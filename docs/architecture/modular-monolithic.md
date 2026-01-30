---
sidebar_position: 1
---

# Modular Monolithic Architecture

초기 단계 프로젝트에서 Microservices 대신 Modular Monolithic을 선택한 이유와 설계 전략

## 🎯 Why Modular Monolithic?

### Context

- 팀 규모: Tech Lead + Frontend 팀 (소규모)
- 타임라인: 빠른 MVP 출시 필요
- 복잡도: 3개의 주요 백엔드 서비스 (STB, PLB-C, PLB-A)

### Decision: Start Simple, Architect for Complexity

```javascript
// ❌ Bad: Premature microservices
// - 팀 규모에 비해 과도한 복잡도
// - 분산 트랜잭션 어려움
// - 배포/모니터링 오버헤드

// ✅ Good: Modular Monolithic
// - 명확한 모듈 경계
// - 단순한 배포
// - 필요시 MSA 전환 가능
```

## 🏗️ Architecture Principles

### 1. Feature-Based Module Organization

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.validator.js
│   │   └── auth.model.js (Prisma)
│   │
│   ├── streaming/
│   │   ├── streaming.routes.js
│   │   ├── streaming.controller.js
│   │   ├── streaming.service.js
│   │   └── streaming.model.js
│   │
│   └── partners/
│       └── ... (same structure)
│
├── shared/
│   ├── middleware/
│   ├── utils/
│   └── config/
│
└── app.js
```

**Why Feature-Based?**

- ✅ 모듈 간 경계가 명확
- ✅ 독립적인 개발/테스트 가능
- ✅ MSA 전환 시 각 모듈이 서비스가 됨
- ✅ AI context에 최적화 (Claude/Copilot이 구조 이해 쉬움)

### 2. Clear Module Boundaries

```javascript
// ❌ Bad: Tight coupling
// auth/auth.service.js
async function login(email, password) {
  const user = await db.users.findOne({ email });
  // 직접 다른 모듈 DB 접근
  const partner = await db.partners.findOne({ userId: user.id });
  return { user, partner };
}

// ✅ Good: Through service layer
// auth/auth.service.js
async function login(email, password) {
  const user = await db.users.findOne({ email });
  // 다른 모듈 서비스 호출
  const partner = await partnerService.findByUserId(user.id);
  return { user, partner };
}
```

### 3. Dependency Flow

```
Controllers (HTTP layer)
    ↓
Services (Business logic)
    ↓
Models (Prisma - Data access)
    ↓
Database
```

**Rule:**

- Controllers는 Services만 호출
- Services는 Models와 다른 Services 호출
- Models는 오직 DB와 통신

## 📦 Service Separation Strategy

### Three Independent Services

```
STB (Streaming Backend)
- Pixel streaming session management
- Cirrus server routing
- WebRTC signaling

PLB-C (Platform Backend - Client)
- User authentication
- Product recommendations (AI)
- Partner matching

PLB-A (Platform Backend - Admin)
- Admin dashboard
- Analytics
- Partner management
```

**왜 3개로 분리?**

- 각자 다른 scaling 요구사항
- Streaming은 stateful, Platform은 stateless
- 독립적인 배포 가능

## 🔄 MSA Readiness

### Prepared for Migration

```javascript
// 모듈 간 통신을 이미 추상화
// shared/services/serviceClient.js
class ServiceClient {
  async call(service, method, params) {
    // 현재: 로컬 함수 호출
    return localServices[service][method](params);

    // 미래: HTTP/gRPC 호출로 전환
    // return await fetch(`http://${service}/${method}`, {
    //   method: 'POST',
    //   body: JSON.stringify(params)
    // });
  }
}
```

### Migration Path

```
Phase 1: Modular Monolithic (현재)
├── Clear module boundaries
├── Service-based communication
└── Independent databases per service

Phase 2: Service Extraction (필요시)
├── Extract high-load modules first
├── Replace local calls with HTTP
└── Deploy as separate containers

Phase 3: Full MSA (스케일 필요시)
├── API Gateway
├── Service mesh
└── Distributed tracing
```

## 💡 Key Benefits

### Development Speed

```
Monolithic: 1-2주 feature 개발
Microservices: 3-4주 (inter-service communication overhead)
```

### Debugging Simplicity

```
Monolithic: Single stack trace
Microservices: Distributed tracing 필요
```

### Deployment

```
Monolithic: 1 deploy command
Microservices: Orchestration 필요 (K8s 등)
```

## 🎓 Lessons Learned

### 1. Don't Over-Engineer Early

초기에는 단순함이 속도입니다. 확장성이 필요해지면 그때 리팩토링해도 늦지 않습니다.

### 2. Boundaries Are More Important Than Physical Separation

모듈 경계만 명확하면 나중에 분리는 쉽습니다. 반대로 경계 없이 MSA를 만들면 distributed monolith가 됩니다.

### 3. Team Size Matters

소규모 팀은 Modular Monolithic, 대규모 팀은 MSA가 적합합니다. 기술 선택은 팀 역량과 규모에 맞춰야 합니다.

### 4. AI-Friendly Structure

Feature-based organization은 AI 도구들 (Claude, Copilot)이 코드를 이해하기 쉬워 개발 속도가 향상됩니다.

## 📚 Related Topics

- [Database Schema Design](/docs/architecture/database-design)
- [API Response Patterns](/docs/architecture/api-patterns)
- [Error Handling Strategy](/docs/best-practices/error-handling)

---

> "Start simple, architect for complexity.  
> Clear boundaries matter more than physical separation."
