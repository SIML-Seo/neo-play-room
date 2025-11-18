import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useGameRoom } from '@/hooks/useGameRoom'
import { generateAIAnswer, checkVoteResult } from '@/services/ai'
import Button from '@/components/common/Button'
import Loader from '@/components/common/Loader'
import Timer from '@/components/common/Timer'
import AnswerInput from '@/components/game/AnswerInput'
import VotingBoard from '@/components/game/VotingBoard'

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

  // 투표 집계 호출 여부 추적 (중복 호출 방지)
  const voteResultChecked = useRef<Record<number, boolean>>({})

  // 로그인 안 되어 있으면 홈으로
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  // AI 답변 생성 (답변 제출 후)
  useEffect(() => {
    if (!gameRoom || !roomId || !user) return
    if (gameRoom.status !== 'in-progress') return

    const currentTurn = gameRoom.turns[gameRoom.currentTurn]
    if (!currentTurn || !currentTurn.answers) return

    const answerCount = Object.keys(currentTurn.answers).length

    // Easy/Normal: 모든 인간 플레이어(5명) 답변 제출 후 AI 답변 생성
    // Hard: 4명 제출 후 AI 답변 생성
    const requiredCount = gameRoom.difficulty === 'hard' ? 4 : 5

    if (answerCount === requiredCount) {
      // AI 답변이 아직 없으면 생성
      const myAnonymousId = getMyAnonymousId(user.uid)
      if (myAnonymousId && !currentTurn.answers[myAnonymousId]) {
        console.log('[GameRoom] AI 답변 생성 호출:', { requiredCount, answerCount })
        generateAIAnswer(roomId, gameRoom.currentTurn).catch((err) => {
          console.error('AI 답변 생성 실패:', err)
        })
      }
    }
  }, [gameRoom, roomId, user, getMyAnonymousId])

  // 투표 결과 자동 집계 (모든 플레이어 투표 완료 후)
  useEffect(() => {
    if (!gameRoom || !roomId) return
    if (gameRoom.status !== 'in-progress') return

    const currentTurn = gameRoom.turns[gameRoom.currentTurn]
    if (!currentTurn || !currentTurn.votes) return

    // 이미 투표 결과가 있으면 스킵
    if (currentTurn.voteResult) return

    const voteCount = Object.keys(currentTurn.votes).length

    // 모든 플레이어(5명)가 투표를 완료했고, 아직 집계하지 않았으면 집계 호출
    if (voteCount === 5 && !voteResultChecked.current[gameRoom.currentTurn]) {
      voteResultChecked.current[gameRoom.currentTurn] = true
      console.log('[GameRoom] 투표 집계 호출:', { voteCount })

      checkVoteResult(roomId, gameRoom.currentTurn).catch((err) => {
        console.error('투표 집계 실패:', err)
        // 실패 시 재시도 가능하도록 플래그 초기화
        voteResultChecked.current[gameRoom.currentTurn] = false
      })
    }
  }, [gameRoom, roomId])

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
  const currentTurn = gameRoom.turns[gameRoom.currentTurn]

  // 현재 턴의 내 답변/투표 여부
  const myAnswer = currentTurn?.answers?.[myAnonymousId || '']
  const myVote = currentTurn?.votes?.[user.uid]

  // 답변/투표 개수
  const answerCount = currentTurn?.answers ? Object.keys(currentTurn.answers).length : 0
  const voteCount = currentTurn?.votes ? Object.keys(currentTurn.votes).length : 0
  const allAnswersSubmitted = answerCount === 6 // 5명 + AI
  const allVotesSubmitted = voteCount === 5

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Project Turing</h1>
            <p className="text-gray-600 mt-1">Room ID: {roomId}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">난이도</p>
              <p className="text-lg font-bold capitalize">{gameRoom.difficulty}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">턴</p>
              <p className="text-lg font-bold">
                {gameRoom.currentTurn}/{gameRoom.maxTurns}
              </p>
            </div>
          </div>
        </div>

        {/* Waiting 상태 */}
        {gameRoom.status === 'waiting' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">게임 준비</h2>

            {/* 난이도 선택 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">난이도 선택</h3>
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'normal', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => handleDifficultyChange(diff)}
                    className={`
                      p-4 border-2 rounded-lg font-semibold transition-all
                      ${
                        gameRoom.difficulty === diff
                          ? 'border-primary bg-blue-50 text-primary'
                          : 'border-gray-300 hover:border-gray-400'
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
              <h3 className="text-lg font-semibold mb-4">플레이어 ({Object.keys(gameRoom.players).length}/5)</h3>
              <div className="space-y-2">
                {Object.values(gameRoom.players).map((player) => (
                  <div key={player.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {player.photoURL && (
                        <img src={player.photoURL} alt={player.name} className="w-10 h-10 rounded-full" />
                      )}
                      <span className="font-semibold">{player.name}</span>
                    </div>
                    {player.ready ? (
                      <span className="px-3 py-1 bg-success text-white text-sm font-semibold rounded-full">
                        준비 완료
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-300 text-gray-700 text-sm font-semibold rounded-full">
                        대기 중
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 준비 버튼 */}
            {gameRoom.players[user.uid] && (
              <Button
                onClick={() => handlePlayerReady(user.uid, !gameRoom.players[user.uid].ready)}
                size="lg"
                className="w-full"
                variant={gameRoom.players[user.uid].ready ? 'danger' : 'primary'}
              >
                {gameRoom.players[user.uid].ready ? '준비 취소' : '준비 완료'}
              </Button>
            )}

            {/* 게임 시작 버튼 */}
            {allPlayersReady() && (
              <div className="mt-4">
                <Button onClick={handleStartGame} size="lg" className="w-full" variant="success">
                  게임 시작
                </Button>
              </div>
            )}
          </div>
        )}

        {/* In-Progress 상태 */}
        {gameRoom.status === 'in-progress' && currentTurn && (
          <div className="space-y-6">
            {/* 턴 정보 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Turn {gameRoom.currentTurn}</h2>
                  <p className="text-gray-600 mt-1">카테고리: {currentTurn.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">답변 제출</p>
                  <p className="text-2xl font-bold">
                    {answerCount}/6
                  </p>
                </div>
              </div>
            </div>

            {/* 답변 단계 */}
            {!allAnswersSubmitted && (
              <AnswerInput
                question={currentTurn.question}
                onSubmit={(answer) => {
                  if (myAnonymousId) {
                    handleSubmitAnswer(gameRoom.currentTurn, myAnonymousId, answer)
                    setSubmittedAnswer(true)
                  }
                }}
                submitted={!!myAnswer}
              />
            )}

            {/* 투표 단계 */}
            {allAnswersSubmitted && currentTurn.answers && (
              <VotingBoard
                answers={currentTurn.answers}
                onVote={(votedFor) => {
                  handleSubmitVote(gameRoom.currentTurn, user.uid, votedFor)
                  setSubmittedVote(true)
                }}
                voted={!!myVote}
                myVote={myVote?.votedFor || null}
              />
            )}

            {/* 투표 진행 상황 */}
            {allAnswersSubmitted && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">투표 진행 상황</p>
                  <p className="text-2xl font-bold">
                    {voteCount}/5
                  </p>
                </div>
              </div>
            )}

            {/* 투표 결과 및 다음 턴 */}
            {allVotesSubmitted && currentTurn.voteResult && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold mb-6 text-center">
                  {currentTurn.voteResult.isAI ? '🎉 AI를 찾았습니다!' : '❌ AI가 아닙니다'}
                </h2>
                <div className="text-center mb-6">
                  <p className="text-xl">
                    최다 득표: <span className="font-bold">{currentTurn.voteResult.mostVotedPlayer}</span> (
                    {currentTurn.voteResult.voteCount}표)
                  </p>
                </div>

                {currentTurn.voteResult.gameEnded ? (
                  <Button onClick={() => navigate('/results')} size="lg" className="w-full" variant="success">
                    결과 보기
                  </Button>
                ) : (
                  <Button onClick={() => {
                    handleNextTurn()
                    setSubmittedAnswer(false)
                    setSubmittedVote(false)
                  }} size="lg" className="w-full">
                    다음 턴
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Finished 상태 */}
        {gameRoom.status === 'finished' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">게임 종료!</h2>
            <Button onClick={() => navigate('/results')} size="lg" variant="success">
              결과 보기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
