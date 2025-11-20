// Game Types for Project Turing

export type Difficulty = 'easy' | 'normal' | 'hard'
export type GameStatus = 'waiting' | 'in-progress' | 'finished'
export type Category = 'personal' | 'company' | 'creative' | 'trend' | 'values'

// 플레이어 정보
export interface Player {
  uid: string
  name: string
  email: string
  photoURL?: string
  anonymousId: string // player_1 ~ player_6
  ready: boolean
}

// 답변
export interface Answer {
  text: string
  submittedAt: number
  isAI?: boolean // 서버에서만 접근 가능
}

// 투표
export interface Vote {
  votedFor: string // anonymousId
  submittedAt: number
}

// 투표 결과
export interface VoteResult {
  mostVotedPlayer: string // anonymousId
  voteCount: number
  isAI: boolean
  gameEnded: boolean
  timestamp: number
}

// 턴 데이터
export interface Turn {
  turnNumber: number
  question: string
  category: Category
  startTime: number
  answers: Record<string, Answer> // anonymousId -> Answer
  votes: Record<string, Vote> // uid -> Vote
  voteResult?: VoteResult
}

// 게임 룸
export interface GameRoom {
  roomId: string
  status: GameStatus
  difficulty: Difficulty
  currentTurn: number
  maxTurns: number
  aiPlayerId: string // 서버에서만 접근 가능 (보안 규칙)
  startTime: number | null
  endTime: number | null
  players: Record<string, Player> // uid -> Player
  turns: Record<number, Turn> // turnNumber -> Turn
}

// 게임 로그 (Firestore)
export interface GameLog {
  roomId: string
  difficulty: Difficulty
  finalTurnCount: number
  finalTime: number
  result: 'success' | 'failure' // AI를 찾았는지 여부
  aiPlayerId: string
  score: number
  turnsHistory: Array<{
    turn: number
    question: string
    answers: Record<string, Answer>
    voteResult?: VoteResult
  }>
  completedAt: number
  finishedAt: unknown // FieldValue.serverTimestamp()
}

// 질문 (Firestore)
export interface Question {
  id: string
  category: Category
  text: string
  createdAt: number
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

// 게임 스케줄 타입 (특정 날짜/시간대)
export interface GameScheduleDateRange {
  id?: string // Firestore 문서 ID
  date: string // YYYY-MM-DD 형식
  start: string // HH:mm 형식
  end: string // HH:mm 형식
  description?: string // 선택적 설명 (예: "팀 빌딩 이벤트")
  theme?: string // 게임 주제 (선택)
}

export interface GameScheduleConfig {
  dateRanges: GameScheduleDateRange[]
  updatedBy: string
  updatedAt: unknown // Firestore Timestamp
}
