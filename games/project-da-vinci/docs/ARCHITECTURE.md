# Project Da Vinci - 시스템 아키텍처

> 50인 동시 접속, 실시간 협동 드로잉을 위한 서버리스 아키텍처 설계

## 📐 아키텍처 개요

Project Da Vinci는 **서버리스(Serverless)** 및 **BaaS(Backend as a Service)** 기반으로 설계되어, 2개월 개발 주기 내에 인프라 관리 없이 게임 로직에 집중할 수 있도록 합니다.

### 핵심 설계 원칙

1. **No Server Management**: 백엔드 서버 직접 구축 및 관리 제거
2. **Real-time First**: 5인 협동 드로잉을 위한 실시간 동기화 최우선
3. **AI as a Player**: AI를 단순 도구가 아닌 게임의 핵심 플레이어로 설계
4. **Cost Efficiency**: 월 $20 이하 운영 비용 목표

---

## 🏗️ 전체 시스템 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                           사용자 (50명)                               │
│                     ↓ (HTTPS, WebSocket-like)                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    [Firebase Hosting / Vercel]                       │
│                    React SPA (정적 파일 서빙)                         │
│  - /: 메인 페이지 (로그인)                                             │
│  - /lobby: 대기실 (팀 확인)                                           │
│  - /game/:roomId: 게임 룸 (캔버스 + 채팅)                             │
│  - /results: 결과 화면 (순위 및 리더보드)                              │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ↓ (1.인증)           ↓ (2.실시간 동기화)   ↓ (3.AI 추론 요청)
┌──────────────────┐  ┌─────────────────────┐  ┌────────────────────┐
│  Firebase Auth   │  │  Realtime Database  │  │  Cloud Functions   │
│  (Google SSO)    │  │  (WebSocket-like)   │  │  (Serverless)      │
│                  │  │                     │  │                    │
│ - 사용자 식별     │  │ /gameRooms/{id}     │  │ judgeDrawing()     │
│ - 토큰 발급       │  │ /liveDrawings/{id}  │  │ matchPlayers()     │
│ - 프로필 정보     │  │ /chatMessages/{id}  │  │ finalizeGame()     │
└──────────────────┘  └─────────────────────┘  └────────────────────┘
                                                          │
                                                          ↓ (4.AI API 호출)
                                               ┌─────────────────────┐
                                               │   Gemini 1.5 Flash  │
                                               │   (Vision API)      │
                                               │                     │
                                               │ - 이미지 인식        │
                                               │ - 단어 추론          │
                                               │ - JSON 응답          │
                                               └─────────────────────┘
                              │
                              ↓ (5.게임 로그 저장)
                   ┌───────────────────────────┐
                   │  Cloud Storage            │
                   │  (아카이빙)                │
                   │                           │
                   │ /drawings/{roomId}.png    │
                   │ /logs/{roomId}.json       │
                   └───────────────────────────┘
```

---

## 🔧 기술 스택 상세

### 1. 프론트엔드 (Client)

| 항목 | 기술 | 선택 이유 |
|-----|------|----------|
| **프레임워크** | React 18 (Vite) | 빠른 개발, HMR, 가벼운 번들 |
| **캔버스** | Fabric.js 5.x | 객체 기반 캔버스 제어, JSON 직렬화 지원 |
| **상태 관리** | Zustand | Redux보다 경량, Firebase RTDB와 궁합 좋음 |
| **스타일링** | Tailwind CSS | 빠른 UI 개발, 반응형 디자인 |
| **라우팅** | React Router v6 | SPA 페이지 전환 |
| **Firebase SDK** | Firebase JS SDK v9+ | 모듈화된 임포트, 번들 크기 최소화 |

**핵심 로직:**
- Fabric.js의 `canvas.toJSON()`으로 캔버스 상태를 JSON 직렬화
- Firebase RTDB에 `set()` → 다른 클라이언트가 `onValue()` 구독
- `canvas.loadFromJSON()`으로 즉시 동기화

### 2. 백엔드 (Backend as a Service)

#### Firebase Ecosystem

| 서비스 | 용도 | 플랜 |
|--------|------|------|
| **Authentication** | Google SSO 로그인, 사용자 식별 | Spark (무료) |
| **Realtime Database** | 실시간 캔버스/채팅 동기화 | Spark (무료) |
| **Cloud Functions** | AI 추론, 게임 로직 (서버리스) | Blaze (종량제) |
| **Cloud Storage** | 게임 로그 및 이미지 아카이빙 | Blaze (종량제) |
| **Hosting** | React 정적 파일 서빙 (CDN) | Spark (무료) |

**Realtime Database vs Firestore:**
- **RTDB 선택**: 실시간 동기화가 Firestore보다 빠름 (WebSocket 기반)
- Firestore는 복잡한 쿼리에 강하지만, 이 프로젝트는 단순한 key-value 구조로 충분

#### Cloud Functions (Node.js 18+)

```javascript
// functions/src/index.ts
export const judgeDrawing = functions.https.onCall(async (data, context) => {
  // AI 추론 로직 (Genkit 사용)
});

