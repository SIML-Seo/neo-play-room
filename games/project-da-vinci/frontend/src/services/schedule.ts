/**
 * 게임 스케줄 관리 서비스
 * Firestore를 사용하여 게임 가능 시간대 관리
 * 주제 등록 시 자동으로 문제 풀 생성
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { firestore } from '@/firebase'
import type { GameScheduleConfig, GameScheduleDateRange } from '@/types/game.types'
import {
  getWordPoolByTheme,
  generateAndSaveWordPool,
  getAllWordPools,
  deleteWordPool,
} from '@/services/wordPools'

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
 * 주제가 새로 추가되면 자동으로 문제 풀 생성
 * 사용되지 않는 주제는 워드풀에서 자동 삭제
 */
export async function updateGameSchedule(
  dateRanges: GameScheduleDateRange[],
  updatedBy: string,
  autoGenerateWords: boolean = true
): Promise<void> {
  try {
    // 현재 스케줄에 있는 고유 주제 목록
    const scheduledThemes = new Set(dateRanges.map((range) => range.theme))

    // 새로운 주제 찾기 및 워드풀 생성
    if (autoGenerateWords) {
      for (const theme of scheduledThemes) {
        // 이미 문제 풀이 있는지 확인
        const existingPool = await getWordPoolByTheme(theme)

        if (!existingPool) {
          console.log(
            `[updateGameSchedule] "${theme}" 주제의 문제 풀이 없습니다. 자동 생성 시작...`
          )

          try {
            await generateAndSaveWordPool(
              theme,
              `${theme} 주제 (자동 생성)`,
              updatedBy,
              20 // 기본 20개 단어 생성
            )
            console.log(`[updateGameSchedule] ✅ "${theme}" 주제 문제 풀 생성 완료`)
          } catch (error) {
            console.error(`[updateGameSchedule] ❌ "${theme}" 주제 생성 실패:`, error)
            // 생성 실패해도 스케줄은 저장
          }
        } else {
          console.log(
            `[updateGameSchedule] "${theme}" 주제 문제 풀이 이미 존재 (${existingPool.words.length}개 단어)`
          )
        }
      }

      // 사용되지 않는 워드풀 삭제
      const allWordPools = await getAllWordPools()
      for (const pool of allWordPools) {
        if (!scheduledThemes.has(pool.theme)) {
          console.log(
            `[updateGameSchedule] "${pool.theme}" 주제가 스케줄에서 제거됨. 워드풀 삭제 중...`
          )
          try {
            await deleteWordPool(pool.theme)
            console.log(`[updateGameSchedule] ✅ "${pool.theme}" 워드풀 삭제 완료`)
          } catch (error) {
            console.error(`[updateGameSchedule] ❌ "${pool.theme}" 워드풀 삭제 실패:`, error)
            // 삭제 실패해도 계속 진행
          }
        }
      }
    }

    // 스케줄 저장
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

/**
 * 현재 시간의 게임 주제 가져오기
 */
export function getCurrentTheme(schedule: GameScheduleConfig | null): string | null {
  if (!schedule || schedule.dateRanges.length === 0) {
    return null
  }

  const now = new Date()
  const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()

  // 오늘 날짜의 활성 시간대 찾기
  const todaySchedules = schedule.dateRanges.filter((range) => range.date === currentDate)

  for (const timeSlot of todaySchedules) {
    const [startHour, startMin] = timeSlot.start.split(':').map(Number)
    const [endHour, endMin] = timeSlot.end.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
      return timeSlot.theme
    }
  }

  return null
}
