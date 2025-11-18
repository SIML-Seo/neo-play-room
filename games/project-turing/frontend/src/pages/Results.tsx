import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGameLog, type GameLog } from '@/services/gameLogs'
import Loader from '@shared/ui-components/Loader'

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
      <div className="flex items-center justify-center min-h-screen bg-terminal-bg">
        <div className="text-center space-y-4">
          <Loader size="lg" />
          <p className="text-cyber-blue font-mono text-sm animate-blink">
            결과 분석 중...
          </p>
        </div>
      </div>
    )
  }

  if (error || !gameLog) {
    return (
      <div className="min-h-screen bg-terminal-bg p-4 md:p-8 noise-texture flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-terminal-surface border-4 border-cyber-red rounded-2xl p-8 text-center shadow-glow-red">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-2xl text-cyber-red font-terminal mb-6 glow-text">{error}</p>
            <button
              onClick={() => navigate('/lobby')}
              className="px-8 py-4 bg-terminal-surface border-4 border-cyber-blue text-cyber-blue font-mono font-bold text-lg
                         hover:bg-cyber-blue hover:text-terminal-bg transition-all duration-300
                         shadow-glow-blue hover:scale-105 rounded-xl"
            >
              대기실로 돌아가기
            </button>
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
    easy: 'EASY',
    normal: 'NORMAL',
    hard: 'HARD',
  }

  const difficultyColor = {
    easy: 'text-phosphor-green',
    normal: 'text-cyber-blue',
    hard: 'text-cyber-red',
  }

  return (
    <div className="min-h-screen bg-terminal-bg p-4 md:p-8 noise-texture">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center mb-8 animate-scaleGlow">
          <h1 className="font-terminal text-5xl sm:text-6xl md:text-7xl text-cyber-pink font-bold tracking-wider mb-4"
              style={{
                textShadow: '0 0 20px #FF0080, 0 0 40px #FF0080, 0 0 60px #FF0080, 4px 4px 0px #000'
              }}>
            MISSION COMPLETE
          </h1>
          <p className="text-cyber-blue font-mono text-sm">
            SESSION ID: {gameLog.roomId}
          </p>
        </div>

        {/* 결과 카드 */}
        <div className="bg-terminal-surface border-4 border-cyber-pink rounded-2xl p-6 md:p-10 shadow-glow-pink animate-scaleGlow">
          {/* 성공/실패 */}
          <div className="text-center mb-10">
            {gameLog.result === 'success' ? (
              <>
                <div className="inline-flex items-center justify-center w-32 h-32 bg-phosphor-green/20 border-4 border-phosphor-green rounded-full mb-6 shadow-glow-green animate-scaleGlow">
                  <svg className="w-20 h-20 text-phosphor-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h2 className="text-5xl font-terminal font-bold text-phosphor-green mb-4 glow-text">
                  MISSION SUCCESS
                </h2>
                <p className="text-xl text-cyber-blue font-mono">AI 침입자를 성공적으로 식별했습니다</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-32 h-32 bg-cyber-red/20 border-4 border-cyber-red rounded-full mb-6 shadow-glow-red animate-scaleGlow">
                  <svg className="w-20 h-20 text-cyber-red" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h2 className="text-5xl font-terminal font-bold text-cyber-red mb-4 glow-text">
                  MISSION FAILED
                </h2>
                <p className="text-xl text-cyber-blue font-mono">AI가 탐지를 피했습니다</p>
              </>
            )}
          </div>

          {/* AI 플레이어 공개 */}
          <div className="bg-terminal-bg border-4 border-cyber-blue rounded-xl p-6 mb-8 text-center shadow-glow-blue">
            <p className="text-lg text-cyber-blue font-mono mb-3">AI 침입자 신원:</p>
            <p className="text-5xl font-terminal font-bold text-cyber-pink glow-text"
               style={{
                 textShadow: '0 0 20px #FF0080, 0 0 40px #FF0080'
               }}>
              {gameLog.aiPlayerId}
            </p>
          </div>

          {/* 통계 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-terminal-bg border-2 border-cyber-gold rounded-xl p-5 text-center hover:scale-105 transition-transform">
              <p className="text-xs text-cyber-gold font-mono mb-2 uppercase">Score</p>
              <p className="text-4xl font-terminal font-bold text-cyber-gold">
                {Math.round(gameLog.score)}
              </p>
            </div>
            <div className="bg-terminal-bg border-2 border-cyber-blue rounded-xl p-5 text-center hover:scale-105 transition-transform">
              <p className="text-xs text-cyber-blue font-mono mb-2 uppercase">Difficulty</p>
              <p className={`text-3xl font-terminal font-bold ${difficultyColor[gameLog.difficulty]}`}>
                {difficultyLabel[gameLog.difficulty]}
              </p>
            </div>
            <div className="bg-terminal-bg border-2 border-cyber-purple rounded-xl p-5 text-center hover:scale-105 transition-transform">
              <p className="text-xs text-cyber-purple font-mono mb-2 uppercase">Turns</p>
              <p className="text-4xl font-terminal font-bold text-white">{gameLog.finalTurnCount}</p>
            </div>
            <div className="bg-terminal-bg border-2 border-phosphor-green rounded-xl p-5 text-center hover:scale-105 transition-transform">
              <p className="text-xs text-phosphor-green font-mono mb-2 uppercase">Time</p>
              <p className="text-4xl font-terminal font-bold text-white">{formatTime(gameLog.finalTime)}</p>
            </div>
          </div>
        </div>

        {/* 턴별 히스토리 */}
        <div className="bg-terminal-surface border-4 border-cyber-blue rounded-2xl p-6 md:p-8 shadow-glow-blue">
          <h3 className="text-3xl font-terminal font-bold text-cyber-pink mb-6 glow-text">
            MISSION LOG
          </h3>
          <div className="space-y-6">
            {gameLog.turnsHistory.map((turn) => (
              <div key={turn.turn} className="border-l-4 border-cyber-blue pl-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center bg-cyber-blue text-terminal-bg px-4 py-2 rounded-lg font-terminal font-bold text-lg shadow-glow-blue">
                    TURN {turn.turn}
                  </span>
                  <p className="text-lg font-mono text-white">{turn.question}</p>
                </div>

                {/* 답변들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {Object.entries(turn.answers).map(([anonymousId, answer]) => {
                    const isAI = anonymousId === gameLog.aiPlayerId
                    const wasVoted = turn.voteResult?.mostVotedPlayer === anonymousId

                    return (
                      <div
                        key={anonymousId}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isAI
                            ? 'bg-cyber-red/20 border-cyber-red shadow-glow-red'
                            : wasVoted
                            ? 'bg-cyber-gold/20 border-cyber-gold shadow-glow-gold'
                            : 'bg-terminal-bg border-cyber-blue/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-terminal font-bold text-sm text-cyber-blue">{anonymousId}</span>
                          {isAI && (
                            <span className="text-xs bg-cyber-red text-terminal-bg px-2 py-1 rounded font-mono font-bold">
                              AI
                            </span>
                          )}
                          {wasVoted && (
                            <span className="text-xs bg-cyber-gold text-terminal-bg px-2 py-1 rounded font-mono font-bold">
                              최다 득표
                            </span>
                          )}
                        </div>
                        <p className="text-white font-mono text-sm leading-relaxed">{answer.text}</p>
                      </div>
                    )
                  })}
                </div>

                {/* 투표 결과 */}
                {turn.voteResult && (
                  <div className="bg-terminal-bg border-2 border-cyber-purple rounded-lg p-4">
                    <p className="text-sm font-mono font-semibold text-cyber-purple mb-1">투표 결과:</p>
                    <p className="text-white font-mono text-sm">
                      <span className="text-cyber-pink font-bold">{turn.voteResult.mostVotedPlayer}</span>님이{' '}
                      <span className="text-cyber-gold font-bold">{turn.voteResult.voteCount}표</span>를 받았습니다
                      {turn.voteResult.isAI ? (
                        <span className="text-phosphor-green font-bold"> (✓ AI 맞음!)</span>
                      ) : (
                        <span className="text-cyber-red font-bold"> (✗ AI 아님)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pb-8">
          <button
            onClick={() => navigate('/lobby')}
            className="px-12 py-5 bg-terminal-surface border-4 border-cyber-pink text-cyber-pink font-terminal font-bold text-xl
                       hover:bg-cyber-pink hover:text-terminal-bg transition-all duration-300
                       shadow-glow-pink hover:shadow-glow-pink hover:scale-105 rounded-xl"
          >
            다시 시작
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-12 py-5 bg-terminal-surface border-4 border-cyber-blue text-cyber-blue font-terminal font-bold text-xl
                       hover:bg-cyber-blue hover:text-terminal-bg transition-all duration-300
                       shadow-glow-blue hover:shadow-glow-blue hover:scale-105 rounded-xl"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  )
}
