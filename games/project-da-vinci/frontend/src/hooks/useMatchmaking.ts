import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  joinLobby,
  leaveLobby,
  subscribeToWaitingPlayers,
  createGameRoom,
  checkAndStartGame,
  findMyGameRoom,
  type WaitingPlayer,
} from '@/services/matchmaking'
import { useAuth } from './useAuth'

export function useMatchmaking() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [waitingPlayers, setWaitingPlayers] = useState<WaitingPlayer[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wasInLobby, setWasInLobby] = useState(false)

  // 게임 시작 처리
  const handleGameStart = useCallback(
    async (players: WaitingPlayer[]) => {
      try {
        // 첫 번째 플레이어만 게임 룸 생성 (중복 방지)
        const isFirstPlayer = user && players[0]?.uid === user.uid

        if (isFirstPlayer) {
          const roomId = await createGameRoom(players)
          navigate(`/game/${roomId}`)
        }
        // 다른 플레이어들은 subscribeToWaitingPlayers에서 자동으로 navigate
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
    let hasNavigated = false

    const unsubscribe = subscribeToWaitingPlayers((players) => {
      // 이미 네비게이션 된 경우 무시
      if (hasNavigated) return

      const isCurrentlyInLobby = user ? players.some((p) => p.uid === user.uid) : false

      console.log('[useMatchmaking] 구독 콜백:', {
        uid: user?.uid,
        wasInLobby,
        isCurrentlyInLobby,
        playerCount: players.length,
        playerUids: players.map(p => p.uid)
      })

      // 이전에 대기실에 있었는데 지금은 없다면 = 게임 룸으로 이동됨
      if (wasInLobby && !isCurrentlyInLobby && user) {
        console.log('[useMatchmaking] 대기실에서 제거됨, 게임 룸 찾는 중...')
        hasNavigated = true // 네비게이션 플래그 설정

        // 내가 속한 게임 룸 찾아서 이동
        findMyGameRoom(user.uid)
          .then((roomId) => {
            console.log('[useMatchmaking] 게임 룸 찾음:', roomId)
            if (roomId) {
              navigate(`/game/${roomId}`)
            } else {
              console.warn('[useMatchmaking] 게임 룸을 찾지 못함')
              hasNavigated = false // 실패시 플래그 리셋
            }
          })
          .catch((err) => {
            console.error('[useMatchmaking] 게임 룸 찾기 실패:', err)
            hasNavigated = false // 실패시 플래그 리셋
          })
        return // 네비게이션 시작했으므로 이후 로직 실행 안함
      }

      setWasInLobby(isCurrentlyInLobby)
      setWaitingPlayers(players)

      // 5명 모였는지 확인
      if (checkAndStartGame(players)) {
        handleGameStart(players)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [handleGameStart, user, wasInLobby, navigate])

  // 대기실 입장
  const joinWaitingRoom = useCallback(async () => {
    if (!user) return

    try {
      setIsJoining(true)
      setError(null)
      await joinLobby(user)
      setWasInLobby(true) // 입장 즉시 wasInLobby 설정
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
