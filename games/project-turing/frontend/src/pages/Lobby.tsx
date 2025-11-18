import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import Loader from '@shared/ui-components/Loader'

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

  // 환경 변수에서 게임 설정 가져오기
  const MAX_PLAYERS = Number(import.meta.env.VITE_MAX_PLAYERS) || 5
  const MAX_TURNS = Number(import.meta.env.VITE_MAX_TURNS) || 5

  // 로그인 안 되어 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  // 자동으로 대기열에 참가
  useEffect(() => {
    if (user && !isInWaitingRoom && !isJoining) {
      console.log('[Lobby] 자동으로 대기열에 참가')
      joinWaitingRoom()
    }
  }, [user, isInWaitingRoom, isJoining, joinWaitingRoom])

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
      <div className="flex items-center justify-center min-h-screen bg-terminal-bg">
        <div className="text-center space-y-4">
          <Loader size="lg" />
          <p className="text-cyber-blue font-mono text-sm glow-text animate-blink">
            매칭 시스템 로딩 중...
          </p>
        </div>
      </div>
    )
  }

  const progressPercentage = (waitingPlayers.length / MAX_PLAYERS) * 100

  return (
    <div className="min-h-screen bg-terminal-bg flex items-center justify-center p-4 noise-texture">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header with title and logout */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-left">
            <h1 className="font-terminal text-5xl sm:text-6xl md:text-7xl text-cyber-pink font-bold tracking-wider mb-2"
                style={{
                  textShadow: '0 0 20px #FF0080, 0 0 40px #FF0080, 0 0 60px #FF0080, 4px 4px 0px #000'
                }}>
              AI HUNTER
            </h1>
            <p className="text-cyber-blue font-mono text-sm sm:text-base">
              대기실 - 참여자를 기다리는 중...
            </p>
          </div>

          {/* User info & logout */}
          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-cyber-blue shadow-glow-blue"
              />
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-cyber-red/20 border-2 border-cyber-red text-cyber-red font-mono text-sm
                         hover:bg-cyber-red hover:text-terminal-bg transition-all
                         shadow-glow-red rounded"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Player counter box */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-terminal-surface/50 border-4 border-cyber-blue rounded-2xl">
            <svg className="w-8 h-8 text-cyber-blue" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            <span className="font-terminal text-4xl text-cyber-pink font-bold">
              {waitingPlayers.length}
            </span>
            <span className="font-terminal text-3xl text-white/50">/</span>
            <span className="font-terminal text-4xl text-white/50">{MAX_PLAYERS}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-12">
          <div className="w-full h-8 bg-terminal-surface border-4 border-cyber-blue/50 rounded-full overflow-hidden relative">
            <div
              className="h-full transition-all duration-500 relative"
              style={{
                width: `${progressPercentage}%`,
                background: 'linear-gradient(90deg, #FF0080 0%, #A855F7 50%, #00D9FF 100%)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Player slots grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: MAX_PLAYERS }).map((_, index) => {
            const player = waitingPlayers[index]
            const isActive = !!player

            if (isActive) {
              return (
                <div
                  key={player.uid}
                  className="aspect-square bg-terminal-surface border-4 border-cyber-blue rounded-2xl p-4
                             flex flex-col items-center justify-center gap-3
                             hover:border-cyber-pink hover:shadow-glow-pink transition-all duration-300
                             animate-scaleGlow"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Avatar with gradient */}
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                       style={{
                         background: 'linear-gradient(135deg, #FF0080 0%, #A855F7 50%, #00D9FF 100%)'
                       }}>
                    {player.photoURL ? (
                      <img
                        src={player.photoURL}
                        alt={player.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Player name */}
                  <p className="text-cyber-blue font-mono text-sm font-bold truncate w-full text-center">
                    {player.name}
                  </p>

                  {/* You badge */}
                  {player.uid === user.uid && (
                    <span className="px-2 py-1 bg-cyber-gold/20 border border-cyber-gold text-cyber-gold text-xs font-mono font-bold rounded">
                      YOU
                    </span>
                  )}
                </div>
              )
            }

            // Empty slot
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square bg-terminal-surface/30 border-4 border-dashed border-white/20 rounded-2xl
                           flex flex-col items-center justify-center"
              >
                <span className="text-6xl text-white/20 font-terminal">?</span>
              </div>
            )
          })}
        </div>

        {/* Status message */}
        <div className="text-center mb-8">
          <p className="text-cyber-blue font-mono text-lg flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            {waitingPlayers.length < MAX_PLAYERS
              ? `참여자를 기다리는 중... (${MAX_PLAYERS - waitingPlayers.length}명 더 필요)`
              : '게임 시작 준비 완료!'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-cyber-red/20 border-2 border-cyber-red rounded-xl text-center">
            <p className="text-cyber-red font-mono text-sm font-bold">
              ⚠ {error}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {!isInWaitingRoom ? (
            <button
              onClick={joinWaitingRoom}
              disabled={isJoining}
              className="px-8 py-4 bg-terminal-surface border-4 border-cyber-pink text-cyber-pink font-mono font-bold text-lg
                         hover:bg-cyber-pink hover:text-terminal-bg transition-all duration-300
                         shadow-glow-pink hover:shadow-glow-pink hover:scale-105
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                         rounded-xl min-w-[200px]"
            >
              {isJoining ? '입장 중...' : '대기실 입장'}
            </button>
          ) : (
            <button
              onClick={leaveWaitingRoom}
              className="px-8 py-4 bg-terminal-surface border-4 border-cyber-red text-cyber-red font-mono font-bold text-lg
                         hover:bg-cyber-red hover:text-terminal-bg transition-all duration-300
                         shadow-glow-red hover:shadow-glow-red hover:scale-105
                         rounded-xl min-w-[200px]"
            >
              대기실 나가기
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-terminal-surface border-4 border-cyber-blue text-cyber-blue font-mono font-bold text-lg
                       hover:bg-cyber-blue hover:text-terminal-bg transition-all duration-300
                       shadow-glow-blue hover:scale-105
                       rounded-xl min-w-[200px]"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  )
}
