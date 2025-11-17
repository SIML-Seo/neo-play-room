# Project Turing - Architecture

이 문서는 Project Turing의 시스템 아키텍처를 설명합니다.

---

## 📐 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     React SPA                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │   │
│  │  │   Home     │  │   Lobby    │  │  GameRoom  │          │   │
│  │  │  (Login)   │→ │ (Matching) │→ │  (Playing) │          │   │
│  │  └────────────┘  └────────────┘  └────────────┘          │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐     │   │
│  │  │           State Management (Zustand)             │     │   │
│  │  │               - authStore only                   │     │   │
│  │  └──────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Firebase Client SDK                          │   │
│  │  - Auth (Google SSO)                                     │   │
│  │  - Realtime Database (onValue 리스너)                    │   │
│  │  - Functions (httpsCallable)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        Firebase (BaaS)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Firebase Authentication                         │   │
│  │  - Google SSO (@neolab.net 도메인 제한)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Realtime Database (RTDB)                       │   │
│  │  - /users                                                │   │
│  │  - /lobby/waitingPlayers                                 │   │
│  │  - /gameRooms/{roomId}                                   │   │
│  │  - /chatMessages/{roomId}                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Cloud Functions (Node 20)                      │   │
│  │  ┌────────────────────────────────────────┐              │   │
│  │  │  generateAIResponse                    │              │   │
│  │  │  - AI 답변 생성                         │              │   │
│  │  │  - 난이도별 전략 적용                   │              │   │
│  │  └────────────────────────────────────────┘              │   │
│  │  ┌────────────────────────────────────────┐              │   │
│  │  │  checkVoteResult                       │              │   │
│  │  │  - 투표 집계                            │              │   │
│  │  │  - AI 확인 및 게임 상태 업데이트         │              │   │
│  │  └────────────────────────────────────────┘              │   │
│  │  ┌────────────────────────────────────────┐              │   │
│  │  │  generateQuestion                      │              │   │
│  │  │  - 카테고리별 질문 생성                  │              │   │
│  │  └────────────────────────────────────────┘              │   │
│  │  ┌────────────────────────────────────────┐              │   │
│  │  │  matchPlayers                          │              │   │
│  │  │  - 5명 매칭 + AI 투입                   │              │   │
│  │  └────────────────────────────────────────┘              │   │
│  │  ┌────────────────────────────────────────┐              │   │
│  │  │  finalizeGame                          │              │   │
│  │  │  - 게임 로그 저장 (Firestore)           │              │   │
│  │  └────────────────────────────────────────┘              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Firestore                                      │   │
│  │  - /gameLogs (게임 결과 기록)                             │   │
│  │  - /questions (질문 풀)                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           External API                                   │   │
│  │  - Gemini 2.5 Flash Lite (AI 답변 생성)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎮 게임 플로우 다이어그램

### 1. 매칭 → 게임 시작

```
[Client: Lobby Page]
    │
    ├─ 사용자가 "게임 참가" 클릭
    │
    ├─ RTDB에 사용자 정보 추가
    │  /lobby/waitingPlayers/{uid}
    │
    ├─ onValue('/lobby/waitingPlayers') 구독
    │  → 대기 중인 플레이어 수 실시간 표시
    │
    └─ 5명 도달 시
           ↓
[Cloud Function: matchPlayers]
    │
    ├─ 5명 플레이어 데이터 읽기
    │
    ├─ AI 플레이어 1명 추가 (익명 ID 할당)
    │  - player_1 ~ player_5: 실제 참가자
    │  - player_6: AI (비밀)
    │
    ├─ GameRoom 생성
    │  /gameRooms/{roomId}
    │  - status: 'waiting'
    │  - difficulty: 'normal'
    │  - aiPlayerId: 'player_6' (보안 규칙으로 읽기 차단)
    │
    └─ 모든 참가자에게 roomId 전달
           ↓
[Client: GameRoom Page (waiting)]
    │
    ├─ onValue('/gameRooms/{roomId}') 구독
    │
    ├─ 난이도 선택 UI 표시
    │  - 모든 참가자가 실시간으로 변경 가능
    │
    ├─ 채팅 기능 활성화
    │
    ├─ "준비 완료" 버튼 클릭
    │  → RTDB에 ready: true 저장
    │
    └─ 모든 참가자 ready === true
           ↓
[Client: "게임 시작" 버튼 활성화]
    │
    ├─ 게임 시작 버튼 클릭
    │
    └─ RTDB 업데이트
       - status: 'in-progress'
       - 첫 번째 질문 생성
       - 타이머 시작
```

