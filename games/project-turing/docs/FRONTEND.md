# Project Turing - Frontend Design

프론트엔드 상세 설계 문서입니다.

---

## 📂 디렉토리 구조

```
frontend/src/
├── main.tsx                 # 앱 진입점
├── App.tsx                  # 라우팅
├── firebase.ts              # Firebase 초기화
├
├── pages/                   # 페이지 컴포넌트
│   ├── Home.tsx             # 로그인
│   ├── Lobby.tsx            # 매칭 대기실
│   ├── GameRoom.tsx         # 게임 메인
│   └── Results.tsx          # 결과 화면
├
├── components/              # UI 컴포넌트
│   ├── game/
│   │   ├── AnswerInput.tsx       # 답변 입력
│   │   ├── AnswerList.tsx        # 답변 목록
│   │   ├── VotingBoard.tsx       # 투표 UI
│   │   ├── Discussion.tsx        # 토론 채팅
│   │   ├── TurnIndicator.tsx     # 턴/타이머 표시
│   │   ├── PlayerList.tsx        # 참가자 목록
│   │   └── ResultDisplay.tsx     # 투표 결과
│   └── common/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Loader.tsx
│       └── Timer.tsx
├
├── hooks/                   # Custom Hooks
│   ├── useAuth.ts           # 인증
│   ├── useGameRoom.ts       # 게임 룸 구독
│   ├── useTimer.ts          # 타이머
│   ├── useVoting.ts         # 투표
│   └── useMatchmaking.ts    # 매칭
├
├── services/                # Firebase SDK 래퍼
│   ├── auth.ts
│   ├── gameRoom.ts
│   ├── voting.ts
│   └── matchmaking.ts
├
├── stores/                  # Zustand
│   └── authStore.ts
├
├── types/                   # TypeScript 타입
│   └── game.types.ts
├
└── utils/                   # 유틸리티
    ├── shuffle.ts
    ├── sanitizer.ts
    ├── timeFormatter.ts
    └── difficulty.ts
```

---

## 🗺️ 페이지별 설계

### 1. Home Page (`/`)

**목적**: Google SSO 로그인

```tsx
export function Home() {
  const { user, signIn } = useAuth()

  if (user) {
    return <Navigate to="/lobby" />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>Project Turing</h1>
      <p>AI Among Us</p>
      <Button onClick={signIn}>
        Google로 로그인
      </Button>
    </div>
  )
}
```

---

### 2. Lobby Page (`/lobby`)

**목적**: 5명 매칭 대기

**상태**:
- `waitingPlayers`: 대기 중인 플레이어 목록
- `matchedRoomId`: 매칭 완료 시 게임 룸 ID

```tsx
export function Lobby() {
  const { user } = useAuth()
  const { players, joinLobby, leaveLobby, matchedRoomId } = useMatchmaking()

  useEffect(() => {
    joinLobby(user)
    return () => leaveLobby(user.uid)
  }, [])

  if (matchedRoomId) {
    return <Navigate to={`/game/${matchedRoomId}`} />
  }

  return (
    <div>
      <h2>대기실</h2>
      <p>대기 중: {players.length}/5</p>
      <PlayerList players={players} />
    </div>
  )
}
```

---

### 3. GameRoom Page (`/game/:roomId`)

**목적**: 게임 메인 화면

**상태별 UI**:

#### 3.1 Waiting (대기실)

```tsx
{gameRoom.status === 'waiting' && (
  <WaitingRoom
    gameRoom={gameRoom}
    onDifficultyChange={handleDifficultyChange}
    onReady={handlePlayerReady}
    onStart={handleStartGame}
  />
)}
```

**기능**:
- 난이도 선택 (Easy/Normal/Hard)
- 채팅
- "준비 완료" 버튼
- 모두 준비 시 "게임 시작" 버튼 활성화

#### 3.2 In-Progress (게임 진행)

**게임 단계별 UI**:

