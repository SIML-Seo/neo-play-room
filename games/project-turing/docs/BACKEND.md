# Project Turing - Backend Design

Cloud Functions 설계 문서입니다.

---

## 📂 Functions 디렉토리 구조

```
functions/src/
├── index.ts                      # 진입점 (모든 Function export)
├
├── ai/
│   ├── respondAnswer.ts          # AI 답변 생성
│   ├── questionGenerator.ts      # 질문 생성
│   └── prompts.ts                # 프롬프트 템플릿
├
├── game/
│   ├── matching.ts               # 매칭 로직
│   ├── voting.ts                 # 투표 집계
│   └── finalize.ts               # 게임 종료 처리
├
└── utils/
    ├── validation.ts             # 입력 검증
    └── errors.ts                 # 에러 핸들링
```

---

## 🔧 Cloud Functions 목록

### 1. generateAIResponse (AI 답변 생성)

**트리거**: HTTP Callable
**역할**: AI 플레이어 답변 생성

```typescript
// functions/src/ai/respondAnswer.ts
export const generateAIResponse = onCall(async (request) => {
  // 1. 인증 확인
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
  }

  // 2. 파라미터 추출
  const { roomId, turn } = request.data

  // 3. 게임 룸 데이터 가져오기 (Admin SDK)
  const gameRoomSnapshot = await admin.database()
    .ref(`/gameRooms/${roomId}`)
    .once('value')
  const gameRoom = gameRoomSnapshot.val()

  // 4. AI 플레이어 ID 확인
  const aiPlayerId = gameRoom.aiPlayerId

  // 5. 현재 턴 데이터
  const currentTurn = gameRoom.turns[turn]
  const question = currentTurn.question
  const difficulty = gameRoom.difficulty
  const otherAnswers = currentTurn.answers || {}

  // 6. 난이도별 프롬프트 생성
  let prompt: string
  switch (difficulty) {
    case 'easy':
      prompt = buildEasyPrompt(question)
      break
    case 'normal':
      prompt = buildNormalPrompt(question)
      break
    case 'hard':
      // Hard 모드에서는 타인 답변 참고
      prompt = buildHardPrompt(question, Object.values(otherAnswers))
      break
  }

  // 7. Gemini API 호출
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 200,
    }
  })

  const result = await model.generateContent(prompt)
  const answer = result.response.text().trim()

  // 8. RTDB에 답변 저장
  await admin.database()
    .ref(`/gameRooms/${roomId}/turns/${turn}/answers/${aiPlayerId}`)
    .set({
      text: answer,
      submittedAt: admin.database.ServerValue.TIMESTAMP,
      isAI: true  // 보안 규칙으로 읽기 차단
    })

  functions.logger.info('AI 답변 생성 완료', { roomId, turn, answerLength: answer.length })

  return { success: true, answerId: aiPlayerId }
})
```

---

### 2. generateQuestion (질문 생성)

**트리거**: HTTP Callable
**역할**: 카테고리별 질문 생성

```typescript
// functions/src/ai/questionGenerator.ts
export const generateQuestion = onCall(async (request) => {
  const { category, previousQuestions } = request.data

  const prompt = `
You are a game master for a Turing test game.
Generate a single question for the category: "${category}".

Categories:
- personal: About personal experiences (e.g., "What movie did you watch recently?")
- company: About company culture (e.g., "What's your favorite lunch menu?")
- creative: Creative questions (e.g., "If you were an animal, what would you be?")
- trend: About trends (e.g., "What's the hottest tech right now?")
- values: About values (e.g., "What's most important when working?")

Guidelines:
- Keep it short and simple
- Answerable in 1-2 sentences
- Avoid questions that are too easy for AI
- Korean language output

${previousQuestions ? `Already used questions (avoid duplicates): ${previousQuestions.join(', ')}` : ''}

Output only the question text, nothing else.
  `.trim()

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const result = await model.generateContent(prompt)
  const question = result.response.text().trim()

  return { question, category }
})
```

---

### 3. checkVoteResult (투표 집계)

**트리거**: HTTP Callable
**역할**: 투표 결과 집계 및 게임 상태 업데이트

