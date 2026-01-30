---
sidebar_position: 1
---

# Real-time 3D Platform Case Study

AI 기반 실시간 3D 시각화 플랫폼 구축 경험

## 📋 Project Overview

### Challenge

브라우저에서 고품질 3D 환경을 실시간으로 경험하고, AI 기반 추천을 받을 수 있는 플랫폼 구축

### Constraints

- 타임라인: 5개월 (MVP)
- 팀 규모: Tech Lead + Frontend 2명
- 예산: 중소 규모 스타트업
- 기술 부채: 없음 (greenfield project)

### Solution

Unreal Engine 5.5 Pixel Streaming + AI RAG 시스템 + Modular Monolithic Backend

## 🏗️ Technical Architecture

### System Design

```
┌─────────────────────────────────────────────┐
│           Frontend (Next.js)                │
│  - 3D WebRTC viewer                         │
│  - AI chat interface                        │
│  - Partner matching UI                      │
└──────────────┬──────────────────────────────┘
               │
        ┌──────┴──────┐
        │   Nginx     │
        │   Proxy     │
        └──────┬──────┘
               │
    ┏━━━━━━━━━┻━━━━━━━━━┓
    ┃                    ┃
┌───┴────────────┐  ┌───┴──────────┐
│  STB Service   │  │  PLB Service │
│  (Streaming)   │  │  (Platform)  │
│                │  │              │
│  - Session     │  │  - Auth      │
│  - Routing     │  │  - AI RAG    │
│  - WebRTC      │  │  - Matching  │
└────┬───────────┘  └──────┬───────┘
     │                     │
     │              ┌──────┴──────┐
     │              │   MySQL     │
     │              │   Redis     │
     │              └─────────────┘
     │
┌────┴───────────┐
│  UE5 Instances │
│  (Containers)  │
└────────────────┘
```

### Tech Stack

| Layer          | Technology        | Reason                    |
| -------------- | ----------------- | ------------------------- |
| Frontend       | Next.js + React   | SSR, Image optimization   |
| Styling        | Tailwind CSS      | Rapid development         |
| Backend        | Node.js + Express | Team expertise, async I/O |
| Database       | MySQL + Prisma    | ACID + Type safety        |
| Cache          | Redis             | Session management        |
| 3D Engine      | Unreal Engine 5.5 | Photorealistic quality    |
| Streaming      | WebRTC + Cirrus   | Low latency               |
| AI             | FastAPI + OpenAI  | Python ecosystem          |
| Vector DB      | Pinecone          | Managed solution          |
| Infrastructure | Docker + Nginx    | Containerization          |
| Cloud          | Multi-cloud       | Cost optimization         |

## 🎯 Key Technical Challenges

### Challenge 1: GPU Bottleneck

**Problem:**

- Single user consuming 100% GPU
- Unstable FPS (10-60 fluctuating)
- Multi-user support impossible

**Investigation:**

```bash
# Hypothesis testing
1. Lower resolution? → GPU 90% (not main issue)
2. Reduce quality? → GPU 85% (marginal)
3. Check rendering loop? → Unlimited FPS! (FOUND IT)
```

**Solution:**

```bash
# Force 30 FPS limit
t.MaxFPS 30

# Enable DLSS
r.NGX.DLSS.Enable 1
r.NGX.DLSS.Quality 2

# Disable TSR (conflicts with DLSS)
r.TemporalAA.Upscaling 0
```

**Result:**

```
GPU: 100%+ → 29% (-71%)
Concurrent users: 1 → 4 per VM (4x)
Cost per user: -75%
```

### Challenge 2: Multi-User Session Management

**Problem:**

- Each user needs isolated UE instance
- Dynamic routing to available servers
- Session lifecycle management

**Solution: Matchmaker System**

```javascript
// Matchmaker logic
class SessionManager {
  async assignSession(userId) {
    // Find available Cirrus server
    const server = await this.findAvailableServer();

    if (!server) {
      // Spin up new container (future: Kakao Cloud API)
      server = await this.createNewServer();
    }

    // Create session
    const session = {
      userId,
      serverId: server.id,
      subdomain: `session-${Date.now()}.ps.domain.com`,
      startTime: Date.now(),
      maxDuration: 30 * 60 * 1000, // 30분
    };

    // Store in Redis
    await redis.setex(
      `session:${userId}`,
      1800, // 30분 TTL
      JSON.stringify(session),
    );

    return session;
  }

  async findAvailableServer() {
    const servers = await redis.smembers("cirrus:servers");

    for (const serverId of servers) {
      const load = await redis.get(`cirrus:${serverId}:load`);
      if (parseInt(load) < 4) {
        // Max 4 users per server
        return { id: serverId, load: parseInt(load) };
      }
    }

    return null;
  }
}
```

### Challenge 3: AI Product Recommendations

**Problem:**

- 수천 개 제품 중 사용자 예산/스타일에 맞는 제품 추천
- 실시간 검색 필요
- 정확도와 속도 균형

**Solution: RAG with Pinecone**

