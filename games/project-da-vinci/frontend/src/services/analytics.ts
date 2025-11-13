/**
 * 분석 데이터 조회 서비스
 * Firestore에서 게임 통계 및 분석 데이터 조회
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore'
import { firestore } from '@/firebase'
import type { GameLog, DailyAnalytics, WordAnalytics } from '@/types/game.types'

/**
 * 게임 로그 조회 (최근 N개)
 */
export async function getRecentGameLogs(limitCount: number = 50): Promise<GameLog[]> {
  try {
    const logsRef = collection(firestore, 'gameLogs')
    const q = query(logsRef, orderBy('finishedAt', 'desc'), limit(limitCount))

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ logId: doc.id, ...doc.data() } as GameLog))
  } catch (error) {
    console.error('[getRecentGameLogs] 조회 실패:', error)
    return []
  }
}

/**
 * 난이도별 게임 로그 조회
 */
export async function getGameLogsByDifficulty(
  difficulty: string,
  limitCount: number = 50
): Promise<GameLog[]> {
  try {
    const logsRef = collection(firestore, 'gameLogs')
    const q = query(
      logsRef,
      where('difficulty', '==', difficulty),
      orderBy('finishedAt', 'desc'),
      limit(limitCount)
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ logId: doc.id, ...doc.data() } as GameLog))
  } catch (error) {
    console.error('[getGameLogsByDifficulty] 조회 실패:', error)
    return []
  }
}

/**
 * 실패한 게임 로그만 조회
 */
export async function getFailedGameLogs(limitCount: number = 50): Promise<GameLog[]> {
  try {
    const logsRef = collection(firestore, 'gameLogs')
    const q = query(
      logsRef,
      where('result', '==', 'failure'),
      orderBy('finishedAt', 'desc'),
      limit(limitCount)
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ logId: doc.id, ...doc.data() } as GameLog))
  } catch (error) {
    console.error('[getFailedGameLogs] 조회 실패:', error)
    return []
  }
}

/**
 * 일별 집계 데이터 조회 (최근 N일)
 */
export async function getDailyAnalytics(days: number = 30): Promise<DailyAnalytics[]> {
  try {
    const analyticsRef = collection(firestore, 'analytics')
    const docs: DailyAnalytics[] = []

    // 최근 N일간의 데이터를 개별 조회 (일별 document ID 패턴: daily_YYYY-MM-DD)
    const today = new Date()
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const docRef = doc(analyticsRef, `daily_${dateStr}`)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        docs.push({
          date: dateStr,
          totalGames: data.totalGames || 0,
          successCount: data.successCount || 0,
          failureCount: data.failureCount || 0,
          totalTurns: data.totalTurns || 0,
          avgTurns: data.totalGames > 0 ? data.totalTurns / data.totalGames : 0,
          avgTime: data.totalGames > 0 ? (data.totalTime || 0) / data.totalGames : 0,
        })
      }
    }

    return docs.sort((a, b) => b.date.localeCompare(a.date))
  } catch (error) {
    console.error('[getDailyAnalytics] 조회 실패:', error)
    return []
  }
}

/**
 * 단어별 통계 조회 (전체)
 */
export async function getWordAnalytics(): Promise<WordAnalytics[]> {
  try {
    const analyticsRef = collection(firestore, 'analytics')
    const q = query(analyticsRef, where('word', '!=', null))

    const snapshot = await getDocs(q)
    return snapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          word: data.word || '',
          attempts: data.attempts || 0,
          successCount: data.successCount || 0,
          successRate: data.attempts > 0 ? (data.successCount / data.attempts) * 100 : 0,
          avgTurns: data.attempts > 0 ? (data.totalTurns || 0) / data.attempts : 0,
          avgConfidence: data.attempts > 0 ? (data.totalConfidence || 0) / data.attempts : 0,
        } as WordAnalytics
      })
      .filter((w) => w.word) // word가 빈 문자열인 경우 제외
  } catch (error) {
    console.error('[getWordAnalytics] 조회 실패:', error)
    return []
  }
}

/**
 * 가장 어려운 단어 TOP N (성공률 낮은 순)
 */
export async function getHardestWords(topN: number = 10): Promise<WordAnalytics[]> {
  const allWords = await getWordAnalytics()
  return allWords
    .filter((w) => w.attempts >= 3) // 최소 3번 이상 시도된 단어만
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, topN)
}

/**
 * 전체 게임 통계 요약
 */
export async function getOverallStats(): Promise<{
  totalGames: number
  successRate: number
  avgTurns: number
  avgTime: number
}> {
  try {
    const dailyData = await getDailyAnalytics(365) // 최근 1년

    const totalGames = dailyData.reduce((sum, d) => sum + d.totalGames, 0)
    const totalSuccess = dailyData.reduce((sum, d) => sum + d.successCount, 0)
    const totalTurns = dailyData.reduce((sum, d) => sum + d.totalTurns, 0)
    const totalTime = dailyData.reduce((sum, d) => sum + d.avgTime * d.totalGames, 0)

    return {
      totalGames,
      successRate: totalGames > 0 ? (totalSuccess / totalGames) * 100 : 0,
      avgTurns: totalGames > 0 ? totalTurns / totalGames : 0,
      avgTime: totalGames > 0 ? totalTime / totalGames : 0,
    }
  } catch (error) {
    console.error('[getOverallStats] 조회 실패:', error)
    return { totalGames: 0, successRate: 0, avgTurns: 0, avgTime: 0 }
  }
}
