import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ref, get } from 'firebase/database'
import { database } from '@/firebase'
import { useAuth } from '@/hooks/useAuth'
import { calculateScore } from '@/services/gameLog'
import type { GameRoom, GameLog } from '@/types/game.types'

export default function Results() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('roomId')
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const [gameLog, setGameLog] = useState<GameLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  // 게임 룸과 로그 데이터 가져오기
  useEffect(() => {
    if (!roomId) {
      setError('게임 룸 ID가 없습니다.')
      setLoading(false)
      return
    }

    const fetchGameData = async () => {
      try {
        setLoading(true)

        // 게임 룸 데이터 가져오기
        const roomRef = ref(database, `/gameRooms/${roomId}`)
        const roomSnapshot = await get(roomRef)

        if (!roomSnapshot.exists()) {
          setError('게임 룸을 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        const room = roomSnapshot.val() as GameRoom
        setGameRoom(room)

        // 게임 로그 가져오기 (있으면)
        const logRef = ref(database, `/gameLogs/${roomId}`)
        const logSnapshot = await get(logRef)

        if (logSnapshot.exists()) {
          setGameLog(logSnapshot.val() as GameLog)
        }

        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch game data:', err)
        setError('게임 데이터를 불러오는데 실패했습니다.')
        setLoading(false)
      }
    }

    fetchGameData()
  }, [roomId])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">로딩 중...</div>
      </div>
    )
  }

  if (error || !gameRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">오류 발생</h2>
          <p className="text-gray-600 mb-6">{error || '게임 데이터를 찾을 수 없습니다.'}</p>
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

  const isSuccess = gameRoom.result === 'success'
  const isTurnLimitExceeded = gameRoom.failReason === 'turnLimitExceeded'
  const revealedWord = gameRoom.targetWordReveal || gameLog?.targetWord || '비공개'
  const allPlayers = Object.values(gameRoom.players)
  const aiGuesses = gameLog?.aiGuessList || gameRoom.aiGuesses || []

  // 시간 포맷팅
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">게임 결과</h1>
            <div className="flex items-center gap-3">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="text-sm">
                <div className="font-medium text-gray-900">{user?.displayName}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 결과 카드 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            {isSuccess ? (
              <>
                <div className="text-8xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-4xl font-bold text-green-600 mb-2">성공!</h2>
                <p className="text-lg text-gray-600">AI가 정답을 맞혔습니다!</p>
              </>
            ) : isTurnLimitExceeded ? (
              <>
                <div className="text-8xl mb-4">⏱️</div>
                <h2 className="text-4xl font-bold text-orange-600 mb-2">시간 초과</h2>
                <p className="text-lg text-gray-600">
                  최대 {gameRoom.maxTurns}턴을 초과했습니다.
                </p>
              </>
            ) : (
              <>
                <div className="text-8xl mb-4">😢</div>
                <h2 className="text-4xl font-bold text-red-600 mb-2">게임 종료</h2>
                <p className="text-lg text-gray-600">다음에 다시 도전하세요!</p>
              </>
            )}
          </div>

          {/* 게임 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-indigo-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">{revealedWord}</div>
              <div className="text-sm text-gray-600">목표 단어</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {gameRoom.turnCount} / {gameRoom.maxTurns}
              </div>
              <div className="text-sm text-gray-600">소요 턴</div>
            </div>
            <div className="bg-pink-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">
                {gameRoom.endTime && gameRoom.startTime
                  ? formatTime(gameRoom.endTime - gameRoom.startTime)
                  : '0:00'}
              </div>
              <div className="text-sm text-gray-600">소요 시간</div>
            </div>
            {isSuccess && gameLog && (
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {calculateScore(gameLog).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">보정 점수</div>
              </div>
            )}
          </div>

          {/* 마지막 추론 */}
          {gameRoom.lastGuess && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">AI의 마지막 추론</h3>
              <p className="text-2xl font-bold text-gray-800">{gameRoom.lastGuess}</p>
            </div>
          )}

          {/* 플레이어 목록 */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">참가자</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allPlayers.map((player) => (
                <div key={player.uid} className="flex items-center gap-3 bg-white rounded-lg p-3">
                  {player.photoURL && (
                    <img
                      src={player.photoURL}
                      alt={player.displayName || ''}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900">{player.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI 추론 히스토리 */}
        {aiGuesses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">AI 추론 히스토리</h3>
            <div className="space-y-3">
              {aiGuesses.map((guess, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 border-2 ${
                    guess.guess === revealedWord
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium text-gray-500">턴 {guess.turn}</div>
                      <div className="text-xl font-bold text-gray-900">{guess.guess}</div>
                      {guess.guess === revealedWord && (
                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                          ✓ 정답
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Math.round(guess.confidence * 100)}% 확신
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/lobby')}
            className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
          >
            다시 플레이하기
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
          >
            홈으로
          </button>
        </div>
      </main>
    </div>
  )
}
