/**
 * 로컬 스토리지 캐싱 유틸리티
 * Firestore 읽기 비용 절감을 위한 캐시 레이어
 */

interface CacheItem<T> {
  data: T
  timestamp: number
}

const CACHE_PREFIX = 'project-da-vinci-cache-'

/**
 * 캐시에 데이터 저장
 */
export function setCache<T>(key: string, data: T): void {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem))
  } catch (error) {
    console.error('[setCache] 저장 실패:', error)
  }
}

/**
 * 캐시에서 데이터 조회
 * @param key 캐시 키
 * @param maxAgeMs 최대 유효 시간 (밀리초)
 * @returns 캐시된 데이터 또는 null
 */
export function getCache<T>(key: string, maxAgeMs: number): T | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key)
    if (!cached) return null

    const cacheItem: CacheItem<T> = JSON.parse(cached)
    const age = Date.now() - cacheItem.timestamp

    // 캐시가 만료되었으면 삭제하고 null 반환
    if (age > maxAgeMs) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }

    return cacheItem.data
  } catch (error) {
    console.error('[getCache] 조회 실패:', error)
    return null
  }
}

/**
 * 캐시 무효화 (삭제)
 */
export function invalidateCache(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
  } catch (error) {
    console.error('[invalidateCache] 실패:', error)
  }
}

/**
 * 모든 캐시 삭제
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('[clearAllCache] 실패:', error)
  }
}
