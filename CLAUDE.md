# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 프로젝트 개요

**Neo Play Room**은 네오랩컨버전스 사내 소통 활성화를 위한 2개월 주기 게임 개발 프로젝트입니다.

**현재 활성 프로젝트**: `games/project-da-vinci` - 5인 협동 AI Pictionary 게임
- React 19 + TypeScript + Vite 프론트엔드
- Firebase (Realtime Database + Cloud Functions) 백엔드
- Gemini 1.5 Flash Vision API를 활용한 AI 그림 판정

---

## 🏗️ 프로젝트 구조

```
neo-play-room/
├── README.md                           # 레포지토리 전체 개요
├── AGENTS.md                           # 팀 협업 가이드라인
├── games/
│   └── project-da-vinci/               # Cycle 1: AI 협동 Pictionary
│       ├── README.md                    # 게임 개요 및 룰
│       ├── docs/                        # 상세 설계 문서
│       │   ├── ARCHITECTURE.md          # 시스템 아키텍처
│       │   ├── FRONTEND.md              # 프론트엔드 설계
│       │   ├── BACKEND.md               # Cloud Functions 설계
│       │   ├── AI.md                    # Gemini API 프롬프트 전략
│       │   ├── TESTING.md               # 테스트 전략 (Vitest, Playwright)
│       │   └── TODO.md                  # 8주 개발 일정
│       ├── frontend/                    # React SPA
│       │   ├── src/
│       │   │   ├── main.tsx             # 앱 진입점
│       │   │   ├── App.tsx              # 라우팅 (Home, Lobby, GameRoom, Results)
│       │   │   ├── components/          # UI 컴포넌트
│       │   │   │   ├── game/            # Canvas, DrawingTools, Chat, AIGuessDisplay
│       │   │   │   └── common/          # Button, Modal, Loader
│       │   │   ├── pages/               # Home, Lobby, GameRoom, Results
│       │   │   ├── hooks/               # useAuth, useGameRoom, useCanvas, useAIJudge
│       │   │   ├── stores/              # Zustand (authStore만 사용, 게임 상태는 RTDB)
│       │   │   ├── services/            # Firebase SDK 래퍼 (auth, database, functions)
│       │   │   ├── types/               # game.types.ts (GameRoom, AIGuess 등)
│       │   │   └── utils/               # timeFormatter, sanitizer
│       │   ├── vite.config.ts           # Vite 설정 (@/ 경로 별칭)
│       │   └── package.json             # React 19, Fabric.js 6, Zustand 5
│       ├── functions/                   # Cloud Functions (Node 20)
│       │   ├── src/
│       │   │   ├── index.ts             # 진입점
│       │   │   ├── ai/                  # judgeDrawing Function + prompts.ts
│       │   │   └── game/                # matchPlayers, finalizeGame
│       │   └── package.json             # Gemini AI 0.21, Firebase Admin 12.7
│       ├── firebase.json                # Firebase 배포 설정
│       └── database.rules.json          # RTDB 보안 규칙
└── shared/                              # (향후 확장) 공통 모듈
```

---

## 🚀 개발 환경 설정 및 빌드 명령어

### 프론트엔드 (frontend/)

```bash
# 작업 디렉토리
cd games/project-da-vinci/frontend

# 개발 서버 실행 (Vite HMR)
npm run dev                    # → http://localhost:5173

# 빌드 (TypeScript 검사 + Vite 번들링)
npm run build                  # → dist/

# 빌드 결과 미리보기
npm run preview

# 코드 품질
npm run lint                   # ESLint 검사
npm run lint:fix               # ESLint 자동 수정
npm run format                 # Prettier 포맷팅

# 테스트 (Vitest)
npm run test                   # Watch 모드
npm run test:ui                # Vitest UI
npm run test:run               # 단일 실행 (CI용)
npm run test:coverage          # 커버리지 리포트
```

### Cloud Functions (functions/)

