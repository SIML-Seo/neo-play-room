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
  finalTurnCount: number
  finalTime: number
  winningTeam: string
  finalImageUri: string
  aiGuessList: AIGuess[]
  completedAt: number
}
