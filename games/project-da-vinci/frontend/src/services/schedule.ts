/**
 * 게임 스케줄 관리 서비스
 * Firestore를 사용하여 게임 가능 시간대 관리
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { firestore } from '@/firebase'
import type { GameScheduleConfig, GameScheduleDateRange } from '@/types/game.types'

/**
 * 게임 스케줄 설정 조회
 */
export async function getGameSchedule(): Promise<GameScheduleConfig | null> {
  try {
    const docRef = doc(firestore, 'gameSchedules', 'config')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as GameScheduleConfig
    }
    return null
  } catch (error) {
    console.error('[getGameSchedule] 스케줄 조회 실패:', error)
    return null
  }
}

/**
 * 게임 스케줄 설정 업데이트 (마스터 계정만)
 */
export async function updateGameSchedule(
  dateRanges: GameScheduleDateRange[],
  updatedBy: string
): Promise<void> {
  try {
    const docRef = doc(firestore, 'gameSchedules', 'config')
    await setDoc(docRef, {
      dateRanges,
      updatedBy,
      updatedAt: new Date(),
    })
    console.log('[updateGameSchedule] 스케줄 업데이트 완료')
  } catch (error) {
    console.error('[updateGameSchedule] 스케줄 업데이트 실패:', error)
    throw error
  }
}

/**
 * 게임 스케줄 실시간 구독
 */
export function subscribeToGameSchedule(
  callback: (schedule: GameScheduleConfig | null) => void
): () => void {
  const docRef = doc(firestore, 'gameSchedules', 'config')

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as GameScheduleConfig)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('[subscribeToGameSchedule] 구독 오류:', error)
      callback(null)
    }
  )

  return unsubscribe
}

/**
 * 현재 시간이 게임 가능 시간대인지 확인
 */
export function isGameAllowed(schedule: GameScheduleConfig | null): boolean {
  if (!schedule || schedule.dateRanges.length === 0) {
    // 스케줄이 없으면 항상 허용
    return true
  }

  const now = new Date()
  const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()

  // 오늘 날짜의 허용 시간대 찾기
  const todaySchedules = schedule.dateRanges.filter((range) => range.date === currentDate)

  for (const timeSlot of todaySchedules) {
    const [startHour, startMin] = timeSlot.start.split(':').map(Number)
    const [endHour, endMin] = timeSlot.end.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
      return true
    }
  }

  return false
}

/**
 * 다음 게임 가능 시간 계산
 */
export function getNextOpenTime(schedule: GameScheduleConfig | null): Date | null {
  if (!schedule || schedule.dateRanges.length === 0) {
    return null
  }

  const now = new Date()
  const currentDateTime = now.getTime()

  // 모든 날짜/시간대를 Date 객체로 변환하여 정렬
  const futureTimes = schedule.dateRanges
    .map((range) => {
      const startDate = new Date(`${range.date}T${range.start}:00`)
      return { date: startDate, range }
    })
    .filter((item) => item.date.getTime() > currentDateTime)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (futureTimes.length === 0) {
    return null
  }

  return futureTimes[0].date
}

/**
 * 남은 시간을 읽기 쉬운 형식으로 변환
 */
export function formatTimeUntil(targetDate: Date): string {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()

  if (diff <= 0) return '곧 시작'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}일 ${hours}시간 ${minutes}분 후`
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분 후`
  } else {
    return `${minutes}분 후`
  }
}
