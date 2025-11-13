import { useAuth } from '@/hooks/useAuth'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useGameSchedule } from '@/hooks/useGameSchedule'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ENV } from '@/config/env'

export default function Lobby() {
  const { user, loading, signOut, isAuthenticated } = useAuth()
  const {
    waitingPlayers,
    isJoining,
    error: matchError,
    joinWaitingRoom,
    isInWaitingRoom,
  } = useMatchmaking()
  const { isAllowed, nextOpenTime, timeUntilOpen, loading: scheduleLoading } = useGameSchedule()
  const navigate = useNavigate()

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/')
    }
  }, [isAuthenticated, loading, navigate])

  // 로그인 완료되면 자동으로 대기실 입장 (게임 허용 시간대일 때만)
  useEffect(() => {
    if (user && !isInWaitingRoom && !isJoining && isAllowed) {
      joinWaitingRoom()
    }
  }, [user, isInWaitingRoom, isJoining, isAllowed, joinWaitingRoom])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  if (loading || scheduleLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">로딩 중...</div>
      </div>
    )
  }

  // 게임이 허용되지 않는 시간대
  if (!isAllowed) {
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
                {user.email === 'swh1182@neolab.net' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="px-4 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-medium"
                  >
                    관리자
                  </button>
                )}
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

        {/* Closed Message */}
        <main className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-5xl">🔒</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">게임 시간이 아닙니다</h2>
            <p className="text-gray-600 text-lg mb-8">
              현재는 게임 운영 시간이 아닙니다.<br />
              다음 게임 시간까지 기다려주세요!
            </p>

            {nextOpenTime && (
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6 max-w-md mx-auto">
                <div className="text-sm text-indigo-600 font-medium mb-2">다음 게임 시작</div>
                <div className="text-2xl font-bold text-indigo-900 mb-1">
                  {nextOpenTime.toLocaleString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-indigo-700 text-lg font-semibold">{timeUntilOpen}</div>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // 빈 슬롯 개수 계산
  const emptySlots = Math.max(0, ENV.game.maxPlayers - waitingPlayers.length)

  // 마스터 계정 여부 확인
  const isMaster = user.email === 'swh1182@neolab.net'

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
              {isMaster && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-medium"
                >
                  관리자
                </button>
              )}
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
        {/* 매칭 에러 표시 */}
        {matchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {matchError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 대기 중인 플레이어 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">대기 중인 플레이어</h2>
              <p className="text-gray-500 text-sm mb-6">
                {ENV.game.maxPlayers}명이 모이면 자동으로 게임이 시작됩니다
              </p>

              {/* 플레이어 목록 */}
              <div className="space-y-3">
                {waitingPlayers.map((player) => {
                  const isMe = player.uid === user.uid

                  return (
                    <div
                      key={player.uid}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                        isMe ? 'bg-indigo-50 border-indigo-200' : 'bg-green-50 border-green-200'
                      }`}
                    >
                      {player.photoURL ? (
                        <img
                          src={player.photoURL}
                          alt={player.displayName || ''}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-bold">
                            {player.displayName?.[0] || '?'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {player.displayName || '익명'}
                          {isMe && <span className="text-indigo-600 ml-2">(나)</span>}
                        </div>
                        <div className="text-sm text-gray-500">{player.email}</div>
                      </div>
                    </div>
                  )
                })}

                {/* 빈 슬롯 */}
                {Array.from({ length: emptySlots }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
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

              {/* 대기실 입장 중 표시 */}
              {isJoining && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span>대기실에 입장 중...</span>
                </div>
              )}
            </div>
          </div>

          {/* 게임 정보 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">게임 정보</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">필요 인원</span>
                  <span className="font-medium text-gray-900">{ENV.game.maxPlayers}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">현재 대기</span>
                  <span className="font-medium text-indigo-600">{waitingPlayers.length}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">최대 턴</span>
                  <span className="font-medium text-gray-900">{ENV.game.maxTurns}턴</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">턴당 시간</span>
                  <span className="font-medium text-gray-900">{ENV.game.turnTimeLimit}초</span>
                </div>
              </div>

              {/* 진행 바 */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>매칭 진행</span>
                  <span>
                    {waitingPlayers.length}/{ENV.game.maxPlayers}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${(waitingPlayers.length / ENV.game.maxPlayers) * 100}%` }}
                  />
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
