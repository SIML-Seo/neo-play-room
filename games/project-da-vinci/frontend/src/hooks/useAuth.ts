import { useEffect } from 'react'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/firebase'
import { useAuthStore } from '@/store/authStore'

const googleProvider = new GoogleAuthProvider()

// 네오랩컨버전스 도메인만 허용
googleProvider.setCustomParameters({
  hd: 'neolab.net', // Google Workspace 도메인 제한
})

export function useAuth() {
  const { user, loading, error, setUser, setLoading, setError } = useAuthStore()

  // Firebase 인증 상태 구독
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user)
        setLoading(false)
      },
      (error) => {
        console.error('Auth state change error:', error)
        setError(error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [setUser, setLoading, setError])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await signInWithPopup(auth, googleProvider)
      const email = result.user.email

      // 네오랩컨버전스 이메일인지 검증
      if (!email?.endsWith('@neolab.net')) {
        await firebaseSignOut(auth)
        throw new Error('네오랩컨버전스 임직원만 참여 가능합니다.')
      }

      setUser(result.user)
      return result.user
    } catch (error: unknown) {
      console.error('Google sign-in error:', error)
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await firebaseSignOut(auth)
      setUser(null)
    } catch (error: unknown) {
      console.error('Sign-out error:', error)
      const errorMessage = error instanceof Error ? error.message : '로그아웃에 실패했습니다.'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  }
}
