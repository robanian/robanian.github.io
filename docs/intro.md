---
sidebar_position: 1
---

# 👋 Welcome to My Tech Archive

Backend Architecture, Infrastructure, Real-time 3D Streaming을 중심으로 **진화 가능한 시스템**을 설계하는 Tech Lead입니다.

## 🎯 Philosophy

```javascript
const philosophy = {
  principle: "Building systems designed to evolve, not just to launch",

  approach: [
    "Start with simplicity, architect for complexity",
    "Modular design with clear boundaries",
    "Performance optimization through measurement",
    "Documentation as code architecture",
  ],

  focus: "Solving real problems with proven technology",
};
```

## 🛠️ Technical Expertise

### Backend Architecture

**Node.js/Express 기반 Modular Monolithic → MSA Ready 설계**

- Prisma ORM으로 type-safe database access
- Feature-based module organization
- Standardized error handling patterns
- 17+ table schema with automatic migrations

**핵심 결정:**

- 초기 단계에서는 Modular Monolithic 선택
- 명확한 모듈 경계로 MSA 전환 준비
- AI context 최적화를 위한 feature-based 구조

### Infrastructure & DevOps

**Docker + GitHub Actions + 멀티 클라우드 운영**

- Containerized deployment with Portainer orchestration
- Hybrid CI/CD (GitHub-hosted build + Self-hosted deploy)
- Nginx Proxy Manager + Cloudflare integration
- Grafana + Prometheus + Loki monitoring stack

**인프라 철학:**

- Separation of concerns (NPM for proxy, dedicated monitoring)
- Standardized VM images for consistency
- Manual port forwarding over UPnP for stability

### Real-time 3D Streaming

**Unreal Engine 5.5 + WebRTC Pixel Streaming**

- GPU optimization (무제한 FPS 병목 → t.MaxFPS 30)
- DLSS integration with TSR conflict management
- Multi-server matchmaker architecture
- Dynamic session routing with wildcard SSL

**성능 개선:**

- GPU utilization: 100%+ → 29%
- Stable 30 FPS delivery
- Sub-100ms latency

### AI Integration

**RAG-based Intelligent Systems**

- Pinecone vector DB + OpenAI embeddings
- Budget and style-aware product recommendations
- Custom ML models with OpenCV/Pandas/NumPy

## 📚 Documentation Structure

이 문서는 실제 프로젝트 경험에서 얻은 기술적 인사이트를 공유합니다:

### [Architecture](/docs/category/architecture)

시스템 설계 결정과 그 이유

- Modular Monolithic vs Microservices
- Database schema design patterns
- API response standardization

### [Infrastructure](/docs/category/infrastructure)

인프라 구축 및 운영 경험

- Docker deployment strategies
- CI/CD pipeline design
- Monitoring and observability

### [Streaming](/docs/category/streaming)

실시간 3D 스트리밍 기술

- Pixel Streaming optimization
- WebRTC architecture
- Performance tuning

### [AI](/docs/category/ai)

AI 시스템 구현

- RAG implementation
- Vector search optimization
- ML model integration

### [Best Practices](/docs/category/best-practices)

개발 과정에서 정립한 패턴들

- Error handling patterns
- Prisma ORM best practices
- Code organization strategies

## 🚀 Featured Case Study

### Real-time 3D Interior Design Platform

**Challenge:** 브라우저에서 Unreal Engine 기반 3D 공간을 실시간으로 경험하고, AI 상담을 받을 수 있는 플랫폼 구축

**Tech Stack:**

- Frontend: Next.js, React, Tailwind
- Backend: Node.js, Express, Prisma ORM
- Streaming: UE5.5, WebRTC, Cirrus
- AI: FastAPI, Pinecone, OpenAI GPT-4
- Infrastructure: Docker, Nginx, Multi-cloud

**Key Achievements:**

- ⚡ GPU utilization 29% (최적화 전 100%+)
- 🎮 Stable 30 FPS pixel streaming
- 🤖 RAG-based product recommendations
- 🔄 Zero-downtime CI/CD pipeline

[전체 케이스 스터디 보기 →](/docs/projects/realtime-3d-platform)

## 💡 Key Learnings

### 1. Architecture Decisions Matter Early

초기 아키텍처 결정이 향후 확장성을 결정합니다. Modular Monolithic으로 시작해 명확한 경계를 유지하면서 빠르게 개발하고, MSA 전환 준비를 병행하는 전략이 효과적이었습니다.

### 2. Measure Before Optimize

"무제한 FPS가 더 좋다"는 가정은 GPU 병목을 유발했습니다. 측정을 통해 t.MaxFPS 30이 최적임을 발견했고, 이는 71% GPU 사용률 감소로 이어졌습니다.

### 3. Developer Experience Drives Productivity

Prisma ORM 도입, feature-based 모듈 구조, standardized response helpers 등 개발자 경험 개선은 팀 생산성 향상으로 직결됩니다.

### 4. Infrastructure as Code

Docker images, GitHub Actions workflows, Nginx configs를 코드로 관리하면서 배포 안정성과 재현성이 크게 향상되었습니다.

## 📬 Connect

이 문서의 내용에 대해 질문이나 피드백이 있다면 언제든 연락주세요!

- **GitHub**: [@robanian](https://github.com/robanian)
- **Email**: colorfuleffect@gmail.com

---

> "Building systems designed to evolve, not just to launch"
>
> Systems should be designed not just to solve today's problems,  
> but to adapt gracefully as requirements change and scale increases.
