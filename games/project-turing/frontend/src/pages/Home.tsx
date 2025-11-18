import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Button from '@shared/ui-components/Button'
import Loader from '@shared/ui-components/Loader'
import { useEffect, useState } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const { user, loading, error, signInWithGoogle, isAuthenticated } = useAuth()
  const [bootComplete, setBootComplete] = useState(false)

  // 이미 로그인되어 있으면 Lobby로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/lobby')
    }
  }, [isAuthenticated, user, navigate])

  // Boot sequence animation
  useEffect(() => {
    const timer = setTimeout(() => setBootComplete(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async () => {
    try {
      await signInWithGoogle()
      // 로그인 성공 후 useEffect에서 자동으로 리다이렉트
    } catch (err) {
      // 에러는 useAuth에서 처리
      console.error('Login failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-terminal-bg">
        <div className="text-center space-y-4">
          <Loader size="lg" />
          <p className="text-phosphor-green font-mono text-sm glow-text animate-blink">
            시스템 초기화 중...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-terminal-bg flex items-center justify-center p-4 overflow-hidden noise-texture">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(#00FF41 1px, transparent 1px),
            linear-gradient(90deg, #00FF41 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Main terminal window */}
      <div className="relative z-10 max-w-4xl w-full">
        {/* Terminal header */}
        <div className="terminal-border bg-terminal-surface/90 backdrop-blur-sm p-6 mb-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-cyber-red shadow-glow-red" />
            <div className="w-3 h-3 rounded-full bg-cyber-yellow" />
            <div className="w-3 h-3 rounded-full bg-phosphor-green shadow-glow-green" />
            <span className="ml-4 text-phosphor-green font-mono text-sm">
              TURING_TEST_TERMINAL v1.950
            </span>
          </div>

          {/* ASCII Art Title */}
          <div className="ascii-art text-center mb-6 text-2xl sm:text-3xl md:text-4xl animate-scaleGlow">
{`╔═══════════════════════════════════════╗
║    PROJECT TURING - AI DETECTOR      ║
╚═══════════════════════════════════════╝`}
          </div>

          {/* Boot sequence */}
          <div className="space-y-2 mb-6 font-mono text-sm">
            <p className="text-phosphor-green animate-slideInTerminal" style={{ animationDelay: '0.1s' }}>
              <span className="text-cyber-blue">[OK]</span> 신경망 분석기 초기화 중...
            </p>
            <p className="text-phosphor-green animate-slideInTerminal" style={{ animationDelay: '0.2s' }}>
              <span className="text-cyber-blue">[OK]</span> 튜링 테스트 프로토콜 로딩 중...
            </p>
            <p className="text-phosphor-green animate-slideInTerminal" style={{ animationDelay: '0.3s' }}>
              <span className="text-cyber-blue">[OK]</span> 의식 감지 매트릭스 연결 중...
            </p>
            <p className="text-cyber-yellow animate-slideInTerminal" style={{ animationDelay: '0.4s' }}>
              <span className="text-cyber-blue">[!]</span> 경고: 시스템 내 AI 침투 감지됨
            </p>
            <p className="text-phosphor-green animate-slideInTerminal" style={{ animationDelay: '0.5s' }}>
              <span className="text-cyber-blue">[OK]</span> 시스템 준비 완료. 인증이 필요합니다.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-phosphor-green/30 my-6" />

          {/* Mission Brief */}
          {bootComplete && (
            <div className="space-y-4 animate-scaleGlow">
              <div className="terminal-prompt text-phosphor-green font-mono">
                <span className="glow-text font-terminal text-xl">작전 브리핑</span>
              </div>
              <p className="text-white/90 font-mono text-sm leading-relaxed pl-6">
                인공지능이 5명의 인간 팀에 침투했습니다.
                당신의 임무: 인공지능이 인간의 행동을 너무 많이 학습하기 전에
                AI 침입자를 식별하십시오. <span className="text-cyber-red glow-text">5턴</span> 안에
                기계를 찾아내야 합니다. 실패하면 AI가 승리합니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-phosphor-green">▸</span>
                  <span className="text-white/80">플레이어: 5명의 인간 + AI 1개</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyber-blue">▸</span>
                  <span className="text-white/80">턴: 최대 5라운드</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyber-yellow">▸</span>
                  <span className="text-white/80">방법: 질문 및 답변 분석</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyber-red">▸</span>
                  <span className="text-white/80">목표: 투표를 통해 AI 식별</span>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && bootComplete && (
            <div className="mt-6 p-4 bg-cyber-red/20 border-2 border-cyber-red rounded animate-glitch">
              <p className="text-cyber-red font-mono text-sm glow-text">
                <span className="font-bold">[ERROR]</span> {error}
              </p>
            </div>
          )}

          {/* Auth section */}
          {bootComplete && (
            <div className="mt-8 space-y-4">
              <div className="terminal-prompt text-phosphor-green font-mono">
                <span className="glow-text">인증</span>
                <span className="terminal-cursor" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="group relative px-6 py-4 bg-terminal-surface border-2 border-phosphor-green text-phosphor-green font-mono font-bold
                             hover:bg-phosphor-green hover:text-terminal-bg transition-all duration-300
                             shadow-glow-green hover:shadow-glow-green
                             disabled:opacity-50 disabled:cursor-not-allowed
                             glitch-hover"
                >
                  <span className="relative z-10">
                    {loading ? '인증 중...' : '[ 구글 로그인 ]'}
                  </span>
                </button>

                <button
                  onClick={() => navigate('/leaderboard')}
                  className="group relative px-6 py-4 bg-terminal-surface border-2 border-cyber-blue text-cyber-blue font-mono font-bold
                             hover:bg-cyber-blue hover:text-terminal-bg transition-all duration-300
                             shadow-glow-blue hover:shadow-glow-blue
                             glitch-hover"
                >
                  <span className="relative z-10">[ 순위표 보기 ]</span>
                </button>
              </div>

              {/* Footer notice */}
              <p className="text-center text-white/50 text-xs font-mono pt-4 border-t border-white/10">
                ⚠ 인가된 직원만 접근 가능 - 네오랩컨버전스
              </p>
            </div>
          )}
        </div>

        {/* Terminal bottom border with status */}
        <div className="terminal-border bg-terminal-surface/90 backdrop-blur-sm px-6 py-2 flex justify-between items-center text-xs font-mono">
          <span className="text-phosphor-green">
            상태: <span className="animate-blink">온라인</span>
          </span>
          <span className="text-cyber-blue">
            SYSTEM: TURING_OS_v1.950
          </span>
          <span className="text-white/50">
            {new Date().toISOString().split('T')[0]}
          </span>
        </div>
      </div>
    </div>
  )
}
