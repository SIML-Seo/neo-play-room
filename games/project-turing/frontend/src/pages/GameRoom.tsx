import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useGameRoom } from '@/hooks/useGameRoom'
import { useTimer } from '@/hooks/useTimer'
import { generateAIAnswer, checkVoteResult } from '@/services/ai'
import Button from '@shared/ui-components/Button'
import Loader from '@shared/ui-components/Loader'
import Timer from '@shared/ui-components/Timer'
import AnswerInput from '@/components/game/AnswerInput'
import VotingBoard from '@/components/game/VotingBoard'

// 환경 변수 설정
const MAX_PLAYERS = Number(import.meta.env.VITE_MAX_PLAYERS) || 5
const ANSWER_TIME_LIMIT = Number(import.meta.env.VITE_ANSWER_TIME_LIMIT) || 90
const VOTE_TIME_LIMIT = Number(import.meta.env.VITE_VOTE_TIME_LIMIT) || 60

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const {
    gameRoom,
    loading,
    error,
    handlePlayerReady,
    handleDifficultyChange,
    handleStartGame,
    handleSubmitAnswer,
    handleSubmitVote,
    handleNextTurn,
    getMyAnonymousId,
    allPlayersReady,
  } = useGameRoom(roomId)

  const [submittedAnswer, setSubmittedAnswer] = useState(false)
  const [submittedVote, setSubmittedVote] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState('')

  // 투표 집계 호출 여부 추적 (중복 호출 방지)
  const voteResultChecked = useRef<Record<number, boolean>>({})

  // 답변 타이머 만료 시 자동 제출
  const handleAnswerExpire = useCallback(() => {
    if (!gameRoom || !roomId || !user || submittedAnswer) return

    const myAnonymousId = getMyAnonymousId(user.uid)
    if (!myAnonymousId) return

    // 현재 입력된 답변이 있으면 제출, 없으면 기본 메시지 제출
    const answerText = currentAnswer.trim() || '(시간 초과 - 답변 없음)'
    handleSubmitAnswer(gameRoom.currentTurn, myAnonymousId, answerText)
    setSubmittedAnswer(true)
    console.log('[GameRoom] 답변 시간 초과, 자동 제출:', answerText)
  }, [gameRoom, roomId, user, submittedAnswer, currentAnswer, getMyAnonymousId, handleSubmitAnswer])

  // 투표 타이머 만료 시 자동 건너뛰기
  const handleVoteExpire = useCallback(() => {
    console.log('[GameRoom] 투표 시간 초과, 자동 건너뛰기')
    // 투표를 하지 않으면 그냥 넘어감 (voteCount가 5가 안 되므로 게임이 진행 안 됨)
    // 실제로는 랜덤 투표나 자동 기권 처리가 필요할 수 있음
    setSubmittedVote(true)
  }, [])

  // 답변 타이머
  const answerTimer = useTimer(ANSWER_TIME_LIMIT, handleAnswerExpire)

  // 투표 타이머
  const voteTimer = useTimer(VOTE_TIME_LIMIT, handleVoteExpire)

  // 로그인 안 되어 있으면 홈으로
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  // AI 답변 자동 생성 (턴 시작 3초 후)
  useEffect(() => {
    if (!gameRoom || !roomId) return
    if (gameRoom.status !== 'in-progress') return

    const currentTurn = gameRoom.turns[gameRoom.currentTurn]
    if (!currentTurn) return

    // AI 답변이 이미 있으면 스킵
    const aiPlayerId = gameRoom.aiPlayerId
    if (currentTurn.answers && currentTurn.answers[aiPlayerId]) {
      console.log('[GameRoom] AI 답변이 이미 존재함')
      return
    }

    // 턴 시작 3초 후 AI 답변 생성
    const timer = setTimeout(() => {
      console.log('[GameRoom] 3초 경과, AI 답변 생성 호출')
      generateAIAnswer(roomId, gameRoom.currentTurn).catch((err) => {
        console.error('[GameRoom] AI 답변 생성 실패:', err)
      })
    }, 3000)

    return () => clearTimeout(timer)
  }, [gameRoom?.currentTurn, gameRoom?.status, roomId])

  // 투표 결과 자동 집계 (모든 플레이어 투표 완료 후)
  useEffect(() => {
    if (!gameRoom || !roomId) return
    if (gameRoom.status !== 'in-progress') return

    const currentTurn = gameRoom.turns[gameRoom.currentTurn]
    if (!currentTurn || !currentTurn.votes) return

    // 이미 투표 결과가 있으면 스킵
    if (currentTurn.voteResult) return

    const voteCount = Object.keys(currentTurn.votes).length
    const playerCount = Object.keys(gameRoom.players).length

    // 모든 플레이어가 투표를 완료했고, 아직 집계하지 않았으면 집계 호출
    if (voteCount === playerCount && !voteResultChecked.current[gameRoom.currentTurn]) {
      voteResultChecked.current[gameRoom.currentTurn] = true
      console.log('[GameRoom] 투표 집계 호출:', { voteCount })

      checkVoteResult(roomId, gameRoom.currentTurn).catch((err) => {
        console.error('투표 집계 실패:', err)
        // 실패 시 재시도 가능하도록 플래그 초기화
        voteResultChecked.current[gameRoom.currentTurn] = false
      })
    }
  }, [gameRoom, roomId])

  // 턴 변경 시 상태 초기화
  useEffect(() => {
    if (gameRoom && gameRoom.status === 'in-progress') {
      setSubmittedAnswer(false)
      setSubmittedVote(false)
      setCurrentAnswer('')
    }
  }, [gameRoom?.currentTurn])

  // 타이머 제어 로직
  useEffect(() => {
    if (!gameRoom || gameRoom.status !== 'in-progress') {
      answerTimer.reset()
      voteTimer.reset()
      return
    }

    const currentTurn = gameRoom.turns[gameRoom.currentTurn]
    if (!currentTurn) return

    const answerCount = currentTurn.answers ? Object.keys(currentTurn.answers).length : 0
    const allAnswersSubmitted = answerCount === 6
    const myAnonymousId = getMyAnonymousId(user?.uid || '')
    const myAnswer = currentTurn.answers?.[myAnonymousId || '']
    const myVote = currentTurn.votes?.[user?.uid || '']

    // 답변 단계
    if (!allAnswersSubmitted && !myAnswer) {
      // 답변 타이머 시작
      if (!answerTimer.isRunning) {
        answerTimer.reset(ANSWER_TIME_LIMIT)
        answerTimer.start()
      }
      voteTimer.reset()
    }
    // 투표 단계
    else if (allAnswersSubmitted && !myVote && !currentTurn.voteResult) {
      // 투표 타이머 시작
      if (!voteTimer.isRunning) {
        voteTimer.reset(VOTE_TIME_LIMIT)
        voteTimer.start()
      }
      answerTimer.reset()
    }
    // 대기 중
    else {
      answerTimer.pause()
      voteTimer.pause()
    }
  }, [
    gameRoom,
    user,
    getMyAnonymousId,
    answerTimer,
    voteTimer,
    submittedAnswer,
    submittedVote,
  ])

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" text="게임 룸 로딩 중..." />
      </div>
    )
  }

  if (error || !gameRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-danger mb-4">{error || '게임 룸을 찾을 수 없습니다.'}</p>
        <Button onClick={() => navigate('/lobby')}>대기실로 돌아가기</Button>
      </div>
    )
  }

  const myAnonymousId = getMyAnonymousId(user.uid)
  const currentTurn = gameRoom.turns?.[gameRoom.currentTurn]

  // 현재 턴의 내 답변/투표 여부
  const myAnswer = currentTurn?.answers?.[myAnonymousId || '']
  const myVote = currentTurn?.votes?.[user.uid]

  // 답변/투표 개수
  const answerCount = currentTurn?.answers ? Object.keys(currentTurn.answers).length : 0
  const voteCount = currentTurn?.votes ? Object.keys(currentTurn.votes).length : 0
  const allAnswersSubmitted = answerCount === MAX_PLAYERS + 1 // MAX_PLAYERS명 + AI
  const allVotesSubmitted = voteCount === MAX_PLAYERS

  return (
    <div className="min-h-screen bg-terminal-bg p-4 md:p-8 noise-texture">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="font-terminal text-4xl sm:text-5xl md:text-6xl text-cyber-pink font-bold tracking-wider"
                style={{
                  textShadow: '0 0 20px #FF0080, 0 0 40px #FF0080, 4px 4px 0px #000'
                }}>
              AI HUNTER
            </h1>
            <p className="text-cyber-blue font-mono text-sm sm:text-base mt-1">
              라운드 {gameRoom.currentTurn} / {gameRoom.maxTurns}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* AI를 찾아라 버튼 (투표 단계에서만 표시) */}
            {gameRoom.status === 'in-progress' && currentTurn && allAnswersSubmitted && !currentTurn.voteResult && (
              <button
                onClick={() => {
                  // 투표 섹션으로 스크롤
                  document.getElementById('voting-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-6 py-3 bg-terminal-surface border-3 border-cyber-purple text-cyber-purple font-mono font-bold text-base
                           hover:bg-cyber-purple hover:text-terminal-bg transition-all duration-300
                           shadow-glow-blue hover:scale-105 rounded-xl
                           flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                AI를 찾아라!
              </button>
            )}
            <button
              onClick={() => navigate('/lobby')}
              className="px-4 py-2 bg-cyber-red/20 border-2 border-cyber-red text-cyber-red font-mono text-sm
                         hover:bg-cyber-red hover:text-terminal-bg transition-all rounded"
            >
              나가기
            </button>
          </div>
        </div>

        {/* Waiting 상태 */}
        {gameRoom.status === 'waiting' && (
          <div className="bg-terminal-surface border-4 border-cyber-blue rounded-2xl p-8 shadow-glow-blue">
            <h2 className="text-3xl font-terminal font-bold mb-8 text-center text-cyber-pink">게임 준비</h2>

            {/* 난이도 선택 */}
            <div className="mb-8">
              <h3 className="text-xl font-mono font-semibold mb-4 text-cyber-blue">난이도 선택</h3>
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'normal', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => handleDifficultyChange(diff)}
                    className={`
                      p-6 border-4 rounded-xl font-mono font-bold text-lg transition-all duration-300
                      ${
                        gameRoom.difficulty === diff
                          ? 'border-cyber-gold bg-cyber-gold/20 text-cyber-gold shadow-glow-gold scale-105'
                          : 'border-cyber-blue/50 bg-terminal-bg text-white/70 hover:border-cyber-blue hover:scale-105'
                      }
                    `}
                  >
                    {diff === 'easy' ? 'Easy' : diff === 'normal' ? 'Normal' : 'Hard'}
                  </button>
                ))}
              </div>
            </div>

            {/* 플레이어 준비 상태 */}
            <div className="mb-8">
              <h3 className="text-xl font-mono font-semibold mb-4 text-cyber-blue">
                플레이어 ({Object.keys(gameRoom.players).length}/{MAX_PLAYERS})
              </h3>
              <div className="space-y-3">
                {Object.values(gameRoom.players).map((player) => (
                  <div key={player.uid} className="flex items-center justify-between p-4 bg-terminal-bg border-2 border-cyber-blue/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      {player.photoURL ? (
                        <img src={player.photoURL} alt={player.name} className="w-12 h-12 rounded-full border-2 border-cyber-blue" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2 border-cyber-blue"
                             style={{
                               background: 'linear-gradient(135deg, #FF0080 0%, #A855F7 50%, #00D9FF 100%)'
                             }}>
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-mono font-semibold text-white">{player.name}</span>
                    </div>
                    {player.ready ? (
                      <span className="px-4 py-2 bg-phosphor-green/20 border-2 border-phosphor-green text-phosphor-green text-sm font-mono font-bold rounded-lg shadow-glow-green">
                        준비 완료
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-white/10 border-2 border-white/30 text-white/50 text-sm font-mono font-bold rounded-lg">
                        대기 중
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 준비 버튼 */}
            <div className="flex flex-col gap-4">
              {gameRoom.players[user.uid] && (
                <button
                  onClick={() => handlePlayerReady(user.uid, !gameRoom.players[user.uid].ready)}
                  className={`
                    w-full px-8 py-5 border-4 rounded-xl font-mono font-bold text-xl transition-all duration-300
                    ${
                      gameRoom.players[user.uid].ready
                        ? 'border-cyber-red bg-terminal-surface text-cyber-red hover:bg-cyber-red hover:text-terminal-bg shadow-glow-red hover:scale-105'
                        : 'border-phosphor-green bg-terminal-surface text-phosphor-green hover:bg-phosphor-green hover:text-terminal-bg shadow-glow-green hover:scale-105'
                    }
                  `}
                >
                  {gameRoom.players[user.uid].ready ? '준비 취소' : '준비 완료'}
                </button>
              )}

              {/* 게임 시작 버튼 */}
              {allPlayersReady() && (
                <button
                  onClick={handleStartGame}
                  className="w-full px-8 py-6 bg-terminal-surface border-4 border-cyber-pink text-cyber-pink font-terminal font-bold text-2xl
                             hover:bg-cyber-pink hover:text-terminal-bg transition-all duration-300
                             shadow-glow-pink hover:shadow-glow-pink hover:scale-105 rounded-xl animate-scaleGlow"
                >
                  게임 시작
                </button>
              )}
            </div>
          </div>
        )}

        {/* In-Progress 상태 */}
        {gameRoom.status === 'in-progress' && currentTurn && (
          <div className="space-y-6">
            {/* 질문 박스 (투표 단계에서 상단에 고정 표시) */}
            {allAnswersSubmitted && (
              <div className="bg-terminal-surface border-4 border-cyber-blue rounded-2xl p-6 shadow-glow-blue">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-cyber-blue" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-cyber-blue font-mono mb-2">질문</p>
                    <p className="text-xl sm:text-2xl font-terminal font-bold text-white leading-relaxed">
                      {currentTurn.question}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 턴 정보 (답변 단계에서만 표시) */}
            {!allAnswersSubmitted && (
              <div className="bg-terminal-surface border-4 border-cyber-blue rounded-2xl p-6 shadow-glow-blue">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-cyber-blue font-mono mb-1">카테고리</p>
                    <p className="text-2xl font-terminal font-bold text-white">{currentTurn.category}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-cyber-blue font-mono mb-1">답변 제출</p>
                      <p className="text-3xl font-terminal font-bold text-cyber-gold">
                        {answerCount}<span className="text-white/50">/{MAX_PLAYERS + 1}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 답변 단계 */}
            {!allAnswersSubmitted && (
              <>
                {/* 답변 타이머 */}
                {!myAnswer && answerTimer.isRunning && (
                  <div className="bg-terminal-surface border-4 border-cyber-gold rounded-2xl p-6 shadow-glow-gold animate-pulse">
                    <div className="flex items-center justify-center gap-4">
                      <svg className="w-8 h-8 text-cyber-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-lg font-mono font-semibold text-cyber-gold">남은 시간</p>
                      <div className="text-4xl font-terminal font-bold text-cyber-gold">
                        <Timer timeLeft={answerTimer.timeLeft} />
                      </div>
                    </div>
                  </div>
                )}

                <AnswerInput
                  question={currentTurn.question}
                  onChange={(value) => setCurrentAnswer(value)}
                  onSubmit={(answer) => {
                    if (myAnonymousId) {
                      handleSubmitAnswer(gameRoom.currentTurn, myAnonymousId, answer)
                      setSubmittedAnswer(true)
                      answerTimer.pause()
                    }
                  }}
                  submitted={!!myAnswer}
                />
              </>
            )}

            {/* 투표 단계 */}
            {allAnswersSubmitted && currentTurn.answers && (
              <div id="voting-section">
                {/* 투표 타이머 */}
                {!myVote && !currentTurn.voteResult && voteTimer.isRunning && (
                  <div className="bg-terminal-surface border-4 border-cyber-gold rounded-2xl p-6 shadow-glow-gold animate-pulse mb-6">
                    <div className="flex items-center justify-center gap-4">
                      <svg className="w-8 h-8 text-cyber-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-lg font-mono font-semibold text-cyber-gold">투표 남은 시간</p>
                      <div className="text-4xl font-terminal font-bold text-cyber-gold">
                        <Timer timeLeft={voteTimer.timeLeft} />
                      </div>
                    </div>
                  </div>
                )}

                <VotingBoard
                  answers={currentTurn.answers}
                  onVote={(votedFor) => {
                    handleSubmitVote(gameRoom.currentTurn, user.uid, votedFor)
                    setSubmittedVote(true)
                    voteTimer.pause()
                  }}
                  voted={!!myVote}
                  myVote={myVote?.votedFor || null}
                />
              </div>
            )}

            {/* 투표 결과 및 다음 턴 */}
            {allVotesSubmitted && currentTurn.voteResult && (
              <div className="bg-terminal-surface border-4 border-cyber-pink rounded-2xl p-8 shadow-glow-pink">
                <div className="text-center mb-8">
                  {currentTurn.voteResult.isAI ? (
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-phosphor-green/20 border-4 border-phosphor-green rounded-full mb-4 shadow-glow-green">
                      <svg className="w-14 h-14 text-phosphor-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-cyber-red/20 border-4 border-cyber-red rounded-full mb-4 shadow-glow-red">
                      <svg className="w-14 h-14 text-cyber-red" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                  <h2 className={`text-4xl font-terminal font-bold mb-4 ${
                    currentTurn.voteResult.isAI ? 'text-phosphor-green' : 'text-cyber-red'
                  }`}>
                    {currentTurn.voteResult.isAI ? 'AI를 찾았습니다!' : 'AI가 아닙니다'}
                  </h2>
                  <div className="bg-terminal-bg border-2 border-cyber-blue rounded-xl p-4 inline-block">
                    <p className="text-sm text-cyber-blue font-mono mb-1">최다 득표</p>
                    <p className="text-2xl font-terminal font-bold text-cyber-gold">
                      {currentTurn.voteResult.mostVotedPlayer}
                    </p>
                    <p className="text-lg font-mono text-white/70 mt-1">
                      {currentTurn.voteResult.voteCount}표
                    </p>
                  </div>
                </div>

                {currentTurn.voteResult.gameEnded ? (
                  <button
                    onClick={() => navigate(`/results/${roomId}`)}
                    className="w-full px-8 py-6 bg-terminal-surface border-4 border-phosphor-green text-phosphor-green font-terminal font-bold text-2xl
                               hover:bg-phosphor-green hover:text-terminal-bg transition-all duration-300
                               shadow-glow-green hover:shadow-glow-green hover:scale-105 rounded-xl"
                  >
                    결과 보기
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleNextTurn()
                      setSubmittedAnswer(false)
                      setSubmittedVote(false)
                    }}
                    className="w-full px-8 py-6 bg-terminal-surface border-4 border-cyber-blue text-cyber-blue font-terminal font-bold text-2xl
                               hover:bg-cyber-blue hover:text-terminal-bg transition-all duration-300
                               shadow-glow-blue hover:shadow-glow-blue hover:scale-105 rounded-xl"
                  >
                    다음 턴
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Finished 상태 */}
        {gameRoom.status === 'finished' && (
          <div className="bg-terminal-surface border-4 border-cyber-pink rounded-2xl p-12 text-center shadow-glow-pink">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-cyber-pink/20 border-4 border-cyber-pink rounded-full mb-6 shadow-glow-pink animate-scaleGlow">
              <svg className="w-20 h-20 text-cyber-pink" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
            </div>
            <h2 className="text-5xl font-terminal font-bold mb-6 text-cyber-pink">게임 종료!</h2>
            <p className="text-xl font-mono text-cyber-blue mb-8">
              모든 라운드가 완료되었습니다
            </p>
            <button
              onClick={() => navigate(`/results/${roomId}`)}
              className="px-12 py-6 bg-terminal-surface border-4 border-phosphor-green text-phosphor-green font-terminal font-bold text-2xl
                         hover:bg-phosphor-green hover:text-terminal-bg transition-all duration-300
                         shadow-glow-green hover:shadow-glow-green hover:scale-105 rounded-xl"
            >
              결과 보기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