export const matchPlayers = functions.pubsub.schedule('0 9 * * 1').onRun(async () => {
  // 매주 월요일 09:00 자동 팀 매칭
});

export const finalizeGame = functions.database.ref('/gameRooms/{roomId}/status')
  .onUpdate(async (change, context) => {
    // 게임 종료 시 로그 저장
  });
```

### 3. AI (Gemini API)

| 항목 | 세부사항 |
|-----|----------|
| **모델** | Gemini 1.5 Flash (gemini-1.5-flash-latest) |
| **입력** | 이미지 (Base64 또는 GCS URI) + 텍스트 프롬프트 |
| **출력** | JSON 형식 (`{"guess": "백설공주", "confidence": 0.85}`) |
| **비용** | $0.00001875/이미지 (~300회 호출 시 $5-10) |
| **오케스트레이션** | Firebase Genkit (v0.5+) |

**Genkit 사용 이유:**
- Cloud Function 내에서 API 키를 안전하게 관리
- 프롬프트 버전 관리 및 A/B 테스트 용이
- 멀티모달(Vision) API 추상화

---

## 💾 데이터 모델 (Database Schema)

### Firebase Realtime Database 구조

```json
{
  "users": {
    "uid-player-1": {
      "displayName": "김개발",
      "email": "kim@neolab.com",
      "department": "개발팀",
      "photoURL": "https://..."
    }
  },

  "gameRooms": {
    "room-abc123": {
      "status": "in-progress",           // 'waiting' | 'in-progress' | 'finished'
      "theme": "동화",                    // 게임 주제
      "targetWord": "백설공주",           // 정답 단어
      "currentTurn": "uid-player-2",     // 현재 턴 플레이어 UID
      "turnOrder": ["uid-1", "uid-2", "uid-3", "uid-4", "uid-5"],
      "currentTurnIndex": 1,             // 0-based 인덱스
      "maxTurns": 10,
      "turnCount": 2,                    // 현재까지 소비한 턴 수
      "startTime": 1678886400000,        // Unix timestamp (ms)
      "players": {
        "uid-player-1": { "name": "김개발", "team": "A", "ready": true },
        "uid-player-2": { "name": "이소통", "team": "A", "ready": true },
        "uid-player-3": { "name": "박기획", "team": "A", "ready": true },
        "uid-player-4": { "name": "최디자인", "team": "A", "ready": true },
        "uid-player-5": { "name": "정마케팅", "team": "A", "ready": true }
      },
      "aiGuesses": [
        { "turn": 1, "guess": "사과", "confidence": 0.72, "timestamp": 1678886401000 },
        { "turn": 2, "guess": "공주", "confidence": 0.65, "timestamp": 1678886462000 }
      ]
    }
  },

  "liveDrawings": {
    "room-abc123": {
      "canvasState": "{\"version\":\"5.3.0\",\"objects\":[...]}",  // Fabric.js JSON
      "lastUpdatedBy": "uid-player-2",
      "lastUpdatedAt": 1678886462000
    }
  },

  "chatMessages": {
    "room-abc123": {
      "msg-001": {
        "uid": "uid-player-1",
        "displayName": "김개발",
        "text": "제가 사과 먼저 그릴게요",
        "timestamp": 1678886400500
      },
      "msg-002": {
        "uid": "uid-player-2",
        "displayName": "이소통",
        "text": "좋아요! 저는 난쟁이 추가할게요",
        "timestamp": 1678886401200
      }
    }
  },

  "gameLogs": {
    "log-abc123": {
      "roomId": "room-abc123",
      "theme": "동화",
      "targetWord": "백설공주",
      "finalTurnCount": 5,
      "finalTime": 180500,                  // ms
      "winningTeam": "room-abc123",
      "finalImageUri": "gs://bucket/drawings/room-abc123-final.png",
      "aiGuessList": [...],                 // aiGuesses 배열 복사
      "completedAt": 1678886580500
    }
  }
}
```

### 데이터 흐름 최적화

**실시간 동기화 최적화:**
```javascript
// ❌ 비효율: 전체 게임 룸 구독
database.ref('/gameRooms/room-abc123').on('value', ...)