```typescript
// functions/src/game/voting.ts
export const checkVoteResult = onCall(async (request) => {
  const { roomId, turn } = request.data

  // 1. 투표 데이터 가져오기
  const votesSnapshot = await admin.database()
    .ref(`/gameRooms/${roomId}/turns/${turn}/votes`)
    .once('value')
  const votes = votesSnapshot.val()

  // 2. 투표 집계
  const voteCount: Record<string, number> = {}
  Object.values(votes).forEach((vote: any) => {
    const votedFor = vote.votedFor
    voteCount[votedFor] = (voteCount[votedFor] || 0) + 1
  })

  // 3. 최다 득표자 찾기
  let mostVotedPlayer = ''
  let maxVotes = 0
  Object.entries(voteCount).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count
      mostVotedPlayer = playerId
    }
  })

  // 4. AI 여부 확인
  const gameRoomSnapshot = await admin.database()
    .ref(`/gameRooms/${roomId}`)
    .once('value')
  const gameRoom = gameRoomSnapshot.val()
  const aiPlayerId = gameRoom.aiPlayerId

  const isAI = mostVotedPlayer === aiPlayerId

  // 5. 게임 종료 여부
  const gameEnded = isAI || gameRoom.currentTurn >= gameRoom.maxTurns

  // 6. 투표 결과 저장
  await admin.database()
    .ref(`/gameRooms/${roomId}/turns/${turn}/voteResult`)
    .set({
      mostVotedPlayer,
      voteCount: maxVotes,
      isAI,
      gameEnded,
      timestamp: admin.database.ServerValue.TIMESTAMP
    })

  // 7. 게임 상태 업데이트
  if (gameEnded) {
    await admin.database()
      .ref(`/gameRooms/${roomId}`)
      .update({
        status: 'finished',
        endTime: admin.database.ServerValue.TIMESTAMP
      })

    // finalizeGame 호출
    await finalizeGame(roomId)
  } else {
    // 다음 턴 시작
    await admin.database()
      .ref(`/gameRooms/${roomId}/currentTurn`)
      .set(gameRoom.currentTurn + 1)
  }

  return { isAI, gameEnded, mostVotedPlayer }
})
```

---

### 4. matchPlayers (매칭)

**트리거**: RTDB Trigger (onUpdate)
**역할**: 5명 매칭 시 게임 룸 생성 + AI 투입

```typescript
// functions/src/game/matching.ts
export const matchPlayers = onUpdate(
  { ref: '/lobby/waitingPlayers' },
  async (change) => {
    const players = change.after.val()

    if (!players || Object.keys(players).length < 5) {
      return null
    }

    // 5명 플레이어 추출
    const playerList = Object.entries(players).slice(0, 5)

    // 게임 룸 ID 생성
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 익명 ID 할당 (player_1 ~ player_6)
    const anonymousIds = ['player_1', 'player_2', 'player_3', 'player_4', 'player_5', 'player_6']
    const shuffledIds = shuffle(anonymousIds)

    // AI는 6번째 플레이어
    const aiPlayerId = shuffledIds[5]

    // 게임 룸 생성
    const gameRoomData: GameRoom = {
      roomId,
      status: 'waiting',
      difficulty: 'normal',
      currentTurn: 1,
      maxTurns: 5,
      aiPlayerId,
      startTime: null,
      endTime: null,
      players: {},
      turns: {}
    }

    // 플레이어 데이터 추가
    playerList.forEach(([uid, player], index) => {
      gameRoomData.players[uid] = {
        name: player.name,
        email: player.email,
        photoURL: player.photoURL,
        ready: false,
        anonymousId: shuffledIds[index]
      }
    })

    // RTDB에 게임 룸 저장
    await admin.database()
      .ref(`/gameRooms/${roomId}`)
      .set(gameRoomData)

    // 대기실에서 플레이어 제거
    await admin.database()
      .ref('/lobby/waitingPlayers')
      .remove()

    functions.logger.info('게임 룸 생성 완료', { roomId, aiPlayerId })

    return null
  }
)
```

---

### 5. finalizeGame (게임 종료 처리)

**트리거**: 내부 호출 (checkVoteResult에서)
**역할**: Firestore에 게임 로그 저장

