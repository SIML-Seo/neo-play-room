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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-gold-frame border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gallery-cream text-xl font-crimson">전시 결과 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !gameRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full gallery-frame bg-wood-dark shadow-gallery p-8 text-center animate-scaleIn">
          <div className="w-20 h-20 mx-auto mb-6 bg-velvet-red/20 rounded-full flex items-center justify-center border-4 border-velvet-red">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-playfair font-bold text-gold-frame mb-4">오류 발생</h2>
          <p className="gallery-text text-gallery-cream mb-6">
            {error || '전시 데이터를 찾을 수 없습니다.'}
          </p>
          <button
            onClick={() => navigate('/lobby')}
            className="w-full px-6 py-3 bg-gold-frame text-gallery-floor font-playfair font-bold text-lg
                       rounded-lg hover:bg-gold-light transition-all shadow-frame-gold hover:scale-105"
          >
            대기실로 돌아가기
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-wood-dark border-b-4 border-gold-frame shadow-gallery">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-playfair font-bold text-gold-frame gold-glow">
                Project Da Vinci
              </h1>
              <span className="museum-label">전시 결과</span>
            </div>
            <div className="flex items-center gap-3">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-8 h-8 rounded-full border-2 border-gold-frame"
                />
              )}
              <div className="text-sm">
                <div className="font-crimson font-semibold text-gallery-cream">
                  {user?.displayName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 결과 카드 */}
        <div className="gallery-frame bg-wood-dark shadow-gallery p-8 mb-8 animate-scaleIn">
          <div className="text-center mb-8">
            {isSuccess ? (
              <>
                <div className="text-8xl mb-4 animate-bounce">🎨</div>
                <h2 className="text-4xl font-playfair font-bold text-gold-frame mb-2 gold-glow">
                  협동 창작 성공!
                </h2>
                <p className="text-lg gallery-text text-gold-light">
                  AI 큐레이터가 작품의 주제를 정확히 감상했습니다!
                </p>
              </>
            ) : isTurnLimitExceeded ? (
              <>
                <div className="text-8xl mb-4">⏱️</div>
                <h2 className="text-4xl font-playfair font-bold text-velvet-burgundy mb-2">
                  전시 시간 종료
                </h2>
                <p className="text-lg gallery-text text-gallery-cream/80">
                  최대 {gameRoom.maxTurns}턴을 초과했습니다.
                </p>
              </>
            ) : (
              <>
                <div className="text-8xl mb-4">🖼️</div>
                <h2 className="text-4xl font-playfair font-bold text-gold-frame mb-2">전시 종료</h2>
                <p className="text-lg gallery-text text-gallery-cream/80">
                  다음 전시에 다시 도전하세요!
                </p>
              </>
            )}
          </div>

          {/* 게임 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="gallery-placard border-2 border-gold-frame bg-gold-frame/10 text-center">
              <div className="text-3xl font-playfair font-bold text-gold-light mb-2">
                {revealedWord}
              </div>
              <div className="text-sm museum-label">작품 주제</div>
            </div>
            <div className="gallery-placard border-2 border-gold-dark bg-wood-medium/30 text-center">
              <div className="text-3xl font-playfair font-bold text-gold-frame mb-2">
                {gameRoom.turnCount} / {gameRoom.maxTurns}
              </div>
              <div className="text-sm museum-label">소요 턴</div>
            </div>
            <div className="gallery-placard border-2 border-gold-dark bg-wood-medium/30 text-center">
              <div className="text-3xl font-playfair font-bold text-gold-frame mb-2">
                {gameRoom.endTime && gameRoom.startTime
                  ? formatTime(gameRoom.endTime - gameRoom.startTime)
                  : '0:00'}
              </div>
              <div className="text-sm museum-label">소요 시간</div>
            </div>
            {isSuccess && gameLog && (
              <div className="gallery-placard border-2 border-gold-frame bg-gold-frame/10 text-center">
                <div className="text-3xl font-playfair font-bold text-gold-light mb-2">
                  {calculateScore(gameLog).toFixed(0)}
                </div>
                <div className="text-sm museum-label">보정 점수</div>
              </div>
            )}
          </div>

          {/* 마지막 추론 */}
          {gameRoom.lastGuess && (
            <div className="gallery-placard border-2 border-gold-dark mb-6">
              <h3 className="font-playfair font-bold text-gold-light mb-2">
                AI 큐레이터의 최종 감상
              </h3>
              <p className="text-2xl font-crimson font-semibold text-gallery-cream">
                {gameRoom.lastGuess}
              </p>
            </div>
          )}

          {/* 플레이어 목록 */}
          <div className="gallery-placard border-2 border-gold-dark">
            <h3 className="font-playfair font-bold text-gold-light mb-4">참여 작가</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allPlayers.map((player) => (
                <div
                  key={player.uid}
                  className="flex items-center gap-3 bg-wood-medium/30 rounded-lg p-3 border border-gold-dark/30"
                >
                  {/* {player.photoURL ? (
                    <img
                      src={player.photoURL}
                      alt={player.displayName || ''}
                      className="w-10 h-10 rounded-full border-2 border-gold-frame"
                    />
                  ) : ( */}
                  <div className="w-10 h-10 rounded-full bg-gallery-wall flex items-center justify-center border-2 border-gold-dark">
                    <span className="text-gold-frame font-playfair font-bold">
                      {player.artistName?.[0] || '?'}
                    </span>
                  </div>
                  {/* )} */}
                  <span className="text-sm font-crimson font-semibold text-gallery-cream">
                    {player.artistName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI 추론 히스토리 */}
        {aiGuesses.length > 0 && (
          <div
            className="gallery-frame bg-wood-dark shadow-gallery p-8 mb-8 animate-scaleIn"
            style={{ animationDelay: '0.1s' }}
          >
            <h3 className="text-2xl font-playfair font-bold text-gold-frame mb-6 gold-glow">
              AI 감상 기록
            </h3>
            <div className="space-y-3">
              {aiGuesses.map((guess, idx) => {
                const isCorrect = guess.guess === revealedWord
                const confidencePercent = Math.round(guess.confidence * 100)
                const confidenceColor =
                  confidencePercent >= 80
                    ? 'text-gold-light'
                    : confidencePercent >= 50
                      ? 'text-gold-frame'
                      : 'text-velvet-burgundy'

                return (
                  <div
                    key={idx}
                    className={`rounded-lg p-4 border-2 transition-all ${
                      isCorrect
                        ? 'gallery-placard border-gold-frame bg-gold-frame/10 shadow-frame-gold'
                        : 'gallery-placard border-gold-dark/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-playfair font-bold museum-label px-3 py-1 bg-gold-dark/20 rounded">
                          턴 {guess.turn}
                        </div>
                        <div className="text-xl font-crimson font-bold text-gallery-cream">
                          {guess.guess}
                        </div>
                        {isCorrect && (
                          <span className="px-3 py-1 bg-gold-frame text-gallery-floor text-xs font-crimson font-bold rounded-full">
                            ✓ 정답
                          </span>
                        )}
                      </div>
                      <div className={`text-sm font-crimson font-semibold ${confidenceColor}`}>
                        {confidencePercent}% 확신
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-4 animate-scaleIn" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => navigate('/lobby')}
            className="flex-1 px-6 py-4 bg-gold-frame text-gallery-floor rounded-xl hover:bg-gold-light transition-all font-playfair font-bold text-lg shadow-frame-gold hover:scale-105"
          >
            다음 전시 참여하기
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-4 bg-wood-medium text-gallery-cream rounded-xl hover:bg-wood-light transition-all font-crimson font-semibold text-lg border-2 border-gold-dark/50 hover:border-gold-frame"
          >
            갤러리 입구로
          </button>
        </div>
      </main>
    </div>
  )
}