### 2. 게임 진행 (턴 1개 사이클)

```
[턴 시작]
    │
    ├─ RTDB에 현재 턴 정보 저장
    │  /gameRooms/{roomId}/turns/{turnNumber}
    │  - question: "최근에 본 영화는?"
    │  - timerDuration: 60 (난이도별)
    │  - timerStartTime: serverTimestamp
    │
    ├─ 클라이언트에서 타이머 시작
    │  → UI에 카운트다운 표시
    │
    └─ 답변 단계
           ↓
[참가자 답변 입력]
    │
    ├─ 각 참가자가 텍스트 입력
    │
    ├─ "답변 제출" 클릭
    │  → RTDB에 저장
    │     /gameRooms/{roomId}/turns/{turn}/answers/{anonymousId}
    │     { text: "인터스텔라", submittedAt: timestamp }
    │
    └─ 제출 완료 UI 표시
           ↓
[AI 답변 생성]
    │
    ├─ 타이머 시작 후 일정 시간 경과 시
    │  또는 난이도에 따라
    │  - Easy: 즉시 (타인 답변 참고 X)
    │  - Normal: 30초 후
    │  - Hard: 대부분 참가자 제출 후
    │
    ├─ Cloud Function 호출
    │  generateAIResponse(roomId, turn, difficulty)
    │
    ├─ [Cloud Function: generateAIResponse]
    │  │
    │  ├─ 질문 읽기
    │  │
    │  ├─ 난이도별 프롬프트 생성
    │  │  - Easy: buildEasyPrompt(question)
    │  │  - Normal: buildNormalPrompt(question)
    │  │  - Hard: buildHardPrompt(question, otherAnswers)
    │  │
    │  ├─ Gemini API 호출
    │  │  model: gemini-2.5-flash-lite
    │  │
    │  ├─ AI 답변 텍스트 생성
    │  │
    │  └─ RTDB에 저장
    │     /gameRooms/{roomId}/turns/{turn}/answers/{aiPlayerId}
    │     { text: "오펜하이머 봤어요", submittedAt: timestamp, isAI: true }
    │
    └─ 클라이언트에서 onValue()로 실시간 감지
           ↓
[타이머 종료]
    │
    ├─ 모든 답변 공개
    │  - 익명 ID로 표시 (player_1, player_2, ...)
    │  - 랜덤 순서로 섞기 (클라이언트)
    │
    └─ 토론 시간 시작 (30초)
           ↓
[토론 시간]
    │
    ├─ 채팅 활성화
    │  - 참가자들이 의견 교환
    │  - "3번이 AI 같은데요?"
    │
    ├─ 30초 타이머
    │
    └─ 토론 종료
           ↓
[투표 단계]
    │
    ├─ 투표 UI 표시
    │  - 6개 답변 목록
    │  - 각 답변마다 "투표" 버튼
    │  - 자신의 답변은 투표 불가
    │
    ├─ 각 참가자가 1명 선택
    │  → RTDB에 저장
    │     /gameRooms/{roomId}/turns/{turn}/votes/{uid}
    │     { votedFor: "player_3", submittedAt: timestamp }
    │
    └─ 모든 참가자 투표 완료
           ↓
[Cloud Function: checkVoteResult]
    │
    ├─ 투표 집계
    │  - player_1: 1표
    │  - player_2: 0표
    │  - player_3: 3표 ← 최다 득표
    │  - player_4: 1표
    │  - player_5: 0표
    │  - player_6: 0표
    │
    ├─ 최다 득표자 확인
    │  mostVotedPlayer = "player_3"
    │
    ├─ AI 여부 확인
    │  aiPlayerId === "player_6" (from RTDB, Admin SDK로 읽기)
    │  mostVotedPlayer === aiPlayerId? → NO
    │
    ├─ RTDB에 결과 저장
    │  /gameRooms/{roomId}/turns/{turn}/voteResult
    │  {
    │    mostVotedPlayer: "player_3",
    │    isAI: false,
    │    gameEnded: false
    │  }
    │
    └─ 게임 상태 업데이트
       - currentTurn: 2
       - 다음 턴 시작 OR 게임 종료
           ↓
[결과 공개]
    │
    ├─ 클라이언트에서 onValue()로 감지
    │
    ├─ ResultDisplay 컴포넌트
    │  - "player_3 (김개발님)이 최다 득표를 받았습니다!"
    │  - "AI가 아닙니다 ❌"
    │  - "다음 턴을 준비하세요"
    │
    └─ 분기
       ├─ isAI === true → 게임 종료 (성공)
       ├─ currentTurn >= maxTurns → 게임 종료 (실패)
       └─ else → 다음 턴 시작
```