```typescript
// functions/src/game/finalize.ts
async function finalizeGame(roomId: string) {
  // 1. 게임 룸 데이터 가져오기
  const gameRoomSnapshot = await admin.database()
    .ref(`/gameRooms/${roomId}`)
    .once('value')
  const gameRoom = gameRoomSnapshot.val()

  // 2. 점수 계산
  const difficultyMultiplier = {
    easy: 1.0,
    normal: 1.3,
    hard: 1.6
  }[gameRoom.difficulty]

  const finalTurnCount = gameRoom.currentTurn
  const finalTime = gameRoom.endTime - gameRoom.startTime
  const score = (finalTurnCount / difficultyMultiplier) * 1000 + (finalTime / 1000)

  // 3. 턴 히스토리 정리
  const turnsHistory = Object.entries(gameRoom.turns).map(([turnNum, turn]: [string, any]) => ({
    turn: parseInt(turnNum),
    question: turn.question,
    answers: turn.answers,
    voteResult: turn.voteResult
  }))

  // 4. 게임 로그 생성
  const gameLog: GameLog = {
    roomId,
    difficulty: gameRoom.difficulty,
    finalTurnCount,
    finalTime,
    result: gameRoom.turns[finalTurnCount].voteResult.isAI ? 'success' : 'failure',
    aiPlayerId: gameRoom.aiPlayerId,
    score,
    turnsHistory,
    completedAt: Date.now(),
    finishedAt: admin.firestore.FieldValue.serverTimestamp()
  }

  // 5. Firestore에 저장
  await admin.firestore()
    .collection('gameLogs')
    .add(gameLog)

  functions.logger.info('게임 로그 저장 완료', { roomId, score })
}
```

---

## 🔐 보안

### 1. 인증 확인

```typescript
if (!request.auth) {
  throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
}
```

### 2. 게임 룸 참가자 확인

```typescript
const gameRoom = await getGameRoom(roomId)
if (!gameRoom.players[request.auth.uid]) {
  throw new HttpsError('permission-denied', '게임 참가자가 아닙니다.')
}
```

### 3. Admin SDK 권한

- aiPlayerId 읽기 (클라이언트 불가)
- 투표 결과 쓰기 (클라이언트 불가)
- 게임 로그 쓰기 (클라이언트 불가)

---

## 🧪 테스트

### 단위 테스트

```typescript
// test/ai/prompts.test.ts
describe('buildEasyPrompt', () => {
  it('should generate prompt for easy difficulty', () => {
    const question = "최근에 본 영화는?"
    const prompt = buildEasyPrompt(question)

    expect(prompt).toContain(question)
    expect(prompt).toContain('로봇처럼')
  })
})
```

### 통합 테스트 (Emulator)

```typescript
// test/integration/voting.test.ts
describe('checkVoteResult', () => {
  it('should correctly identify AI', async () => {
    // 1. 테스트 데이터 세팅
    await setupTestGameRoom()

    // 2. Function 호출
    const result = await checkVoteResult({ roomId: 'test-room', turn: 1 })

    // 3. 검증
    expect(result.isAI).toBe(true)
    expect(result.gameEnded).toBe(true)
  })
})
```

---

## 📊 로깅

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
  error: error.message,
  stack: error.stack
})

functions.logger.warn('투표 시간 초과', {
  roomId,
  turn,
  votedCount: Object.keys(votes).length
})
```

---

## ⚡ 성능 최적화

### 1. Batch Write

```typescript
// ❌ 여러 번 쓰기
await ref1.set(data1)
await ref2.set(data2)
await ref3.set(data3)

// ✅ Batch write
const updates = {}
updates[`/path1`] = data1
updates[`/path2`] = data2
updates[`/path3`] = data3
await admin.database().ref().update(updates)
```

### 2. 캐싱

```typescript
// 자주 사용하는 데이터 캐싱
const questionsCache = new Map<string, string[]>()

async function getCachedQuestions(category: string) {
  if (questionsCache.has(category)) {
    return questionsCache.get(category)
  }

  const questions = await fetchQuestionsFromFirestore(category)
  questionsCache.set(category, questions)
  return questions
}
```

---

**다음 문서**: [AI.md](./AI.md) - AI 답변 전략