1. **답변 단계**
```tsx
{phase === 'answering' && (
  <>
    <TurnIndicator
      turn={gameRoom.currentTurn}
      maxTurns={gameRoom.maxTurns}
      question={currentQuestion}
      timeLeft={timeLeft}
    />
    <AnswerInput
      onSubmit={submitAnswer}
      disabled={hasSubmitted}
      timeLeft={timeLeft}
    />
    <AnswerList
      answers={currentAnswers}
      showAll={false}  // 아직 공개 안 됨
      submittedCount={Object.keys(currentAnswers).length}
    />
  </>
)}
```

2. **토론 단계**
```tsx
{phase === 'discussion' && (
  <>
    <AnswerList
      answers={shuffledAnswers}  // 랜덤 순서
      showAll={true}
    />
    <Discussion
      roomId={roomId}
      timeLeft={discussionTimeLeft}
    />
  </>
)}
```

3. **투표 단계**
```tsx
{phase === 'voting' && (
  <VotingBoard
    answers={shuffledAnswers}
    myAnonymousId={myAnonymousId}
    onVote={submitVote}
    hasVoted={hasVoted}
  />
)}
```

4. **결과 확인**
```tsx
{phase === 'result' && (
  <ResultDisplay
    voteResult={voteResult}
    mostVotedPlayer={mostVotedPlayer}
    isAI={voteResult.isAI}
    gameEnded={voteResult.gameEnded}
  />
)}
```

#### 3.3 Finished (게임 종료)

```tsx
{gameRoom.status === 'finished' && (
  <Navigate to="/results" state={{ roomId }} />
)}
```

---

### 4. Results Page (`/results`)

**목적**: 게임 결과 및 리더보드

```tsx
export function Results() {
  const { state } = useLocation()
  const { roomId } = state
  const [gameLog, setGameLog] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    // Firestore에서 게임 로그 가져오기
    fetchGameLog(roomId).then(setGameLog)

    // 리더보드 가져오기
    fetchLeaderboard().then(setLeaderboard)
  }, [roomId])

  return (
    <div>
      <h2>게임 결과</h2>

      {/* 성공/실패 */}
      <ResultSummary
        result={gameLog.result}
        finalTurnCount={gameLog.finalTurnCount}
        aiPlayerId={gameLog.aiPlayerId}
      />

      {/* 턴별 히스토리 */}
      <TurnsHistory turns={gameLog.turnsHistory} />

      {/* 리더보드 */}
      <Leaderboard data={leaderboard} />

      <Button onClick={() => navigate('/lobby')}>
        다시 하기
      </Button>
    </div>
  )
}
```

---

## 🎣 Custom Hooks

### 1. useAuth

```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // @neolab.net 도메인 검증
        if (!firebaseUser.email?.endsWith('@neolab.net')) {
          await signOut(auth)
          throw new Error('네오랩 계정만 접근 가능합니다.')
        }
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  return { user, loading, signIn, signOut: () => signOut(auth) }
}
```

### 2. useGameRoom

```typescript
export function useGameRoom(roomId: string) {
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const { user } = useAuth()

  // RTDB 구독
  useEffect(() => {
    const gameRoomRef = ref(database, `/gameRooms/${roomId}`)
    const unsubscribe = onValue(gameRoomRef, (snapshot) => {
      setGameRoom(snapshot.val())
    })
    return unsubscribe
  }, [roomId])

  // 답변 제출
  const submitAnswer = async (text: string) => {
    const myAnonymousId = gameRoom.players[user.uid].anonymousId
    await set(
      ref(database, `/gameRooms/${roomId}/turns/${gameRoom.currentTurn}/answers/${myAnonymousId}`),
      {
        text: sanitizeMessage(text),
        submittedAt: serverTimestamp()
      }
    )
  }

  // 투표 제출
  const submitVote = async (votedFor: string) => {
    await set(
      ref(database, `/gameRooms/${roomId}/turns/${gameRoom.currentTurn}/votes/${user.uid}`),
      {
        votedFor,
        submittedAt: serverTimestamp()
      }
    )

    // Cloud Function 호출 (투표 집계)
    const checkVote = httpsCallable(functions, 'checkVoteResult')
    await checkVote({ roomId, turn: gameRoom.currentTurn })
  }

  return {
    gameRoom,
    submitAnswer,
    submitVote,
    // ... 기타 메서드
  }
}
```

