import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useGameRoom } from '@/hooks/useGameRoom'
import { useEffect, useState, useRef } from 'react'
import Canvas, { type CanvasHandle } from '@/components/game/Canvas'
import Chat from '@/components/game/Chat'
import { submitDrawingToAI } from '@/services/ai'
import { ENV } from '@/config/env'
import { subscribeToRoomSecret } from '@/services/roomSecrets'
import { getDifficultyConfig, DIFFICULTY_CONFIG, type GameDifficulty } from '@/utils/difficulty'

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const {
    gameRoom,
    loading: roomLoading,
    error: roomError,
    handleCanvasChange,
    handleNextTurn,
    handlePlayerReady,
    handleDifficultyChange,
    handleStartGame,
    isMyTurn,
    getRemainingTime,
  } = useGameRoom(roomId)
  const navigate = useNavigate()
  const canvasRef = useRef<CanvasHandle>(null)
  const [remainingTime, setRemainingTime] = useState(gameRoom?.turnTimeLimit || ENV.game.turnTimeLimit)
  const [isSubmittingToAI, setIsSubmittingToAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [targetWord, setTargetWord] = useState<string | null>(null)

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  // 타이머 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime(getRemainingTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [getRemainingTime])

  // 현재 턴인 경우 정답 단어 구독
  useEffect(() => {
    if (!roomId) {
      setTargetWord(null)
      return
    }

    if (!user || !isMyTurn(user.uid)) {
      setTargetWord(null)
      return
    }

    const unsubscribe = subscribeToRoomSecret(roomId, (secret) => {
      setTargetWord(secret?.targetWord ?? null)
    })

    return () => {
      unsubscribe()
    }
  }, [roomId, user, isMyTurn])

  // 시간 초과 시 자동으로 다음 턴
  useEffect(() => {
    if (remainingTime === 0 && gameRoom?.status === 'in-progress') {
      handleNextTurn()
    }
  }, [remainingTime, gameRoom?.status, handleNextTurn])

  // 관전자/다른 플레이어는 최신 캔버스를 불러오기
  useEffect(() => {
    console.log('[GameRoom] 캔버스 데이터 변경 감지', {
      hasCanvasRef: !!canvasRef.current,
      canvasData: gameRoom?.canvasData,
      isMyTurn: user ? isMyTurn(user.uid) : false,
    })

    if (!canvasRef.current || gameRoom?.canvasData === undefined) {
      return
    }

    // 빈 캔버스 데이터면 항상 초기화 (턴이 넘어갈 때)
    if (gameRoom.canvasData === '') {
      console.log('[GameRoom] 빈 캔버스로 초기화')
      canvasRef.current.clearCanvas()
      return
    }

    // 내 차례가 아닐 때만 다른 사람의 그림 로드
    if (!user || isMyTurn(user.uid)) {
      console.log('[GameRoom] 내 차례라서 캔버스 로드 스킵')
      return
    }

    console.log('[GameRoom] 다른 플레이어의 캔버스 로드', gameRoom.canvasData.substring(0, 50))
    canvasRef.current.loadCanvasData(gameRoom.canvasData)
  }, [gameRoom?.canvasData, isMyTurn, user])

  // AI에게 그림 제출
  const handleSubmitToAI = async () => {
    if (!roomId || !canvasRef.current) return

    try {
      setIsSubmittingToAI(true)
      setAiError(null)

      const imageBase64 = canvasRef.current.getCanvasAsBase64()
      if (!imageBase64) {
        throw new Error('캔버스 이미지를 가져올 수 없습니다.')
      }

      const result = await submitDrawingToAI(roomId, imageBase64)

      console.log('AI 판단 결과:', result)

      // 게임이 종료되면 useEffect에서 자동으로 /results로 리다이렉트됨
    } catch (err) {
      console.error('AI 제출 실패:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'AI에게 제출하는 중 오류가 발생했습니다.'
      setAiError(errorMessage)
    } finally {
      setIsSubmittingToAI(false)
    }
  }

  if (authLoading || roomLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">로딩 중...</div>
      </div>
    )
  }

  if (roomError || !gameRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">오류 발생</h2>
          <p className="text-gray-600 mb-6">{roomError || '게임 룸을 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/lobby')}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            로비로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // 게임 종료 시 결과 페이지로 리다이렉트
  useEffect(() => {
    if (gameRoom?.status === 'finished' && roomId) {
      navigate(`/results?roomId=${roomId}`)
    }
  }, [gameRoom?.status, roomId, navigate])

  const isDrawing = isMyTurn(user.uid)
  const currentPlayer = gameRoom.players[gameRoom.currentTurn]
  const allPlayers = Object.values(gameRoom.players)
  const wordDisplay = targetWord ? (
    <strong>{targetWord}</strong>
  ) : (
    <span className="text-sm text-gray-500">정답 단어를 불러오는 중...</span>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Project Da Vinci</h1>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                {gameRoom.theme}
              </span>
              {/* 난이도 배지 */}
              {gameRoom.difficulty && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    getDifficultyConfig(gameRoom.difficulty).bgColor
                  } ${getDifficultyConfig(gameRoom.difficulty).color}`}
                >
                  <span>{getDifficultyConfig(gameRoom.difficulty).icon}</span>
                  <span>{getDifficultyConfig(gameRoom.difficulty).label}</span>
                </span>
              )}
              {gameRoom.status === 'waiting' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  대기 중
                </span>
              )}
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
        {/* 게임 대기 중 - 대기실 UI */}
        {gameRoom.status === 'waiting' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 플레이어 목록 & 난이도 선택 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 난이도 선택 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🎯 난이도 선택 (모두 수정 가능)
                </h3>
                <div className="space-y-3">
                  {(Object.keys(DIFFICULTY_CONFIG) as GameDifficulty[]).map((difficulty) => {
                    const config = DIFFICULTY_CONFIG[difficulty]
                    const isSelected = gameRoom.difficulty === difficulty

                    return (
                      <button
                        key={difficulty}
                        onClick={() => handleDifficultyChange(difficulty)}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                          isSelected
                            ? `${config.bgColor} border-current shadow-md scale-105`
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{config.icon}</span>
                            <span
                              className={`font-bold text-lg ${isSelected ? config.color : 'text-gray-700'}`}
                            >
                              {config.label}
                            </span>
                          </div>
                          {isSelected && <span className="text-2xl animate-scaleIn">✓</span>}
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

              {/* 플레이어 목록 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 참가자 ({allPlayers.length}명)</h3>
                <div className="space-y-3">
                  {allPlayers.map((player) => {
                    const isMe = player.uid === user.uid
                    const isReady = player.ready

                    return (
                      <div
                        key={player.uid}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-300 ${
                          isMe
                            ? 'bg-indigo-50 border-indigo-200'
                            : isReady
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {player.photoURL && (
                            <img
                              src={player.photoURL}
                              alt={player.displayName || ''}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {player.displayName}
                              {isMe && <span className="text-xs text-indigo-600 ml-2">(나)</span>}
                            </div>
                            <div className="text-xs text-gray-500">{player.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isReady ? (
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                              ✓ 준비 완료
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-300 text-gray-600 text-xs font-medium rounded-full">
                              대기 중
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 준비 버튼 & 게임 시작 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  {/* 내 준비 상태 토글 */}
                  <button
                    onClick={() => {
                      const myPlayer = allPlayers.find((p) => p.uid === user.uid)
                      handlePlayerReady(user.uid, !myPlayer?.ready)
                    }}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
                      allPlayers.find((p) => p.uid === user.uid)?.ready
                        ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {allPlayers.find((p) => p.uid === user.uid)?.ready ? '준비 취소' : '준비 완료'}
                  </button>

                  {/* 모두 준비 완료 시 게임 시작 버튼 */}
                  {allPlayers.every((p) => p.ready) && (
                    <button
                      onClick={handleStartGame}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all animate-pulse"
                    >
                      🚀 게임 시작하기
                    </button>
                  )}

                  {/* 준비 상태 안내 */}
                  <div className="text-center text-sm text-gray-600">
                    {allPlayers.every((p) => p.ready) ? (
                      <span className="text-green-600 font-medium">모든 플레이어가 준비 완료! 🎉</span>
                    ) : (
                      <span>
                        {allPlayers.filter((p) => p.ready).length}/{allPlayers.length}명 준비 완료
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 채팅 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[calc(100vh-200px)] flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 채팅</h3>
                <div className="flex-1 overflow-hidden">
                  <Chat roomId={roomId!} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 캔버스 영역 */}
          <div className="lg:col-span-3">
            {isDrawing ? (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-indigo-900 font-medium">
                  🎨 당신의 차례입니다! 주제: {wordDisplay}
                </p>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                <p className="text-gray-700">
                  👀 {currentPlayer?.displayName || '???'}님이 그림을 그리고 있습니다...
                </p>
              </div>
            )}

            <Canvas
              ref={canvasRef}
              width={800}
              height={600}
              isDrawingEnabled={isDrawing && gameRoom.status === 'in-progress'}
              onCanvasChange={handleCanvasChange}
            />

            {/* AI 에러 표시 */}
            {aiError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {aiError}
              </div>
            )}

            {isDrawing && gameRoom.status === 'in-progress' && (
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleSubmitToAI}
                  disabled={isSubmittingToAI}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmittingToAI ? '🤖 AI가 판단 중...' : '🎨 AI에게 제출하기'}
                </button>
                <button
                  onClick={handleNextTurn}
                  disabled={isSubmittingToAI}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  다음 차례로 넘기기 (AI 제출 안 함)
                </button>
              </div>
            )}
          </div>

          {/* 사이드바 - 게임 정보 */}
          <div className="space-y-6">
            {/* 현재 턴 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">현재 턴</h3>

              {/* 큰 타이머 표시 */}
              <div className="mb-6 flex flex-col items-center justify-center">
                <div
                  className={`text-6xl font-bold transition-all duration-300 ${
                    remainingTime <= 10
                      ? 'text-red-600 animate-pulse'
                      : remainingTime <= 30
                        ? 'text-amber-600'
                        : 'text-indigo-600'
                  }`}
                >
                  {remainingTime}
                </div>
                <div className="text-sm text-gray-500 mt-1">남은 시간 (초)</div>

                {/* 진행 바 */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${
                      remainingTime <= 10
                        ? 'bg-red-600'
                        : remainingTime <= 30
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                    }`}
                    style={{
                      width: `${(remainingTime / (gameRoom.turnTimeLimit || ENV.game.turnTimeLimit)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 text-sm border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">그리는 사람</span>
                  <span className="font-medium text-gray-900">
                    {currentPlayer?.displayName || '???'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">턴 수</span>
                  <span className="font-medium text-indigo-600">
                    {gameRoom.turnCount} / {gameRoom.maxTurns}
                  </span>
                </div>
              </div>
            </div>

            {/* 턴 히스토리 & AI 추론 결과 */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                <span>🎯</span>
                <span>턴 히스토리</span>
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {gameRoom.aiGuesses && gameRoom.aiGuesses.length > 0 ? (
                  gameRoom.aiGuesses.map((guess, idx) => {
                    const playerUid =
                      gameRoom.turnOrder[((guess.turn as number) - 1) % gameRoom.turnOrder.length]
                    const player = allPlayers.find((p) => p.uid === playerUid)
                    const confidenceColor =
                      (guess.confidence as number) >= 80
                        ? 'text-green-600'
                        : (guess.confidence as number) >= 50
                          ? 'text-amber-600'
                          : 'text-red-600'

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-lg p-3 text-sm shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 animate-slideIn"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                              턴 {guess.turn}
                            </span>
                            {player && (
                              <span className="text-xs text-gray-600">
                                by {player.displayName}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-medium ${confidenceColor}`}>
                            {guess.confidence}% 확신
                          </span>
                        </div>
                        <div className="font-medium text-gray-900 text-base">{guess.guess}</div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 bg-white rounded-lg">
                    <div className="text-4xl mb-2">🤖</div>
                    <p className="text-sm text-indigo-700 font-medium">
                      아직 AI 추론 결과가 없습니다.
                    </p>
                    <p className="text-xs text-indigo-500 mt-1">
                      그림을 그리고 AI에게 제출해보세요!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 플레이어 목록 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">플레이어</h3>
              <div className="space-y-2">
                {allPlayers.map((player) => {
                  const isCurrent = player.uid === gameRoom.currentTurn
                  const isMe = player.uid === user.uid

                  return (
                    <div
                      key={player.uid}
                      className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-400 shadow-lg scale-105 animate-pulse'
                          : isMe
                            ? 'bg-indigo-50 border border-indigo-200'
                            : 'bg-gray-50'
                      }`}
                    >
                      <div className="relative">
                        {player.photoURL ? (
                          <img
                            src={player.photoURL}
                            alt={player.displayName || ''}
                            className={`w-8 h-8 rounded-full ${
                              isCurrent ? 'ring-2 ring-indigo-400' : ''
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ${
                              isCurrent ? 'ring-2 ring-indigo-400' : ''
                            }`}
                          >
                            <span className="text-sm font-bold">{player.displayName?.[0]}</span>
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-bounce" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-indigo-900' : 'text-gray-900'
                        }`}
                      >
                        {player.displayName}
                        {isMe && ' (나)'}
                      </span>
                      {isCurrent && (
                        <span className="text-xs text-white bg-indigo-600 px-2 py-1 rounded-full ml-auto font-medium">
                          🎨 그리는 중
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 채팅 */}
            <div className="h-96">
              <Chat roomId={roomId!} user={user} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