```bash
# 작업 디렉토리
cd games/project-da-vinci/functions

# Functions 빌드
npm run build                  # TypeScript → lib/

# 로컬 개발 (Emulator)
npm run serve                  # Emulator 실행 (빌드 후)

# 배포
npm run deploy                 # firebase deploy --only functions

# 로그 확인
npm run logs                   # firebase functions:log
```

### Firebase Emulator (전체 개발 환경)

```bash
# 레포지토리 루트에서
firebase emulators:start

# 실행되는 서비스:
# - Auth: http://localhost:9099
# - Realtime Database: http://localhost:9000
# - Functions: http://localhost:5001
# - Storage: http://localhost:9199
# - Emulator UI: http://localhost:4000
```

### Firebase 배포

```bash
# 전체 배포 (Hosting + Functions)
firebase deploy

# Functions만 배포
firebase deploy --only functions

# 특정 Function만 배포
firebase deploy --only functions:judgeDrawing

# Hosting만 배포
firebase deploy --only hosting
```

---

## 📐 아키텍처 핵심 원칙

### 1. 서버리스 우선 (Serverless-First)
- **백엔드 서버 없음**: Firebase BaaS로 인프라 관리 최소화
- **Cloud Functions**: HTTP Callable로 AI 추론 등 서버 로직 처리
- **Realtime Database**: WebSocket 기반 실시간 동기화 (Firestore 대신 RTDB 선택 이유: 낮은 지연시간)

### 2. 게임 상태의 단일 진실 공급원 (Single Source of Truth)
- **Zustand**: 클라이언트 인증 상태만 관리 (`authStore`)
- **Firebase RTDB**: 게임 상태는 모두 RTDB에 저장 (GameRoom, LiveDrawing, ChatMessages)
- **React 훅이 RTDB 구독**: `useGameRoom(roomId)` → `onValue()` 리스너로 실시간 반영

### 3. AI를 "플레이어"로 설계
- ❌ **잘못된 접근**: AI가 정답을 알고 "그림이 정답과 맞는지" 평가
- ✅ **올바른 접근**: AI가 정답을 모르고 "그림이 무엇인지" 추론 → 진정한 협동 게임

### 4. 실시간 캔버스 동기화
```
Player A (턴)                    Firebase RTDB                     Player B-E (관전)
    │                                 │                                  │
    ├─ 마우스로 그림 그리기                │                                  │
    ├─ canvas.toJSON()                 │                                  │
    ├─ set('/liveDrawings/roomId') ──→ │                                  │
    │                                 ├─ onValue() 리스너 ──────────────→ │
    │                                 │                                  ├─ canvas.loadFromJSON()
    │                                 │                                  └─ 즉시 렌더링
```

**최적화:**
- Debounce (500ms): 과도한 RTDB 쓰기 방지
- JSON 크기 제한 (100KB): 성능 저하 방지
- 현재 턴 플레이어만 쓰기 권한 (RTDB Rules)

### 5. AI 추론 파이프라인
```
[Player 턴 종료]
    ↓
[클라이언트] canvas.toDataURL('image/jpeg', 0.8) → Base64
    ↓
[Cloud Function: judgeDrawing]
    - RTDB에서 GameRoom 조회 (theme, targetWord)
    - 프롬프트 생성 (buildEnhancedPrompt(theme))
    - Gemini 1.5 Flash 호출 (이미지 + 프롬프트)
    - JSON 파싱 { guess: "백설공주", confidence: 0.85 }
    - 정답 확인 (guess === targetWord)
    - 게임 상태 업데이트 (다음 턴 OR 종료)
    ↓
[응답] { guess, confidence, isCorrect, gameStatus }
    ↓
[클라이언트] UI 업데이트 (AI 추론 결과 표시)
```

---

## 🎨 주요 기술 스택 & 버전

