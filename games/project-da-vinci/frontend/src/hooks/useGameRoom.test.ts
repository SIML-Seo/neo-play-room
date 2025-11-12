import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useGameRoom } from './useGameRoom'
import type { GameRoom } from '@/types/game.types'

// Mock services
const {
  mockSubscribeToGameRoom,
  mockUpdateCanvasData,
  mockNextTurn,
  mockStartGame,
  mockEndGameByTurnLimit,
} = vi.hoisted(() => ({
  mockSubscribeToGameRoom: vi.fn(),
  mockUpdateCanvasData: vi.fn(),
  mockNextTurn: vi.fn(),
  mockStartGame: vi.fn(),
  mockEndGameByTurnLimit: vi.fn(),
}))

vi.mock('@/services/gameRoom', () => ({
  subscribeToGameRoom: mockSubscribeToGameRoom,
  updateCanvasData: mockUpdateCanvasData,
  nextTurn: mockNextTurn,
  startGame: mockStartGame,
  endGameByTurnLimit: mockEndGameByTurnLimit,
}))

vi.mock('@/config/env', () => ({
  ENV: {
    game: {
      turnTimeLimit: 60,
      maxPlayers: 5,
      maxTurns: 10,
    },
  },
}))

describe('useGameRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  const mockGameRoom: GameRoom = {
    roomId: 'room-123',
    status: 'in-progress',
    theme: '동화',
    currentTurn: 'user-1',
    turnOrder: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
    currentTurnIndex: 0,
    maxTurns: 10,
    turnCount: 3,
    startTime: Date.now(),
    turnStartTime: Date.now() - 10000, // 10초 전
    players: {
      'user-1': {
        uid: 'user-1',
        name: '플레이어1',
        team: 'A',
        ready: true,
        joinedAt: Date.now(),
      },
    },
    aiGuesses: [],
  }

  it('게임 룸 구독 시작', async () => {
    mockSubscribeToGameRoom.mockImplementation((roomId, callback) => {
      callback(mockGameRoom)
      return () => {} // unsubscribe
    })

    const { result } = renderHook(() => useGameRoom('room-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockSubscribeToGameRoom).toHaveBeenCalledWith('room-123', expect.any(Function))
    expect(result.current.gameRoom).toEqual(mockGameRoom)
  })

  it('roomId가 없으면 로딩 완료', () => {
    const { result } = renderHook(() => useGameRoom(undefined))

    expect(result.current.loading).toBe(false)
    expect(result.current.gameRoom).toBeNull()
  })

  it('isMyTurn: 현재 플레이어 확인', async () => {
    mockSubscribeToGameRoom.mockImplementation((roomId, callback) => {
      callback(mockGameRoom)
      return () => {}
    })

    const { result } = renderHook(() => useGameRoom('room-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isMyTurn('user-1')).toBe(true)
    expect(result.current.isMyTurn('user-2')).toBe(false)
  })

  it('handleCanvasChange: 캔버스 데이터 업데이트', async () => {
    mockSubscribeToGameRoom.mockImplementation((roomId, callback) => {
      callback(mockGameRoom)
      return () => {}
    })
    mockUpdateCanvasData.mockResolvedValue(undefined)

    const { result } = renderHook(() => useGameRoom('room-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const canvasData = '{"objects":[]}'
    await result.current.handleCanvasChange(canvasData)

    expect(mockUpdateCanvasData).toHaveBeenCalledWith('room-123', canvasData)
  })

  it('handleNextTurn: 다음 턴으로 이동', async () => {
    mockSubscribeToGameRoom.mockImplementation((roomId, callback) => {
      callback(mockGameRoom)
      return () => {}
    })
    mockNextTurn.mockResolvedValue(undefined)

    const { result } = renderHook(() => useGameRoom('room-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.handleNextTurn()

    expect(mockNextTurn).toHaveBeenCalledWith('room-123')
  })

  it('handleStartGame: 게임 시작', async () => {
    mockSubscribeToGameRoom.mockImplementation((roomId, callback) => {
      callback({ ...mockGameRoom, status: 'waiting' })
      return () => {}
    })
    mockStartGame.mockResolvedValue(undefined)

    const { result } = renderHook(() => useGameRoom('room-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.handleStartGame()

    expect(mockStartGame).toHaveBeenCalledWith('room-123')
  })

  it('turnCount 초과 시 자동 게임 종료', async () => {
    const maxedOutRoom = {
      ...mockGameRoom,
      turnCount: 10, // maxTurns와 동일
      status: 'in-progress' as const,
    }

    mockSubscribeToGameRoom.mockImplementation((roomId, callback) => {
      callback(maxedOutRoom)
      return () => {}
    })
    mockEndGameByTurnLimit.mockResolvedValue(undefined)

    renderHook(() => useGameRoom('room-123'))

    await waitFor(() => {
      expect(mockEndGameByTurnLimit).toHaveBeenCalledWith('room-123')
    })
  })

  it('getRemainingTime: 남은 시간 계산', async () => {
    const now = Date.now()
    const roomWithTime = {
      ...mockGameRoom,
      turnStartTime: now - 45000, // 45초 전
    }

    mockSubscribeToGameRoom.mockImplementation((roomId, callback) => {
      callback(roomWithTime)
      return () => {}
    })

    const { result } = renderHook(() => useGameRoom('room-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const remaining = result.current.getRemainingTime()
    
    // 60초 - 45초 = 15초 (약간의 오차 허용)
    expect(remaining).toBeGreaterThan(10)
    expect(remaining).toBeLessThan(20)
  })

  it('에러 발생 시 error 상태 설정', async () => {
    mockSubscribeToGameRoom.mockImplementation((roomId, callback) => {
      callback(null) // 룸을 찾을 수 없음
      return () => {}
    })

    const { result } = renderHook(() => useGameRoom('room-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('게임 룸을 찾을 수 없습니다.')
  })
})
