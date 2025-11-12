import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useGameRoom } from '@/hooks/useGameRoom'
import { useEffect, useState, useRef } from 'react'
import Canvas, { type CanvasHandle } from '@/components/game/Canvas'
import Chat from '@/components/game/Chat'
import { submitDrawingToAI } from '@/services/ai'
import { ENV } from '@/config/env'

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const {
    gameRoom,
    loading: roomLoading,
    error: roomError,
    handleCanvasChange,
    handleNextTurn,
    handleStartGame,
    isMyTurn,
    getRemainingTime,
  } = useGameRoom(roomId)
  const navigate = useNavigate()
  const canvasRef = useRef<CanvasHandle>(null)
  const [remainingTime, setRemainingTime] = useState(ENV.game.turnTimeLimit)
  const [isSubmittingToAI, setIsSubmittingToAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

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

  // 시간 초과 시 자동으로 다음 턴
  useEffect(() => {
    if (remainingTime === 0 && gameRoom?.status === 'in-progress') {
      handleNextTurn()
    }
  }, [remainingTime, gameRoom?.status, handleNextTurn])

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

      // 게임이 종료되었으면 결과 페이지로 이동
      if (result.gameStatus === 'finished') {
        if (result.isCorrect) {
          alert(`🎉 정답입니다! AI가 "${result.guess}"라고 추론했습니다!`)
        } else {
          alert(`❌ 게임 종료! AI의 최종 추론: "${result.guess}"`)
        }
      }
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

  // 게임 종료 상태 확인
  if (gameRoom.status === 'finished') {
    const isSuccess = gameRoom.result === 'success'
    const isTurnLimitExceeded = gameRoom.failReason === 'turnLimitExceeded'

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            {isSuccess ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-600 mb-2">성공!</h2>
                <p className="text-gray-600">AI가 정답을 맞혔습니다!</p>
              </>
            ) : isTurnLimitExceeded ? (
              <>
                <div className="text-6xl mb-4">⏱️</div>
                <h2 className="text-3xl font-bold text-orange-600 mb-2">시간 초과</h2>
                <p className="text-gray-600">
                  최대 {gameRoom.maxTurns}턴을 초과했습니다. 다음에 다시 도전하세요!
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😢</div>
                <h2 className="text-3xl font-bold text-red-600 mb-2">실패</h2>
                <p className="text-gray-600">게임이 종료되었습니다.</p>
              </>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">게임 결과</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">목표 단어</span>
                <span className="font-medium text-gray-900">{gameRoom.targetWord}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">소요 턴</span>
                <span className="font-medium text-gray-900">
                  {gameRoom.turnCount} / {gameRoom.maxTurns}턴
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AI 추론 횟수</span>
                <span className="font-medium text-gray-900">{gameRoom.aiGuesses?.length || 0}회</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/lobby')}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            로비로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const isDrawing = isMyTurn(user.uid)
  const currentPlayer = gameRoom.players[gameRoom.currentTurn]
  const allPlayers = Object.values(gameRoom.players)

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
        {/* 게임 대기 중 */}
        {gameRoom.status === 'waiting' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-900">게임 시작 대기 중</h3>
                <p className="text-sm text-yellow-700">
                  모든 플레이어가 준비되면 게임이 시작됩니다.
                </p>
              </div>
              {allPlayers[0]?.uid === user.uid && (
                <button
                  onClick={handleStartGame}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  게임 시작
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 캔버스 영역 */}
          <div className="lg:col-span-3">
            {isDrawing ? (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-indigo-900 font-medium">
                  🎨 당신의 차례입니다! 주제: <strong>{gameRoom.targetWord}</strong>
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
              <div className="space-y-3 text-sm">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">남은 시간</span>
                  <span
                    className={`font-medium ${
                      remainingTime <= 10 ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {remainingTime}초
                  </span>
                </div>
              </div>

              {/* 타이머 프로그레스 바 */}
              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      remainingTime <= 10 ? 'bg-red-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${(remainingTime / 60) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI 추론 결과 */}
            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">AI 추론</h3>
              <div className="space-y-2">
                {gameRoom.aiGuesses && gameRoom.aiGuesses.length > 0 ? (
                  gameRoom.aiGuesses.slice(-3).map((guess, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 text-sm">
                      <div className="font-medium text-gray-900">{guess.guess}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        턴 {guess.turn} - {guess.confidence}% 확신
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-lg p-3 text-sm">
                    <span className="text-gray-500">아직 AI 추론이 없습니다...</span>
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
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        isCurrent ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'
                      }`}
                    >
                      {player.photoURL && (
                        <img
                          src={player.photoURL}
                          alt={player.displayName || ''}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {player.displayName}
                        {isMe && ' (나)'}
                      </span>
                      {isCurrent && (
                        <span className="text-xs text-indigo-600 ml-auto">그리는 중</span>
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
