import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

// Firebase Auth 모킹
vi.mock('@/firebase', () => ({
  auth: {
    currentUser: null,
  },
}))

vi.mock('firebase/auth', () => {
  // GoogleAuthProvider mock 클래스를 vi.mock 내부에서 정의
  class MockGoogleAuthProvider {
    setCustomParameters = vi.fn()
  }

  return {
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: MockGoogleAuthProvider,
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((_auth, callback) => {
      // 초기 상태: 로그인하지 않음
      callback(null)
      return vi.fn() // unsubscribe 함수
    }),
  }
})

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('로그인되지 않은 경우 isAuthenticated는 false', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBe(null)
  })

  it('signInWithGoogle 함수가 존재함', () => {
    const { result } = renderHook(() => useAuth())

    expect(typeof result.current.signInWithGoogle).toBe('function')
  })

  it('signOut 함수가 존재함', () => {
    const { result } = renderHook(() => useAuth())

    expect(typeof result.current.signOut).toBe('function')
  })

  it('에러 상태가 초기에는 null', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(null)
  })
})
