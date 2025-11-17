# Project Turing - CLAUDE.md

이 파일은 **Project Turing (5인 협동 AI 찾기 게임)** 프로젝트 특화 개발 가이드입니다.

**⚠️ 주의**: 이 프로젝트 작업 전에 루트 `/CLAUDE.md`를 먼저 읽어 레포지토리 공통 원칙을 이해하세요.

---

## 🎯 프로젝트 개요

**Project Turing**은 5명의 참가자가 협동하여 숨어있는 AI 1명을 찾아내는 소셜 추리 게임입니다.

### 핵심 컨셉

- **튜링 테스트 게임화**: AI가 사람처럼 답변하고, 사람들은 AI를 구별
- **진정한 협동 추리**: 5명이 함께 AI를 찾아내야 성공
- **난이도별 AI 전략**: Easy/Normal/Hard에 따른 AI 답변 스타일 차별화

---

## 🏗️ 프로젝트 구조

```
games/project-turing/
├── CLAUDE.md                    # 이 파일 - project-turing 특화 가이드
├── README.md                    # 게임 개요 및 룰
├── docs/                        # 상세 설계 문서
│   ├── ARCHITECTURE.md          # 시스템 아키텍처
│   ├── FRONTEND.md              # 프론트엔드 설계
│   ├── BACKEND.md               # Cloud Functions 설계
│   ├── AI.md                    # Gemini API 답변 전략
│   ├── TESTING.md               # 테스트 전략 (Vitest, Playwright)
│   └── TODO.md                  # 8주 개발 일정
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── main.tsx             # 앱 진입점
│   │   ├── App.tsx              # 라우팅
│   │   ├── components/          # UI 컴포넌트
│   │   │   ├── game/            # AnswerInput, VotingBoard, Discussion, ResultDisplay
│   │   │   └── common/          # Button, Modal, Loader, Timer
│   │   ├── pages/               # Home, Lobby, GameRoom, Results
│   │   ├── hooks/               # useAuth, useGameRoom, useVoting, useTimer
│   │   ├── stores/              # Zustand (authStore만 사용)
│   │   ├── services/            # Firebase SDK 래퍼
│   │   ├── types/               # game.types.ts
│   │   └── utils/               # timeFormatter, sanitizer
│   ├── vite.config.ts           # Vite 설정
│   └── package.json             # React 19, Zustand 5
├── functions/                   # Cloud Functions (Node 20)
│   ├── src/
│   │   ├── index.ts             # 진입점
│   │   ├── ai/                  # ⚠️ AI 관련 로직은 여기만!
│   │   │   ├── respondAnswer.ts # AI 답변 생성
│   │   │   ├── prompts.ts       # 난이도별 프롬프트 템플릿
│   │   │   └── questionGenerator.ts # 질문 생성
│   │   └── game/                # matchPlayers, finalizeGame, checkVoteResult
│   ├── .env                     # ⚠️ 민감한 키
│   ├── .env.example             # 환경 변수 템플릿
│   └── package.json             # Gemini AI 0.21, Firebase Admin 12.7
├── firebase.json                # Firebase 배포 설정
└── database.rules.json          # RTDB 보안 규칙
```

---

## 🚀 개발 환경 설정 및 빌드 명령어

### 프론트엔드 (frontend/)

```bash
# 작업 디렉토리
cd games/project-turing/frontend

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
cd games/project-turing/functions

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
# 프로젝트 루트에서
cd games/project-turing
firebase emulators:start

# 실행되는 서비스:
# - Auth: http://localhost:9099
# - Realtime Database: http://localhost:9000
# - Functions: http://localhost:5001
# - Emulator UI: http://localhost:4000
```

### Firebase 배포

```bash
# 전체 배포 (Hosting + Functions)
firebase deploy

# Functions만 배포
firebase deploy --only functions

# 특정 Function만 배포
firebase deploy --only functions:generateAIResponse

# Hosting만 배포
firebase deploy --only hosting
```

---

## 📐 아키텍처 핵심 원칙

### 0. ⚠️ **최우선 규칙: 기존 구현 패턴 준수** ⚠️

**새로운 기능 구현 시 반드시 다음을 확인:**