| 카테고리 | 기술 | 버전 | 용도 |
|---------|------|------|------|
| **Frontend** | React | 19.2.0 | UI 라이브러리 (최신 Concurrent 렌더링) |
| | TypeScript | 5.9.3 | 정적 타입 검사 (Strict Mode) |
| | Vite | 7.2.2 | 빌드 도구 (HMR) |
| | Tailwind CSS | 4.1.17 | 유틸리티 기반 스타일링 |
| | Fabric.js | 6.9.0 | HTML5 Canvas 객체 제어 |
| | Zustand | 5.0.8 | 경량 상태 관리 (authStore) |
| | React Router | 7.9.5 | 클라이언트 라우팅 |
| | DOMPurify | 3.3.0 | XSS 방지 (채팅 메시지 sanitize) |
| **Backend** | Firebase Admin | 12.7.0 | Firebase 서버 SDK |
| | Firebase Functions | 6.1.1 | Cloud Functions v2 |
| | Gemini API | 0.21.0 | Google AI Vision 모델 |
| | Node.js | 20 | Functions 런타임 |
| **BaaS** | Firebase Auth | - | Google SSO (@neolab.net 도메인 제한) |
| | Realtime Database | - | 실시간 동기화 (WebSocket 기반) |
| | Cloud Storage | - | 최종 이미지 아카이빙 |
| | Hosting | - | React SPA 정적 파일 서빙 (CDN) |
| **Testing** | Vitest | 4.0.8 | 단위 테스트 (jsdom 환경) |
| | Testing Library | 16.3.0 | React 컴포넌트 테스트 |
| | Playwright | - | E2E 테스트 (향후 추가 예정) |
| **Code Quality** | ESLint | 9.39.1 | Flat Config v9 + TypeScript ESLint |
| | Prettier | 3.6.2 | 코드 포맷팅 |
| | Husky | 9.1.7 | Git Hooks (pre-commit) |
| | lint-staged | 16.2.6 | 변경된 파일만 lint + test |

---

## 📂 핵심 파일 & 모듈 가이드

### Frontend 주요 파일

| 파일 경로 | 역할 | 주요 로직 |
|----------|------|----------|
| **src/main.tsx** | 앱 진입점 | React.createRoot() + Firebase 초기화 |
| **src/App.tsx** | 라우팅 | React Router (/, /lobby, /game/:roomId, /results) |
| **src/firebase.ts** | Firebase SDK 초기화 | auth, database, functions export |
| **src/types/game.types.ts** | 타입 정의 | GameRoom, AIGuess, Player 등 인터페이스 |

#### 페이지 컴포넌트 (src/pages/)
| 파일 | 경로 | 기능 |
|-----|------|------|
| **Home.tsx** | `/` | Google SSO 로그인 페이지 |
| **Lobby.tsx** | `/lobby` | 팀원 대기실 (5명 매칭 후 게임 시작) |
| **GameRoom.tsx** | `/game/:roomId` | 메인 게임 화면 (Canvas + Chat + AI 추론) |
| **Results.tsx** | `/results` | 게임 종료 후 결과 화면 (리더보드) |

#### 커스텀 훅 (src/hooks/)
| 훅 | 기능 | 반환값 |
|----|------|--------|
| **useAuth()** | Firebase Auth 상태 관리 | `{ user, loading, signIn, signOut }` + @neolab.net 검증 |
| **useGameRoom(roomId)** | 게임 룸 실시간 구독 | `{ gameRoom, canvasState, loading }` |
| **useCanvas()** | Fabric.js Canvas 제어 | `{ canvas, initCanvas, syncCanvas, exportImage }` |
| **useAIJudge()** | AI 추론 Cloud Function 호출 | `{ judge(roomId, imageBase64), loading, error }` |
| **useMatchmaking()** | Lobby 플레이어 매칭 | `{ players, joinLobby, leaveLobby, startGame }` |

