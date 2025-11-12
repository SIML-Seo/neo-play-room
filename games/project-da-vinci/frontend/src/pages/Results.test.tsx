import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Results from './Results'
import type { GameRoom } from '@/types/game.types'
import * as React from 'react'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams('roomId=room-123'), vi.fn()],
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: to }, children),
}))

// Mock Firebase
const { mockGet, mockRef } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockRef: vi.fn(),
}))

vi.mock('firebase/database', () => ({
  ref: mockRef,
  get: mockGet,
}))

vi.mock('@/firebase', () => ({
  database: {},
}))

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'user-123',
      displayName: '테스터',
      photoURL: 'https://example.com/photo.jpg',
    },
    loading: false,
    isAuthenticated: true,
  }),
}))

describe('Results 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRef.mockReturnValue('mock-ref')
  })

  const mockGameRoom: GameRoom = {
    roomId: 'room-123',
    status: 'finished',
    result: 'success',
    theme: '동화',
    currentTurn: 'user-1',
    turnOrder: ['user-1', 'user-2'],
    currentTurnIndex: 0,
    maxTurns: 10,
    turnCount: 5,
    startTime: Date.now() - 180000, // 3분 전
    endTime: Date.now(),
    targetWordReveal: '백설공주',
    lastGuess: '백설공주',
    players: {
      'user-1': {
        uid: 'user-1',
        name: '플레이어1',
        displayName: '플레이어1',
        team: 'A',
        ready: true,
        joinedAt: Date.now(),
      },
      'user-2': {
        uid: 'user-2',
        name: '플레이어2',
        displayName: '플레이어2',
        team: 'A',
        ready: true,
        joinedAt: Date.now(),
      },
    },
    aiGuesses: [
      {
        turn: 1,
        guess: '공주',
        confidence: 0.6,
        timestamp: Date.now(),
      },
      {
        turn: 5,
        guess: '백설공주',
        confidence: 0.9,
        timestamp: Date.now(),
      },
    ],
  }

  const renderResults = () => {
    return render(<Results />)
  }

  it('성공 화면 렌더링', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => mockGameRoom,
    })

    renderResults()

    await waitFor(() => {
      expect(screen.getByText('성공!')).toBeInTheDocument()
    })

    expect(screen.getByText('백설공주')).toBeInTheDocument()
    expect(screen.getByText(/5 \/ 10/)).toBeInTheDocument()
  })

  it('실패 화면 렌더링 (턴 초과)', async () => {
    const failedRoom = {
      ...mockGameRoom,
      result: 'failure',
      failReason: 'turnLimitExceeded',
      turnCount: 10,
    }

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => failedRoom,
    })

    renderResults()

    await waitFor(() => {
      expect(screen.getByText('시간 초과')).toBeInTheDocument()
    })
  })

  it('AI 추론 히스토리 표시', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => mockGameRoom,
    })

    renderResults()

    await waitFor(() => {
      expect(screen.getByText('AI 추론 히스토리')).toBeInTheDocument()
    })

    expect(screen.getByText('공주')).toBeInTheDocument()
    expect(screen.getByText('백설공주')).toBeInTheDocument()
  })

  it('플레이어 목록 표시', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => mockGameRoom,
    })

    renderResults()

    await waitFor(() => {
      expect(screen.getByText('참가자')).toBeInTheDocument()
    })

    expect(screen.getByText('플레이어1')).toBeInTheDocument()
    expect(screen.getByText('플레이어2')).toBeInTheDocument()
  })

  it('게임 룸을 찾을 수 없으면 에러 표시', async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
      val: () => null,
    })

    renderResults()

    await waitFor(() => {
      expect(screen.getByText('오류 발생')).toBeInTheDocument()
    })

    expect(screen.getByText('게임 룸을 찾을 수 없습니다.')).toBeInTheDocument()
  })

  it('다시 플레이하기 버튼 표시', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => mockGameRoom,
    })

    renderResults()

    await waitFor(() => {
      expect(screen.getByText('다시 플레이하기')).toBeInTheDocument()
    })

    expect(screen.getByText('홈으로')).toBeInTheDocument()
  })
})