### 3. 게임 종료

```
[게임 종료 조건]
    │
    ├─ 조건 1: AI를 찾았을 때 (성공)
    │  - voteResult.isAI === true
    │
    ├─ 조건 2: 5턴 초과 (실패)
    │  - currentTurn > maxTurns
    │
    └─ 조건 만족 시
           ↓
[Cloud Function: finalizeGame]
    │
    ├─ 게임 데이터 수집
    │  - roomId
    │  - difficulty
    │  - finalTurnCount
    │  - finalTime (startTime ~ endTime)
    │  - result: 'success' | 'failure'
    │  - aiPlayerId (공개)
    │  - 모든 턴의 질문, 답변, 투표 히스토리
    │
    ├─ 점수 계산
    │  score = (turnCount / difficultyMultiplier) * 1000 + (time / 1000)
    │  - Easy: 1.0
    │  - Normal: 1.3
    │  - Hard: 1.6
    │
    ├─ Firestore에 저장
    │  /gameLogs/{logId}
    │  {
    │    roomId, difficulty, finalTurnCount, finalTime,
    │    result, aiPlayerId, turnsHistory, score,
    │    completedAt, finishedAt
    │  }
    │
    ├─ RTDB 업데이트
    │  /gameRooms/{roomId}
    │  - status: 'finished'
    │  - aiPlayerId 공개 (보안 규칙 해제)
    │
    └─ 클라이언트 리다이렉트
       → /results 페이지
           ↓
[Client: Results Page]
    │
    ├─ 게임 결과 표시
    │  - 성공/실패 여부
    │  - AI가 누구였는지 공개
    │  - 턴별 히스토리
    │  - 최종 점수
    │
    ├─ 리더보드 표시
    │  - Firestore /gameLogs 쿼리
    │  - 점수 낮은 순 정렬
    │  - 상위 10개 팀
    │
    └─ "다시 하기" 버튼
       → /lobby로 이동
```

---

## 🔄 실시간 데이터 동기화

### RTDB 실시간 리스너 구조

```typescript
// 1. GameRoom 전체 구독
const gameRoomRef = ref(database, `/gameRooms/${roomId}`)
onValue(gameRoomRef, (snapshot) => {
  const gameRoom = snapshot.val()
  // 게임 상태, 현재 턴, 플레이어 정보 등 실시간 업데이트
})

// 2. 현재 턴 답변 구독
const answersRef = ref(database, `/gameRooms/${roomId}/turns/${currentTurn}/answers`)
onValue(answersRef, (snapshot) => {
  const answers = snapshot.val()
  // 답변이 제출될 때마다 실시간 반영
  // UI: "5/6명 답변 완료"
})

// 3. 투표 구독
const votesRef = ref(database, `/gameRooms/${roomId}/turns/${currentTurn}/votes`)
onValue(votesRef, (snapshot) => {
  const votes = snapshot.val()
  // 투표가 제출될 때마다 실시간 반영
  // UI: "3/5명 투표 완료"
})

// 4. 채팅 구독
const chatRef = ref(database, `/chatMessages/${roomId}`)
onChildAdded(chatRef, (snapshot) => {
  const message = snapshot.val()
  // 새 메시지가 추가될 때마다 실시간 반영
})
```

