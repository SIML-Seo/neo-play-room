import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Lobby() {
  const { user, loading, signOut, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/')
    }
  }, [isAuthenticated, loading, navigate])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Project Da Vinci</h1>
              <span className="text-sm text-gray-500">Lobby</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || ''}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.displayName}</div>
                  <div className="text-gray-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 대기 중인 플레이어 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">대기 중인 플레이어</h2>
              <p className="text-gray-500 text-sm mb-6">5명이 모이면 자동으로 게임이 시작됩니다</p>

              {/* 플레이어 목록 - 추후 실시간 데이터로 교체 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || ''}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {user.displayName} <span className="text-indigo-600">(나)</span>
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>

                {/* 빈 슬롯 */}
                {[1, 2, 3, 4].map((slot) => (
                  <div
                    key={slot}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">?</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-400">대기 중...</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 게임 정보 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">게임 정보</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">필요 인원</span>
                  <span className="font-medium text-gray-900">5명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">현재 대기</span>
                  <span className="font-medium text-indigo-600">1명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">최대 턴</span>
                  <span className="font-medium text-gray-900">10턴</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">턴당 시간</span>
                  <span className="font-medium text-gray-900">60초</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">게임 규칙</h3>
              <ul className="space-y-2 text-sm text-indigo-800">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>각 턴마다 한 명씩 그림을 그립니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>AI가 그림을 보고 단어를 추론합니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>최소 턴으로 정답을 맞추면 승리!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>협동하여 최고 기록에 도전하세요</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