#### 게임 컴포넌트 (src/components/game/)
| 컴포넌트 | 기능 |
|---------|------|
| **Canvas.tsx** | Fabric.js 캔버스 (현재 턴 플레이어만 수정 가능, 나머지는 읽기 전용) |
| **DrawingTools.tsx** | 브러시 색상/두께 선택, 지우기 버튼 |
| **TurnIndicator.tsx** | 현재 턴 플레이어, 턴 수, 경과 시간 표시 |
| **PlayerList.tsx** | 5명 팀원 목록 (프로필 사진, 이름, 부서) |
| **Chat.tsx** | 실시간 채팅 (XSS 방지: DOMPurify) |
| **AIGuessDisplay.tsx** | AI 추론 결과 및 히스토리 표시 |

#### Services (src/services/)
| 파일 | 역할 |
|-----|------|
| **auth.ts** | Firebase Auth 래퍼 (`signInWithPopup`, `signOut`) |
| **gameRoom.ts** | 게임 룸 CRUD (`subscribeToGameRoom`, `updateGameRoom`, `endTurn`) |
| **matchmaking.ts** | Lobby 로직 (`joinLobby`, `createGameRoom`) |
| **ai.ts** | Cloud Function 호출 (`judgeDrawing` httpsCallable) |

### Cloud Functions 주요 파일

| 파일 경로 | 역할 |
|----------|------|
| **functions/src/index.ts** | Function 진입점 (judgeDrawing, matchPlayers, finalizeGame export) |
| **functions/src/ai/prompts.ts** | 프롬프트 템플릿 (buildJudgePrompt, buildEnhancedPrompt, buildFewShotPrompt) |
| **functions/src/ai/judge.ts** | judgeDrawing Function (Gemini API 호출 + 게임 상태 업데이트) |
| **functions/src/game/matching.ts** | matchPlayers Function (참가자 → 5인 팀 자동 구성) |
| **functions/src/game/finalize.ts** | finalizeGame Trigger (게임 종료 시 로그 저장) |

---

## 🗂️ Firebase Realtime Database 구조

```json
{
  "users": {
    "{uid}": {
      "displayName": "김개발",
      "email": "kim@neolab.net",
      "department": "개발팀",
      "photoURL": "https://..."
    }
  },

  "lobby": {
    "waitingPlayers": {
      "{uid}": { "name": "...", "joinedAt": 1234567890 }
    }
  },

  "gameRooms": {
    "{roomId}": {
      "status": "in-progress",        // 'waiting' | 'in-progress' | 'finished'
      "theme": "동화",
      "targetWord": "백설공주",
      "currentTurn": "{uid}",
      "turnOrder": ["{uid1}", "{uid2}", "{uid3}", "{uid4}", "{uid5}"],
      "currentTurnIndex": 2,
      "maxTurns": 10,
      "turnCount": 3,
      "startTime": 1678886400000,
      "endTime": null,
      "players": {
        "{uid}": { "name": "김개발", "team": "A", "ready": true }
      },
      "aiGuesses": [
        { "turn": 1, "guess": "사과", "confidence": 0.72, "timestamp": 1678886401000 },
        { "turn": 2, "guess": "공주", "confidence": 0.65, "timestamp": 1678886462000 }
      ]
    }
  },

  "liveDrawings": {
    "{roomId}": {
      "canvasState": "{...Fabric.js JSON...}",  // Stringified JSON
      "lastUpdatedBy": "{uid}",
      "lastUpdatedAt": 1678886462000
    }
  },

  "chatMessages": {
    "{roomId}": {
      "{messageId}": {
        "uid": "{uid}",
        "displayName": "김개발",
        "text": "제가 사과 먼저 그릴게요",
        "timestamp": 1678886400500
      }
    }
  },

  "gameLogs": {
    "{logId}": {
      "roomId": "{roomId}",
      "theme": "동화",
      "targetWord": "백설공주",
      "finalTurnCount": 5,
      "finalTime": 180500,              // ms
      "winningTeam": "{roomId}",
      "finalImageUri": "gs://bucket/drawings/finals/{roomId}.jpg",
      "aiGuessList": [...],
      "completedAt": 1678886580500
    }
  }
}
```

