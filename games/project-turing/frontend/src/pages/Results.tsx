import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGameLog, type GameLog } from '@/services/gameLogs'
import Button from '@/components/common/Button'
import Loader from '@/components/common/Loader'

export default function Results() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const [gameLog, setGameLog] = useState<GameLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) {
      setError('게임 ID가 없습니다.')
      setLoading(false)
      return
    }

    const fetchGameLog = async () => {
      try {
        const log = await getGameLog(roomId)
        if (!log) {
          setError('게임 로그를 찾을 수 없습니다.')
        } else {
          setGameLog(log)
        }
      } catch (err) {
        console.error('게임 로그 조회 실패:', err)
        setError('게임 결과를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchGameLog()
  }, [roomId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" text="결과 불러오는 중..." />
      </div>
    )
  }

  if (error || !gameLog) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-xl text-danger mb-4">{error}</p>
            <Button onClick={() => navigate('/lobby')}>대기실로 돌아가기</Button>
          </div>
        </div>
      </div>
    )
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const difficultyLabel = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
  }

  const difficultyColor = {
    easy: 'text-green-600',
    normal: 'text-blue-600',
    hard: 'text-red-600',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-2">게임 종료</h1>
          <p className="text-gray-600">Room ID: {gameLog.roomId}</p>
        </div>

        {/* 결과 카드 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 성공/실패 */}
          <div className="text-center mb-8">
            {gameLog.result === 'success' ? (
              <>
                <div className="text-8xl mb-4">🎉</div>
                <h2 className="text-4xl font-bold text-success mb-2">성공!</h2>
                <p className="text-xl text-gray-600">AI를 찾아냈습니다!</p>
              </>
            ) : (
              <>
                <div className="text-8xl mb-4">😢</div>
                <h2 className="text-4xl font-bold text-danger mb-2">실패</h2>
                <p className="text-xl text-gray-600">AI를 찾지 못했습니다</p>
              </>
            )}
          </div>

          {/* AI 플레이어 공개 */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-center">
            <p className="text-lg mb-2">AI 플레이어는...</p>
            <p className="text-4xl font-bold text-primary">{gameLog.aiPlayerId}</p>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">점수</p>
              <p className="text-3xl font-bold text-primary">{Math.round(gameLog.score)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">난이도</p>
              <p className={`text-2xl font-bold ${difficultyColor[gameLog.difficulty]}`}>
                {difficultyLabel[gameLog.difficulty]}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">턴 수</p>
              <p className="text-3xl font-bold text-gray-900">{gameLog.finalTurnCount}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">플레이 시간</p>
              <p className="text-3xl font-bold text-gray-900">{formatTime(gameLog.finalTime)}</p>
            </div>
          </div>
        </div>

        {/* 턴별 히스토리 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">게임 히스토리</h3>
          <div className="space-y-6">
            {gameLog.turnsHistory.map((turn) => (
              <div key={turn.turn} className="border-l-4 border-primary pl-6 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-primary text-white px-4 py-2 rounded-full font-bold">
                    Turn {turn.turn}
                  </span>
                  <p className="text-lg font-semibold text-gray-900">{turn.question}</p>
                </div>

                {/* 답변들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {Object.entries(turn.answers).map(([anonymousId, answer]) => {
                    const isAI = anonymousId === gameLog.aiPlayerId
                    const wasVoted = turn.voteResult?.mostVotedPlayer === anonymousId

                    return (
                      <div
                        key={anonymousId}
                        className={`p-4 rounded-lg border-2 ${
                          isAI
                            ? 'bg-red-50 border-red-300'
                            : wasVoted
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-sm">{anonymousId}</span>
                          {isAI && <span className="text-xs bg-danger text-white px-2 py-1 rounded-full">AI</span>}
                          {wasVoted && <span className="text-xs bg-warning text-white px-2 py-1 rounded-full">최다 득표</span>}
                        </div>
                        <p className="text-gray-800">{answer.text}</p>
                      </div>
                    )
                  })}
                </div>

                {/* 투표 결과 */}
                {turn.voteResult && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-1">투표 결과:</p>
                    <p className="text-gray-700">
                      <span className="font-bold">{turn.voteResult.mostVotedPlayer}</span>님이{' '}
                      <span className="font-bold">{turn.voteResult.voteCount}표</span>를 받았습니다
                      {turn.voteResult.isAI ? ' (✅ AI 맞음!)' : ' (❌ AI 아님)'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate('/lobby')} size="lg" className="px-8">
            다시 하기
          </Button>
          <Button onClick={() => navigate('/')} variant="secondary" size="lg" className="px-8">
            홈으로
          </Button>
        </div>
      </div>
    </div>
  )
}
