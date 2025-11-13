/**
 * 게임 스케줄 관리 훅
 * Firestore 실시간 구독 (변경될 때만 비용 발생)
 */

import { useState, useEffect } from 'react'
import {
  subscribeToGameSchedule,
  isGameAllowed,
  getNextOpenTime,
  formatTimeUntil,
} from '@/services/schedule'
import type { GameScheduleConfig } from '@/types/game.types'

interface UseGameScheduleReturn {
  schedule: GameScheduleConfig | null
  isAllowed: boolean
  nextOpenTime: Date | null
  timeUntilOpen: string
  loading: boolean
}

export function useGameSchedule(): UseGameScheduleReturn {
  const [schedule, setSchedule] = useState<GameScheduleConfig | null>(null)
  const [isAllowed, setIsAllowed] = useState(true)
  const [nextOpenTime, setNextOpenTime] = useState<Date | null>(null)
  const [timeUntilOpen, setTimeUntilOpen] = useState('')
  const [loading, setLoading] = useState(true)

  // 스케줄 실시간 구독 (초기 1회 + 변경 시에만 비용 발생)
  useEffect(() => {
    console.log('[useGameSchedule] Firestore 실시간 구독 시작')
    const unsubscribe = subscribeToGameSchedule((newSchedule) => {
      console.log('[useGameSchedule] 스케줄 업데이트 수신:', newSchedule)
      setSchedule(newSchedule)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // 게임 허용 상태 및 다음 시간 계산
  useEffect(() => {
    const updateAllowedStatus = () => {
      const allowed = isGameAllowed(schedule)
      setIsAllowed(allowed)

      if (!allowed) {
        const nextTime = getNextOpenTime(schedule)
        setNextOpenTime(nextTime)
        if (nextTime) {
          setTimeUntilOpen(formatTimeUntil(nextTime))
        }
      } else {
        setNextOpenTime(null)
        setTimeUntilOpen('')
      }
    }

    updateAllowedStatus()

    // 1분마다 상태 업데이트
    const interval = setInterval(updateAllowedStatus, 60000)

    return () => clearInterval(interval)
  }, [schedule])

  return {
    schedule,
    isAllowed,
    nextOpenTime,
    timeUntilOpen,
    loading,
  }
}