```python
# AI service (FastAPI)
from pinecone import Pinecone
from openai import OpenAI

class RecommendationService:
    def __init__(self):
        self.pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        self.index = self.pc.Index('products')
        self.openai = OpenAI()

    async def recommend(self, query: str, budget: int, style: str):
        # Generate embedding
        embedding = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=query
        ).data[0].embedding

        # Search in vector DB
        results = self.index.query(
            vector=embedding,
            top_k=20,
            filter={
                "price": {"$lte": budget},
                "style": style
            },
            include_metadata=True
        )

        # Rerank with GPT-4
        context = "\n".join([
            f"{r.metadata['name']}: {r.metadata['description']}"
            for r in results.matches[:10]
        ])

        response = self.openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional consultant."},
                {"role": "user", "content": f"User query: {query}\nProducts:\n{context}\n\nRecommend top 3."}
            ]
        )

        return response.choices[0].message.content
```

**Result:**

- Sub-second response time
- 90%+ recommendation accuracy (user feedback)
- Scalable to 100K+ products

### Challenge 4: Zero-Downtime Deployment

**Problem:**

- Daily deploys needed
- Active streaming sessions must not disconnect
- Database migrations without downtime

**Solution: Blue-Green + Health Checks**

```yaml
# GitHub Actions
deploy:
  steps:
    - name: Start new container (blue)
      run: docker run -d --name app-blue ...

    - name: Health check
      run: |
        for i in {1..30}; do
          if curl -f http://localhost:3000/health; then
            break
          fi
          sleep 2
        done

    - name: Switch traffic
      run: docker exec nginx nginx -s reload

    - name: Stop old container (green)
      run: docker stop app-green
```

## 📊 Performance Metrics

### Infrastructure

| Metric                  | Target | Achieved | Status |
| ----------------------- | ------ | -------- | ------ |
| GPU Utilization         | <30%   | 29%      | ✅     |
| Concurrent Users/VM     | 3+     | 4        | ✅     |
| Streaming Latency       | <100ms | ~80ms    | ✅     |
| API Response Time (p95) | <500ms | 320ms    | ✅     |
| Uptime                  | 99.9%  | 99.95%   | ✅     |

### Development

| Metric                   | Baseline | Result    | Status |
| ------------------------ | -------- | --------- | ------ |
| Deploy Frequency         | Manual   | 5-10/week | ✅     |
| Deploy Time              | 30min    | 5min      | ✅     |
| Mean Time to Recovery    | Hours    | <10min    | ✅     |
| Bug Detection (pre-prod) | 60%      | 90%+      | ✅     |

## 🎓 Key Learnings

### 1. Start Simple, Architect for Scale

Modular Monolithic으로 시작해 빠르게 출시하고, 명확한 경계를 유지하면서 MSA 전환을 준비했습니다.

### 2. Measure Before Optimize

GPU 병목은 "더 많은 GPU"가 아니라 "FPS 제한"으로 해결되었습니다. 측정 없이는 알 수 없었을 것입니다.

### 3. Developer Experience = Velocity

- Prisma ORM: Type safety
- Feature-based modules: AI context 최적화
- Standardized patterns: 온보딩 시간 단축

### 4. AI is Not Magic

RAG 시스템도 결국은 잘 설계된 vector search + prompt engineering입니다.

### 5. Infrastructure as Code

Docker, GitHub Actions, Nginx configs를 코드로 관리하면서 재현 가능한 배포를 달성했습니다.

## 🔮 Future Improvements

### Short-term (Q1 2025)

- [ ] PM2 process management
- [ ] Dynamic VM provisioning (Kakao Cloud API)
- [ ] Enhanced monitoring (Grafana dashboards)
- [ ] Mobile app (React Native)

### Mid-term (Q2-Q3 2025)

- [ ] TypeScript migration
- [ ] MSA extraction (streaming service first)
- [ ] Kubernetes orchestration
- [ ] Multi-region deployment

### Long-term (Q4 2025+)

- [ ] Real-time collaboration
- [ ] VR/AR support
- [ ] Edge computing (CDN integration)
- [ ] ML model optimization

## 💡 What Went Well

✅ **Technical Decisions**

- Modular Monolithic: 빠른 개발 속도
- Prisma ORM: Type safety로 런타임 버그 감소
- Docker: 일관된 환경

✅ **Performance**

- GPU 최적화: 4x capacity improvement
- Zero-downtime deploys: 신뢰도 향상
- Sub-100ms latency: 우수한 UX

✅ **Team Productivity**

- Feature-based modules: 명확한 책임 분리
- Standardized patterns: 빠른 온보딩
- AI-friendly structure: Claude/Copilot 활용

## 🚧 What Could Be Better

⚠️ **Technical Debt**

- JavaScript → TypeScript 마이그레이션 필요
- Test coverage 부족 (현재 60%, 목표 80%)
- Documentation 자동화 미비

⚠️ **Infrastructure**

- Manual VM provisioning (자동화 예정)
- Single-region deployment (multi-region 필요)
- Monitoring gaps (일부 메트릭 누락)

⚠️ **Process**

- Code review 속도 개선 필요
- Incident response playbook 미비
- Capacity planning 수동

## 📚 Related Documentation

- [Modular Monolithic Architecture](/docs/architecture/modular-monolithic)
- [Pixel Streaming Optimization](/docs/streaming/pixel-streaming-optimization)
- [Prisma ORM Patterns](/docs/best-practices/prisma-patterns)
- [Docker Deployment](/docs/infrastructure/docker-deployment)
- [Error Handling](/docs/best-practices/error-handling)

---

> "Ship fast, measure everything, iterate constantly.  
> Good architecture enables change, not prevents it."

**Project Status:** MVP launched, active users growing, continuous optimization ongoing.
