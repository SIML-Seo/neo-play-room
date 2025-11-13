export type GameStatus = 'waiting' | 'in-progress' | 'finished'
export type GameDifficulty = 'easy' | 'normal' | 'hard'

export interface Player {
  uid: string
  name: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
  team: string
  ready: boolean
  joinedAt: number
}

export interface AIGuess {
  turn: number
  guess: string
  confidence: number
  timestamp: number
}

export interface GameRoom {
  roomId: string
  status: GameStatus
  theme: string
  difficulty: GameDifficulty
  currentTurn: string
  turnOrder: string[]
  currentTurnIndex: number
  maxTurns: number
  turnCount: number
  turnTimeLimit: number // 난이도별 턴 제한 시간
  startTime: number
  turnStartTime?: number
  endTime?: number
  result?: 'success' | 'failure'
  failReason?: 'turnLimitExceeded' | 'aiFailure'
  lastGuess?: string
  targetWordReveal?: string
  players: Record<string, Player>
  aiGuesses: AIGuess[]
  canvasData?: string
}

export interface LiveDrawing {
  roomId: string
  canvasState: string // Fabric.js JSON (stringified)
  lastUpdatedBy: string
  lastUpdatedAt: number
}

export interface ChatMessage {
  id: string
  roomId: string
  uid: string
  displayName: string
  text: string
  timestamp: number
}

export interface GameLog {
  logId: string
  roomId: string
  theme: string
  targetWord: string
  difficulty: GameDifficulty
  finalTurnCount: number
  finalTime: number
  result: 'success' | 'failure'
  failReason?: 'turnLimitExceeded' | 'aiFailure'
  winningTeam: string
  finalImageUri: string
  aiGuessList: AIGuess[]
  completedAt: number
  finishedAt: any // Firestore Timestamp
}

// Firestore 분석 데이터 타입
export interface DailyAnalytics {
  date: string // YYYY-MM-DD
  totalGames: number
  successCount: number
  failureCount: number
  totalTurns: number
  avgTurns: number
  avgTime: number
}

export interface WordAnalytics {
  word: string
  attempts: number
  successCount: number
  successRate: number
  avgTurns: number
  avgConfidence: number
}

export interface DepartmentAnalytics {
  department: string
  totalGames: number
  successCount: number
  successRate: number
  avgTurns: number
}

// 게임 스케줄 타입 (특정 날짜/시간대)
export interface GameScheduleDateRange {
  id?: string // Firestore 문서 ID
  date: string // YYYY-MM-DD 형식
  start: string // HH:mm 형식
  end: string // HH:mm 형식
  description?: string // 선택적 설명 (예: "팀 빌딩 이벤트")
}

export interface GameScheduleConfig {
  dateRanges: GameScheduleDateRange[]
  updatedBy: string
  updatedAt: any // Firestore Timestamp
}
