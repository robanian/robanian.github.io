---
sidebar_position: 1
---

# Prisma ORM Best Practices

Native MySQL2에서 Prisma로 마이그레이션하면서 정립한 패턴들

## 🎯 Why Prisma?

### Before: Native MySQL2

```javascript
// ❌ No type safety
const [users] = await connection.execute(
  "SELECT * FROM users WHERE email = ?",
  [email],
);

// ❌ Manual snake_case ↔ camelCase conversion
const user = {
  id: row.id,
  email: row.email,
  firstName: row.first_name, // 수동 변환
  createdAt: row.created_at,
};

// ❌ Manual migrations
await connection.execute(`
  ALTER TABLE users ADD COLUMN phone VARCHAR(20)
`);
```

### After: Prisma

```javascript
// ✅ Type-safe queries
const user = await prisma.user.findUnique({
  where: { email },
});

// ✅ Automatic snake_case ↔ camelCase
// DB: created_at → Code: createdAt

// ✅ Automatic migrations
// Edit schema.prisma → npx prisma migrate dev
```

## 📐 Schema Design Patterns

### 1. Naming Conventions

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  firstName String   @map("first_name")  // DB: first_name
  createdAt DateTime @default(now()) @map("created_at")

  // Relation
  posts     Post[]

  // Table name mapping
  @@map("users")  // DB table: users (plural)
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @db.Text
  userId    Int      @map("user_id")

  // Relations
  user      User     @relation(fields: [userId], references: [id])

  @@map("posts")
}
```

**Rules:**

- Model: PascalCase (User, Post)
- Field: camelCase (firstName, createdAt)
- DB column: snake_case (first_name, created_at)
- DB table: lowercase plural (users, posts)

### 2. Enums

```prisma
enum UserRole {
  ADMIN
  USER
  PARTNER

  @@map("user_role")
}

enum ProjectStatus {
  PENDING
  IN_PROGRESS  // DB: IN_PROGRESS
  COMPLETED
  CANCELLED

  @@map("project_status")
}
```

### 3. Timestamps Pattern

```prisma
model BaseModel {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("base_model")
}

// 모든 모델에 적용
model User {
  // ... other fields
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

## 🔧 Query Patterns

### 1. Single Source of Truth

```javascript
// ❌ Bad: Raw query alongside Prisma
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE status = 'active'
`;

// ✅ Good: Use Prisma client
const users = await prisma.user.findMany({
  where: { status: "ACTIVE" },
});
```

**Prisma Schema = Single Source of Truth**

### 2. Relation Loading

```javascript
// ❌ Bad: N+1 problem
const users = await prisma.user.findMany();
for (const user of users) {
  user.posts = await prisma.post.findMany({
    where: { userId: user.id },
  });
}

// ✅ Good: Include relations
const users = await prisma.user.findMany({
  include: {
    posts: true,
  },
});

// ✅ Better: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    posts: {
      select: {
        id: true,
        title: true,
      },
    },
  },
});
```

### 3. Transactions

```javascript
// ❌ Bad: No atomicity
await prisma.user.create({ data: userData });
await prisma.profile.create({ data: profileData });
// What if second fails?

// ✅ Good: Transaction
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.profile.create({
    data: { ...profileData, userId: user.id },
  });
});

// ✅ Better: Interactive transaction
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });

  if (user.role === "PARTNER") {
    await tx.partner.create({
      data: { userId: user.id, ...partnerData },
    });
  }

  return user;
});
```

## 🎨 Service Layer Patterns

### Model Layer (Data Access)

```javascript
// models/user.model.js
class UserModel {
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data) {
    return await prisma.user.create({ data });
  }

  async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }
}

export default new UserModel();
```

### Service Layer (Business Logic)

```javascript
// services/user.service.js
class UserService {
  async register(userData) {
    // Validation
    const existingUser = await userModel.findByEmail(userData.email);
    if (existingUser) {
      throw fail("Email already exists", 409);
    }

    // Business logic
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Transaction
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });

      await tx.profile.create({
        data: { userId: user.id },
      });

      return user;
    });
  }
}
```

## 🐛 Error Handling

### Prisma Error Codes

```javascript
// services/user.service.js
import { Prisma } from "@prisma/client";

async function createUser(data) {
  try {
    return await prisma.user.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation
      if (error.code === "P2002") {
        throw fail("Email already exists", 409);
      }

      // P2025: Record not found
      if (error.code === "P2025") {
        throw fail("User not found", 404);
      }
    }

    throw error; // Unknown error
  }
}
```

### Common Prisma Error Codes

| Code  | Meaning                       | HTTP Status     |
| ----- | ----------------------------- | --------------- |
| P2002 | Unique constraint failed      | 409 Conflict    |
| P2025 | Record not found              | 404 Not Found   |
| P2003 | Foreign key constraint failed | 400 Bad Request |
| P2014 | Relation violation            | 400 Bad Request |

## 🚀 Migration Workflow

### Development

```bash
# 1. Edit schema.prisma
# Add new field, table, relation

# 2. Create migration
npx prisma migrate dev --name add_user_phone

# 3. Generate client
npx prisma generate

# 4. Test
npm test
```

### Production

```bash
# 1. Review migration SQL
cat prisma/migrations/*/migration.sql

# 2. Apply migration
npx prisma migrate deploy

# 3. Generate client
npx prisma generate
```

### Rollback (if needed)

```bash
# Prisma doesn't support automatic rollback
# Manual process:

# 1. Identify migration to rollback
ls prisma/migrations/

# 2. Manually write reverse migration
# Create: 20240130_rollback_phone/migration.sql

# 3. Apply
npx prisma migrate resolve --applied 20240130_rollback_phone
```

## 💡 Performance Tips

### 1. Connection Pooling

```javascript
// lib/prisma.js
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### 2. Batch Operations

```javascript
// ❌ Bad: Loop
for (const item of items) {
  await prisma.product.create({ data: item });
}

// ✅ Good: Batch
await prisma.product.createMany({
  data: items,
  skipDuplicates: true,
});
```

### 3. Pagination

```javascript
// Cursor-based (better for large datasets)
const posts = await prisma.post.findMany({
  take: 10,
  skip: 1,
  cursor: {
    id: lastPostId,
  },
  orderBy: {
    createdAt: "desc",
  },
});

// Offset-based (simpler)
const posts = await prisma.post.findMany({
  take: 10,
  skip: (page - 1) * 10,
  orderBy: {
    createdAt: "desc",
  },
});
```

## 🎓 Key Learnings

### 1. Schema is Documentation

Prisma schema doubles as documentation. Keep it clean and well-commented.

### 2. Migrations are Code

Treat migrations like code. Review, test, version control.

### 3. Type Safety Saves Time

Initial Prisma setup takes time, but type safety catches bugs early.

### 4. Don't Fight the ORM

Use Prisma's patterns. Raw queries should be rare exceptions.

## 📚 Related Topics

- [Error Handling Patterns](/docs/best-practices/error-handling)
- [Database Design](/docs/architecture/database-design)
- [API Response Patterns](/docs/architecture/api-patterns)

---

> "Prisma Schema as Single Source of Truth.  
> Type safety catches bugs at compile time, not runtime."
