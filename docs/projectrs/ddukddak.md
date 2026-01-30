---
sidebar_position: 1
---

# 🏠 DDukDDak Platform

AI 기반 인테리어 디자인 플랫폼 - 실시간 3D 시각화 + AI 상담

## 📋 Project Overview

DDukDDak는 실시간 3D 픽셀 스트리밍과 AI 상담 서비스를 결합한 인테리어 디자인 플랫폼입니다.

### Key Features
- 🎮 **Real-time 3D Visualization**: Unreal Engine 5.5 기반 픽셀 스트리밍
- 🤖 **AI Consultation**: GPT-4 기반 인테리어 상담
- 🔍 **Smart Recommendations**: RAG 기반 제품 추천 시스템
- 🏢 **Partner Matching**: 지역별 시공 파트너 매칭

## 🏗️ Architecture

### System Components

```
Client (Next.js)
    ↓
Platform Backend (PLB-C)
    ↓
┌───────────┬──────────────┬──────────────┐
│  MySQL    │   Redis      │  AI Service  │
│  Prisma   │   Session    │  FastAPI     │
└───────────┴──────────────┴──────────────┘
                                ↓
                    ┌───────────────────────┐
                    │  Pinecone Vector DB   │
                    │  OpenAI API           │
                    └───────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js, React, Tailwind CSS |
| **Backend** | Node.js, Express, Prisma ORM |
| **Streaming** | Unreal Engine 5.5, WebRTC, Cirrus |
| **AI** | Python, FastAPI, OpenAI, Pinecone |
| **Database** | MySQL, Redis |
| **Infrastructure** | Docker, Nginx, Kakao Cloud |

## 🎯 Key Technical Achievements

### 1. Pixel Streaming Optimization

```bash
# DLSS 최적화로 GPU 사용률 29% 달성
t.MaxFPS 30
r.Streaming.PoolSize 1024
```

- GPU 병목 해결: 무제한 FPS → 30 FPS 제한
- DLSS 활성화로 화질 유지하면서 성능 개선

### 2. RAG 기반 제품 추천

```javascript
// Pinecone + OpenAI Embeddings
const recommendations = await vectorDB.search({
  query: userQuery,
  filter: { budget: range, style: preference },
  topK: 10
});
```

- 예산과 스타일 기반 맞춤 추천
- 실시간 벡터 검색으로 정확도 향상

### 3. Prisma ORM 마이그레이션

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("users")
}
```

- Native MySQL2 → Prisma 전환
- Type-safe 쿼리 + 자동 마이그레이션
- snake_case ↔ camelCase 자동 변환

## 🚀 Infrastructure

### CI/CD Pipeline

```yaml
# GitHub Actions Workflow
- Build on GitHub-hosted runner
- Test with Jest
- Deploy to self-hosted runner
- Zero-downtime with health checks
```

### Monitoring Stack

- **Grafana**: 시스템 메트릭 시각화
- **Prometheus**: 메트릭 수집
- **Loki**: 로그 집계 및 분석

## 📊 Performance Metrics

| Metric | Target | Achieved |
|--------|--------|----------|
| GPU Utilization | <30% | 29% ✅ |
| FPS (Client) | 30 | 30 ✅ |
| Latency | <100ms | ~80ms ✅ |
| Concurrent Users | 50+ | Testing 🔄 |

## 🎓 Key Learnings

### 1. Performance Optimization
- 무제한 FPS는 GPU 병목 유발
- DLSS와 TSR 충돌 주의 필요
- Manual port forwarding > UPnP (안정성)

### 2. Architecture Decisions
- Modular Monolithic > Microservices (소규모 팀)
- Feature-based 모듈 구조 > Layer-based
- Prisma Schema as Single Source of Truth

### 3. Error Handling
- Prisma 에러 코드 중앙 처리 (P2002, P2025)
- Controller는 success()만, Service는 throw
- Standardized response helpers

## 🔮 Future Roadmap

- [ ] Mobile App Development
- [ ] Dynamic VM Provisioning (Kakao Cloud OpenAPI)
- [ ] PM2 Process Management
- [ ] Comprehensive Interior Categories
- [ ] TypeScript Migration

## 📚 Related Docs

- [Architecture Guide](#)
- [Infrastructure Setup](#)
- [Best Practices](#)
