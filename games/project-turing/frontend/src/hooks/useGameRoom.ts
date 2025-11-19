import { useEffect, useState, useCallback } from 'react'
import {
  subscribeToGameRoom,
  updatePlayerReady,
  updateDifficulty,
  startGame,
  submitAnswer,
  submitVote,
  markNextTurnReady,
  nextTurn,
} from '@/services/gameRoom'
import type { GameRoom, Difficulty } from '@/types/game.types'

export function useGameRoom(roomId: string | undefined) {
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 게임 룸 데이터 구독
  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToGameRoom(roomId, (room) => {
      console.log('[useGameRoom] 게임 룸 데이터 수신:', {
        hasRoom: !!room,
        status: room?.status,
        currentTurn: room?.currentTurn,
      })
      setGameRoom(room)
      setLoading(false)

      if (!room) {
        setError('게임 룸을 찾을 수 없습니다.')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [roomId])

  // 플레이어 준비
  const handlePlayerReady = useCallback(
    async (playerId: string, ready: boolean) => {
      if (!roomId) return

      try {
        await updatePlayerReady(roomId, playerId, ready)
      } catch (err) {
        console.error('Failed to update player ready:', err)
      }
    },
    [roomId]
  )

  // 난이도 변경
  const handleDifficultyChange = useCallback(
    async (difficulty: Difficulty) => {
      if (!roomId) return

      try {
        await updateDifficulty(roomId, difficulty)
      } catch (err) {
        console.error('Failed to update difficulty:', err)
        const errorMessage = err instanceof Error ? err.message : '난이도 변경에 실패했습니다.'
        setError(errorMessage)
      }
    },
    [roomId]
  )

  // 게임 시작
  const handleStartGame = useCallback(async () => {
    if (!roomId) return

    try {
      await startGame(roomId)
    } catch (err) {
      console.error('Failed to start game:', err)
      const errorMessage = err instanceof Error ? err.message : '게임 시작에 실패했습니다.'
      setError(errorMessage)
    }
  }, [roomId])

  // 답변 제출
  const handleSubmitAnswer = useCallback(
    async (turnNumber: number, anonymousId: string, answerText: string) => {
      if (!roomId) return

      try {
        await submitAnswer(roomId, turnNumber, anonymousId, answerText)
      } catch (err) {
        console.error('Failed to submit answer:', err)
        const errorMessage = err instanceof Error ? err.message : '답변 제출에 실패했습니다.'
        setError(errorMessage)
      }
    },
    [roomId]
  )

  // 투표 제출
  const handleSubmitVote = useCallback(
    async (turnNumber: number, uid: string, votedFor: string) => {
      if (!roomId) return

      try {
        await submitVote(roomId, turnNumber, uid, votedFor)
      } catch (err) {
        console.error('Failed to submit vote:', err)
        const errorMessage = err instanceof Error ? err.message : '투표 제출에 실패했습니다.'
        setError(errorMessage)
      }
    },
    [roomId]
  )

  // 다음 턴 준비 표시
  const handleNextTurnReady = useCallback(
    async (turnNumber: number, uid: string) => {
      if (!roomId) return

      try {
        await markNextTurnReady(roomId, turnNumber, uid)
      } catch (err) {
        console.error('Failed to mark next turn ready:', err)
        const errorMessage = err instanceof Error ? err.message : '다음 턴 준비 실패'
        setError(errorMessage)
      }
    },
    [roomId]
  )

  // 다음 턴 시작 (모든 플레이어 준비 완료 시 자동 실행)
  const handleNextTurn = useCallback(async () => {
    if (!roomId) return

    try {
      await nextTurn(roomId)
    } catch (err) {
      console.error('Failed to go to next turn:', err)
      const errorMessage = err instanceof Error ? err.message : '다음 턴으로 넘어가는데 실패했습니다.'
      setError(errorMessage)
    }
  }, [roomId])

  // 내 익명 ID 찾기
  const getMyAnonymousId = useCallback(
    (userId: string) => {
      if (!gameRoom) return null
      const player = gameRoom.players[userId]
      return player?.anonymousId || null
    },
    [gameRoom]
  )

  // 모든 플레이어가 준비되었는지
  const allPlayersReady = useCallback(() => {
    if (!gameRoom) return false
    const players = Object.values(gameRoom.players)
    return players.length > 0 && players.every((p) => p.ready)
  }, [gameRoom])

  return {
    gameRoom,
    loading,
    error,
    handlePlayerReady,
    handleDifficultyChange,
    handleStartGame,
    handleSubmitAnswer,
    handleSubmitVote,
    handleNextTurnReady,
    handleNextTurn,
    getMyAnonymousId,
    allPlayersReady,
  }
}
