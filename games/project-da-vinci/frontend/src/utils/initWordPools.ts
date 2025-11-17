/**
 * 초기 주제별 문제 풀 데이터 Firestore에 업로드
 *
 * 사용법:
 * 1. 마스터 계정으로 로그인
 * 2. 브라우저 콘솔에서 다음 실행:
 *    import { initializeWordPools } from '@/utils/initWordPools'
 *    await initializeWordPools('마스터UID')
 */

import { updateWordPool, DEFAULT_WORD_POOLS } from '@/services/wordPools'

/**
 * 모든 기본 주제별 문제 풀을 Firestore에 저장
 */
export async function initializeWordPools(createdBy: string): Promise<void> {
  console.log('[initializeWordPools] 주제별 문제 풀 초기화 시작...')

  for (const pool of DEFAULT_WORD_POOLS) {
    try {
      await updateWordPool(pool.theme, pool.words, pool.description || '', createdBy)
      console.log(`✅ ${pool.theme}: ${pool.words.length}개 단어 저장 완료`)
    } catch (error) {
      console.error(`❌ ${pool.theme} 저장 실패:`, error)
    }
  }

  console.log('[initializeWordPools] 초기화 완료!')
  console.log(`총 ${DEFAULT_WORD_POOLS.length}개 주제 저장됨`)
}

/**
 * 특정 주제의 문제 풀만 업데이트
 */
export async function updateSingleTheme(
  theme: string,
  words: string[],
  description: string,
  createdBy: string
): Promise<void> {
  try {
    await updateWordPool(theme, words, description, createdBy)
    console.log(`✅ ${theme}: ${words.length}개 단어 저장 완료`)
  } catch (error) {
    console.error(`❌ ${theme} 저장 실패:`, error)
    throw error
  }
}