1. **기존 유사 기능이 있는지 먼저 확인**
   - 예: AI 기능 추가 시 → `functions/src/ai/respondAnswer.ts` 확인 필수
   - 예: Firebase 인증 추가 시 → `frontend/src/hooks/useAuth.ts` 확인 필수
   - 예: 투표 로직 추가 시 → `frontend/src/hooks/useVoting.ts` 확인 필수

2. **기존 패턴을 반드시 따를 것**
   - ❌ **절대 금지**: Frontend에서 직접 외부 API 키 사용
   - ✅ **올바른 방법**: Cloud Functions를 통해 API 호출
   - ❌ **절대 금지**: 다른 모델/라이브러리 버전 사용
   - ✅ **올바른 방법**: 기존 구현과 동일한 모델/버전 사용 (gemini-2.5-flash-lite)

3. **보안 원칙 (Security First)**
   - **API 키는 절대 Frontend에 노출 금지**
   - **모든 민감한 로직은 Cloud Functions에서 실행**
   - **환경 변수 위치:**
     - Frontend: `frontend/.env` → `VITE_` 접두사 (public 데이터만)
     - Functions: `functions/.env` → 민감한 키 (API 키 등)

4. **기존 코드 참조 체크리스트**
   ```
   [ ] 유사 기능이 이미 구현되어 있는지 확인했는가?
   [ ] 기존 구현의 모델/라이브러리 버전을 확인했는가?
   [ ] 기존 구현의 보안 패턴을 확인했는가?
   [ ] 기존 구현의 에러 처리 방식을 확인했는가?
   [ ] 기존 구현의 로깅 방식을 확인했는가?
   ```

### 1. 서버리스 우선 (Serverless-First)
- **백엔드 서버 없음**: Firebase BaaS로 인프라 관리 최소화
- **Cloud Functions**: HTTP Callable로 AI 답변 생성, 투표 결과 처리
- **Realtime Database**: WebSocket 기반 실시간 동기화 (답변, 투표 상태)
- **⚠️ 중요**: 모든 외부 API 호출은 Cloud Functions에서만 실행

### 2. 게임 상태의 단일 진실 공급원 (Single Source of Truth)
- **Zustand**: 클라이언트 인증 상태만 관리 (`authStore`)
- **Firebase RTDB**: 게임 상태는 모두 RTDB에 저장 (GameRoom, Answers, Votes)
- **React 훅이 RTDB 구독**: `useGameRoom(roomId)` → `onValue()` 리스너로 실시간 반영

### 3. AI를 "플레이어"로 설계
- ✅ **올바른 접근**: AI가 사람처럼 답변하고, 사람들은 AI를 구별해야 함
- **난이도별 차별화**: AI 답변 스타일을 난이도에 따라 조정
  - Easy: 의도적으로 로봇같이 답변
  - Normal: 자연스럽게 답변
  - Hard: 타인 답변 패턴 분석 후 평균 스타일로 답변

### 4. 동시 답변 시스템
```
[턴 시작]
    ↓
[질문 제시] "최근에 본 영화는?"
    ↓
[타이머 시작] 60초 (난이도별 차등)
    ↓
[모든 참가자 + AI 동시 답변 입력]
    - 참가자: 텍스트 입력
    - AI: Cloud Function 호출 (타인 답변 참고 여부는 난이도에 따라)
    ↓
[타이머 종료] 모든 답변 동시 공개 (익명, 랜덤 순서)
    ↓
[토론 시간] 30초간 채팅
    ↓
[투표] 5명 참가자가 "누가 AI인가?" 투표
    ↓
[결과 확인]
    - AI 맞음 → 게임 종료 (성공)
    - AI 아님 → 다음 턴
    - 5턴 초과 → AI 승리 (실패)
```

**최적화:**
- 답변 제출 시 RTDB에 즉시 저장
- 타이머 동기화 (서버 시간 기준)
- 답변 공개 시 랜덤 섞기 (클라이언트)