### 3. useTimer

```typescript
export function useTimer(duration: number, startTime: number) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [serverOffset, setServerOffset] = useState(0)

  // 서버 시간 오프셋 계산
  useEffect(() => {
    getServerTime().then((serverTime) => {
      setServerOffset(serverTime - Date.now())
    })
  }, [])

  // 타이머 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() + serverOffset
      const elapsed = (now - startTime) / 1000
      setTimeLeft(Math.max(0, duration - elapsed))
    }, 100)

    return () => clearInterval(interval)
  }, [duration, startTime, serverOffset])

  return { timeLeft, isExpired: timeLeft === 0 }
}
```

---

## 🎨 주요 컴포넌트

### AnswerInput

```tsx
interface AnswerInputProps {
  onSubmit: (text: string) => void
  disabled: boolean
  timeLeft: number
}

export function AnswerInput({ onSubmit, disabled, timeLeft }: AnswerInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text)
      setText('')
    }
  }

  return (
    <div>
      <Timer timeLeft={timeLeft} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="답변을 입력하세요..."
        disabled={disabled}
        maxLength={200}
      />
      <Button onClick={handleSubmit} disabled={disabled || !text.trim()}>
        답변 제출
      </Button>
    </div>
  )
}
```

### VotingBoard

```tsx
interface VotingBoardProps {
  answers: Array<{ anonymousId: string; text: string }>
  myAnonymousId: string
  onVote: (anonymousId: string) => void
  hasVoted: boolean
}

export function VotingBoard({ answers, myAnonymousId, onVote, hasVoted }: VotingBoardProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div>
      <h3>누가 AI일까요?</h3>
      {answers.map((answer) => (
        <div key={answer.anonymousId}>
          <p>📝 {answer.text}</p>
          <input
            type="radio"
            name="vote"
            value={answer.anonymousId}
            checked={selected === answer.anonymousId}
            onChange={() => setSelected(answer.anonymousId)}
            disabled={answer.anonymousId === myAnonymousId || hasVoted}
          />
          <label>이 사람이 AI입니다</label>
        </div>
      ))}
      <Button
        onClick={() => selected && onVote(selected)}
        disabled={!selected || hasVoted}
      >
        투표하기
      </Button>
    </div>
  )
}
```

---

## 🎯 상태 관리

### Zustand (authStore만 사용)

```typescript
// stores/authStore.ts
interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user })
}))
```

**게임 상태는 RTDB가 단일 진실 공급원!**

---

## 📱 반응형 디자인

- **모바일**: 768px 이하
- **태블릿**: 768px ~ 1024px
- **데스크톱**: 1024px 이상

```tsx
// Tailwind CSS 클래스
<div className="
  flex flex-col  // 모바일: 세로 배치
  md:flex-row    // 태블릿 이상: 가로 배치
  lg:max-w-6xl   // 데스크톱: 최대 너비 제한
">
  ...
</div>
```

---

## ⚡ 성능 최적화

### 1. React.memo

```typescript
export const AnswerList = React.memo(({ answers }: AnswerListProps) => {
  // 답변 목록이 변경될 때만 리렌더링
})
```

### 2. useMemo

```typescript
const shuffledAnswers = useMemo(() => {
  return shuffle(Object.entries(answers))
}, [answers])
```

### 3. Code Splitting

```typescript
const GameRoom = lazy(() => import('@/pages/GameRoom'))
const Results = lazy(() => import('@/pages/Results'))
```

---

**다음 문서**: [BACKEND.md](./BACKEND.md) - Cloud Functions 설계
