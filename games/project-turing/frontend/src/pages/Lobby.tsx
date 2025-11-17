import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import Button from '@/components/common/Button'
import Loader from '@/components/common/Loader'

export default function Lobby() {
  const navigate = useNavigate()
  const { user, signOut, isAuthenticated } = useAuth()
  const {
    waitingPlayers,
    isJoining,
    error,
    joinWaitingRoom,
    leaveWaitingRoom,
    isInWaitingRoom,
  } = useMatchmaking()

  // 로그인 안 되어 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleLogout = async () => {
    try {
      await leaveWaitingRoom()
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" text="로딩 중..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">대기실</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <span className="font-semibold">{user.displayName}</span>
            </div>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>

        {/* 대기실 카드 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 상태 표시 */}
          <div className="text-center mb-8">
            <p className="text-3xl font-bold mb-2">
              대기 중: {waitingPlayers.length}/5
            </p>
            <p className="text-gray-600">
              5명의 플레이어가 모이면 자동으로 게임이 시작됩니다
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-danger text-white px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* 입장/퇴장 버튼 */}
          {!isInWaitingRoom ? (
            <div className="text-center mb-8">
              <Button
                onClick={joinWaitingRoom}
                size="lg"
                disabled={isJoining}
                className="px-12"
              >
                {isJoining ? '입장 중...' : '대기실 입장'}
              </Button>
            </div>
          ) : (
            <div className="text-center mb-8">
              <Button
                onClick={leaveWaitingRoom}
                variant="danger"
                size="lg"
                className="px-12"
              >
                대기실 나가기
              </Button>
            </div>
          )}

          {/* 플레이어 목록 */}
          <div className="space-y-4">
            {waitingPlayers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                대기 중인 플레이어가 없습니다
              </div>
            ) : (
              waitingPlayers.map((player, index) => (
                <div
                  key={player.uid}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-fadeIn"
                >
                  {/* 순서 번호 */}
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>

                  {/* 프로필 사진 */}
                  {player.photoURL && (
                    <img
                      src={player.photoURL}
                      alt={player.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}

                  {/* 이름 */}
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{player.name}</p>
                    <p className="text-sm text-gray-600">{player.email}</p>
                  </div>

                  {/* 현재 사용자 표시 */}
                  {player.uid === user.uid && (
                    <span className="px-3 py-1 bg-success text-white text-sm font-semibold rounded-full">
                      나
                    </span>
                  )}
                </div>
              ))
            )}

            {/* 빈 슬롯 표시 */}
            {Array.from({ length: 5 - waitingPlayers.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
              >
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                  {waitingPlayers.length + index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 font-semibold">빈 슬롯</p>
                  <p className="text-sm text-gray-400">대기 중...</p>
                </div>
              </div>
            ))}
          </div>

          {/* 게임 설명 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">게임 방법</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 6명 중 1명은 AI입니다 (나머지 5명은 실제 플레이어)</li>
              <li>• 매 턴마다 질문이 주어지고, 모두가 답변합니다</li>
              <li>• 익명으로 답변이 공개되며, 투표로 AI를 찾습니다</li>
              <li>• 5턴 안에 AI를 찾으면 승리!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