### 5. AI 답변 생성 파이프라인
```
[턴 시작]
    ↓
[Cloud Function: generateAIResponse]
    - RTDB에서 GameRoom 조회 (question, difficulty, turn)
    - 난이도에 따라 다른 전략:
      - Easy: 단순 답변, 타인 답변 참고 X
      - Normal: 자연스러운 답변
      - Hard: 타인 답변 패턴 분석 후 평균 스타일로 답변
    - 프롬프트 생성 (buildPromptByDifficulty(question, difficulty, otherAnswers?))
    - Gemini 2.5 Flash 호출
    - 답변 텍스트 생성
    - RTDB에 답변 저장 (익명 ID로)
    ↓
[응답] { answer: "인터스텔라 봤어요", answerId: "player_3" }
    ↓
[클라이언트] 답변 목록에 추가 (누가 AI인지 모름)
```

**데이터 활용**:
- 질문 + 답변 + 투표 결과를 Firestore에 저장
- AI 답변 품질 개선에 활용
- 게임 밸런스 조정 (난이도별 성공률)

### 6. 투표 시스템
```
[토론 시간 종료]
    ↓
[투표 화면]
    - 6개 답변 표시 (익명)
    - 각 참가자가 1명 선택
    - 자기 자신은 선택 불가
    ↓
[모든 참가자 투표 완료]
    ↓
[Cloud Function: checkVoteResult]
    - 투표 집계
    - 최다 득표자 확인
    - AI 여부 확인
    - 게임 상태 업데이트
    ↓
[결과 공개]
    - 최다 득표자 공개
    - AI 여부 공개
    - 다음 턴 or 게임 종료
```

### 7. 협의 기반 게임 시작 플로우
```
[Lobby: 5명 매칭 완료]
    ↓
[GameRoom 생성 (status: waiting, difficulty: normal)]
    ↓
[대기실 UI]
    - 난이도 선택 (모든 참가자가 실시간 수정 가능)
    - 채팅으로 난이도 협의
    - 각 플레이어 "준비 완료" 버튼 클릭
    ↓
[모든 플레이어 ready: true]
    ↓
[게임 시작 버튼 활성화]
    ↓
[클릭 시 AI 투입 + status: in-progress]
    ↓
[게임 진행 (질문 → 답변 → 투표)]
```

**협동 게임 철학:**
- 난이도는 한 사람이 아닌 **모두가 협의**하여 결정
- 준비 완료 시스템으로 **모든 플레이어가 동의** 후 시작
- 대기실 채팅을 통한 **원활한 소통**

---

## 🎨 주요 기술 스택 & 버전

| 카테고리 | 기술 | 버전 | 용도 |
|---------|------|------|------|
| **Frontend** | React | 19.2.0 | UI 라이브러리 (최신 Concurrent 렌더링) |
| | TypeScript | 5.9.3 | 정적 타입 검사 (Strict Mode) |
| | Vite | 7.2.2 | 빌드 도구 (HMR) |
| | Tailwind CSS | 4.1.17 | 유틸리티 기반 스타일링 |
| | Zustand | 5.0.8 | 경량 상태 관리 (authStore) |
| | React Router | 7.9.5 | 클라이언트 라우팅 |
| | DOMPurify | 3.3.0 | XSS 방지 (채팅 메시지 sanitize) |
| **Backend** | Firebase Admin | 12.7.0 | Firebase 서버 SDK |
| | Firebase Functions | 6.1.1 | Cloud Functions v2 |
| | Gemini API | 0.21.0 | Google AI 답변 생성 |
| | Node.js | 20 | Functions 런타임 |
| **BaaS** | Firebase Auth | - | Google SSO (@neolab.net 도메인 제한) |
| | Realtime Database | - | 실시간 동기화 (WebSocket 기반) |
| | Firestore | - | 게임 로그, 분석 데이터 저장 |
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
| **src/types/game.types.ts** | 타입 정의 | GameRoom, Answer, Vote, Player 등 인터페이스 |

#### 페이지 컴포넌트 (src/pages/)
| 파일 | 경로 | 기능 |
|-----|------|------|
| **Home.tsx** | `/` | Google SSO 로그인 페이지 |
| **Lobby.tsx** | `/lobby` | 5명 매칭 대기실 (매칭 완료 시 GameRoom 생성) |
| **GameRoom.tsx** | `/game/:roomId` | **waiting**: 난이도 협의 + 채팅 + 준비 완료 대기실<br>**in-progress**: 메인 게임 (질문 → 답변 → 토론 → 투표) |
| **Results.tsx** | `/results` | 게임 종료 후 결과 화면 (리더보드) |

