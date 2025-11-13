/**
 * 게임 로그 조회 서비스
 * Firestore에서 게임 로그 데이터 조회
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { firestore } from '@/firebase'
import type { GameLog } from '@/types/game.types'

/**
 * 특정 기간의 게임 로그 조회
 * @param startDate 시작 날짜 (YYYY-MM-DD)
 * @param endDate 종료 날짜 (YYYY-MM-DD)
 * @returns 게임 로그 배열 (최신순)
 */
export async function getGameLogsByDateRange(
  startDate: string,
  endDate: string
): Promise<GameLog[]> {
  try {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    console.log('[getGameLogsByDateRange] 조회 기간:', { startDate, endDate })

    const logsRef = collection(firestore, 'gameLogs')
    const q = query(
      logsRef,
      where('finishedAt', '>=', Timestamp.fromDate(start)),
      where('finishedAt', '<=', Timestamp.fromDate(end)),
      orderBy('finishedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const logs: GameLog[] = []

    querySnapshot.forEach((doc) => {
      logs.push({
        logId: doc.id,
        ...doc.data(),
      } as GameLog)
    })

    console.log('[getGameLogsByDateRange] 조회 결과:', logs.length, '개')
    return logs
  } catch (error) {
    console.error('[getGameLogsByDateRange] 조회 실패:', error)
    throw error
  }
}

/**
 * 최근 N개의 게임 로그 조회
 * @param count 조회할 게임 수
 * @returns 게임 로그 배열 (최신순)
 */
export async function getRecentGameLogs(count: number = 20): Promise<GameLog[]> {
  try {
    console.log('[getRecentGameLogs] 최근', count, '개 조회')

    const logsRef = collection(firestore, 'gameLogs')
    const q = query(logsRef, orderBy('finishedAt', 'desc'), limit(count))

    const querySnapshot = await getDocs(q)
    const logs: GameLog[] = []

    querySnapshot.forEach((doc) => {
      logs.push({
        logId: doc.id,
        ...doc.data(),
      } as GameLog)
    })

    console.log('[getRecentGameLogs] 조회 결과:', logs.length, '개')
    return logs
  } catch (error) {
    console.error('[getRecentGameLogs] 조회 실패:', error)
    throw error
  }
}

/**
 * 게임 로그를 회차별로 그룹화
 * @param logs 게임 로그 배열
 * @returns 날짜별로 그룹화된 게임 로그 맵
 */
export function groupGameLogsBySession(logs: GameLog[]): Map<string, GameLog[]> {
  const grouped = new Map<string, GameLog[]>()

  logs.forEach((log) => {
    // finishedAt을 Date로 변환
    const finishedDate = log.finishedAt?.toDate?.() || new Date(log.completedAt)
    const dateKey = finishedDate.toISOString().split('T')[0] // YYYY-MM-DD

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(log)
  })

  // 각 날짜 내에서 성공한 게임을 시간순으로 정렬
  grouped.forEach((sessionLogs) => {
    sessionLogs.sort((a, b) => {
      const aTime = a.finishedAt?.toDate?.()?.getTime() || a.completedAt
      const bTime = b.finishedAt?.toDate?.()?.getTime() || b.completedAt
      return aTime - bTime
    })
  })

  return grouped
}

/**
 * 난이도별 가중치 반환
 * @param difficulty 난이도 (easy, normal, hard)
 * @returns 점수 보정 가중치
 *
 * 호환성 참고:
 * - finalize.ts에서 난이도 미지정 시 'normal'로 저장
 * - 만약 난이도가 누락된 경우 1.0 반환 (easy와 동일하게 처리)
 */
function getDifficultyMultiplier(difficulty: string): number {
  switch (difficulty) {
    case 'easy':
      return 1.0 // 기준
    case 'normal':
      return 1.3 // 30% 보정
    case 'hard':
      return 1.6 // 60% 보정
    default:
      return 1.0 // 알 수 없는 난이도는 easy와 동일하게 처리
  }
}

/**
 * 난이도 보정 점수 계산
 * 점수 = (턴 수 / 난이도 가중치) * 1000 + (시간 / 1000)
 * 낮을수록 높은 순위
 *
 * @param log 게임 로그
 * @returns 보정 점수
 */
export function calculateScore(log: GameLog): number {
  const multiplier = getDifficultyMultiplier(log.difficulty)

  // 턴 점수: 난이도 보정 적용 (가중치로 나누면 어려운 난이도일수록 점수가 낮아짐)
  const turnScore = (log.finalTurnCount / multiplier) * 1000

  // 시간 점수: 초 단위로 변환
  const timeScore = log.finalTime / 1000

  return turnScore + timeScore
}

/**
 * 게임 로그를 순위별로 정렬 (난이도 보정 점수 기반)
 * @param logs 게임 로그 배열
 * @returns 순위별로 정렬된 게임 로그 배열 (보정 점수 낮은 순)
 */
export function sortGameLogsByRanking(logs: GameLog[]): GameLog[] {
  // 성공한 게임만 필터링
  const successfulGames = logs.filter((log) => log.result === 'success')

  // 보정 점수로 정렬 (낮을수록 높은 순위)
  return successfulGames.sort((a, b) => {
    const scoreA = calculateScore(a)
    const scoreB = calculateScore(b)
    return scoreA - scoreB
  })
}
