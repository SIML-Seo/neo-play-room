import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useChat } from './useChat'

// Mock Firebase
const { mockOnValue, mockPush, mockRef } = vi.hoisted(() => ({
  mockOnValue: vi.fn(),
  mockPush: vi.fn(),
  mockRef: vi.fn(),
}))

vi.mock('firebase/database', () => ({
  ref: mockRef,
  push: mockPush,
  onValue: mockOnValue,
  query: vi.fn((ref) => ref),
  orderByChild: vi.fn(() => ({})),
  limitToLast: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => Date.now()),
}))

vi.mock('@/firebase', () => ({
  database: {},
}))

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockUser = {
    uid: 'user-123',
    displayName: '테스터',
    email: 'test@neolab.net',
  }

  it('채팅 메시지 구독', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        uid: 'user-123',
        displayName: '테스터',
        text: '안녕하세요',
        timestamp: Date.now(),
      },
    ]

    mockRef.mockReturnValue('mock-ref')
    mockOnValue.mockImplementation((ref, callback) => {
      const snapshot = {
        val: () => ({
          'msg-1': mockMessages[0],
        }),
        forEach: (fn: (child: { key: string; val: () => unknown }) => void) => {
          fn({ key: 'msg-1', val: () => mockMessages[0] })
        },
      }
      callback(snapshot)
      return () => {} // unsubscribe
    })

    const { result } = renderHook(() => useChat('room-123', mockUser))

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1)
    })

    expect(result.current.messages[0].text).toBe('안녕하세요')
  })

  it('메시지 전송', async () => {
    mockRef.mockReturnValue('mock-ref')
    mockPush.mockResolvedValue({ key: 'new-msg-id' })
    mockOnValue.mockImplementation((ref, callback) => {
      callback({
        val: () => null,
        forEach: () => {},
      })
      return () => {}
    })

    const { result } = renderHook(() => useChat('room-123', mockUser))

    await act(async () => {
      await result.current.sendMessage('테스트 메시지')
    })

    expect(mockPush).toHaveBeenCalledWith(
      'mock-ref',
      expect.objectContaining({
        uid: 'user-123',
        displayName: '테스터',
        text: '테스트 메시지',
        timestamp: expect.any(Number),
      })
    )
  })

  it('빈 메시지는 전송하지 않음', async () => {
    mockRef.mockReturnValue('mock-ref')
    mockOnValue.mockImplementation((ref, callback) => {
      callback({
        val: () => null,
        forEach: () => {},
      })
      return () => {}
    })

    const { result } = renderHook(() => useChat('room-123', mockUser))

    await act(async () => {
      await result.current.sendMessage('')
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('메시지는 timestamp 순으로 정렬', async () => {
    const mockMessages = {
      'msg-3': {
        id: 'msg-3',
        text: '세번째',
        timestamp: 3000,
      },
      'msg-1': {
        id: 'msg-1',
        text: '첫번째',
        timestamp: 1000,
      },
      'msg-2': {
        id: 'msg-2',
        text: '두번째',
        timestamp: 2000,
      },
    }

    mockRef.mockReturnValue('mock-ref')
    mockOnValue.mockImplementation((ref, callback) => {
      callback({
        val: () => mockMessages,
        forEach: (fn: (child: { key: string; val: () => unknown }) => void) => {
          Object.entries(mockMessages).forEach(([key, value]) => {
            fn({ key, val: () => value })
          })
        },
      })
      return () => {}
    })

    const { result } = renderHook(() => useChat('room-123', mockUser))

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(3)
    })

    expect(result.current.messages[0].text).toBe('첫번째')
    expect(result.current.messages[1].text).toBe('두번째')
    expect(result.current.messages[2].text).toBe('세번째')
  })
})