#### 커스텀 훅 (src/hooks/)
| 훅 | 기능 | 반환값 |
|----|------|--------|
| **useAuth()** | Firebase Auth 상태 관리 | `{ user, loading, signIn, signOut }` + @neolab.net 검증 |
| **useGameRoom(roomId)** | 게임 룸 실시간 구독 + 상태 관리 | `{ gameRoom, submitAnswer, submitVote, handlePlayerReady, handleDifficultyChange, handleStartGame }` |
| **useTimer(duration)** | 타이머 제어 | `{ timeLeft, isRunning, start, pause, reset }` |
| **useVoting(roomId)** | 투표 로직 | `{ vote, hasVoted, voteResult }` |
| **useMatchmaking()** | Lobby 플레이어 매칭 | `{ players, joinLobby, leaveLobby, startGame }` |

#### 게임 컴포넌트 (src/components/game/)
| 컴포넌트 | 기능 |
|---------|------|
| **AnswerInput.tsx** | 답변 입력 폼 (타이머 + 텍스트 입력) |
| **AnswerList.tsx** | 제출된 답변 목록 표시 (익명, 랜덤 순서) |
| **VotingBoard.tsx** | 투표 UI (6개 답변 중 1개 선택) |
| **Discussion.tsx** | 토론 시간 채팅 |
| **TurnIndicator.tsx** | 현재 턴, 질문, 타이머 표시 |
| **PlayerList.tsx** | 5명 팀원 목록 (프로필 사진, 이름, 부서) |
| **ResultDisplay.tsx** | 투표 결과 및 AI 공개 |

#### Services (src/services/)
| 파일 | 역할 |
|-----|------|
| **auth.ts** | Firebase Auth 래퍼 (`signInWithPopup`, `signOut`) |
| **gameRoom.ts** | 게임 룸 CRUD (`subscribeToGameRoom`, `submitAnswer`, `submitVote`, `updatePlayerReady`, `updateDifficulty`, `startGame`) |
| **matchmaking.ts** | Lobby 로직 (`joinLobby`, `createGameRoom(players, difficulty)`) |
| **ai.ts** | Cloud Function 호출 (`generateAIResponse` httpsCallable) |

#### 유틸리티 (src/utils/)
| 파일 | 역할 |
|-----|------|
| **difficulty.ts** | 난이도 설정 관리 (`DIFFICULTY_CONFIG`, `getDifficultyConfig`, `getDifficultyLabel`) |
| **timeFormatter.ts** | 시간 포맷팅 유틸리티 |
| **sanitizer.ts** | XSS 방지 (DOMPurify 래퍼) |
| **shuffle.ts** | 배열 랜덤 섞기 (답변 공개 시 사용) |

### Cloud Functions 주요 파일

