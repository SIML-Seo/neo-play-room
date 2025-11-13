import { useEffect, useState, useCallback } from 'react'
import {
  subscribeToGameRoom,
  updateCanvasData,
  nextTurn,
  updatePlayerReady,
  startGame,
  endGameByTurnLimit,
  updateDifficulty,
} from '@/services/gameRoom'
import type { GameRoom, GameDifficulty } from '@/types/game.types'
import { ENV } from '@/config/env'

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
        hasCanvasData: !!room?.canvasData,
        canvasDataLength: room?.canvasData?.length || 0,
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

  // 턴 수 초과 시 자동 게임 종료
  useEffect(() => {
    if (!gameRoom || !roomId) return
    if (gameRoom.status !== 'in-progress') return

    // turnCount가 maxTurns를 초과하면 게임 종료
    if (gameRoom.turnCount >= gameRoom.maxTurns) {
      console.log('⚠️ 최대 턴 수 초과! 게임을 종료합니다.')
      endGameByTurnLimit(roomId).catch((err) => {
        console.error('Failed to end game:', err)
      })
    }
  }, [gameRoom, roomId])

  // 캔버스 업데이트
  const handleCanvasChange = useCallback(
    async (canvasData: string) => {
      if (!roomId) return

      try {
        console.log('[useGameRoom] 캔버스 데이터 업데이트 중...', canvasData.substring(0, 50))
        await updateCanvasData(roomId, canvasData)
        console.log('[useGameRoom] 캔버스 데이터 업데이트 완료')
      } catch (err) {
        console.error('Failed to update canvas:', err)
        const errorMessage = err instanceof Error ? err.message : '캔버스 업데이트에 실패했습니다.'
        setError(errorMessage)
      }
    },
    [roomId]
  )

  // 다음 턴
  const handleNextTurn = useCallback(async () => {
    if (!roomId) return

    try {
      await nextTurn(roomId)
    } catch (err) {
      console.error('Failed to go to next turn:', err)
      const errorMessage = err instanceof Error ? err.message : '턴 넘기기에 실패했습니다.'
      setError(errorMessage)
    }
  }, [roomId])

  // 준비 상태 업데이트
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
    async (difficulty: GameDifficulty) => {
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

  // 현재 플레이어가 그릴 차례인지
  const isMyTurn = useCallback(
    (userId: string) => {
      if (!gameRoom) return false
      return gameRoom.currentTurn === userId
    },
    [gameRoom]
  )

  // 남은 시간 계산
  const getRemainingTime = useCallback(() => {
    if (!gameRoom?.turnStartTime) return ENV.game.turnTimeLimit

    const elapsed = Math.floor((Date.now() - gameRoom.turnStartTime) / 1000)
    const remaining = Math.max(0, ENV.game.turnTimeLimit - elapsed)
    return remaining
  }, [gameRoom])

  return {
    gameRoom,
    loading,
    error,
    handleCanvasChange,
    handleNextTurn,
    handlePlayerReady,
    handleDifficultyChange,
    handleStartGame,
    isMyTurn,
    getRemainingTime,
  }
}
