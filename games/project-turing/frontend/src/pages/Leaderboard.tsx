import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllGameLogs, type GameLog } from '@/services/gameLogs'
import Loader from '@shared/ui-components/Loader'

export default function Leaderboard() {
  const navigate = useNavigate()
  const [gameLogs, setGameLogs] = useState<GameLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const logs = await getAllGameLogs(20) // 상위 20개
        setGameLogs(logs)
      } catch (err) {
        console.error('리더보드 조회 실패:', err)
        setError('리더보드를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-terminal-bg">
        <div className="text-center space-y-4">
          <Loader size="lg" />
          <p className="text-phosphor-green font-mono text-sm glow-text animate-blink">
            LOADING HIGH SCORES DATABASE...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-terminal-bg p-8 flex items-center justify-center">
        <div className="terminal-border bg-terminal-surface/90 p-8 text-center max-w-2xl">
          <p className="text-cyber-red font-mono text-xl glow-text mb-6">
            [ERROR] {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-terminal-surface border-2 border-phosphor-green text-phosphor-green font-mono font-bold
                       hover:bg-phosphor-green hover:text-terminal-bg transition-all
                       shadow-glow-green"
          >
            RETURN TO HOME
          </button>
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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const difficultyLabel = {
    easy: 'EASY',
    normal: 'NORM',
    hard: 'HARD',
  }

  const difficultyColor = {
    easy: 'text-phosphor-green',
    normal: 'text-cyber-blue',
    hard: 'text-cyber-red',
  }

  const getRankDisplay = (index: number) => {
    if (index === 0) return { symbol: '▲', color: 'text-cyber-yellow' }
    if (index === 1) return { symbol: '▲', color: 'text-white/90' }
    if (index === 2) return { symbol: '▲', color: 'text-cyber-red' }
    return { symbol: '•', color: 'text-phosphor-green/50' }
  }

  const successRate = gameLogs.length > 0
    ? Math.round((gameLogs.filter((log) => log.result === 'success').length / gameLogs.length) * 100)
    : 0

  const topScore = gameLogs.length > 0 ? Math.round(gameLogs[0]?.score || 0) : 0

  return (
    <div className="min-h-screen bg-terminal-bg p-4 md:p-8 noise-texture">
      <div className="max-w-7xl mx-auto">
        {/* Terminal Window */}
        <div className="terminal-border bg-terminal-surface/90 backdrop-blur-sm mb-2">
          {/* Terminal Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-phosphor-green/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-cyber-red shadow-glow-red" />
                <div className="w-3 h-3 rounded-full bg-cyber-yellow" />
                <div className="w-3 h-3 rounded-full bg-phosphor-green shadow-glow-green" />
              </div>
              <span className="text-phosphor-green font-mono text-sm glow-text">
                SCOREBOARD_TERMINAL
              </span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-mono text-xs
                         hover:bg-cyber-blue hover:text-terminal-bg transition-all
                         shadow-glow-blue"
            >
              HOME
            </button>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {/* ASCII Art Header */}
            <div className="ascii-art text-center text-xl sm:text-2xl md:text-3xl animate-scaleGlow">
{`╔═══════════════════════════════════════╗
║     HIGH SCORES - HALL OF FAME       ║
╚═══════════════════════════════════════╝`}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Games */}
              <div className="p-4 bg-terminal-bg border-2 border-phosphor-green/50">
                <p className="text-phosphor-green/70 font-mono text-xs mb-2">TOTAL GAMES</p>
                <p className="text-phosphor-green font-terminal text-4xl glow-text-strong">
                  {gameLogs.length.toString().padStart(3, '0')}
                </p>
              </div>

              {/* Success Rate */}
              <div className="p-4 bg-terminal-bg border-2 border-cyber-blue/50">
                <p className="text-cyber-blue/70 font-mono text-xs mb-2">SUCCESS RATE</p>
                <p className="text-cyber-blue font-terminal text-4xl glow-text">
                  {successRate.toString().padStart(2, '0')}%
                </p>
              </div>

              {/* Top Score */}
              <div className="p-4 bg-terminal-bg border-2 border-cyber-yellow/50">
                <p className="text-cyber-yellow/70 font-mono text-xs mb-2">TOP SCORE</p>
                <p className="text-cyber-yellow font-terminal text-4xl glow-text">
                  {topScore.toString().padStart(4, '0')}
                </p>
              </div>
            </div>

            {/* Leaderboard Table */}
            {gameLogs.length === 0 ? (
              <div className="p-12 text-center border-2 border-white/20 bg-terminal-bg/50">
                <p className="text-white/60 font-mono text-xl mb-6">
                  ▸ NO RECORDED GAMES
                </p>
                <button
                  onClick={() => navigate('/lobby')}
                  className="px-6 py-3 bg-terminal-surface border-2 border-phosphor-green text-phosphor-green font-mono font-bold
                             hover:bg-phosphor-green hover:text-terminal-bg transition-all
                             shadow-glow-green"
                >
                  START FIRST GAME
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-phosphor-green/10 border-2 border-phosphor-green/50 font-mono text-xs font-bold text-phosphor-green mb-2">
                  <div className="col-span-1">RNK</div>
                  <div className="col-span-2">SCORE</div>
                  <div className="col-span-2">RESULT</div>
                  <div className="col-span-1">DIFF</div>
                  <div className="col-span-1">TURN</div>
                  <div className="col-span-2">TIME</div>
                  <div className="col-span-3">COMPLETED</div>
                </div>

                {/* Table Body */}
                <div className="space-y-1">
                  {gameLogs.map((log, index) => {
                    const rank = getRankDisplay(index)
                    return (
                      <div
                        key={log.roomId}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 bg-terminal-bg border-2
                                   ${index < 3 ? 'border-phosphor-green/50 bg-phosphor-green/5' : 'border-white/20'}
                                   hover:border-phosphor-green hover:bg-phosphor-green/10
                                   transition-all cursor-pointer animate-slideInTerminal`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => navigate(`/results/${log.roomId}`)}
                      >
                        {/* Rank */}
                        <div className={`col-span-1 font-terminal text-xl ${rank.color} flex items-center`}>
                          {rank.symbol} {index + 1}
                        </div>

                        {/* Score */}
                        <div className="col-span-2 font-terminal text-2xl text-phosphor-green glow-text flex items-center">
                          {Math.round(log.score).toString().padStart(4, '0')}
                        </div>

                        {/* Result */}
                        <div className="col-span-2 flex items-center">
                          {log.result === 'success' ? (
                            <span className="px-2 py-1 bg-phosphor-green/20 border border-phosphor-green text-phosphor-green font-mono text-xs font-bold">
                              WIN
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-cyber-red/20 border border-cyber-red text-cyber-red font-mono text-xs font-bold">
                              FAIL
                            </span>
                          )}
                        </div>

                        {/* Difficulty */}
                        <div className={`col-span-1 font-mono text-xs font-bold flex items-center ${difficultyColor[log.difficulty]}`}>
                          {difficultyLabel[log.difficulty]}
                        </div>

                        {/* Turns */}
                        <div className="col-span-1 font-mono text-sm text-white/90 flex items-center">
                          {log.finalTurnCount}/5
                        </div>

                        {/* Time */}
                        <div className="col-span-2 font-mono text-sm text-cyber-blue flex items-center">
                          {formatTime(log.finalTime)}
                        </div>

                        {/* Date */}
                        <div className="col-span-3 font-mono text-xs text-white/60 flex items-center">
                          {formatDate(log.completedAt)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-white/10">
              <button
                onClick={() => navigate('/lobby')}
                className="flex-1 px-6 py-3 bg-terminal-surface border-2 border-phosphor-green text-phosphor-green font-mono font-bold
                           hover:bg-phosphor-green hover:text-terminal-bg transition-all
                           shadow-glow-green glitch-hover"
              >
                {'> START NEW GAME'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-terminal-surface border-2 border-cyber-blue text-cyber-blue font-mono font-bold
                           hover:bg-cyber-blue hover:text-terminal-bg transition-all
                           shadow-glow-blue glitch-hover"
              >
                {'> RETURN HOME'}
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="terminal-border bg-terminal-surface/90 backdrop-blur-sm px-6 py-2 flex justify-between items-center text-xs font-mono">
          <span className="text-phosphor-green">
            RECORDS: <span className="animate-blink">{gameLogs.length}</span>
          </span>
          <span className="text-white/50">
            {new Date().toISOString().replace('T', ' ').substring(0, 19)}
          </span>
        </div>
      </div>
    </div>
  )
}
