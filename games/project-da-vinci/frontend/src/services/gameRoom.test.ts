import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTurn, updateCanvasData, endGameByTurnLimit } from './gameRoom'

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
})