// ✅ 효율: 필요한 경로만 구독
database.ref('/liveDrawings/room-abc123/canvasState').on('value', ...)
database.ref('/chatMessages/room-abc123').on('child_added', ...)
```

**보안 규칙 (Security Rules):**
```json
{
  "rules": {
    "gameRooms": {
      "$roomId": {
        ".read": "auth != null && data.child('players').child(auth.uid).exists()",
        ".write": "auth != null && data.child('players').child(auth.uid).exists()"
      }
    },
    "liveDrawings": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('gameRooms').child($roomId).child('currentTurn').val() == auth.uid"
      }
    }
  }
}
```

---

## 🔄 핵심 로직 흐름

### 1. 게임 시작 (참가 → 매칭)

```
[사용자]
    ↓ (참가 신청)
[Firebase Auth] 인증 확인
    ↓
[Cloud Function: matchPlayers]
    - 참가자 목록 읽기
    - 5명씩 무작위 팀 구성
    - /gameRooms/{roomId} 생성
    ↓
[클라이언트]
    - 할당된 roomId로 리다이렉트
    - /game/{roomId} 페이지 이동
```

### 2. 실시간 드로잉 동기화

```
[Player 1 - 현재 턴]
    ↓ (마우스로 그림 그리기)
canvas.on('mouse:up', () => {
    const json = canvas.toJSON();
    database.ref(`/liveDrawings/${roomId}/canvasState`).set(json);
})
    ↓ (Firebase RTDB에 JSON 저장)

[Player 2-5 - 관전자]
database.ref(`/liveDrawings/${roomId}/canvasState`).on('value', (snapshot) => {
    const json = snapshot.val();
    canvas.loadFromJSON(json);  // 캔버스 즉시 업데이트
})
    ↓ (실시간으로 동일한 그림 렌더링)
```

**성능 고려사항:**
- Fabric.js JSON은 획이 많아질수록 크기 증가 → 최대 100KB로 제한
- 대안: 증분 업데이트(Incremental updates) 또는 SVG path만 전송

### 3. AI 추론 (턴 종료 시)

```
[Player 1] 턴 종료 버튼 클릭
    ↓
[Client]
    - canvas.toDataURL('image/jpeg') → Base64 변환
    - Cloud Function 호출: judgeDrawing({ roomId, imageBase64 })
    ↓
[Cloud Function: judgeDrawing]
    - Genkit Flow 실행
    - Gemini API에 이미지 + 프롬프트 전송
    ↓
[Gemini API]
프롬프트: "Category: 동화. What is this drawing? Respond in Korean."
    ↓ (응답)
{"guess": "백설공주", "confidence": 0.85}
    ↓
[Cloud Function]
    - guess == targetWord?
        - Yes: gameRooms/{roomId}/status = 'finished'
        - No: currentTurnIndex++, turnCount++
    - aiGuesses 배열에 결과 추가
    ↓
[Client]
    - gameRooms/{roomId} 구독 중 → status 변화 감지
    - 'finished' → /results 페이지로 이동
```

### 4. 게임 종료 및 로그 저장

```
[Database Trigger: onUpdate('/gameRooms/{roomId}/status')]
    ↓
[Cloud Function: finalizeGame]
    - 최종 캔버스 이미지 생성 (서버 사이드 렌더링 또는 클라이언트 업로드)
    - Cloud Storage에 저장: /drawings/{roomId}-final.png
    - /gameLogs/{logId} 생성 (결과 아카이빙)
    - 전체 팀 순위 계산 (turnCount, finalTime 기준)
    ↓