### 보안 규칙 (database.rules.json)

**핵심 원칙:**
1. 인증된 사용자만 접근 (`auth != null`)
2. 자신이 속한 게임 룸만 읽기/쓰기
3. **현재 턴 플레이어만** 캔버스 수정 가능
4. 게임 로그는 Cloud Function만 작성

---

## 🧠 AI 프롬프트 전략

### 3가지 프롬프트 버전 (docs/AI.md 참조)

1. **buildJudgePrompt(theme)**: 기본 프롬프트
   - "You are playing a Pictionary game. Guess what this drawing represents."
   - 카테고리 힌트만 제공

2. **buildEnhancedPrompt(theme)**: 테마별 힌트 추가
   - 테마별 예시 단어 제공 (동화: 백설공주, 신데렐라...)
   - 현재 기본 사용 중

3. **buildFewShotPrompt(theme)**: Few-shot 학습 (향후 개선용)
   - 과거 게임 예시 3개 제공
   - 정확도 향상 목표

### Gemini API 설정

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    temperature: 0.7,        // 약간의 창의성 허용
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 100,    // JSON 응답은 짧음
  },
});
```

### JSON 응답 포맷 강제

```json
{
  "guess": "백설공주",
  "confidence": 0.85
}
```

**Fallback 파싱**: Gemini가 마크다운으로 감싸는 경우 정규식으로 추출

---

## 🧪 테스트 전략 (docs/TESTING.md 참조)

### 테스트 피라미드

```
      /\
     /E2E\     (10% - Playwright)
    /______\
   /통합테스트\  (30% - Vitest + Firebase Emulator)
  /__________\
 /  단위테스트 \ (60% - Vitest + Testing Library)
/____________\
```

### 커버리지 목표

| 모듈 | 목표 | 실행 시점 |
|-----|------|----------|
| **단위 테스트** | 80% | 매 커밋 (pre-commit hook via lint-staged) |
| **통합 테스트** | 60% | PR 생성 시 (CI/CD) |
| **E2E 테스트** | 주요 시나리오 10개 | 배포 전 (주 1회) |

### 주요 테스트 파일

```bash
frontend/src/
├── utils/
│   ├── timeFormatter.test.ts        # 시간 포맷팅 유틸
│   └── sanitizer.test.ts            # XSS 방지 sanitize
├── stores/
│   └── authStore.test.ts            # Zustand 스토어
├── hooks/
│   └── useAuth.test.ts              # Firebase Auth 훅
├── services/
│   └── matchmaking.test.ts          # Lobby 로직
└── components/
    └── game/
        └── Canvas.test.tsx          # Fabric.js 캔버스 컴포넌트

functions/test/
├── ai/
│   └── prompts.test.ts              # 프롬프트 생성 로직
└── game/
    └── matching.test.ts             # 팀 매칭 알고리즘
```

### pre-commit 자동 테스트 (lint-staged)

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "vitest related --run"     // 변경된 파일 관련 테스트만 실행
  ]
}
```

---

## 🎯 개발 워크플로우 & 컨벤션

### 커밋 메시지 컨벤션 (Conventional Commits)

```bash
feat: 새로운 기능 추가
fix: 버그 수정
chore: 빌드/설정 변경
docs: 문서 수정
style: 코드 스타일 변경 (세미콜론 등)
refactor: 리팩토링
test: 테스트 추가/수정
perf: 성능 개선
```

**예시:**
```bash
git commit -m "feat(frontend): Canvas 컴포넌트 실시간 동기화 구현"
git commit -m "fix(functions): AI 추론 JSON 파싱 에러 수정"
git commit -m "chore: Vite 7.2.2로 업그레이드"
```

### PR 가이드라인 (AGENTS.md 참조)

