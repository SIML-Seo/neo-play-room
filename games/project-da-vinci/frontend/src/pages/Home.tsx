import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const { loading, error, signInWithGoogle, isAuthenticated } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  // 이미 로그인된 경우 Lobby로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/lobby')
    }
  }, [isAuthenticated, loading, navigate])

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signInWithGoogle()
      // navigate는 useEffect에서 처리됨
    } catch {
      // 에러는 useAuth에서 처리됨
      setIsSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Project Da Vinci</h1>
          <p className="text-gray-600 mb-8">AI 협동 Pictionary 게임</p>

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || loading}
              className="w-full px-4 py-3 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSigningIn ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>로그인 중...</span>
                </>
              ) : (
                'Google로 로그인'
              )}
            </button>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

            <p className="text-sm text-gray-500">네오랩컨버전스 임직원만 참여 가능합니다</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">게임 방법</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">1.</span>
              <span>5명이 한 팀이 되어 게임 시작</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">2.</span>
              <span>순서대로 돌아가며 그림 그리기</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">3.</span>
              <span>AI가 그림을 보고 단어 추론</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 mr-2">4.</span>
              <span>최소 턴으로 정답 맞추기!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