---

## 🔐 보안 아키텍처

### 1. Firebase Security Rules (RTDB)

```json
{
  "rules": {
    "gameRooms": {
      "$roomId": {
        // 게임 룸 읽기: 참가자만 가능
        ".read": "auth != null && data.child('players').child(auth.uid).exists()",

        // 게임 룸 쓰기: 참가자만 가능 (일부 필드 제한)
        ".write": "auth != null && data.child('players').child(auth.uid).exists()",

        // AI 플레이어 ID 보호
        "aiPlayerId": {
          // 게임 종료 전까지 읽기 불가
          ".read": "data.parent().child('status').val() === 'finished'"
        },

        // 투표 결과는 Cloud Function만 쓰기 가능
        "turns": {
          "$turnNumber": {
            "voteResult": {
              ".write": false  // 클라이언트 쓰기 금지
            }
          }
        }
      }
    },

    "chatMessages": {
      "$roomId": {
        // 채팅 읽기: 해당 게임 룸 참가자만
        ".read": "auth != null && root.child('gameRooms').child($roomId).child('players').child(auth.uid).exists()",

        // 채팅 쓰기: 인증된 사용자 + sanitize 필수
        "$messageId": {
          ".write": "auth != null && newData.child('uid').val() === auth.uid"
        }
      }
    }
  }
}
```

### 2. Cloud Functions 권한 관리

```typescript
// generateAIResponse Function
export const generateAIResponse = onCall(async (request) => {
  // 1. 인증 확인
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
  }

  // 2. 게임 룸 참가자 확인
  const { roomId, turn } = request.data
  const gameRoom = await admin.database().ref(`/gameRooms/${roomId}`).once('value')
  const players = gameRoom.val().players

  if (!players[request.auth.uid]) {
    throw new HttpsError('permission-denied', '게임 참가자가 아닙니다.')
  }

  // 3. AI 답변 생성 (Admin SDK로 aiPlayerId 읽기 가능)
  const aiPlayerId = gameRoom.val().aiPlayerId
  const answer = await generateAnswer(question, difficulty, otherAnswers)

  // 4. RTDB에 저장 (Admin SDK 권한)
  await admin.database().ref(`/gameRooms/${roomId}/turns/${turn}/answers/${aiPlayerId}`).set({
    text: answer,
    submittedAt: admin.database.ServerValue.TIMESTAMP,
    isAI: true  // 이 필드도 보안 규칙으로 읽기 차단
  })
})
```

### 3. API 키 보호

```
Frontend (Browser)
    ↓
    ❌ Gemini API 직접 호출 금지
    ↓
    ✅ Cloud Functions 호출 (httpsCallable)
    ↓
Cloud Functions (Server)
    ↓
    ✅ process.env.GEMINI_API_KEY 사용
    ↓
Gemini API
```

---

## 📊 데이터 모델

### GameRoom

```typescript
interface GameRoom {
  roomId: string
  status: 'waiting' | 'in-progress' | 'finished'
  difficulty: 'easy' | 'normal' | 'hard'
  currentTurn: number
  maxTurns: number  // 5
  aiPlayerId: string  // 'player_1' ~ 'player_6'
  startTime: number  // timestamp
  endTime: number | null

  players: {
    [uid: string]: {
      name: string
      email: string
      photoURL: string
      ready: boolean
      anonymousId: string  // 'player_1' ~ 'player_6'
    }
  }

  turns: {
    [turnNumber: string]: Turn
  }
}
```

### Turn

```typescript
interface Turn {
  question: string
  category: 'personal' | 'company' | 'creative' | 'trend' | 'values'
  timerDuration: number  // 60 (easy) | 45 (normal) | 30 (hard)
  timerStartTime: number  // serverTimestamp

  answers: {
    [anonymousId: string]: {
      text: string
      submittedAt: number
      isAI?: boolean  // AI 답변만 true (보안 규칙으로 읽기 차단)
    }
  }

  votes: {
    [uid: string]: {
      votedFor: string  // anonymousId
      submittedAt: number
    }
  }

  voteResult?: {
    mostVotedPlayer: string  // anonymousId
    voteCount: number
    isAI: boolean
    gameEnded: boolean
  }
}
```