1. **PR 제목**: Conventional Commits 형식
2. **설명 포함 사항**:
   - 변경 사항 요약
   - 게임플레이 영향 (있는 경우)
   - 테스트 방법 명시
   - UI 변경 시 스크린샷 첨부
3. **크기 제한**: ~400줄 이하 (frontend/functions 분리 권장)

### 코드 스타일

- **들여쓰기**: 2 spaces
- **세미콜론**: 사용 안 함 (Prettier 설정)
- **따옴표**: 싱글 쿼트 (`'`)
- **최대 줄 길이**: 100자
- **컴포넌트 파일명**: PascalCase (`CanvasBoard.tsx`)
- **훅/유틸 파일명**: camelCase (`useGameRoom.ts`)

### ESLint + Prettier 통합

```bash
npm run lint        # ESLint 검사
npm run lint:fix    # 자동 수정
npm run format      # Prettier 포맷팅
```

**우회 금지**: Husky/lint-staged를 bypass하지 말 것. 수정이 어려운 경우 주석으로 이유 명시:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = ...; // RTDB 응답 타입이 동적이므로 any 허용
```

---

## 🔐 보안 고려사항

### 1. API 키 보호

❌ **절대 금지:**
```typescript
// frontend/src/config.ts
export const GEMINI_API_KEY = "AIzaSyC...";  // 클라이언트 노출 위험!
```

✅ **올바른 방법:**
```bash
# functions/.env (로컬)
GEMINI_API_KEY=AIzaSyC...

# 프로덕션 (Firebase Config)
firebase functions:config:set gemini.api_key="AIzaSyC..."
```

### 2. Firebase 보안 규칙

**RTDB Rules:**
- 현재 턴 플레이어만 캔버스 수정 가능
- 자신이 속한 게임 룸만 접근
- 게임 로그는 Cloud Function만 쓰기

**Storage Rules:**
- 인증 사용자는 읽기만 가능
- 업로드는 Cloud Function(Admin SDK)만

### 3. XSS 방지

채팅 메시지는 **DOMPurify**로 sanitize:
```typescript
import DOMPurify from 'dompurify';

export function sanitizeMessage(message: string): string {
  return DOMPurify.sanitize(message, {
    ALLOWED_TAGS: [],  // HTML 태그 모두 제거
    ALLOWED_ATTR: [],
  });
}
```

### 4. 도메인 제한 (@neolab.net)

`useAuth` 훅에서 이메일 도메인 검증:
```typescript
if (!user.email?.endsWith('@neolab.net')) {
  throw new Error('네오랩컨버전스 계정만 접근 가능합니다.');
}
```

---

## 📊 성능 최적화 전략

### 1. 캔버스 동기화 최적화

```typescript
import { debounce } from 'lodash-es';

// 500ms마다 최대 1회만 RTDB에 저장
const syncCanvasDebounced = debounce((roomId, json) => {
  database.ref(`/liveDrawings/${roomId}/canvasState`).set(JSON.stringify(json));
}, 500);
```

### 2. 이미지 압축

```typescript
// AI 추론 전 이미지 품질 80%로 압축
const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
```

### 3. Code Splitting (React.lazy)

```typescript
import { lazy, Suspense } from 'react';

const GameRoom = lazy(() => import('@/pages/GameRoom'));

<Suspense fallback={<Loader />}>
  <GameRoom />
</Suspense>
```

### 4. Fabric.js JSON 크기 제한

```typescript
const json = canvas.toJSON();
const jsonSize = JSON.stringify(json).length;