| 파일 경로 | 역할 |
|----------|------|
| **functions/src/index.ts** | Function 진입점 (generateAIResponse, checkVoteResult, matchPlayers, finalizeGame export) |
| **functions/src/ai/prompts.ts** | 프롬프트 템플릿 (buildEasyPrompt, buildNormalPrompt, buildHardPrompt) |
| **functions/src/ai/respondAnswer.ts** | generateAIResponse Function (Gemini API 호출 + 답변 생성) |
| **functions/src/ai/questionGenerator.ts** | 질문 생성 (카테고리별) |
| **functions/src/game/matching.ts** | matchPlayers Function (5인 팀 구성) |
| **functions/src/game/voting.ts** | checkVoteResult Function (투표 집계 + AI 확인) |
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
      "difficulty": "normal",         // 'easy' | 'normal' | 'hard'
      "currentTurn": 2,
      "maxTurns": 5,
      "aiPlayerId": "player_3",       // AI의 익명 ID (참가자는 모름)
      "startTime": 1678886400000,
      "endTime": null,
      "players": {
        "{uid}": {
          "name": "김개발",
          "ready": true,
          "anonymousId": "player_1"   // 게임 내 익명 ID
        }
      },
      "turns": {
        "1": {
          "question": "최근에 본 영화는?",
          "timerDuration": 60,
          "timerStartTime": 1678886400000,
          "answers": {
            "player_1": { "text": "인터스텔라", "submittedAt": 1678886420000 },
            "player_2": { "text": "오펜하이머", "submittedAt": 1678886425000 },
            "player_3": { "text": "아바타2", "submittedAt": 1678886430000, "isAI": true },
            "player_4": { "text": "탑건", "submittedAt": 1678886435000 },
            "player_5": { "text": "기생충", "submittedAt": 1678886440000 },
            "player_6": { "text": "조커", "submittedAt": 1678886445000 }
          },
          "votes": {
            "{uid1}": { "votedFor": "player_3", "submittedAt": 1678886500000 },
            "{uid2}": { "votedFor": "player_3", "submittedAt": 1678886505000 },
            "{uid3}": { "votedFor": "player_2", "submittedAt": 1678886510000 },
            "{uid4}": { "votedFor": "player_3", "submittedAt": 1678886515000 },
            "{uid5}": { "votedFor": "player_1", "submittedAt": 1678886520000 }
          },
          "voteResult": {
            "mostVotedPlayer": "player_3",
            "isAI": true,
            "gameEnded": true
          }
        }
      }
    }
  },

  "chatMessages": {
    "{roomId}": {
      "{messageId}": {
        "uid": "{uid}",
        "displayName": "김개발",
        "text": "3번이 AI 같은데요?",
        "timestamp": 1678886400500
      }
    }
  },

  "gameLogs": {
    "{logId}": {
      "roomId": "{roomId}",
      "difficulty": "normal",
      "finalTurnCount": 2,
      "finalTime": 180500,              // ms
      "result": "success",              // 'success' | 'failure' (5턴 초과)
      "aiPlayerId": "player_3",
      "turnsHistory": [
        {
          "turn": 1,
          "question": "최근에 본 영화는?",
          "answers": {...},
          "votes": {...},
          "voteResult": {...}
        }
      ],
      "completedAt": 1678886580500,
      "finishedAt": "(Firestore Timestamp)"
    }
  }
}
```

### 보안 규칙 (database.rules.json)

**핵심 원칙:**
1. 인증된 사용자만 접근 (`auth != null`)
2. 자신이 속한 게임 룸만 읽기/쓰기
3. **AI 플레이어 ID는 게임 종료 전까지 읽기 불가** (보안 규칙으로 차단)
4. 투표 결과는 Cloud Function만 작성
5. 게임 로그는 Cloud Function만 작성

---

## 🧠 AI 답변 전략

**⚠️ 중요: AI 관련 모든 로직은 `functions/src/ai/`에만 존재**

### AI Functions 목록

1. **generateAIResponse** (`respondAnswer.ts`)
   - 역할: AI 플레이어 답변 생성
   - 모델: `gemini-2.5-flash-lite`
   - 입력: roomId, turn, question, difficulty, otherAnswers?
   - 출력: answer (텍스트)

2. **generateQuestion** (`questionGenerator.ts`)
   - 역할: 카테고리별 질문 생성
   - 모델: `gemini-2.5-flash-lite`
   - 입력: category, previousQuestions?
   - 출력: question (텍스트)

**⚠️ 신규 AI 기능 추가 시:**
- ✅ `functions/src/ai/` 디렉토리에 추가
- ✅ 기존 respondAnswer.ts의 패턴 참조 (모델, 에러 처리)
- ✅ `gemini-2.5-flash-lite` 모델 사용 (일관성)
- ❌ Frontend에서 직접 구현 금지

### 난이도별 답변 전략 (docs/AI.md 참조)

1. **buildEasyPrompt(question)** - Easy 난이도
   - 의도적으로 로봇같이 답변
   - 완벽한 문법, 감정 표현 없음
   - 타인 답변 참고 X (먼저 답변)
   - 예: "영화 관람 했습니다. 제목은 인터스텔라입니다."

2. **buildNormalPrompt(question)** - Normal 난이도
   - 자연스럽게 답변
   - 적당한 감정 표현
   - 타인 답변 참고 X
   - 예: "인터스텔라 봤어요! 재밌더라고요"

3. **buildHardPrompt(question, otherAnswers)** - Hard 난이도
   - 타인 답변 패턴 분석
   - 평균 길이, 스타일 모방
   - 감정 표현, 구체성 균형
   - 예: "저는 오펜하이머 봤는데 진짜 인상 깊었어요"

### Gemini API 설정

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  generationConfig: {
    temperature: 0.7,        // 약간의 창의성 허용
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 200,    // 답변은 짧게
  },
});
```

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
| **단위 테스트** | 80% | 매 커밋 (pre-commit hook) |
| **통합 테스트** | 60% | PR 생성 시 (CI/CD) |
| **E2E 테스트** | 주요 시나리오 10개 | 배포 전 (주 1회) |