### GameLog (Firestore)

```typescript
interface GameLog {
  roomId: string
  difficulty: 'easy' | 'normal' | 'hard'
  finalTurnCount: number
  finalTime: number  // ms
  result: 'success' | 'failure'
  aiPlayerId: string
  score: number  // 낮을수록 좋음

  turnsHistory: Array<{
    turn: number
    question: string
    answers: { [anonymousId: string]: { text: string } }
    voteResult: {
      mostVotedPlayer: string
      isAI: boolean
    }
  }>

  completedAt: number  // timestamp
  finishedAt: FieldValue  // Firestore serverTimestamp
}
```

---

## ⚙️ 난이도별 시스템 차이

| 항목 | Easy | Normal | Hard |
|-----|------|--------|------|
| **타이머** | 60초 | 45초 | 30초 |
| **AI 답변 시점** | 즉시 (0초) | 30초 후 | 대부분 제출 후 |
| **AI 답변 스타일** | 로봇같이 | 자연스럽게 | 타인 모방 |
| **AI 프롬프트** | 단순 | 중간 | 복잡 (타인 답변 분석) |
| **점수 배율** | 1.0 | 1.3 | 1.6 |

---

## 🚀 성능 최적화

### 1. RTDB 읽기 최적화

```typescript
// ❌ 비효율: 전체 게임 룸 구독
onValue(ref(database, '/gameRooms'), ...)

// ✅ 효율: 특정 게임 룸만 구독
onValue(ref(database, `/gameRooms/${roomId}`), ...)

// ✅ 더 효율: 특정 경로만 구독
onValue(ref(database, `/gameRooms/${roomId}/turns/${currentTurn}/answers`), ...)
```

### 2. 타이머 동기화

```typescript
// 서버 시간 기준으로 타이머 동기화
const timerStartTime = gameRoom.turns[currentTurn].timerStartTime
const timerDuration = gameRoom.turns[currentTurn].timerDuration

// 클라이언트에서 서버 시간 오프셋 계산
const serverTime = await getServerTime()  // Firebase serverTimestamp
const clientTime = Date.now()
const offset = serverTime - clientTime

// 타이머 계산
const elapsed = (Date.now() + offset - timerStartTime) / 1000
const timeLeft = Math.max(0, timerDuration - elapsed)
```

### 3. Code Splitting

```typescript
// Lazy load 페이지
const GameRoom = lazy(() => import('@/pages/GameRoom'))
const Results = lazy(() => import('@/pages/Results'))

// Suspense로 로딩 처리
<Suspense fallback={<Loader />}>
  <GameRoom />
</Suspense>
```

---

## 🧪 테스트 전략

### 1. 단위 테스트

- **Hooks**: useTimer, useVoting, useGameRoom
- **Utils**: shuffle, sanitizer, timeFormatter
- **Services**: gameRoom.ts, voting.ts

### 2. 통합 테스트

- **Firebase Emulator 사용**
- **시나리오**: 매칭 → 게임 → 투표 → 결과

### 3. E2E 테스트 (Playwright)

- **5명 동시 접속 시뮬레이션**
- **AI 답변 생성 확인**
- **투표 → 결과 플로우**

---

## 📈 모니터링 & 로깅

### Cloud Functions 로그

```typescript
// 구조화된 로깅
functions.logger.info('AI 답변 생성 시작', {
  roomId,
  turn,
  difficulty,
  questionLength: question.length
})

functions.logger.error('Gemini API 호출 실패', {
  roomId,
  error: error.message
})
```

### 성능 모니터링

- **Firebase Performance Monitoring**
  - 페이지 로드 시간
  - Cloud Functions 실행 시간
  - RTDB 읽기/쓰기 지연

---

**다음 문서**: [FRONTEND.md](./FRONTEND.md) - 프론트엔드 상세 설계