if (jsonSize > 100000) {  // 100KB
  throw new Error('Canvas JSON exceeds 100KB. Too many objects!');
}
```

---

## 🚨 알려진 이슈 & 제약사항

1. **Fabric.js JSON 직렬화 지연**
   - 100개 이상 객체 시 성능 저하
   - 해결 방안: Debounce + 증분 업데이트 (향후 개선)

2. **Gemini API 응답 시간**
   - 평균 2-3초 (네트워크 상황에 따라 변동)
   - 사용자 경험: 로딩 애니메이션으로 대응

3. **RTDB 무료 플랜 한도**
   - Spark 플랜: 동시 접속 100명, 다운로드 10GB/월
   - 50명 규모에서는 문제없음, 100명 이상 시 Blaze 플랜 필요

4. **Gemini JSON 응답 불안정**
   - 가끔 마크다운(```json```)으로 감싸는 경우 있음
   - 정규식 fallback으로 대응 중

---

## 📖 추가 참고 문서

### 프로젝트 문서
- **games/project-da-vinci/README.md**: 게임 룰 및 개요
- **games/project-da-vinci/docs/ARCHITECTURE.md**: 시스템 아키텍처 다이어그램
- **games/project-da-vinci/docs/FRONTEND.md**: 컴포넌트 상세 설계
- **games/project-da-vinci/docs/BACKEND.md**: Cloud Functions 구현 가이드
- **games/project-da-vinci/docs/AI.md**: Gemini API 프롬프트 엔지니어링
- **games/project-da-vinci/docs/TESTING.md**: 테스트 전략 (Vitest, Playwright)
- **games/project-da-vinci/docs/TODO.md**: 8주 개발 일정 및 체크리스트

### 팀 협업
- **AGENTS.md**: AI 에이전트 호출 시 한국어 응답 설정, 커밋 컨벤션, PR 가이드라인

### 외부 문서
- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Gemini API Guide](https://ai.google.dev/gemini-api/docs)
- [React 19 Docs](https://react.dev/)
- [Vite Guide](https://vite.dev/)

---

## 🎯 개발 시 주의사항

### DO ✅
- **문서 우선**: 로직 변경 전 해당 문서(ARCHITECTURE.md, FRONTEND.md 등) 참조
- **타입 안전성**: `any` 사용 최소화, 인터페이스 정의 (`types/game.types.ts`)
- **테스트 작성**: 새로운 훅/컴포넌트 추가 시 최소 1개 테스트 작성
- **보안 규칙 확인**: RTDB/Storage 경로 변경 시 보안 규칙 업데이트
- **커밋 전 lint**: `npm run lint:fix` + `npm run format` 실행
- **한국어 주석**: 복잡한 로직은 한국어로 주석 (AI 프롬프트는 영어)

### DON'T ❌
- **RTDB 직접 수정 금지**: Admin Console에서 수동 편집하지 말 것 (보안 규칙 우회 위험)
- **API 키 커밋 금지**: `.env`, `.runtimeconfig.json` 절대 커밋 안 함
- **Zustand에 게임 상태 저장 금지**: 게임 상태는 RTDB가 단일 진실 공급원
- **거대한 PR 지양**: 400줄 이하로 분할 (frontend/functions 분리)
- **테스트 건너뛰기 금지**: `--no-verify` 사용 금지 (특수한 경우만 예외)
- **프로덕션 직접 배포 금지**: Emulator 테스트 후 배포

---

## 🛠️ 문제 해결 (Troubleshooting)

### Firebase Emulator 실행 실패
```bash
# 포트 충돌 시
firebase emulators:start --only functions,database

# 캐시 삭제
rm -rf .firebase
```

### Cloud Function 배포 실패
```bash
# functions/ 빌드 에러 확인
cd functions && npm run build

# TypeScript 컴파일 에러 해결 후 재배포
firebase deploy --only functions
```

### RTDB 보안 규칙 에러
```bash
# 로컬에서 테스트
firebase emulators:start

# 보안 규칙 시뮬레이터로 검증
# Emulator UI → Database → Rules
```

### Gemini API 할당량 초과
```bash
# Google Cloud Console에서 할당량 확인
# https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
```

---

**이 파일은 Claude Code가 이 레포지토리에서 효율적으로 작업할 수 있도록 작성되었습니다. 문서가 실제 코드와 일치하지 않는 경우 코드가 우선입니다.**
