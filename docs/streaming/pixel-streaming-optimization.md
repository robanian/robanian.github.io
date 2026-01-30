---
sidebar_position: 1
---

# Pixel Streaming Optimization

Unreal Engine 5.5 WebRTC Pixel Streaming에서 GPU 병목을 해결하고 29% utilization을 달성한 과정

## 🎯 The Problem

### Initial State: GPU Bottleneck

```
GPU Utilization: 100%+
FPS: Unstable (10-60 fluctuating)
User Experience: Laggy, choppy
```

**증상:**

- 단일 사용자도 GPU 100% 사용
- 다중 사용자 불가능
- 화면 끊김 현상

## 🔍 Root Cause Analysis

### Hypothesis 1: Resolution Too High?

```bash
# 테스트: 해상도 낮춤 (1920x1080 → 1280x720)
r.ScreenPercentage 66.7

# 결과: GPU 90%
# 결론: 주요 원인 아님
```

### Hypothesis 2: Unlimited FPS Rendering

```cpp
// UE5 기본 동작
while (true) {
  RenderFrame();  // 무제한 렌더링!
  SendToWebRTC();
}

// 문제: WebRTC는 30 FPS면 충분한데,
// UE는 60+ FPS로 렌더링 중
```

**발견:** GPU가 필요 이상으로 프레임을 렌더링하고 있었음!

## ✅ Solution: FPS Limiting

### Implementation

```bash
# DefaultEngine.ini or Console Command
t.MaxFPS 30

# 추가 최적화
r.Streaming.PoolSize 1024
r.VSync 0
```

**결과:**

```
Before: GPU 100%+ @ unstable FPS
After:  GPU 29% @ stable 30 FPS
```

### Why 30 FPS?

```javascript
// WebRTC typical frame rate
const videoConstraints = {
  frameRate: { ideal: 30, max: 60 },
};

// 30 FPS는:
// ✅ 부드러운 사용자 경험
// ✅ 네트워크 대역폭 효율적
// ✅ GPU 리소스 절약
// ❌ 60+ FPS는 과도한 리소스 사용
```

## 🎨 DLSS Integration

### Challenge: Quality vs Performance

```
Native Resolution: High quality, High GPU cost
Lower Resolution: Low GPU cost, Poor quality
DLSS: High quality, Low GPU cost ✨
```

### Configuration

```bash
# Enable DLSS
r.NGX.DLSS.Enable 1
r.NGX.DLSS.Quality 2  # 2 = Quality mode

# Disable TSR (conflicts with DLSS)
r.TemporalAA.Upscaling 0
```

**Critical Discovery:** DLSS와 TSR(Temporal Super Resolution)은 동시 사용 불가!

### DLSS Modes

| Mode          | Internal Res | Output Res | GPU Usage   | Quality  |
| ------------- | ------------ | ---------- | ----------- | -------- |
| Performance   | 50%          | 100%       | Low         | Good     |
| Balanced      | 58%          | 100%       | Medium      | Better   |
| **Quality**   | 67%          | 100%       | Medium-Low  | **Best** |
| Ultra Quality | 77%          | 100%       | Medium-High | Best+    |

**선택:** Quality mode (2)

- 화질과 성능의 sweet spot
- 1080p → 720p internal → 1080p upscale

## 🔄 Multi-User Architecture

### Matchmaker System

```
User Request → Matchmaker → Available Cirrus Server
                    ↓
            Session Assignment
                    ↓
         Streaming Connection
```

### Dynamic Routing with Wildcard SSL

```nginx
# *.ps.domain.com → Different Cirrus servers
server {
  server_name *.ps.domain.com;

  location / {
    proxy_pass http://cirrus-pool;
  }
}
```

**Benefits:**

- 각 사용자가 독립적인 UE instance
- Load balancing across multiple servers
- Seamless scaling

### Session Management

```javascript
// Session lifecycle
const session = {
  userId: "user123",
  cirrusServer: "session-1.ps.domain.com",
  ueInstance: "container-abc",
  startTime: Date.now(),
  maxDuration: 30 * 60 * 1000, // 30분
};

// Automatic cleanup
setTimeout(() => {
  closeSession(session);
  releaseResources(session);
}, session.maxDuration);
```

## 📊 Performance Metrics

### Before vs After

| Metric           | Before   | After      | Improvement |
| ---------------- | -------- | ---------- | ----------- |
| GPU Utilization  | 100%+    | 29%        | **-71%**    |
| FPS Stability    | Unstable | Stable 30  | ✅          |
| Concurrent Users | 1        | 3-4 per VM | **4x**      |
| Latency          | 120ms    | 80ms       | **-33%**    |

### Resource Efficiency

```
Single VM (4 vCPU, 16GB RAM, GPU):
Before: 1 user
After:  3-4 users

Cost per user:
Before: 100%
After:  25-33%
```

## 🎓 Key Learnings

### 1. Measure, Don't Assume

"더 높은 FPS가 더 좋다"는 가정은 틀렸습니다. 측정을 통해 30 FPS가 최적임을 발견했습니다.

### 2. Know Your Bottleneck

GPU가 문제인지, CPU가 문제인지, 네트워크가 문제인지 먼저 파악해야 합니다.

### 3. DLSS ≠ TSR

두 기술은 배타적입니다. DLSS 사용 시 TSR은 반드시 비활성화해야 합니다.

### 4. WebRTC Limitations

WebRTC는 30 FPS면 충분합니다. 더 높은 FPS는 네트워크 대역폭만 낭비합니다.

## 🔧 Optimization Checklist

```bash
# ✅ Essential
t.MaxFPS 30
r.VSync 0

# ✅ DLSS (if available)
r.NGX.DLSS.Enable 1
r.NGX.DLSS.Quality 2
r.TemporalAA.Upscaling 0  # Disable TSR

# ✅ Streaming Pool
r.Streaming.PoolSize 1024

# ⚠️ Test These
r.ScreenPercentage 100  # Adjust if needed
r.Shadow.MaxResolution 1024  # Lower shadows
```

## 📚 Related Topics

- [WebRTC Architecture](/docs/streaming/webrtc-architecture)
- [Docker Deployment](/docs/infrastructure/docker-deployment)
- [Monitoring Setup](/docs/infrastructure/monitoring-stack)

---

> "The bottleneck isn't always where you think it is.  
> Measure first, optimize second."

**Impact:** 71% GPU reduction enabled 4x more concurrent users per VM, dramatically reducing infrastructure costs while improving user experience.
