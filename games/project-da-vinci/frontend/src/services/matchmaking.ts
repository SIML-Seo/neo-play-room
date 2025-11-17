import { ref, onValue, set, remove, push, serverTimestamp } from 'firebase/database'
import { database } from '@/firebase'
import type { User } from 'firebase/auth'
import { ENV } from '@/config/env'
import { setRoomSecret } from '@/services/roomSecrets'
import { getGameSchedule, getCurrentTheme } from '@/services/schedule'
import { getWordPoolByTheme, selectRandomWord } from '@/services/wordPools'

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

  // 현재 스케줄에서 주제 가져오기
  let theme: string
  let targetWord: string

  if (ENV.isDevelopment) {
    // 개발 환경: 고정된 테스트 데이터
    theme = '테스트'
    targetWord = '집'
  } else {
    // 상용 환경: 스케줄에서 주제 가져오기
    const schedule = await getGameSchedule()
    const currentTheme = getCurrentTheme(schedule)

    if (currentTheme) {
      theme = currentTheme
      // 주제별 문제 풀에서 랜덤 단어 선택
      const wordPool = await getWordPoolByTheme(currentTheme)
      if (wordPool && wordPool.words.length > 0) {
        targetWord = selectRandomWord(wordPool.words)
      } else {
        // 문제 풀이 없으면 기본값 사용
        console.warn(`[createGameRoom] ${currentTheme} 주제의 문제 풀이 없습니다. 기본값 사용.`)
        targetWord = '고양이'
      }
    } else {
      // 스케줄이 없으면 기본 주제 사용
      console.warn('[createGameRoom] 현재 활성 스케줄이 없습니다. 기본 주제 사용.')
      theme = '동물'
      targetWord = '고양이'
    }
  }

  await set(newRoomRef, {
    roomId,
    status: 'waiting', // waiting, in-progress, completed
    theme,
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
  await setRoomSecret(roomId, targetWord)

  // 대기열에서 플레이어들 제거
  await Promise.all(players.map((p) => leaveLobby(p.uid)))

  console.log(`[createGameRoom] 게임 생성 완료 - 주제: ${theme}, 정답: ${targetWord}`)

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
