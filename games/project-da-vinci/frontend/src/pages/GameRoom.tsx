import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import Canvas from '@/components/game/Canvas'

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/')
    }
  }, [isAuthenticated, loading, navigate])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">로딩 중...</div>
      </div>
    )
  }

  const handleCanvasChange = (canvasData: string) => {
    // TODO: Firebase RTDB에 캔버스 데이터 저장
    console.log('Canvas data changed:', canvasData.substring(0, 100))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Project Da Vinci</h1>
              <span className="text-sm text-gray-500">Room: {roomId}</span>
            </div>

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
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 캔버스 영역 */}
          <div className="lg:col-span-3">
            <Canvas
              width={800}
              height={600}
              isDrawingEnabled={true}
              onCanvasChange={handleCanvasChange}
            />
          </div>

          {/* 사이드바 - 게임 정보 */}
          <div className="space-y-6">
            {/* 현재 턴 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">현재 턴</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">그리는 사람</span>
                  <span className="font-medium text-gray-900">{user.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">턴 수</span>
                  <span className="font-medium text-indigo-600">1 / 10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">제한 시간</span>
                  <span className="font-medium text-gray-900">60초</span>
                </div>
              </div>
            </div>

            {/* AI 추론 결과 */}
            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">AI 추론</h3>
              <div className="space-y-2">
                <div className="bg-white rounded-lg p-3 text-sm">
                  <span className="text-gray-500">대기 중...</span>
                </div>
              </div>
            </div>

            {/* 플레이어 목록 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">플레이어</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || ''}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {user.displayName}
                  </span>
                  <span className="text-xs text-indigo-600 ml-auto">그리는 중</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
