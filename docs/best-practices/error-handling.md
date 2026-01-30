---
sidebar_position: 2
---

# Error Handling Patterns

Standardized error handling for consistent API responses and better debugging

## 🎯 Design Principles

### 1. Controllers Return Success Only

```javascript
// ❌ Bad: Mixed success/error handling
async function getUser(req, res) {
  try {
    const user = await userService.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ✅ Good: Controllers only return success
async function getUser(req, res) {
  const user = await userService.getUser(req.params.id);
  return success(res, user);
}
```

### 2. Services Throw Errors

```javascript
// ❌ Bad: Returning error objects
async function getUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return { error: "User not found", status: 404 };
  }
  return { data: user };
}

// ✅ Good: Throwing errors
async function getUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw fail("User not found", 404);
  }
  return user;
}
```

### 3. Centralized Error Handler

```javascript
// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Send response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Unexpected error
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
```

## 📦 Response Helpers

### Success Response

```javascript
// utils/response.js
export function success(res, data = null, message = null, statusCode = 200) {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
  };

  if (message) response.message = message;
  if (data !== null) response.data = data;

  return res.status(statusCode).json(response);
}

// Usage
router.get("/users", async (req, res) => {
  const users = await userService.getUsers();
  return success(res, users);
});

router.post("/users", async (req, res) => {
  const user = await userService.createUser(req.body);
  return success(res, user, "User created successfully", 201);
});
```

### Error Response

```javascript
// utils/errors.js
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function fail(message, statusCode = 400) {
  return new AppError(message, statusCode);
}

// Usage in services
async function createUser(userData) {
  const existing = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existing) {
    throw fail("Email already exists", 409);
  }

  return await prisma.user.create({ data: userData });
}
```

## 🎨 Error Types

### Custom Error Classes

```javascript
// utils/errors.js
export class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, 400);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = "ConflictError";
  }
}
```

### Usage Examples

```javascript
// Validation error
if (!email || !password) {
  throw new ValidationError("Invalid input", {
    email: !email ? "Email is required" : null,
    password: !password ? "Password is required" : null,
  });
}

// Authentication error
if (!validPassword) {
  throw new AuthenticationError("Invalid credentials");
}

// Authorization error
if (user.role !== "ADMIN") {
  throw new AuthorizationError("Admin access required");
}

// Not found error
if (!product) {
  throw new NotFoundError("Product");
}

// Conflict error
if (existingUser) {
  throw new ConflictError("Email already registered");
}
```

## 🔍 Prisma Error Handling

### Error Code Mapping

```javascript
// utils/prisma-errors.js
import { Prisma } from "@prisma/client";

export function handlePrismaError(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        const field = error.meta?.target?.[0] || "field";
        throw new ConflictError(`${field} already exists`);

      case "P2025":
        // Record not found
        throw new NotFoundError();

      case "P2003":
        // Foreign key constraint failed
        throw fail("Invalid reference", 400);

      case "P2014":
        // Relation violation
        throw fail("Cannot delete: related records exist", 400);

      default:
        throw fail("Database error", 500);
    }
  }

  throw error;
}

// Usage in service
async function createUser(data) {
  try {
    return await prisma.user.create({ data });
  } catch (error) {
    throw handlePrismaError(error);
  }
}
```

### Common Prisma Errors

| Code  | Description                   | Handler         |
| ----- | ----------------------------- | --------------- |
| P2002 | Unique constraint violation   | ConflictError   |
| P2025 | Record not found              | NotFoundError   |
| P2003 | Foreign key constraint failed | ValidationError |
| P2014 | Relation violation            | ValidationError |
| P2021 | Table does not exist          | 500 Error       |
| P2022 | Column does not exist         | 500 Error       |

## 🛡️ Validation Errors

### Joi Integration

```javascript
// middleware/validate.js
import Joi from "joi";
import { ValidationError } from "../utils/errors.js";

export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const fields = {};
      error.details.forEach((detail) => {
        fields[detail.path[0]] = detail.message;
      });

      throw new ValidationError("Validation failed", fields);
    }

    req.body = value;
    next();
  };
}

// validators/user.validator.js
export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
});

// Usage in route
router.post("/users", validate(createUserSchema), userController.create);
```

## 🔄 Async Error Wrapper

### Express Async Handler

```javascript
// utils/async-handler.js
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await userService.getUser(req.params.id);
    return success(res, user);
  }),
);

// OR: Wrap all routes automatically
function wrapAsync(router) {
  const originalGet = router.get;
  const originalPost = router.post;
  // ... other methods

  router.get = function (path, ...handlers) {
    const wrappedHandlers = handlers.map((handler) => asyncHandler(handler));
    return originalGet.call(this, path, ...wrappedHandlers);
  };

  // ... wrap other methods
}
```

## 📊 Error Logging

### Structured Logging

```javascript
// utils/logger.js
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Error handler integration
function errorHandler(err, req, res, next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // ... send response
}
```

## 🎯 Complete Example

### Full Stack Implementation

```javascript
// app.js
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(express.json());
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res) => {
  throw new NotFoundError("Endpoint");
});

// Error handler (must be last)
app.use(errorHandler);

// routes/user.routes.js
router.post(
  "/",
  validate(createUserSchema),
  asyncHandler(userController.create),
);

// controllers/user.controller.js
async function create(req, res) {
  const user = await userService.createUser(req.body);
  return success(res, user, "User created", 201);
}

// services/user.service.js
async function createUser(data) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new ConflictError("Email already registered");
  }

  try {
    return await prisma.user.create({ data });
  } catch (error) {
    throw handlePrismaError(error);
  }
}
```

## 🎓 Key Learnings

### 1. Consistency is Key

모든 API 응답이 동일한 구조를 따라야 클라이언트 코드가 단순해집니다.

### 2. Separation of Concerns

- Controllers: HTTP 처리
- Services: Business logic + Error throwing
- Middleware: Error catching + Logging

### 3. Operational vs Programming Errors

- Operational: 예상된 에러 (404, validation 등)
- Programming: 버그 (null reference 등)

### 4. Never Trust Input

모든 입력은 validation을 거쳐야 합니다.

## 📚 Related Topics

- [Prisma Patterns](/docs/best-practices/prisma-patterns)
- [API Response Patterns](/docs/architecture/api-patterns)
- [Validation Strategies](/docs/best-practices/validation)

---

> "Errors should be expected, logged, and handled gracefully.  
> Never expose internal details to clients."
