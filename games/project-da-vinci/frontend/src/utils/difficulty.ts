import type { GameDifficulty } from '@/types/game.types'

// Re-export GameDifficulty for convenience
export type { GameDifficulty }

export interface DifficultyConfig {
  label: string
  description: string
  turnTimeLimit: number // 초
  maxTurns: number
  color: string
  bgColor: string
  icon: string
}

export const DIFFICULTY_CONFIG: Record<GameDifficulty, DifficultyConfig> = {
  easy: {
    label: '쉬움',
    description: '넉넉한 시간, 많은 턴',
    turnTimeLimit: 90,
    maxTurns: 15,
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-300',
    icon: '🟢',
  },
  normal: {
    label: '보통',
    description: '적당한 시간, 표준 턴',
    turnTimeLimit: 60,
    maxTurns: 10,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-300',
    icon: '🔵',
  },
  hard: {
    label: '어려움',
    description: '짧은 시간, 적은 턴',
    turnTimeLimit: 30,
    maxTurns: 7,
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
