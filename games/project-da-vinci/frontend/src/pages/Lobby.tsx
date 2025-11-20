import { useAuth } from '@/hooks/useAuth'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useGameSchedule } from '@/hooks/useGameSchedule'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ENV } from '@/config/env'

export default function Lobby() {
  const { user, loading, signOut, isAuthenticated } = useAuth()
  const {
    waitingPlayers,
    isJoining,
    error: matchError,
    joinWaitingRoom,
    isInWaitingRoom,
  } = useMatchmaking()
  const { isAllowed, nextOpenTime, timeUntilOpen, loading: scheduleLoading } = useGameSchedule()
  const navigate = useNavigate()

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/')
    }
  }, [isAuthenticated, loading, navigate])

  // 로그인 완료되면 자동으로 대기실 입장 (게임 허용 시간대일 때만)
  useEffect(() => {
    if (user && !isInWaitingRoom && !isJoining && isAllowed) {
      joinWaitingRoom()
    }
  }, [user, isInWaitingRoom, isJoining, isAllowed, joinWaitingRoom])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  if (loading || scheduleLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-gold-frame border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gallery-cream text-xl font-crimson">갤러리 준비 중...</p>
        </div>
      </div>
    )
  }

  // 게임이 허용되지 않는 시간대
  if (!isAllowed) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-wood-dark border-b-4 border-gold-frame shadow-gallery">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-playfair font-bold text-gold-frame gold-glow">Project Da Vinci</h1>
                <span className="museum-label">대기실</span>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || ''}
                      className="w-10 h-10 rounded-full border-2 border-gold-frame"
                    />
                  )}
                  <div className="text-sm">
                    <div className="font-crimson font-semibold text-gallery-cream">{user.displayName}</div>
                    <div className="text-gallery-cream/60 text-xs">{user.email}</div>
                  </div>
                </div>
                {user.email === 'swh1182@neolab.net' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="px-4 py-2 text-sm bg-velvet-red text-gallery-cream hover:bg-velvet-burgundy rounded-lg transition-all font-crimson font-semibold"
                  >
                    관리자
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm text-gallery-cream/80 hover:text-gallery-cream hover:bg-wood-medium rounded-lg transition-all font-crimson"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Closed Message */}
        <main className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="gallery-frame bg-wood-dark shadow-gallery p-12 text-center animate-scaleIn">
            <div className="w-32 h-32 mx-auto mb-6 bg-gold-frame/20 rounded-full flex items-center justify-center border-4 border-gold-frame">
              <span className="text-6xl">🔒</span>
            </div>
            <h2 className="text-4xl font-playfair font-bold text-gold-frame mb-4 gold-glow">전시회 휴관 중</h2>
            <p className="gallery-text text-gallery-cream text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              현재 갤러리는 휴관 시간입니다.<br />
              다음 개관 시간을 확인해주세요.
            </p>

            {nextOpenTime && (
              <div className="gallery-placard max-w-md mx-auto">
                <div className="museum-label mb-2">다음 개관 시간</div>
                <div className="text-3xl font-playfair font-bold text-gold-light mb-2">
                  {nextOpenTime.toLocaleString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-gallery-cream text-xl font-crimson">{timeUntilOpen}</div>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // 빈 슬롯 개수 계산
  const emptySlots = Math.max(0, ENV.game.maxPlayers - waitingPlayers.length)

  // 마스터 계정 여부 확인
  const isMaster = user.email === 'swh1182@neolab.net'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-wood-dark border-b-4 border-gold-frame shadow-gallery">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-playfair font-bold text-gold-frame gold-glow">Project Da Vinci</h1>
              <span className="museum-label">작가 대기실</span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || ''}
                    className="w-10 h-10 rounded-full border-2 border-gold-frame"
                  />
                )}
                <div className="text-sm">
                  <div className="font-crimson font-semibold text-gallery-cream">{user.displayName}</div>
                  <div className="text-gallery-cream/60 text-xs">{user.email}</div>
                </div>
              </div>
              {isMaster && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 text-sm bg-velvet-red text-gallery-cream hover:bg-velvet-burgundy rounded-lg transition-all font-crimson font-semibold"
                >
                  관리자
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gallery-cream/80 hover:text-gallery-cream hover:bg-wood-medium rounded-lg transition-all font-crimson"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 매칭 에러 표시 */}
        {matchError && (
          <div className="mb-6 p-4 bg-velvet-red/20 border-2 border-velvet-red rounded-lg animate-fadeIn">
            <p className="text-velvet-red font-crimson font-semibold">{matchError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 대기 중인 플레이어 */}
          <div className="lg:col-span-2">
            <div className="gallery-frame bg-wood-dark shadow-gallery p-6 animate-scaleIn">
              <h2 className="text-2xl font-playfair font-bold text-gold-frame mb-2 gold-glow">참여 작가</h2>
              <p className="gallery-text text-gallery-cream/80 text-sm mb-6">
                {ENV.game.maxPlayers}명의 작가가 모이면 협동 창작이 시작됩니다
              </p>

              {/* 플레이어 목록 */}
              <div className="space-y-3">
                {waitingPlayers.map((player) => {
                  const isMe = player.uid === user.uid

                  return (
                    <div
                      key={player.uid}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        isMe
                          ? 'bg-gold-frame/20 border-gold-frame shadow-frame-gold'
                          : 'bg-wood-medium/50 border-gold-dark'
                      }`}
                    >
                      {/* {player.photoURL ? (
                        <img
                          src={player.photoURL}
                          alt={player.displayName || ''}
                          className="w-12 h-12 rounded-full border-2 border-gold-frame"
                        />
                      ) : ( */}
                        <div className="w-12 h-12 rounded-full bg-gallery-wall flex items-center justify-center border-2 border-gold-dark">
                          <span className="text-gold-frame text-lg font-playfair font-bold">
                            {'?'}
                          </span>
                        </div>
                      {/* )} */}
                      <div className="flex-1">
                        <div className="font-crimson font-bold text-gallery-cream">
                          {'익명 작가'}
                          {isMe && <span className="text-gold-light ml-2">(나)</span>}
                        </div>
                        {/* <div className="text-sm text-gallery-cream/60 font-crimson">{player.email}</div> */}
                      </div>
                    </div>
                  )
                })}

                {/* 빈 슬롯 */}
                {Array.from({ length: emptySlots }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="flex items-center gap-3 p-4 bg-gallery-floor/50 rounded-lg border-2 border-dashed border-gold-dark/50"
                  >
                    <div className="w-12 h-12 rounded-full bg-gallery-wall/50 flex items-center justify-center border-2 border-dashed border-gold-dark/50">
                      <span className="text-gold-dark text-2xl">?</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gallery-cream/50 font-crimson">대기 중...</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 대기실 입장 중 표시 */}
              {isJoining && (
                <div className="mt-4 p-4 gallery-placard flex items-center gap-3 animate-fadeIn">
                  <div className="w-5 h-5 border-3 border-gold-frame border-t-transparent rounded-full animate-spin" />
                  <span className="font-crimson font-semibold">갤러리 입장 중...</span>
                </div>
              )}
            </div>
          </div>

          {/* 게임 정보 */}
          <div className="space-y-6">
            <div className="gallery-frame bg-wood-dark shadow-gallery p-6 animate-scaleIn" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-xl font-playfair font-bold text-gold-frame mb-4 gold-glow">전시 정보</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gold-dark/30">
                  <span className="text-gallery-cream/70 font-crimson">필요 작가</span>
                  <span className="font-crimson font-bold text-gallery-cream">{ENV.game.maxPlayers}명</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gold-dark/30">
                  <span className="text-gallery-cream/70 font-crimson">현재 대기</span>
                  <span className="font-crimson font-bold text-gold-light">{waitingPlayers.length}명</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gold-dark/30">
                  <span className="text-gallery-cream/70 font-crimson">최대 턴</span>
                  <span className="font-crimson font-bold text-gallery-cream">{ENV.game.maxTurns}턴</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gallery-cream/70 font-crimson">턴당 시간</span>
                  <span className="font-crimson font-bold text-gallery-cream">{ENV.game.turnTimeLimit}초</span>
                </div>
              </div>

              {/* 진행 바 */}
              <div className="mt-6">
                <div className="flex justify-between text-xs museum-label mb-2">
                  <span>매칭 진행</span>
                  <span>
                    {waitingPlayers.length}/{ENV.game.maxPlayers}
                  </span>
                </div>
                <div className="h-3 bg-gallery-floor rounded-full overflow-hidden border border-gold-dark/50">
                  <div
                    className="h-full bg-gradient-to-r from-gold-dark to-gold-frame transition-all duration-500"
                    style={{ width: `${(waitingPlayers.length / ENV.game.maxPlayers) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="gallery-placard animate-scaleIn" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-playfair font-bold text-gold-light mb-4">협동 창작 규칙</h3>
              <ul className="space-y-3 text-sm gallery-text">
                <li className="flex items-start gap-3">
                  <span className="text-gold-frame font-playfair font-bold text-lg">I</span>
                  <span>각 턴마다 한 명씩 캔버스에 그림을 그립니다</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-frame font-playfair font-bold text-lg">II</span>
                  <span>AI 큐레이터가 작품을 감상하고 주제를 추론합니다</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-frame font-playfair font-bold text-lg">III</span>
                  <span>최소 턴으로 정확한 해석을 이끌면 승리!</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-frame font-playfair font-bold text-lg">IV</span>
                  <span>협동하여 갤러리 명예의 전당에 도전하세요</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
