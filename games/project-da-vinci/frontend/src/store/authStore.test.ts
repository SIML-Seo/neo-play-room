import { describe, it, expect } from 'vitest'
import { useAuthStore } from './authStore'
import type { User } from 'firebase/auth'

describe('authStore', () => {
  it('초기 상태가 올바르게 설정됨', () => {
    // 다른 테스트의 영향을 받을 수 있으므로 먼저 reset
    useAuthStore.setState({ user: null, loading: true, error: null })

    const state = useAuthStore.getState()

    expect(state.user).toBe(null)
    expect(state.loading).toBe(true)
    expect(state.error).toBe(null)
  })

  it('setUser가 user를 설정하고 error를 null로 만듦', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@neolab.net',
      displayName: 'Test User',
    } as User

    useAuthStore.getState().setUser(mockUser)

    const state = useAuthStore.getState()
    expect(state.user).toBe(mockUser)
    expect(state.error).toBe(null)
  })

  it('setLoading이 loading 상태를 변경함', () => {
    useAuthStore.getState().setLoading(false)

    const state = useAuthStore.getState()
    expect(state.loading).toBe(false)
  })

  it('setError가 error를 설정함', () => {
    const errorMessage = '로그인에 실패했습니다.'

    useAuthStore.getState().setError(errorMessage)

    const state = useAuthStore.getState()
    expect(state.error).toBe(errorMessage)
  })

  it('reset이 모든 상태를 초기화함', () => {
    const mockUser = { uid: 'test-uid', email: 'test@neolab.net' } as User

    // 상태 변경
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setError('에러 발생')

    // 초기화
    useAuthStore.getState().reset()

    const state = useAuthStore.getState()
    expect(state.user).toBe(null)
    expect(state.loading).toBe(false)
    expect(state.error).toBe(null)
  })
})
