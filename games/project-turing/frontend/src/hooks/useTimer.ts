import { useState, useEffect, useRef } from 'react'

/**
 * 카운트다운 타이머 훅
 * @param initialTime 초기 시간 (초 단위)
 * @param onExpire 타이머 만료 시 콜백
 * @param autoStart 자동 시작 여부
 */
export function useTimer(
  initialTime: number,
  onExpire?: () => void,
  autoStart = false
) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onExpireRef = useRef(onExpire)

  // onExpire를 ref로 관리하여 최신 값 유지
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  // 타이머 시작
  const start = () => {
    setIsRunning(true)
  }

  // 타이머 정지
  const pause = () => {
    setIsRunning(false)
  }

  // 타이머 리셋
  const reset = (newTime?: number) => {
    setIsRunning(false)
    setTimeLeft(newTime ?? initialTime)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // 타이머 로직
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          // 타이머 만료 콜백 실행
          if (onExpireRef.current) {
            onExpireRef.current()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
  }
}