[Client: /results 페이지]
    - gameLogs 읽기 → 리더보드 표시
    - 우승팀 축하 애니메이션
```

---

## 🚀 배포 아키텍처

### 개발 환경 (Local)

```bash
# Firebase Emulator Suite 실행
firebase emulators:start

# 로컬 서비스:
- Auth: http://localhost:9099
- Realtime Database: http://localhost:9000
- Functions: http://localhost:5001
- Hosting: http://localhost:5000
```

### 프로덕션 환경

```
Firebase Hosting (CDN)
    ├── Region: asia-northeast3 (서울)
    └── Custom Domain: play.neolab.com (선택 사항)

Cloud Functions
    ├── Region: asia-northeast3
    └── 메모리: 512MB (Gemini API 호출 시 충분)

Realtime Database
    └── Region: asia-southeast1 (싱가포르 - 서울 가장 가까움)

Cloud Storage
    └── Region: asia-northeast3
```

---

## 📊 성능 및 비용 분석

### 예상 트래픽 (50명, 10팀, 1회 게임)

| 항목 | 수량 | 비용 |
|-----|------|------|
| **RTDB 읽기** | ~50,000회 (실시간 동기화) | 무료 (Spark 한도 내) |
| **RTDB 쓰기** | ~5,000회 (캔버스 업데이트) | 무료 |
| **Cloud Functions 실행** | ~300회 (AI 추론) | $0.40 |
| **Gemini API 호출** | ~300회 | $5-10 |
| **Storage 저장** | ~50MB (최종 이미지) | $0.01 |
| **Hosting 트래픽** | ~500MB | 무료 |

**월 예상 비용 (주 1회 게임):**
- 총합: $6-11/회 × 4회 = **$24-44/월**
- 목표($20) 대비 약간 초과 → 최적화 필요 (캐싱, 이미지 압축)

### 성능 병목 지점 및 해결 방안

| 병목 지점 | 원인 | 해결 방안 |
|----------|------|----------|
| **캔버스 동기화 지연** | JSON 크기 증가 | Gzip 압축, 증분 업데이트 |
| **AI 추론 속도** | Gemini API 응답 시간 (~2-3초) | 프롬프트 최적화, 캐싱 |
| **동시 접속 부하** | 50명 동시 RTDB 읽기 | Connection pooling, CDN 캐싱 |

---

## 🔒 보안 고려사항

### 1. API 키 보호

```javascript
// ❌ 절대 금지: 클라이언트에 API 키 노출
const apiKey = "AIzaSyC...";  // 프론트엔드 코드에 하드코딩

// ✅ 권장: Cloud Function에서만 사용
// functions/.env.local
GEMINI_API_KEY=AIzaSyC...

// functions/src/ai/judge.ts
const apiKey = process.env.GEMINI_API_KEY;
```

### 2. RTDB 보안 규칙

- 인증된 사용자만 접근
- 자신이 속한 게임 룸만 읽기/쓰기 가능
- 현재 턴 플레이어만 캔버스 수정 가능

### 3. XSS 방지

- 채팅 메시지 sanitize (DOMPurify 사용)
- Fabric.js 객체에 악의적 스크립트 삽입 방지

---

## 🔮 확장 가능성 (Scalability)

### 100명 규모 (20팀)로 확장 시

- **RTDB**: Spark 플랜 한도 초과 → **Blaze 플랜 필수** ($25/월 고정 + 종량제)
- **Cloud Functions**: 동시 실행 제한 → 인스턴스 수 증가 ($0.40 → $0.80)
- **Gemini API**: 호출 횟수 2배 → 비용 2배 ($10 → $20)

**결론**: 100명 규모 시 월 $50-70 예상 → 회사 복지 예산으로 충분히 감당 가능

---

## 📚 참고 자료

- [Firebase Realtime Database 문서](https://firebase.google.com/docs/database)
- [Fabric.js 공식 문서](http://fabricjs.com/docs/)
- [Gemini API 가이드](https://ai.google.dev/gemini-api/docs)
- [Firebase Genkit](https://firebase.google.com/docs/genkit)

---

**다음 문서**: [FRONTEND.md](./FRONTEND.md) - 프론트엔드 상세 설계
