---
sidebar_position: 1
---

# Docker Deployment Strategy

Hybrid CI/CD와 zero-downtime deployment를 구현한 Docker 기반 인프라

## 🎯 Architecture Overview

```
GitHub Repository
      ↓
GitHub Actions (Build)
      ↓
Docker Registry
      ↓
Self-Hosted Runner (Deploy)
      ↓
Portainer Management
      ↓
Production Containers
```

## 🏗️ Docker Configuration

### Multi-Stage Build

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Prisma generate
RUN npx prisma generate

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy from deps and builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**Benefits:**

- 작은 이미지 크기 (alpine)
- 보안 (non-root user)
- 빠른 빌드 (레이어 캐싱)

### Docker Compose

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - app-network
    depends_on:
      - app
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker tag myapp:${{ github.sha }} myapp:latest

      - name: Push to Registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push myapp:${{ github.sha }}
          docker push myapp:latest

  deploy:
    needs: build
    runs-on: self-hosted
    steps:
      - name: Pull latest image
        run: docker pull myapp:latest

      - name: Stop old container
        run: docker stop myapp || true

      - name: Remove old container
        run: docker rm myapp || true

      - name: Start new container
        run: |
          docker run -d \
            --name myapp \
            --network app-network \
            --env-file .env.production \
            --restart unless-stopped \
            myapp:latest

      - name: Health check
        run: |
          sleep 10
          curl -f http://localhost:3000/health || exit 1

      - name: Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: "Deployment completed!"
        if: always()
```

**Hybrid Approach:**

- **Build on GitHub-hosted**: 무료, 빠른 build
- **Deploy on self-hosted**: 프로덕션 서버에 직접 배포

## 🚀 Zero-Downtime Deployment

### Blue-Green Deployment

```bash
#!/bin/bash
# deploy.sh

# Configuration
NEW_CONTAINER="myapp-blue"
OLD_CONTAINER="myapp-green"
IMAGE="myapp:latest"

# Pull latest image
docker pull $IMAGE

# Start new container
docker run -d \
  --name $NEW_CONTAINER \
  --network app-network \
  --env-file .env.production \
  $IMAGE

# Health check
echo "Waiting for new container to be healthy..."
for i in {1..30}; do
  if docker exec $NEW_CONTAINER wget -qO- http://localhost:3000/health; then
    echo "New container is healthy!"
    break
  fi
  sleep 2
done

# Switch traffic (update nginx upstream)
docker exec nginx nginx -s reload

# Stop old container
echo "Stopping old container..."
docker stop $OLD_CONTAINER
docker rm $OLD_CONTAINER

# Rename new container
docker rename $NEW_CONTAINER $OLD_CONTAINER

echo "Deployment complete!"
```

### Rolling Update (Multiple Instances)

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    image: myapp:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 10s
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```javascript
// routes/health.routes.js
router.get("/health", async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis
    await redis.ping();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: "connected",
      redis: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js
```

```javascript
// healthcheck.js
const http = require("http");

const options = {
  host: "localhost",
  port: 3000,
  path: "/health",
  timeout: 2000,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on("error", () => {
  process.exit(1);
});

request.end();
```

## 🔧 Portainer Management

### Stack Configuration

```yaml
# portainer-stack.yml
version: "3.8"

services:
  app:
    image: myapp:latest
    environment:
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`api.domain.com`)"
      - "traefik.http.routers.app.tls=true"
    networks:
      - traefik-public
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

networks:
  traefik-public:
    external: true
```

**Portainer Benefits:**

- GUI for container management
- Resource monitoring
- Log aggregation
- Easy rollback

## 📁 File Structure

```
project/
├── .github/
│   └── workflows/
│       ├── build.yml
│       └── deploy.yml
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── .dockerignore
│   └── nginx.conf
│
├── scripts/
│   ├── deploy.sh
│   ├── rollback.sh
│   └── healthcheck.js
│
├── docker-compose.yml
├── docker-compose.dev.yml
└── portainer-stack.yml
```

## 🎓 Key Learnings

### 1. Separation of Concerns

- **NPM (Nginx Proxy Manager)**: SSL 및 프록시
- **Bastion Server**: SSH 접근
- **Monitoring Server**: Grafana/Prometheus/Loki
- **Application Servers**: 앱 컨테이너만

### 2. Hybrid CI/CD is Efficient

- GitHub-hosted runners: 빌드 (무료, 빠름)
- Self-hosted runners: 배포 (프로덕션 직접 접근)

### 3. Health Checks are Critical

- Container health check
- Application health endpoint
- External monitoring (Grafana)

### 4. Standardized Images

- 모든 VM에 동일한 base image
- 일관된 환경 보장
- 빠른 복구

## 🐛 Common Issues

### Issue 1: Container Can't Connect to DB

```bash
# Check network
docker network inspect app-network

# Verify DATABASE_URL
docker exec myapp env | grep DATABASE_URL

# Test connection
docker exec myapp node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.\$connect().then(() => console.log('OK'));
"
```

### Issue 2: Image Too Large

```dockerfile
# ❌ Bad: 1.5GB
FROM node:20
COPY . .
RUN npm install

# ✅ Good: 200MB
FROM node:20-alpine
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
```

### Issue 3: Slow Builds

```yaml
# Use layer caching
- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

## 📚 Related Topics

- [Monitoring Stack](/docs/infrastructure/monitoring-stack)
- [CI/CD Best Practices](/docs/infrastructure/ci-cd-pipeline)
- [Network Architecture](/docs/infrastructure/network-setup)

---

> "Containers should be disposable.  
> Build for failure, design for recovery."

**Result:** Zero-downtime deployments with automatic rollback capability, enabling multiple deploys per day with confidence.
