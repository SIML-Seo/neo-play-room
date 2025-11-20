/**
 * 주제별 문제 풀 관리 서비스
 * Firestore를 사용하여 주제별 단어 목록 관리
 * Cloud Functions를 통한 AI 단어 자동 생성
 */

import { collection, doc, getDoc, setDoc, getDocs, deleteDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { firestore, functions } from '@/firebase'
import type { ThemeWordPool } from '@/types/game.types'
import { shuffle } from '@shared/utils/shuffle'

const WORD_POOLS_COLLECTION = 'wordPools'

/**
 * 특정 주제의 문제 풀 조회
 */
export async function getWordPoolByTheme(theme: string): Promise<ThemeWordPool | null> {
  try {
    const docRef = doc(firestore, WORD_POOLS_COLLECTION, theme)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as ThemeWordPool
    }
    return null
  } catch (error) {
    console.error(`[getWordPoolByTheme] ${theme} 조회 실패:`, error)
    return null
  }
}

/**
 * 모든 주제의 문제 풀 조회
 */
export async function getAllWordPools(): Promise<ThemeWordPool[]> {
  try {
    const querySnapshot = await getDocs(collection(firestore, WORD_POOLS_COLLECTION))
    return querySnapshot.docs.map((doc) => doc.data() as ThemeWordPool)
  } catch (error) {
    console.error('[getAllWordPools] 조회 실패:', error)
    return []
  }
}

/**
 * 주제별 문제 풀 생성 또는 업데이트 (마스터 계정만)
 */
export async function updateWordPool(
  theme: string,
  words: string[],
  description: string,
  createdBy: string
): Promise<void> {
  try {
    const docRef = doc(firestore, WORD_POOLS_COLLECTION, theme)
    const existingDoc = await getDoc(docRef)

    const wordPoolData: ThemeWordPool = {
      theme,
      words,
      description,
      updatedAt: new Date(),
      createdBy,
    }

    if (!existingDoc.exists()) {
      wordPoolData.createdAt = new Date()
    }

    await setDoc(docRef, wordPoolData)
    console.log(`[updateWordPool] ${theme} 업데이트 완료`)
  } catch (error) {
    console.error(`[updateWordPool] ${theme} 업데이트 실패:`, error)
    throw error
  }
}

/**
 * 주제별 문제 풀 삭제 (마스터 계정만)
 */
export async function deleteWordPool(theme: string): Promise<void> {
  try {
    const docRef = doc(firestore, WORD_POOLS_COLLECTION, theme)
    await deleteDoc(docRef)
    console.log(`[deleteWordPool] ${theme} 삭제 완료`)
  } catch (error) {
    console.error(`[deleteWordPool] ${theme} 삭제 실패:`, error)
    throw error
  }
}

/**
 * 주제에서 랜덤 단어 선택
 */
export function selectRandomWord(words: string[]): string {
  if (words.length === 0) {
    throw new Error('단어 목록이 비어있습니다.')
  }
  const randomIndex = Math.floor(Math.random() * words.length)
  return words[randomIndex]
}

/**
 * 주제에서 중복 없이 여러 랜덤 단어 선택
 * Fisher-Yates shuffle 알고리즘 사용 (균일한 랜덤 분포 보장)
 */
export function selectRandomWords(words: string[], count: number): string[] {
  if (words.length < count) {
    throw new Error(`단어 목록(${words.length}개)이 요청 개수(${count}개)보다 적습니다.`)
  }

  const shuffled = shuffle(words)
  return shuffled.slice(0, count)
}

/**
 * Cloud Function을 통해 주제에 맞는 단어 자동 생성
 */
export async function generateWordsForTheme(theme: string, count: number = 20): Promise<string[]> {
  try {
    const generateWords = httpsCallable<
      { theme: string; count?: number },
      { theme: string; words: string[]; count: number }
    >(functions, 'generateWords')

    const result = await generateWords({ theme, count })

    console.log(`[generateWordsForTheme] ${theme}: ${result.data.words.length}개 단어 생성 완료`)
    return result.data.words
  } catch (error) {
    console.error(`[generateWordsForTheme] ${theme} 생성 실패:`, error)
    throw error
  }
}

/**
 * 주제별 문제 풀 자동 생성 (Cloud Function 호출)
 * Cloud Function이 생성과 저장을 모두 처리하므로 별도 저장 불필요
 */
export async function generateAndSaveWordPool(
  theme: string,
  description: string,
  createdBy: string,
  count: number = 20
): Promise<ThemeWordPool> {
  console.log(`[generateAndSaveWordPool] ${theme} 주제 단어 생성 시작...`)

  // Cloud Function이 생성과 저장을 모두 처리
  const words = await generateWordsForTheme(theme, count)

  console.log(`[generateAndSaveWordPool] ${theme} 완료: ${words.length}개 단어 저장`)

  return {
    theme,
    words,
    description,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
  }
}

/**
 * 초기 기본 문제 풀 데이터 (Firestore에 수동으로 추가 권장)
 */
export const DEFAULT_WORD_POOLS: ThemeWordPool[] = [
  {
    theme: '동화',
    words: [
      '백설공주',
      '신데렐라',
      '콩쥐팥쥐',
      '흥부놀부',
      '견우직녀',
      '심청전',
      '춘향전',
      '피노키오',
      '인어공주',
      '잠자는숲속의공주',
      '빨간모자',
      '헨젤과그레텔',
      '엄지공주',
      '미운오리새끼',
      '성냥팔이소녀',
    ],
    description: '동화 속 주인공과 이야기',
  },
  {
    theme: '영화',
    words: [
      '어벤져스',
      '기생충',
      '타이타닉',
      '겨울왕국',
      '해리포터',
      '반지의제왕',
      '스타워즈',
      '쥬라기공원',
      '라이온킹',
      '토이스토리',
      '인터스텔라',
      '인셉션',
      '매트릭스',
      '아바타',
      '슈렉',
    ],
    description: '유명한 영화 제목',
  },
  {
    theme: '음식',
    words: [
      '김치찌개',
      '된장찌개',
      '비빔밥',
      '불고기',
      '삼겹살',
      '치킨',
      '피자',
      '햄버거',
      '스파게티',
      '라면',
      '떡볶이',
      '순대',
      '김밥',
      '만두',
      '칼국수',
      '냉면',
      '짜장면',
      '짬뽕',
      '탕수육',
      '초밥',
    ],
    description: '한국 음식 및 세계 음식',
  },
  {
    theme: '동물',
    words: [
      '고양이',
      '강아지',
      '사자',
      '호랑이',
      '코끼리',
      '기린',
      '원숭이',
      '판다',
      '코알라',
      '펭귄',
      '독수리',
      '돌고래',
      '상어',
      '거북이',
      '토끼',
      '다람쥐',
      '여우',
      '늑대',
      '곰',
      '캥거루',
    ],
    description: '동물원 및 야생 동물',
  },
  {
    theme: '직업',
    words: [
      '의사',
      '간호사',
      '선생님',
      '경찰관',
      '소방관',
      '요리사',
      '가수',
      '배우',
      '운동선수',
      '프로그래머',
      '디자이너',
      '건축가',
      '변호사',
      '판사',
      '기자',
      '작가',
      '화가',
      '과학자',
      '우주비행사',
      '파일럿',
    ],
    description: '다양한 직업',
  },
]
