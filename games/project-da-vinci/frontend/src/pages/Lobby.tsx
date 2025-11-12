import { useAuth } from '@/hooks/useAuth'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ENV } from '@/config/env'
import { createGameRoom } from '@/services/matchmaking'
import { DIFFICULTY_CONFIG, type GameDifficulty } from '@/utils/difficulty'

export default function Lobby() {
  const { user, loading, signOut, isAuthenticated } = useAuth()
  const {
    waitingPlayers,
    isJoining,
    error: matchError,
    joinWaitingRoom,
    isInWaitingRoom,
  } = useMatchmaking()
  const [isStarting, setIsStarting] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('normal')
  const navigate = useNavigate()

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/')
    }
  }, [isAuthenticated, loading, navigate])

  // 로그인 완료되면 자동으로 대기실 입장
  useEffect(() => {
    if (user && !isInWaitingRoom && !isJoining) {
      joinWaitingRoom()
    }
  }, [user, isInWaitingRoom, isJoining, joinWaitingRoom])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const handleStartGame = async () => {
    if (waitingPlayers.length < ENV.game.maxPlayers) return

    try {
      setIsStarting(true)
      const roomId = await createGameRoom(waitingPlayers, selectedDifficulty)
      navigate(`/game/${roomId}`)
    } catch (error) {
      console.error('게임 시작 실패:', error)
      setIsStarting(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">로딩 중...</div>
      </div>
    )
  }

  // 빈 슬롯 개수 계산
  const emptySlots = Math.max(0, ENV.game.maxPlayers - waitingPlayers.length)

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
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300 animate-fadeIn ${
                        isMe
                          ? 'bg-indigo-50 border-indigo-200 shadow-md'
                          : 'bg-green-50 border-green-200'
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
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-lg animate-bounce">?</span>
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

              {/* 게임 시작 버튼 */}
              {waitingPlayers.length === ENV.game.maxPlayers && (
                <div className="mt-6 animate-scaleIn">
                  <button
                    onClick={handleStartGame}
                    disabled={isStarting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isStarting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>게임 시작 중...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">🎮</span>
                        <span>게임 시작하기!</span>
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-sm text-gray-500">
                    모든 플레이어가 모였습니다. 게임을 시작해주세요!
                  </p>
                </div>
              )}

              {/* 대기 중 메시지 */}
              {waitingPlayers.length < ENV.game.maxPlayers && waitingPlayers.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm text-center">
                  <span className="font-medium">
                    {ENV.game.maxPlayers - waitingPlayers.length}명
                  </span>
                  의 플레이어를 더 기다리고 있습니다...
                </div>
              )}
            </div>
          </div>

          {/* 게임 정보 */}
          <div className="space-y-6">
            {/* 난이도 선택 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">난이도 선택</h3>
              <div className="space-y-3">
                {(Object.keys(DIFFICULTY_CONFIG) as GameDifficulty[]).map((difficulty) => {
                  const config = DIFFICULTY_CONFIG[difficulty]
                  const isSelected = selectedDifficulty === difficulty

                  return (
                    <button
                      key={difficulty}
                      onClick={() => setSelectedDifficulty(difficulty)}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                        isSelected
                          ? `${config.bgColor} border-current shadow-md scale-105`
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{config.icon}</span>
                          <span className={`font-bold text-lg ${isSelected ? config.color : 'text-gray-700'}`}>
                            {config.label}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-2xl animate-scaleIn">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>⏱️ {config.turnTimeLimit}초</span>
                        <span>🔄 {config.maxTurns}턴</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

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
                  <span className="text-gray-600">선택된 난이도</span>
                  <span className={`font-medium ${DIFFICULTY_CONFIG[selectedDifficulty].color}`}>
                    {DIFFICULTY_CONFIG[selectedDifficulty].icon} {DIFFICULTY_CONFIG[selectedDifficulty].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">최대 턴</span>
                  <span className="font-medium text-gray-900">{DIFFICULTY_CONFIG[selectedDifficulty].maxTurns}턴</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">턴당 시간</span>
                  <span className="font-medium text-gray-900">{DIFFICULTY_CONFIG[selectedDifficulty].turnTimeLimit}초</span>
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
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out relative"
                    style={{ width: `${(waitingPlayers.length / ENV.game.maxPlayers) * 100}%` }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
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
