import { ref, onValue, set, remove, push, serverTimestamp } from 'firebase/database'
import { database } from '@/firebase'
import type { User } from 'firebase/auth'
import { ENV } from '@/config/env'
import { setRoomSecret } from '@/services/roomSecrets'

export interface WaitingPlayer {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  joinedAt: number
}

interface GameRoomPlayer {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  ready: boolean
}

const LOBBY_PATH = 'lobby/waitingPlayers'
const MAX_PLAYERS = ENV.game.maxPlayers

/**
 * 대기실에 플레이어 추가
 */
export async function joinLobby(user: User): Promise<void> {
  const playerRef = ref(database, `${LOBBY_PATH}/${user.uid}`)

  const playerData: WaitingPlayer = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    joinedAt: Date.now(),
  }

  await set(playerRef, playerData)
}

/**
 * 대기실에서 플레이어 제거
 */
export async function leaveLobby(uid: string): Promise<void> {
  const playerRef = ref(database, `${LOBBY_PATH}/${uid}`)
  await remove(playerRef)
}

/**
 * 대기 중인 플레이어 목록 실시간 구독
 */
export function subscribeToWaitingPlayers(
  callback: (players: WaitingPlayer[]) => void
): () => void {
  const lobbyRef = ref(database, LOBBY_PATH)

  const unsubscribe = onValue(lobbyRef, (snapshot) => {
    const data = snapshot.val()

    if (!data) {
      callback([])
      return
    }

    const players: WaitingPlayer[] = Object.values(data)
    // joinedAt 순서로 정렬
    players.sort((a, b) => a.joinedAt - b.joinedAt)

    callback(players)
  })

  return unsubscribe
}

/**
 * 게임 룸 생성
 */
export async function createGameRoom(players: WaitingPlayer[]): Promise<string> {
  const roomsRef = ref(database, 'gameRooms')
  const newRoomRef = push(roomsRef)
  const roomId = newRoomRef.key!

  const turnOrder = players.map((p) => p.uid)

  await set(newRoomRef, {
    roomId,
    status: 'waiting', // waiting, in-progress, completed
    theme: ENV.isDevelopment ? '테스트' : '동물', // 개발: 단순한 테마, 상용: 랜덤 선택
    currentTurn: turnOrder[0],
    turnOrder,
    currentTurnIndex: 0,
    maxTurns: ENV.game.maxTurns,
    turnCount: 0,
    startTime: serverTimestamp(),
    canvasData: '', // 초기 빈 캔버스
    players: players.reduce(
      (acc, player) => {
        acc[player.uid] = {
          uid: player.uid,
          displayName: player.displayName || null,
          email: player.email || null,
          photoURL: player.photoURL || null,
          ready: false,
        }
        return acc
      },
      {} as Record<string, GameRoomPlayer>
    ),
    aiGuesses: [],
  })

  // 비공개 정답 단어 저장
  const targetWord = ENV.isDevelopment ? '집' : '고양이'
  await setRoomSecret(roomId, targetWord)

  // 대기열에서 플레이어들 제거
  await Promise.all(players.map((p) => leaveLobby(p.uid)))

  return roomId
}

/**
 * 5명이 모였는지 확인하고 자동으로 게임 시작
 */
export function checkAndStartGame(players: WaitingPlayer[]): boolean {
  return players.length >= MAX_PLAYERS
}

/**
 * 플레이어가 속한 게임 룸 찾기 (대기열에서 제거된 후 사용)
 */
export async function findMyGameRoom(uid: string): Promise<string | null> {
  const { ref: dbRef, get } = await import('firebase/database')

  const roomsRef = dbRef(database, 'gameRooms')
  const snapshot = await get(roomsRef)

  if (!snapshot.exists()) {
    return null
  }

  // 가장 최근에 생성된 방 중에서 내가 속한 방 찾기
  let foundRoomId: string | null = null
  let latestStartTime = 0

  snapshot.forEach((child) => {
    const roomData = child.val()
    if (roomData.players && roomData.players[uid]) {
      const startTime = roomData.startTime || 0
      if (startTime > latestStartTime) {
        latestStartTime = startTime
        foundRoomId = child.key
      }
    }
  })

  return foundRoomId
}
