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
    difficulty: 'normal',
    currentTurn: 'user-1',
    turnOrder: ['user-1', 'user-2'],
    currentTurnIndex: 0,
    maxTurns: 10,
    turnCount: 5,
    turnTimeLimit: 60,
    startTime: Date.now() - 180000, // 3분 전
    endTime: Date.now(),
    targetWordReveal: '백설공주',
    lastGuess: '백설공주',
    players: {
      'user-1': {
        uid: 'user-1',
        name: '플레이어1',
        displayName: '플레이어1',
        artistName: '피카소',
        team: 'A',
        ready: true,
        joinedAt: Date.now(),
      },
      'user-2': {
        uid: 'user-2',
        name: '플레이어2',
        displayName: '플레이어2',
        artistName: '다빈치',
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
      expect(screen.getByText('협동 창작 성공!')).toBeInTheDocument()
    })

    // "백설공주"가 여러 곳에 표시됨 (정답, AI 추론 히스토리 등)
    expect(screen.getAllByText('백설공주').length).toBeGreaterThanOrEqual(1)
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
      expect(screen.getByText('전시 시간 종료')).toBeInTheDocument()
    })
  })

  it('AI 감상 기록 표시', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => mockGameRoom,
    })

    renderResults()

    await waitFor(() => {
      expect(screen.getByText('AI 감상 기록')).toBeInTheDocument()
    })

    expect(screen.getByText('공주')).toBeInTheDocument()
    // "백설공주"가 여러 곳에 표시될 수 있음
    expect(screen.getAllByText('백설공주').length).toBeGreaterThanOrEqual(1)
  })

  it('플레이어 목록 표시', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => mockGameRoom,
    })

    renderResults()

    await waitFor(() => {
      expect(screen.getByText('참여 작가')).toBeInTheDocument()
    })

    // artistName 필드가 표시됨
    expect(screen.getByText('피카소')).toBeInTheDocument()
    expect(screen.getByText('다빈치')).toBeInTheDocument()
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

  it('게임 종료 후 버튼 표시', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => mockGameRoom,
    })

    renderResults()

    await waitFor(() => {
      expect(screen.getByText('다음 전시 참여하기')).toBeInTheDocument()
    })

    expect(screen.getByText('갤러리 입구로')).toBeInTheDocument()
  })
})
