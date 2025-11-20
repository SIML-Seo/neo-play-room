import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const { loading, error, signInWithGoogle, isAuthenticated } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  // 이미 로그인된 경우 Lobby로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/lobby')
    }
  }, [isAuthenticated, loading, navigate])

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signInWithGoogle()
      // navigate는 useEffect에서 처리됨
    } catch {
      // 에러는 useAuth에서 처리됨
      setIsSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-gold-frame border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gallery-cream text-xl font-crimson">작품 준비 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      {/* Spotlight effect overlay */}
      <div className="fixed inset-0 pointer-events-none spotlight opacity-30" />

      {/* Main entrance panel */}
      <div className="relative max-w-4xl w-full">
        {/* Velvet curtain header */}
        <div className="velvet-bg rounded-t-lg p-6 text-center border-4 border-gold-frame border-b-0">
          <div className="museum-label mb-2">네오랩컨버전스 아트 컬렉션</div>
          <h1 className="gallery-title text-5xl md:text-7xl text-gallery-ivory mb-2 gold-glow animate-fadeIn">
            Project Da Vinci
          </h1>
          <p className="gallery-text text-xl md:text-2xl text-gallery-cream/90">
            협동 창작 갤러리
          </p>
        </div>

        {/* Main content frame */}
        <div className="gallery-frame bg-gallery-wall-light rounded-b-lg shadow-gallery animate-scaleIn">
          <div className="bg-wood-dark rounded-lg p-8 md:p-12 space-y-8">
            {/* Game description placard */}
            <div className="gallery-placard text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-playfair font-bold text-gold-frame mb-4">
                인간과 AI의 협동 창작 실험
              </h2>
              <p className="gallery-text text-gallery-cream leading-relaxed">
                5명의 예술가가 한 팀이 되어 캔버스에 작품을 그립니다.
                AI 큐레이터가 작품을 감상하고 주제를 추론합니다.
                최소한의 턴으로 정확한 해석을 이끌어내는 것이 목표입니다.
              </p>
            </div>

            {/* Authentication section */}
            <div className="max-w-md mx-auto space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || loading}
                className="w-full px-8 py-5 bg-gold-frame text-gallery-floor font-playfair font-bold text-xl
                           rounded-lg hover:bg-gold-light transition-all duration-300
                           shadow-frame-gold hover:scale-105
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           flex items-center justify-center gap-3"
              >
                {isSigningIn ? (
                  <>
                    <div className="w-6 h-6 border-3 border-gallery-floor border-t-transparent rounded-full animate-spin" />
                    <span>갤러리 입장 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Google로 갤러리 입장</span>
                  </>
                )}
              </button>

              {error && (
                <div className="bg-velvet-red/20 border-2 border-velvet-red rounded-lg p-4">
                  <p className="text-velvet-red font-crimson text-center">{error}</p>
                </div>
              )}

              <p className="text-center text-gallery-cream/60 text-sm font-crimson italic">
                ※ 네오랩컨버전스 구성원 전용 전시회
              </p>
            </div>

            {/* Exhibition guide */}
            <div className="border-t border-gold-frame/30 pt-8">
              <h3 className="text-center text-2xl font-playfair font-bold text-gold-frame mb-6">
                전시 관람 안내
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div className="gallery-placard">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl text-gold-frame">I</span>
                    <div>
                      <h4 className="font-playfair font-bold text-gold-light mb-1">작가 모집</h4>
                      <p className="text-sm gallery-text">5명의 참여자가 한 팀을 구성합니다</p>
                    </div>
                  </div>
                </div>

                <div className="gallery-placard">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl text-gold-frame">II</span>
                    <div>
                      <h4 className="font-playfair font-bold text-gold-light mb-1">순차 창작</h4>
                      <p className="text-sm gallery-text">순서대로 캔버스에 작품을 그립니다</p>
                    </div>
                  </div>
                </div>

                <div className="gallery-placard">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl text-gold-frame">III</span>
                    <div>
                      <h4 className="font-playfair font-bold text-gold-light mb-1">🎯 AI 누적 감상</h4>
                      <p className="text-sm gallery-text">
                        AI 큐레이터가 이전 추측을 기억하며 단서를 조합하여 작품을 해석합니다
                      </p>
                    </div>
                  </div>
                </div>

                <div className="gallery-placard">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl text-gold-frame">IV</span>
                    <div>
                      <h4 className="font-playfair font-bold text-gold-light mb-1">협동 승리</h4>
                      <p className="text-sm gallery-text">최소 턴으로 정답을 맞추세요!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom placard */}
        <div className="mt-4 text-center">
          <p className="museum-label text-xs">
            NEOLAB CONVERGENCE DIGITAL GALLERY • EST. 2025
          </p>
        </div>
      </div>
    </div>
  )
}
