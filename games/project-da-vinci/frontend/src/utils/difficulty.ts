import type { GameDifficulty } from '@/types/game.types'

// Re-export GameDifficulty for convenience
export type { GameDifficulty }

export interface DifficultyConfig {
  label: string
  description: string
  turnTimeLimit: number // 초
  maxTurns: number
  scoreMultiplier: number // 점수 보정 가중치
  color: string
  bgColor: string
  icon: string
}

export const DIFFICULTY_CONFIG: Record<GameDifficulty, DifficultyConfig> = {
  easy: {
    label: '쉬움',
    description: 'AI가 쉽게 맞춤, 넉넉한 시간',
    turnTimeLimit: 45,
    maxTurns: 15,
    scoreMultiplier: 1.0, // 기준 점수
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-300',
    icon: '🟢',
  },
  normal: {
    label: '보통',
    description: 'AI가 보통 맞춤, 적당한 시간',
    turnTimeLimit: 30,
    maxTurns: 10,
    scoreMultiplier: 1.3, // 30% 보정
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-300',
    icon: '🔵',
  },
  hard: {
    label: '어려움',
    description: 'AI가 어렵게 맞춤, 짧은 시간',
    turnTimeLimit: 20,
    maxTurns: 5,
    scoreMultiplier: 1.6, // 60% 보정
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-300',
    icon: '🔴',
  },
}

export function getDifficultyConfig(difficulty: GameDifficulty): DifficultyConfig {
  return DIFFICULTY_CONFIG[difficulty]
}

export function getDifficultyLabel(difficulty: GameDifficulty): string {
  return DIFFICULTY_CONFIG[difficulty].label
}
