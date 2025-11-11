import { describe, it, expect, vi } from 'vitest'
import { checkAndStartGame, type WaitingPlayer } from './matchmaking'

// Firebase 모킹
vi.mock('@/firebase', () => ({
  database: {},
  auth: {},
  storage: {},
  functions: {},
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  push: vi.fn(),
  serverTimestamp: vi.fn(),
}))

describe('matchmaking', () => {
  describe('checkAndStartGame', () => {
    it('5명 미만일 때 false 반환', () => {
      const players: WaitingPlayer[] = [
        {
          uid: '1',
          displayName: 'Player 1',
          email: 'p1@neolab.net',
          photoURL: null,
          joinedAt: Date.now(),
        },
        {
          uid: '2',
          displayName: 'Player 2',
          email: 'p2@neolab.net',
          photoURL: null,
          joinedAt: Date.now(),
        },
      ]

      expect(checkAndStartGame(players)).toBe(false)
    })

    it('5명일 때 true 반환', () => {
      const players: WaitingPlayer[] = Array.from({ length: 5 }, (_, i) => ({
        uid: String(i + 1),
        displayName: `Player ${i + 1}`,
        email: `p${i + 1}@neolab.net`,
        photoURL: null,
        joinedAt: Date.now(),
      }))

      expect(checkAndStartGame(players)).toBe(true)
    })

    it('5명 초과일 때 true 반환', () => {
      const players: WaitingPlayer[] = Array.from({ length: 6 }, (_, i) => ({
        uid: String(i + 1),
        displayName: `Player ${i + 1}`,
        email: `p${i + 1}@neolab.net`,
        photoURL: null,
        joinedAt: Date.now(),
      }))

      expect(checkAndStartGame(players)).toBe(true)
    })

    it('빈 배열일 때 false 반환', () => {
      expect(checkAndStartGame([])).toBe(false)
    })
  })
})
