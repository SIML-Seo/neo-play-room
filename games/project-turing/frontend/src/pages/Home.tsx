import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/common/Button'
import Loader from '@/components/common/Loader'
import { useEffect } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const { user, loading, error, signInWithGoogle, isAuthenticated } = useAuth()

  // 이미 로그인되어 있으면 Lobby로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/lobby')
    }
  }, [isAuthenticated, user, navigate])

  const handleLogin = async () => {
    try {
      await signInWithGoogle()
      // 로그인 성공 후 useEffect에서 자동으로 리다이렉트
    } catch (err) {
      // 에러는 useAuth에서 처리
      console.error('Login failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary">
        <Loader size="lg" text="로딩 중..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary">
      <div className="text-center text-white space-y-8 p-8">
        <h1 className="text-6xl font-bold animate-fadeIn">Project Turing</h1>
        <p className="text-2xl animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          AI Among Us
        </p>
        <p className="text-lg opacity-90 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          누가 AI일까요? 5턴 안에 AI를 찾아내세요!
        </p>

        {error && (
          <div className="bg-danger text-white px-4 py-3 rounded-lg animate-fadeIn">
            {error}
          </div>
        )}

        <div className="pt-4 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <Button
            onClick={handleLogin}
            size="lg"
            className="px-8 py-4 bg-white text-primary hover:bg-gray-100"
            disabled={loading}
          >
            {loading ? '로그인 중...' : 'Google로 로그인'}
          </Button>
        </div>

        <p className="text-sm opacity-75 mt-4">
          네오랩컨버전스 임직원만 참여 가능합니다
        </p>
      </div>
    </div>
  )
}
