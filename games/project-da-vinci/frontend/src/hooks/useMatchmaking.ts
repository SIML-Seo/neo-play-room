import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  joinLobby,
  leaveLobby,
  subscribeToWaitingPlayers,
  createGameRoom,
  checkAndStartGame,
  type WaitingPlayer,
} from '@/services/matchmaking'
import { useAuth } from './useAuth'

export function useMatchmaking() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [waitingPlayers, setWaitingPlayers] = useState<WaitingPlayer[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 게임 시작 처리
  const handleGameStart = useCallback(
    async (players: WaitingPlayer[]) => {
      try {
        // 첫 번째 플레이어만 게임 룸 생성 (중복 방지)
        const isFirstPlayer = user && players[0]?.uid === user.uid

        if (isFirstPlayer) {
          const roomId = await createGameRoom(players)
          navigate(`/game/${roomId}`)
        } else {
          // 다른 플레이어들은 게임 룸이 생성될 때까지 대기
          // 대기열에서 제거되면 자동으로 navigate
        }
      } catch (err) {
        console.error('Failed to start game:', err)
        const errorMessage = err instanceof Error ? err.message : '게임 시작에 실패했습니다.'
        setError(errorMessage)
      }
    },
    [user, navigate]
  )

  // 대기 중인 플레이어 목록 실시간 구독
  useEffect(() => {
    const unsubscribe = subscribeToWaitingPlayers((players) => {
      setWaitingPlayers(players)

      // 5명 모였는지 확인
      if (checkAndStartGame(players)) {
        handleGameStart(players)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [handleGameStart])

  // 대기실 입장
  const joinWaitingRoom = useCallback(async () => {
    if (!user) return

    try {
      setIsJoining(true)
      setError(null)
      await joinLobby(user)
    } catch (err) {
      console.error('Failed to join lobby:', err)
      const errorMessage = err instanceof Error ? err.message : '대기실 입장에 실패했습니다.'
      setError(errorMessage)
    } finally {
      setIsJoining(false)
    }
  }, [user])

  // 대기실 퇴장
  const leaveWaitingRoom = async () => {
    if (!user) return

    try {
      await leaveLobby(user.uid)
    } catch (err) {
      console.error('Failed to leave lobby:', err)
    }
  }

  // 컴포넌트 언마운트 시 대기실 퇴장
  useEffect(() => {
    return () => {
      if (user) {
        leaveLobby(user.uid).catch(console.error)
      }
    }
  }, [user])

  return {
    waitingPlayers,
    isJoining,
    error,
    joinWaitingRoom,
    leaveWaitingRoom,
    isInWaitingRoom: waitingPlayers.some((p) => p.uid === user?.uid),
  }
}
