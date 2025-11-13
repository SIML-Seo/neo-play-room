/**
 * 게임 로그 점수 계산 테스트
 */

import { describe, it, expect } from 'vitest'
import { calculateScore, sortGameLogsByRanking } from './gameLog'
import type { GameLog } from '@/types/game.types'

describe('calculateScore', () => {
  it('easy 난이도 3턴 120초 = 3,120점', () => {
    const log: Partial<GameLog> = {
      difficulty: 'easy',
      finalTurnCount: 3,
      finalTime: 120000, // 120초 (ms)
    }
    expect(calculateScore(log as GameLog)).toBe(3120)
  })

  it('normal 난이도 4턴 100초 = 3,177점', () => {
    const log: Partial<GameLog> = {
      difficulty: 'normal',
      finalTurnCount: 4,
      finalTime: 100000, // 100초
    }
    // (4 / 1.3) * 1000 + 100 = 3076.92 + 100 = 3176.92 ≈ 3177
    expect(calculateScore(log as GameLog)).toBeCloseTo(3177, 0)
  })

  it('hard 난이도 5턴 80초 = 3,205점', () => {
    const log: Partial<GameLog> = {
      difficulty: 'hard',
      finalTurnCount: 5,
      finalTime: 80000, // 80초
    }
    // (5 / 1.6) * 1000 + 80 = 3125 + 80 = 3205
    expect(calculateScore(log as GameLog)).toBe(3205)
  })

  it('hard 3턴 90초 < easy 3턴 120초 (hard가 더 높은 순위)', () => {
    const hardLog: Partial<GameLog> = {
      difficulty: 'hard',
      finalTurnCount: 3,
      finalTime: 90000,
    }
    const easyLog: Partial<GameLog> = {
      difficulty: 'easy',
      finalTurnCount: 3,
      finalTime: 120000,
    }
    // hard: (3 / 1.6) * 1000 + 90 = 1875 + 90 = 1965
    // easy: (3 / 1.0) * 1000 + 120 = 3000 + 120 = 3120
    expect(calculateScore(hardLog as GameLog)).toBeLessThan(calculateScore(easyLog as GameLog))
  })

  it('같은 난이도에서 턴 수가 적으면 점수가 낮음 (높은 순위)', () => {
    const log3turns: Partial<GameLog> = {
      difficulty: 'normal',
      finalTurnCount: 3,
      finalTime: 100000,
    }
    const log5turns: Partial<GameLog> = {
      difficulty: 'normal',
      finalTurnCount: 5,
      finalTime: 100000,
    }
    expect(calculateScore(log3turns as GameLog)).toBeLessThan(
      calculateScore(log5turns as GameLog)
    )
  })

  it('같은 턴 수에서 시간이 짧으면 점수가 낮음 (높은 순위)', () => {
    const log80s: Partial<GameLog> = {
      difficulty: 'normal',
      finalTurnCount: 5,
      finalTime: 80000,
    }
    const log120s: Partial<GameLog> = {
      difficulty: 'normal',
      finalTurnCount: 5,
      finalTime: 120000,
    }
    expect(calculateScore(log80s as GameLog)).toBeLessThan(calculateScore(log120s as GameLog))
  })

  it('난이도 필드가 없으면 기본값 1.0 적용', () => {
    const log: Partial<GameLog> = {
      difficulty: 'unknown' as any,
      finalTurnCount: 3,
      finalTime: 120000,
    }
    // (3 / 1.0) * 1000 + 120 = 3120 (easy와 동일)
    expect(calculateScore(log as GameLog)).toBe(3120)
  })
})

describe('sortGameLogsByRanking', () => {
  it('성공한 게임만 순위에 포함됨', () => {
    const logs: Partial<GameLog>[] = [
      { result: 'success', difficulty: 'easy', finalTurnCount: 3, finalTime: 120000 },
      { result: 'failure', difficulty: 'easy', finalTurnCount: 2, finalTime: 100000 }, // 실패
      { result: 'success', difficulty: 'normal', finalTurnCount: 4, finalTime: 100000 },
    ]

    const ranked = sortGameLogsByRanking(logs as GameLog[])

    expect(ranked).toHaveLength(2) // 성공한 게임만 2개
    expect(ranked.every((log) => log.result === 'success')).toBe(true)
  })

  it('보정 점수가 낮은 순서로 정렬됨', () => {
    const logs: Partial<GameLog>[] = [
      {
        result: 'success',
        difficulty: 'easy',
        finalTurnCount: 5,
        finalTime: 150000,
        roomId: 'team-A',
      }, // 5150
      {
        result: 'success',
        difficulty: 'hard',
        finalTurnCount: 3,
        finalTime: 90000,
        roomId: 'team-B',
      }, // 1965
      {
        result: 'success',
        difficulty: 'normal',
        finalTurnCount: 4,
        finalTime: 100000,
        roomId: 'team-C',
      }, // 3177
    ]

    const ranked = sortGameLogsByRanking(logs as GameLog[])

    // 순위: team-B (1965) > team-C (3177) > team-A (5150)
    expect(ranked[0].roomId).toBe('team-B')
    expect(ranked[1].roomId).toBe('team-C')
    expect(ranked[2].roomId).toBe('team-A')
  })

  it('동일 점수일 때 순서 유지 (stable sort)', () => {
    const logs: Partial<GameLog>[] = [
      {
        result: 'success',
        difficulty: 'easy',
        finalTurnCount: 3,
        finalTime: 120000,
        roomId: 'team-A',
      }, // 3120
      {
        result: 'success',
        difficulty: 'easy',
        finalTurnCount: 3,
        finalTime: 120000,
        roomId: 'team-B',
      }, // 3120
    ]

    const ranked = sortGameLogsByRanking(logs as GameLog[])

    // 동일 점수일 때는 입력 순서 유지 (JavaScript sort는 stable)
    expect(ranked[0].roomId).toBe('team-A')
    expect(ranked[1].roomId).toBe('team-B')
  })

  it('빈 배열 입력 시 빈 배열 반환', () => {
    const ranked = sortGameLogsByRanking([])
    expect(ranked).toEqual([])
  })
})
