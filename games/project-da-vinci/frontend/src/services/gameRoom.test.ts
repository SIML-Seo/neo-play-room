import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  nextTurn,
  updateCanvasData,
  endGameByTurnLimit,
  updatePlayerReady,
  updateDifficulty,
} from './gameRoom'

// Mock Firebase
const { mockRef, mockUpdate, mockOnValue, mockGet } = vi.hoisted(() => ({
  mockRef: vi.fn(),
  mockUpdate: vi.fn(),
  mockOnValue: vi.fn(),
  mockGet: vi.fn(),
}))

vi.mock('firebase/database', () => ({
  ref: mockRef,
  update: mockUpdate,
  onValue: mockOnValue,
  get: mockGet,
  off: vi.fn(),
}))

vi.mock('@/firebase', () => ({
  database: {},
}))

vi.mock('@/utils/difficulty', () => ({
  getDifficultyConfig: vi.fn((difficulty: string) => {
    const configs = {
      easy: { turnTimeLimit: 90, maxTurns: 15 },
      normal: { turnTimeLimit: 60, maxTurns: 10 },
      hard: { turnTimeLimit: 30, maxTurns: 7 },
    }
    return configs[difficulty as keyof typeof configs]
  }),
}))

describe('gameRoom services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRef.mockReturnValue('mock-ref')
  })

  describe('nextTurn', () => {
    it('다음 턴으로 이동 시 canvasData 초기화', async () => {
      mockRef.mockReturnValue('mock-ref')
      mockGet.mockResolvedValue({
        val: () => ({
          currentTurnIndex: 0,
          turnOrder: ['user-1', 'user-2'],
          turnCount: 5,
        }),
      })
      mockUpdate.mockResolvedValue(undefined)

      await nextTurn('room-123')

      expect(mockUpdate).toHaveBeenCalledWith(
        'mock-ref',
        expect.objectContaining({
          canvasData: '',
          turnStartTime: expect.any(Number),
        })
      )
    })
  })

  describe('updateCanvasData', () => {
    it('캔버스 데이터 업데이트', async () => {
      mockUpdate.mockResolvedValue(undefined)

      const canvasData = '{"objects":[{"type":"rect"}]}'
      await updateCanvasData('room-123', canvasData)

      expect(mockUpdate).toHaveBeenCalledWith('mock-ref', {
        canvasData,
        lastUpdated: expect.any(Number),
      })
    })
  })

  describe('endGameByTurnLimit', () => {
    it('턴 초과로 게임 종료', async () => {
      mockUpdate.mockResolvedValue(undefined)

      await endGameByTurnLimit('room-123')

      expect(mockUpdate).toHaveBeenCalledWith(
        'mock-ref',
        expect.objectContaining({
          status: 'finished',
          result: 'failed',
          failReason: 'turnLimitExceeded',
          finishedAt: expect.any(Number),
        })
      )
    })
  })

  describe('updatePlayerReady', () => {
    it('플레이어 준비 상태를 true로 업데이트', async () => {
      mockUpdate.mockResolvedValue(undefined)

      await updatePlayerReady('room-123', 'user-1', true)

      expect(mockRef).toHaveBeenCalledWith({}, 'gameRooms/room-123/players/user-1')
      expect(mockUpdate).toHaveBeenCalledWith('mock-ref', {
        ready: true,
      })
    })

    it('플레이어 준비 상태를 false로 업데이트', async () => {
      mockUpdate.mockResolvedValue(undefined)

      await updatePlayerReady('room-123', 'user-2', false)

      expect(mockRef).toHaveBeenCalledWith({}, 'gameRooms/room-123/players/user-2')
      expect(mockUpdate).toHaveBeenCalledWith('mock-ref', {
        ready: false,
      })
    })
  })

  describe('updateDifficulty', () => {
    it('쉬움 난이도로 변경', async () => {
      mockUpdate.mockResolvedValue(undefined)

      await updateDifficulty('room-123', 'easy')

      expect(mockUpdate).toHaveBeenCalledWith(
        'mock-ref',
        expect.objectContaining({
          difficulty: 'easy',
          maxTurns: 15,
          turnTimeLimit: 90,
        })
      )
    })

    it('보통 난이도로 변경', async () => {
      mockUpdate.mockResolvedValue(undefined)

      await updateDifficulty('room-123', 'normal')

      expect(mockUpdate).toHaveBeenCalledWith(
        'mock-ref',
        expect.objectContaining({
          difficulty: 'normal',
          maxTurns: 10,
          turnTimeLimit: 60,
        })
      )
    })

    it('어려움 난이도로 변경', async () => {
      mockUpdate.mockResolvedValue(undefined)

      await updateDifficulty('room-123', 'hard')

      expect(mockUpdate).toHaveBeenCalledWith(
        'mock-ref',
        expect.objectContaining({
          difficulty: 'hard',
          maxTurns: 7,
          turnTimeLimit: 30,
        })
      )
    })
  })
})
