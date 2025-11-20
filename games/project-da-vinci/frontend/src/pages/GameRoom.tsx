import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useGameRoom } from '@/hooks/useGameRoom'
import { useEffect, useState, useRef } from 'react'
import Canvas, { type CanvasHandle } from '@/components/game/Canvas'
import Chat from '@/components/game/Chat'
import { submitDrawingToAI } from '@/services/ai'
import { ENV } from '@/config/env'
import { subscribeToRoomSecret } from '@/services/roomSecrets'
import { getDifficultyConfig, DIFFICULTY_CONFIG, type GameDifficulty } from '@/utils/difficulty'
import { ref, update } from 'firebase/database'
import { database } from '@/firebase'

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const {
    gameRoom,
    loading: roomLoading,
    error: roomError,
    handleCanvasChange,
    handleNextTurn,
    handlePlayerReady,
    handleDifficultyChange,
    handleStartGame,
    isMyTurn,
    getRemainingTime,
  } = useGameRoom(roomId)
  const navigate = useNavigate()
  const canvasRef = useRef<CanvasHandle>(null)
  const [remainingTime, setRemainingTime] = useState(gameRoom?.turnTimeLimit || ENV.game.turnTimeLimit)
  const [isSubmittingToAI, setIsSubmittingToAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [targetWord, setTargetWord] = useState<string | null>(null)

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  // 타이머 업데이트 (AI 판정 중에는 멈춤)
  useEffect(() => {
    // AI 판정 중일 때는 타이머 멈춤
    if (gameRoom?.isAIJudging) {
      return
    }

    const interval = setInterval(() => {
      setRemainingTime(getRemainingTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [getRemainingTime, gameRoom?.isAIJudging])

  // 현재 턴인 경우 정답 단어 구독
  useEffect(() => {
    if (!roomId) {
      setTargetWord(null)
      return
    }

    if (!user || !isMyTurn(user.uid)) {
      setTargetWord(null)
      return
    }

    const unsubscribe = subscribeToRoomSecret(roomId, (secret) => {
      setTargetWord(secret?.targetWord ?? null)
    })

    return () => {
      unsubscribe()
    }
  }, [roomId, user, isMyTurn])

  // 시간 초과 시 자동으로 다음 턴 (AI 판정 중이 아닐 때만, 턴 수 초과하지 않았을 때만)
  useEffect(() => {
    if (
      remainingTime === 0 &&
      gameRoom?.status === 'in-progress' &&
      !gameRoom?.isAIJudging &&
      gameRoom.turnCount < gameRoom.maxTurns // 턴 수 초과 방지
    ) {
      handleNextTurn()
    }
  }, [remainingTime, gameRoom?.status, gameRoom?.isAIJudging, gameRoom?.turnCount, gameRoom?.maxTurns, handleNextTurn])

  // 게임 종료 시 결과 페이지로 리다이렉트
  useEffect(() => {
    if (gameRoom?.status === 'finished' && roomId) {
      navigate(`/results?roomId=${roomId}`)
    }
  }, [gameRoom?.status, roomId, navigate])

  // 관전자/다른 플레이어는 최신 캔버스를 불러오기
  useEffect(() => {
    console.log('[GameRoom] 캔버스 데이터 변경 감지', {
      hasCanvasRef: !!canvasRef.current,
      canvasData: gameRoom?.canvasData,
      isMyTurn: user ? isMyTurn(user.uid) : false,
    })

    if (!canvasRef.current || gameRoom?.canvasData === undefined) {
      return
    }

    // 빈 캔버스 데이터면 항상 초기화 (턴이 넘어갈 때)
    if (gameRoom.canvasData === '') {
      console.log('[GameRoom] 빈 캔버스로 초기화')
      canvasRef.current.clearCanvas()
      return
    }

    // 내 차례가 아닐 때만 다른 사람의 그림 로드
    if (!user || isMyTurn(user.uid)) {
      console.log('[GameRoom] 내 차례라서 캔버스 로드 스킵')
      return
    }

    console.log('[GameRoom] 다른 플레이어의 캔버스 로드', gameRoom.canvasData.substring(0, 50))
    canvasRef.current.loadCanvasData(gameRoom.canvasData)
  }, [gameRoom?.canvasData, isMyTurn, user])

  // AI에게 그림 제출
  const handleSubmitToAI = async () => {
    if (!roomId || !canvasRef.current) return

    try {
      setIsSubmittingToAI(true)
      setAiError(null)

      // Firebase에 AI 판정 중 플래그 설정 (모든 참가자의 타이머 멈춤)
      const roomRef = ref(database, `gameRooms/${roomId}`)
      await update(roomRef, { isAIJudging: true })

      const imageBase64 = canvasRef.current.getCanvasAsBase64()
      if (!imageBase64) {
        throw new Error('캔버스 이미지를 가져올 수 없습니다.')
      }

      const result = await submitDrawingToAI(roomId, imageBase64)

      console.log('AI 판단 결과:', result)

      // AI 판정 완료 후 플래그 해제 (타이머 재개)
      await update(roomRef, { isAIJudging: false })

      // 게임이 종료되면 useEffect에서 자동으로 /results로 리다이렉트됨
    } catch (err) {
      console.error('AI 제출 실패:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'AI에게 제출하는 중 오류가 발생했습니다.'
      setAiError(errorMessage)

      // 에러 발생 시에도 플래그 해제
      if (roomId) {
        const roomRef = ref(database, `gameRooms/${roomId}`)
        await update(roomRef, { isAIJudging: false })
      }
    } finally {
      setIsSubmittingToAI(false)
    }
  }

  if (authLoading || roomLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-gold-frame border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gallery-cream text-xl font-crimson">갤러리 입장 중...</p>
        </div>
      </div>
    )
  }

  if (roomError || !gameRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full gallery-frame bg-wood-dark shadow-gallery p-8 text-center animate-scaleIn">
          <div className="w-20 h-20 mx-auto mb-6 bg-velvet-red/20 rounded-full flex items-center justify-center border-4 border-velvet-red">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-playfair font-bold text-gold-frame mb-4">오류 발생</h2>
          <p className="gallery-text text-gallery-cream mb-6">{roomError || '전시실을 찾을 수 없습니다.'}</p>
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

  const isDrawing = isMyTurn(user.uid)
  const currentPlayer = gameRoom.players[gameRoom.currentTurn]
  const allPlayers = Object.values(gameRoom.players)
  const wordDisplay = targetWord ? (
    <strong className="text-gold-light">{targetWord}</strong>
  ) : (
    <span className="text-sm text-gallery-cream/60">정답 단어를 불러오는 중...</span>
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-wood-dark border-b-4 border-gold-frame shadow-gallery">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-playfair font-bold text-gold-frame gold-glow">Project Da Vinci</h1>
              <span className="gallery-placard text-xs py-1 px-3">
                {gameRoom.theme}
              </span>
              {/* 난이도 배지 */}
              {gameRoom.difficulty && (
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-crimson font-bold flex items-center gap-1 border-2
                    ${gameRoom.difficulty === 'easy' ? 'bg-gold-frame/20 border-gold-frame text-gold-light' :
                      gameRoom.difficulty === 'normal' ? 'bg-gold-dark/20 border-gold-dark text-gold-frame' :
                      'bg-velvet-red/20 border-velvet-red text-velvet-burgundy'}`}
                >
                  <span>{getDifficultyConfig(gameRoom.difficulty).icon}</span>
                  <span>{getDifficultyConfig(gameRoom.difficulty).label}</span>
                </span>
              )}
              {gameRoom.status === 'waiting' && (
                <span className="px-3 py-1 bg-gold-dark/20 border-2 border-gold-dark text-gold-light rounded-lg text-xs font-crimson font-bold">
                  준비 중
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={gameRoom.players[user.uid]?.artistName || user.displayName || ''}
                  className="w-10 h-10 rounded-full border-2 border-gold-frame"
                />
              )}
              <div className="text-sm">
                <div className="font-crimson font-semibold text-gallery-cream">
                  {gameRoom.players[user.uid]?.artistName || user.displayName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 게임 대기 중 - 대기실 UI */}
        {gameRoom.status === 'waiting' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 플레이어 목록 & 난이도 선택 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 난이도 선택 */}
              <div className="gallery-frame bg-wood-dark shadow-gallery p-6 animate-scaleIn">
                <h3 className="text-xl font-playfair font-bold text-gold-frame mb-2 gold-glow">
                  난이도 선택
                </h3>
                <p className="gallery-text text-gallery-cream/80 text-sm mb-4">
                  모든 참가자가 자유롭게 수정할 수 있습니다
                </p>
                <div className="space-y-3">
                  {(Object.keys(DIFFICULTY_CONFIG) as GameDifficulty[]).map((difficulty) => {
                    const config = DIFFICULTY_CONFIG[difficulty]
                    const isSelected = gameRoom.difficulty === difficulty

                    return (
                      <button
                        key={difficulty}
                        onClick={() => handleDifficultyChange(difficulty)}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                          isSelected
                            ? difficulty === 'easy'
                              ? 'bg-gold-frame/20 border-gold-frame shadow-frame-gold'
                              : difficulty === 'normal'
                                ? 'bg-gold-dark/20 border-gold-dark'
                                : 'bg-velvet-red/20 border-velvet-red'
                            : 'bg-wood-medium/50 border-gold-dark/30 hover:border-gold-frame/50 hover:bg-wood-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{config.icon}</span>
                            <span className={`font-playfair font-bold text-lg ${
                              isSelected ? 'text-gold-light' : 'text-gallery-cream'
                            }`}>
                              {config.label}
                            </span>
                          </div>
                          {isSelected && <span className="text-2xl animate-scaleIn text-gold-frame">✓</span>}
                        </div>
                        <p className="text-sm gallery-text text-gallery-cream/70 mb-2">{config.description}</p>
                        <div className="flex gap-4 text-xs museum-label">
                          <span>⏱️ {config.turnTimeLimit}초</span>
                          <span>🔄 {config.maxTurns}턴</span>
                          <span className="font-semibold text-gold-light">
                            ⭐ 점수 보정 ×{config.scoreMultiplier.toFixed(1)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 플레이어 목록 */}
              <div className="gallery-frame bg-wood-dark shadow-gallery p-6 animate-scaleIn" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-xl font-playfair font-bold text-gold-frame mb-4 gold-glow">
                  참여 작가 ({allPlayers.length}명)
                </h3>
                <div className="space-y-3">
                  {allPlayers.map((player) => {
                    const isMe = player.uid === user.uid
                    const isReady = player.ready

                    return (
                      <div
                        key={player.uid}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-300 ${
                          isMe
                            ? 'bg-gold-frame/20 border-gold-frame shadow-frame-gold'
                            : isReady
                              ? 'bg-wood-medium/50 border-gold-dark'
                              : 'bg-gallery-floor/50 border-gold-dark/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {player.photoURL ? (
                            <img
                              src={player.photoURL}
                              alt={player.artistName || player.displayName || ''}
                              className="w-10 h-10 rounded-full border-2 border-gold-frame"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gallery-wall flex items-center justify-center border-2 border-gold-dark">
                              <span className="text-gold-frame font-playfair font-bold">
                                {player.artistName?.[0] || player.displayName?.[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-crimson font-bold text-gallery-cream">
                              {player.artistName || player.displayName}
                              {isMe && <span className="text-gold-light ml-2">(나)</span>}
                            </div>
                            {/* <div className="text-xs text-gallery-cream/60 font-crimson">{player.email}</div> */}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isReady ? (
                            <span className="px-3 py-1 bg-gold-frame text-gallery-floor text-xs font-crimson font-bold rounded-full">
                              ✓ 준비 완료
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gallery-floor/50 border border-gold-dark/30 text-gallery-cream/60 text-xs font-crimson rounded-full">
                              대기 중
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 준비 버튼 & 게임 시작 */}
              <div className="gallery-frame bg-wood-dark shadow-gallery p-6 animate-scaleIn" style={{ animationDelay: '0.2s' }}>
                <div className="space-y-4">
                  {/* 내 준비 상태 토글 */}
                  <button
                    onClick={() => {
                      const myPlayer = allPlayers.find((p) => p.uid === user.uid)
                      handlePlayerReady(user.uid, !myPlayer?.ready)
                    }}
                    className={`w-full px-6 py-3 rounded-lg font-playfair font-bold text-lg transition-all shadow-md hover:scale-105 border-4 ${
                      allPlayers.find((p) => p.uid === user.uid)?.ready
                        ? 'bg-wood-medium text-gallery-cream hover:bg-wood-light border-gold-dark'
                        : 'bg-gold-frame text-gallery-floor hover:bg-gold-light shadow-frame-gold border-gold-dark'
                    }`}
                  >
                    {allPlayers.find((p) => p.uid === user.uid)?.ready ? '준비 취소' : '준비 완료'}
                  </button>

                  {/* 모두 준비 완료 시 게임 시작 버튼 */}
                  {allPlayers.every((p) => p.ready) && (
                    <button
                      onClick={handleStartGame}
                      className="w-full px-6 py-3 bg-gradient-to-r from-gold-dark via-gold-frame to-gold-light text-gallery-floor rounded-lg font-playfair font-bold text-lg hover:scale-105 transition-all animate-pulse shadow-frame-gold border-4 border-gallery-floor"
                    >
                      🚀 협동 창작 시작하기
                    </button>
                  )}

                  {/* 준비 상태 안내 */}
                  <div className="text-center gallery-placard">
                    {allPlayers.every((p) => p.ready) ? (
                      <span className="text-gold-light font-crimson font-semibold">모든 작가가 준비 완료! 🎉</span>
                    ) : (
                      <span className="text-gallery-cream/80 font-crimson">
                        {allPlayers.filter((p) => p.ready).length}/{allPlayers.length}명 준비 완료
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 게임 룰 & 채팅 */}
            <div className="lg:col-span-1 space-y-6">
              {/* AI 누적 추론 안내 */}
              <div className="gallery-frame bg-wood-dark shadow-gallery p-6 animate-scaleIn" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-xl font-playfair font-bold text-gold-frame mb-3 gold-glow">
                  🎯 AI 누적 추론
                </h3>
                <div className="space-y-3 text-sm gallery-text text-gallery-cream/90">
                  <p className="font-crimson">
                    AI는 <span className="text-gold-light font-bold">이전 턴의 추측을 기억</span>하고,
                    누적된 단서를 조합하여 정답을 추론합니다.
                  </p>
                  <div className="bg-gallery-floor/50 rounded-lg p-3 border border-gold-dark/30">
                    <div className="text-xs museum-label text-gallery-cream/70 mb-2">예시: "선녀와나무꾼"</div>
                    <div className="space-y-1 font-crimson text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gold-frame">턴 1:</span>
                        <span>산 그리기 → AI: "산"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gold-frame">턴 2:</span>
                        <span>나무꾼 그리기 → AI: "나무꾼"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gold-frame">턴 3:</span>
                        <span>요정 그리기 → AI: "선녀와나무꾼" ✅</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-crimson text-gallery-cream/80 italic">
                    💡 팀원들과 전략을 협의하여 단서를 하나씩 쌓아가세요!
                  </p>
                </div>
              </div>

              {/* 채팅 */}
              <div className="gallery-frame bg-wood-dark shadow-gallery p-6 h-96 flex flex-col animate-scaleIn" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-xl font-playfair font-bold text-gold-frame mb-4 gold-glow">대화</h3>
                <div className="flex-1 overflow-hidden">
                  <Chat roomId={roomId!} user={user} gameRoom={gameRoom} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 게임 진행 중 - 캔버스 & 게임 UI */}
        {gameRoom.status === 'in-progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 왼쪽: 캔버스 영역 */}
            <div className="lg:col-span-2">
              {isDrawing ? (
                <div className="mb-4 gallery-placard border-2 border-gold-frame bg-gold-frame/10 animate-fadeIn">
                  <p className="text-gallery-cream font-crimson font-semibold">
                    🎨 당신의 차례입니다! 주제: {wordDisplay}
                  </p>
                </div>
              ) : (
                <div className="mb-4 gallery-placard border-2 border-gold-dark/50 animate-fadeIn">
                  <p className="text-gallery-cream/80 font-crimson">
                    👀 {currentPlayer?.artistName || currentPlayer?.displayName || '???'}님이 작품을 창작하고 있습니다...
                  </p>
                </div>
              )}

              {/* Canvas with gallery frame */}
              <div className="gallery-frame shadow-gallery animate-scaleIn" style={{ animationDelay: '0.1s' }}>
                <div className="canvas-frame">
                  <Canvas
                    ref={canvasRef}
                    isDrawingEnabled={isDrawing && gameRoom.status === 'in-progress'}
                    onCanvasChange={handleCanvasChange}
                  />
                </div>
              </div>

              {/* AI 에러 표시 */}
              {aiError && (
                <div className="mt-4 p-3 bg-velvet-red/20 border-2 border-velvet-red rounded-lg text-velvet-burgundy text-sm font-crimson animate-fadeIn">
                  {aiError}
                </div>
              )}

              {isDrawing && gameRoom.status === 'in-progress' && (
                <div className="mt-4 space-y-3">
                  <button
                    onClick={handleSubmitToAI}
                    disabled={isSubmittingToAI}
                    className="w-full px-4 py-3 bg-gold-frame text-gallery-floor rounded-lg hover:bg-gold-light disabled:bg-wood-medium disabled:cursor-not-allowed transition-all font-playfair font-bold text-lg shadow-frame-gold hover:scale-105 disabled:hover:scale-100"
                  >
                    {isSubmittingToAI ? '🤖 AI 큐레이터가 감상 중...' : '🎨 AI 큐레이터에게 제출'}
                  </button>
                  <button
                    onClick={handleNextTurn}
                    disabled={isSubmittingToAI}
                    className="w-full px-4 py-3 bg-wood-medium text-gallery-cream rounded-lg hover:bg-wood-light disabled:bg-gallery-floor disabled:cursor-not-allowed transition-all font-crimson font-semibold border-2 border-gold-dark/30"
                  >
                    다음 차례로 넘기기 (제출 안 함)
                  </button>
                </div>
              )}
            </div>

            {/* 중간: 타이머 & 플레이어 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 현재 턴 정보 */}
              <div className="gallery-frame bg-wood-dark shadow-gallery p-6 animate-scaleIn" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-lg font-playfair font-bold text-gold-frame mb-4 gold-glow">현재 턴</h3>

                {/* 큰 타이머 표시 */}
                <div className="mb-6 flex flex-col items-center justify-center">
                  <div
                    className={`text-6xl font-playfair font-bold transition-all duration-300 ${
                      remainingTime <= 10
                        ? 'text-velvet-red animate-pulse'
                        : remainingTime <= 30
                          ? 'text-gold-light'
                          : 'text-gold-frame'
                    }`}
                  >
                    {remainingTime}
                  </div>
                  <div className="text-sm museum-label mt-1">남은 시간 (초)</div>

                  {/* 진행 바 */}
                  <div className="w-full h-2 bg-gallery-floor rounded-full overflow-hidden mt-3 border border-gold-dark/50">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear ${
                        remainingTime <= 10
                          ? 'bg-velvet-red'
                          : remainingTime <= 30
                            ? 'bg-gold-light'
                            : 'bg-gold-frame'
                      }`}
                      style={{
                        width: `${(remainingTime / (gameRoom.turnTimeLimit || ENV.game.turnTimeLimit)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3 text-sm border-t border-gold-dark/30 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gallery-cream/70 font-crimson">현재 작가</span>
                    <span className="font-crimson font-semibold text-gallery-cream">
                      {currentPlayer?.artistName || currentPlayer?.displayName || '???'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gallery-cream/70 font-crimson">턴 수</span>
                    <span className="font-crimson font-semibold text-gold-light">
                      {gameRoom.turnCount} / {gameRoom.maxTurns}
                    </span>
                  </div>
                </div>
              </div>

              {/* 플레이어 목록 */}
              <div className="gallery-frame bg-wood-dark shadow-gallery p-6 animate-scaleIn" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-lg font-playfair font-bold text-gold-frame mb-4 gold-glow">작가 목록</h3>
                <div className="space-y-2">
                  {allPlayers.map((player) => {
                    const isCurrent = player.uid === gameRoom.currentTurn
                    const isMe = player.uid === user.uid

                    return (
                      <div
                        key={player.uid}
                        className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                          isCurrent
                            ? 'bg-gold-frame/20 border-2 border-gold-frame shadow-frame-gold scale-105 animate-pulse'
                            : isMe
                              ? 'bg-wood-medium/50 border border-gold-dark'
                              : 'bg-gallery-floor/30'
                        }`}
                      >
                        <div className="relative">
                          {player.photoURL ? (
                            <img
                              src={player.photoURL}
                              alt={player.artistName || player.displayName || ''}
                              className={`w-8 h-8 rounded-full ${
                                isCurrent ? 'ring-2 ring-gold-frame' : 'border-2 border-gold-dark/50'
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full bg-gallery-wall flex items-center justify-center ${
                                isCurrent ? 'ring-2 ring-gold-frame' : 'border-2 border-gold-dark/50'
                              }`}
                            >
                              <span className="text-sm font-playfair font-bold text-gold-frame">{player.artistName?.[0] || player.displayName?.[0]}</span>
                            </div>
                          )}
                          {isCurrent && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold-frame rounded-full border-2 border-gallery-wall animate-bounce" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-crimson font-semibold ${
                            isCurrent ? 'text-gallery-cream' : 'text-gallery-cream/80'
                          }`}
                        >
                          {player.artistName || player.displayName}
                          {isMe && ' (나)'}
                        </span>
                        {isCurrent && (
                          <span className="text-xs text-gallery-floor bg-gold-frame px-2 py-1 rounded-full ml-auto font-crimson font-bold">
                            🎨 창작 중
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 오른쪽: AI 히스토리 & 채팅 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 턴 히스토리 & AI 추론 결과 */}
              <div className="gallery-frame bg-gradient-to-br from-wood-dark to-wood-medium shadow-gallery p-6 animate-scaleIn" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-lg font-playfair font-bold text-gold-frame mb-3 flex items-center gap-2 gold-glow">
                  <span>🎯</span>
                  <span>AI 감상 기록</span>
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {gameRoom.aiGuesses && gameRoom.aiGuesses.length > 0 ? (
                    gameRoom.aiGuesses.map((guess, idx) => {
                      const playerUid =
                        gameRoom.turnOrder[((guess.turn as number) - 1) % gameRoom.turnOrder.length]
                      const player = allPlayers.find((p) => p.uid === playerUid)
                      const confidenceColor =
                        (guess.confidence as number) >= 80
                          ? 'text-gold-light'
                          : (guess.confidence as number) >= 50
                            ? 'text-gold-frame'
                            : 'text-velvet-burgundy'

                      return (
                        <div
                          key={idx}
                          className="gallery-placard hover:bg-wood-medium transition-all duration-300 animate-slideIn"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-playfair font-bold text-gold-frame bg-gold-frame/20 px-2 py-0.5 rounded">
                                턴 {guess.turn}
                              </span>
                              {player && (
                                <span className="text-xs text-gallery-cream/70 font-crimson">
                                  by {player.artistName || player.displayName}
                                </span>
                              )}
                            </div>
                            <span className={`text-xs font-crimson font-semibold ${confidenceColor}`}>
                              {guess.confidence}% 확신
                            </span>
                          </div>
                          <div className="font-crimson font-semibold text-gallery-cream text-base">{guess.guess}</div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 gallery-placard">
                      <div className="text-4xl mb-2">🤖</div>
                      <p className="text-sm text-gold-light font-crimson font-semibold">
                        아직 AI 감상 기록이 없습니다.
                      </p>
                      <p className="text-xs text-gallery-cream/60 font-crimson mt-1">
                        작품을 그리고 AI 큐레이터에게 제출하세요!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 채팅 */}
              <div className="flex flex-col" style={{ height: 'calc(100vh - 500px)', minHeight: '500px' }}>
                <Chat roomId={roomId!} user={user} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