---

## 🎯 개발 워크플로우 & 컨벤션

### 코드 스타일

- **들여쓰기**: 2 spaces
- **세미콜론**: 사용 안 함 (Prettier 설정)
- **따옴표**: 싱글 쿼트 (`'`)
- **최대 줄 길이**: 100자
- **컴포넌트 파일명**: PascalCase (`VotingBoard.tsx`)
- **훅/유틸 파일명**: camelCase (`useVoting.ts`)

---

## 🔐 보안 고려사항

### 1. API 키 보호
- **절대 규칙**: Frontend에서 Gemini API 직접 호출 금지
- **올바른 방법**: Cloud Functions를 통해서만 호출

### 2. AI 플레이어 ID 보호
- **RTDB 보안 규칙**: `aiPlayerId` 필드는 게임 종료 전까지 읽기 불가
- **클라이언트 코드**: AI ID에 접근 시도 금지

### 3. XSS 방지
- 채팅 메시지, 답변은 **DOMPurify**로 sanitize

### 4. 도메인 제한
- @neolab.net 계정만 접근 허용

---

## 📊 성능 최적화 전략

### 1. 답변 실시간 동기화
- RTDB `onValue()` 리스너 사용
- 답변 제출 시 즉시 반영

### 2. 타이머 동기화
- 서버 시간 기준 (Firebase serverTimestamp)
- 클라이언트 시간 보정

### 3. Code Splitting (React.lazy)
```typescript
const GameRoom = lazy(() => import('@/pages/GameRoom'));
```

---

## 🚨 알려진 이슈 & 제약사항

1. **Gemini API 응답 시간**
   - 평균 2-3초
   - 답변 생성 중 로딩 UI 필수

2. **타이머 동기화 오차**
   - 네트워크 지연으로 1-2초 오차 가능
   - 서버 시간 기준으로 보정

3. **RTDB 무료 플랜 한도**
   - Spark 플랜: 동시 접속 100명
   - 50명 규모에서는 문제없음

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

---

## 📖 추가 참고 문서

### 프로젝트 문서
- **README.md**: 게임 룰 및 개요
- **docs/ARCHITECTURE.md**: 시스템 아키텍처 다이어그램
- **docs/FRONTEND.md**: 컴포넌트 상세 설계
- **docs/BACKEND.md**: Cloud Functions 구현 가이드
- **docs/AI.md**: Gemini API 답변 전략
- **docs/TESTING.md**: 테스트 전략 (Vitest, Playwright)
- **docs/TODO.md**: 8주 개발 일정 및 체크리스트

### 외부 문서
- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Gemini API Guide](https://ai.google.dev/gemini-api/docs)
- [React 19 Docs](https://react.dev/)
- [Vite Guide](https://vite.dev/)

---

## 🎯 개발 시 주의사항

### DO ✅
- **문서 우선**: 로직 변경 전 해당 문서 참조
- **타입 안전성**: `any` 사용 최소화
- **테스트 작성**: 새로운 훅/컴포넌트 추가 시 테스트 필수
- **보안 규칙 확인**: RTDB 경로 변경 시 보안 규칙 업데이트
- **AI ID 보호**: aiPlayerId 필드 클라이언트 접근 금지

### DON'T ❌
- **RTDB 직접 수정 금지**: Admin Console에서 수동 편집 금지
- **API 키 커밋 금지**: `.env` 절대 커밋 안 함
- **Zustand에 게임 상태 저장 금지**: RTDB가 단일 진실 공급원
- **테스트 건너뛰기 금지**: `--no-verify` 사용 금지

---

**이 파일은 Claude Code가 Project Turing에서 효율적으로 작업할 수 있도록 작성되었습니다. 문서가 실제 코드와 일치하지 않는 경우 코드가 우선입니다.**
