import { ref, onValue, set, remove, push, serverTimestamp } from 'firebase/database'
import { database } from '@/firebase'
import type { User } from 'firebase/auth'
import type { Player } from '@/types/game.types'
import { shuffle } from '@shared/utils/shuffle'

export interface WaitingPlayer {
  uid: string
  name: string
  email: string
  photoURL: string | null
  joinedAt: number
}

const LOBBY_PATH = 'lobby/waitingPlayers'
const MAX_PLAYERS = Number(import.meta.env.VITE_MAX_PLAYERS) || 5

/**
 * 대기실에 플레이어 추가
 */
export async function joinLobby(user: User): Promise<void> {
  const playerRef = ref(database, `${LOBBY_PATH}/${user.uid}`)

  const playerData: WaitingPlayer = {
    uid: user.uid,
    name: user.displayName || 'Anonymous',
    email: user.email || '',
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
 * 5명이 모였는지 확인
 */
export function checkAndStartGame(players: WaitingPlayer[]): boolean {
  return players.length >= MAX_PLAYERS
}

/**
 * 게임 룸 생성
 */
export async function createGameRoom(players: WaitingPlayer[]): Promise<string> {
  const roomsRef = ref(database, 'gameRooms')
  const newRoomRef = push(roomsRef)
  const roomId = newRoomRef.key!

  // 익명 ID 할당 (player_1 ~ player_6)
  const anonymousIds = shuffle([
    'player_1',
    'player_2',
    'player_3',
    'player_4',
    'player_5',
    'player_6',
  ])

  // AI는 6번째 플레이어 (마지막 anonymousId)
  const aiPlayerId = anonymousIds[5]

  // 플레이어 데이터 구성
  const playersData: Record<string, Player> = {}
  players.forEach((player, index) => {
    const playerData: Player = {
      uid: player.uid,
      name: player.name,
      email: player.email,
      anonymousId: anonymousIds[index],
      ready: false,
    }

    // photoURL이 있을 때만 추가 (undefined 방지)
    if (player.photoURL) {
      playerData.photoURL = player.photoURL
    }

    playersData[player.uid] = playerData
  })

  // 게임 룸 생성
  await set(newRoomRef, {
    roomId,
    status: 'waiting',
    difficulty: 'normal', // 기본 난이도
    currentTurn: 1,
    maxTurns: Number(import.meta.env.VITE_MAX_TURNS) || 5,
    aiPlayerId, // 보안 규칙으로 클라이언트에서 읽기 차단
    startTime: serverTimestamp(), // ✅ serverTimestamp 사용 (findMyGameRoom이 제대로 작동하도록)
    endTime: null,
    players: playersData,
    turns: {},
  })

  // 대기열에서 플레이어들 제거
  await Promise.all(players.map((p) => leaveLobby(p.uid)))

  console.log('[createGameRoom] 게임 룸 생성 완료:', roomId)

  return roomId
}

/**
 * 플레이어가 속한 게임 룸 찾기
 */
export async function findMyGameRoom(uid: string): Promise<string | null> {
  const { ref: dbRef, get } = await import('firebase/database')

  const roomsRef = dbRef(database, 'gameRooms')
  const snapshot = await get(roomsRef)

  if (!snapshot.exists()) {
    console.log('[findMyGameRoom] gameRooms 없음')
    return null
  }

  // 내가 속한 방 찾기 (waiting 또는 in-progress 상태만)
  let foundRoomId: string | null = null

  snapshot.forEach((child) => {
    const roomData = child.val()
    console.log('[findMyGameRoom] 방 체크:', {
      roomId: child.key,
      hasPlayers: !!roomData.players,
      hasMe: roomData.players && !!roomData.players[uid],
      status: roomData.status,
    })

    if (
      roomData.players &&
      roomData.players[uid] &&
      (roomData.status === 'waiting' || roomData.status === 'in-progress')
    ) {
      foundRoomId = child.key
      console.log('[findMyGameRoom] 찾음!', foundRoomId)
    }
  })

  console.log('[findMyGameRoom] 최종 결과:', { uid, foundRoomId })
  return foundRoomId
}
