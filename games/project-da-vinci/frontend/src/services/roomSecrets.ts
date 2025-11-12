import { ref, onValue, set } from 'firebase/database'
import { database } from '@/firebase'

export interface RoomSecret {
  targetWord: string
}

/**
 * 방 시크릿(정답 단어) 저장
 * 최초 생성 시 한 번만 호출
 */
export async function setRoomSecret(roomId: string, targetWord: string): Promise<void> {
  await set(ref(database, `roomSecrets/${roomId}`), {
    targetWord,
  })
}

/**
 * 현재 턴 플레이어가 정답 단어를 구독
 */
export function subscribeToRoomSecret(
  roomId: string,
  callback: (secret: RoomSecret | null) => void
): () => void {
  const secretRef = ref(database, `roomSecrets/${roomId}`)

  const unsubscribe = onValue(secretRef, (snapshot) => {
    const value = snapshot.val() as RoomSecret | null
    callback(value)
  })

  return unsubscribe
}
