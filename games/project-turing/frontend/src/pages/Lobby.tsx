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

  // 로그인 안 되어 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

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
          <p className="text-phosphor-green font-mono text-sm glow-text animate-blink">
            매칭 시스템 로딩 중...
          </p>
        </div>
      </div>
    )
  }

  const progressPercentage = (waitingPlayers.length / 5) * 100

  return (
    <div className="min-h-screen bg-terminal-bg p-4 md:p-8 noise-texture">
      <div className="max-w-5xl mx-auto">
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
                MATCHMAKING_TERMINAL
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-phosphor-green shadow-glow-green"
                />
              )}
              <span className="text-white/90 font-mono text-sm hidden sm:inline">
                {user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-cyber-red/20 border border-cyber-red text-cyber-red font-mono text-xs
                           hover:bg-cyber-red hover:text-terminal-bg transition-all
                           shadow-glow-red"
              >
                LOGOUT
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {/* Status Display */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-cyber-blue font-mono text-sm">[SYSTEM]</span>
                <span className="text-phosphor-green font-terminal text-3xl glow-text">
                  PLAYER QUEUE: {waitingPlayers.length}/5
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-terminal-bg h-6 border-2 border-phosphor-green/50 relative overflow-hidden">
                <div
                  className="h-full bg-phosphor-green/30 transition-all duration-500 relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-phosphor-green/50 to-transparent animate-shimmer" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-phosphor-green font-mono text-xs font-bold glow-text">
                    {progressPercentage.toFixed(0)}% READY
                  </span>
                </div>
              </div>

              <p className="text-white/70 font-mono text-xs pl-8">
                {waitingPlayers.length < 5
                  ? `▸ ${5 - waitingPlayers.length}명의 플레이어를 더 기다리는 중...`
                  : '▸ 게임 세션 초기화 중...'}
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-cyber-red/20 border-2 border-cyber-red animate-glitch">
                <p className="text-cyber-red font-mono text-sm glow-text">
                  <span className="font-bold">[ERROR]</span> {error}
                </p>
              </div>
            )}

            {/* Join/Leave Controls */}
            <div className="flex gap-4">
              {!isInWaitingRoom ? (
                <button
                  onClick={joinWaitingRoom}
                  disabled={isJoining}
                  className="flex-1 px-6 py-3 bg-terminal-surface border-2 border-phosphor-green text-phosphor-green font-mono font-bold
                             hover:bg-phosphor-green hover:text-terminal-bg transition-all duration-300
                             shadow-glow-green hover:shadow-glow-green
                             disabled:opacity-50 disabled:cursor-not-allowed
                             glitch-hover"
                >
                  {isJoining ? '> JOINING...' : '> JOIN QUEUE'}
                </button>
              ) : (
                <button
                  onClick={leaveWaitingRoom}
                  className="flex-1 px-6 py-3 bg-terminal-surface border-2 border-cyber-red text-cyber-red font-mono font-bold
                             hover:bg-cyber-red hover:text-terminal-bg transition-all duration-300
                             shadow-glow-red hover:shadow-glow-red
                             glitch-hover"
                >
                  {'> LEAVE QUEUE'}
                </button>
              )}

              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-terminal-surface border-2 border-cyber-blue text-cyber-blue font-mono font-bold
                           hover:bg-cyber-blue hover:text-terminal-bg transition-all duration-300
                           shadow-glow-blue
                           glitch-hover"
              >
                HOME
              </button>
            </div>

            {/* Player Slots */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-cyber-blue font-mono text-sm">[ROSTER]</span>
                <div className="flex-1 h-px bg-cyber-blue/30" />
              </div>

              {/* Active Players */}
              {waitingPlayers.length === 0 ? (
                <div className="text-center py-8 text-white/40 font-mono text-sm">
                  ▸ 활성 연결 없음
                </div>
              ) : (
                waitingPlayers.map((player, index) => (
                  <div
                    key={player.uid}
                    className="group p-4 bg-terminal-bg/50 border-2 border-phosphor-green/50
                               hover:border-phosphor-green hover:bg-phosphor-green/5
                               transition-all duration-300 animate-slideInTerminal"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Slot Number */}
                      <div className="w-12 h-12 flex items-center justify-center bg-phosphor-green/20 border-2 border-phosphor-green text-phosphor-green font-terminal text-xl glow-text">
                        {index + 1}
                      </div>

                      {/* Profile Photo */}
                      {player.photoURL && (
                        <img
                          src={player.photoURL}
                          alt={player.name}
                          className="w-12 h-12 rounded-full border-2 border-phosphor-green shadow-glow-green"
                        />
                      )}

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-phosphor-green font-mono font-bold truncate glow-text">
                          {player.name}
                        </p>
                        <p className="text-white/60 font-mono text-xs truncate">
                          {player.email}
                        </p>
                      </div>

                      {/* Status Indicators */}
                      <div className="flex items-center gap-2">
                        {player.uid === user.uid && (
                          <span className="px-3 py-1 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue text-xs font-mono font-bold">
                            YOU
                          </span>
                        )}
                        <span className="text-phosphor-green font-mono text-xs animate-blink">
                          ●
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Empty Slots */}
              {Array.from({ length: 5 - waitingPlayers.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="p-4 bg-terminal-bg/30 border-2 border-dashed border-white/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-white/5 border-2 border-white/20 text-white/40 font-terminal text-xl">
                      {waitingPlayers.length + index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white/40 font-mono text-sm">
                        빈 슬롯
                      </p>
                      <p className="text-white/20 font-mono text-xs">
                        연결 대기 중...
                      </p>
                    </div>
                    <span className="text-white/20 font-mono text-xs animate-blink">
                      ▯
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Game Instructions */}
            <div className="p-4 bg-cyber-blue/10 border-2 border-cyber-blue/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-cyber-blue font-mono text-sm font-bold glow-text">
                  [!] 프로토콜 브리핑
                </span>
              </div>
              <ul className="space-y-2 text-xs font-mono text-white/80 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyber-blue">▸</span>
                  <span>세션에 5명의 인간 + AI 1개가 매칭됩니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-blue">▸</span>
                  <span>각 턴마다 질문이 제시되며, 모든 참가자가 답변해야 합니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-blue">▸</span>
                  <span>답변은 익명으로 표시됩니다 - 투표로 AI를 식별하세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-yellow">▸</span>
                  <span>성공 조건: 5턴 이내에 AI 찾기</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="terminal-border bg-terminal-surface/90 backdrop-blur-sm px-6 py-2 flex justify-between items-center text-xs font-mono">
          <span className="text-phosphor-green">
            대기열: <span className="animate-blink">활성</span>
          </span>
          <span className="text-white/50">
            {new Date().toISOString().replace('T', ' ').substring(0, 19)}
          </span>
        </div>
      </div>
    </div>
  )
}
