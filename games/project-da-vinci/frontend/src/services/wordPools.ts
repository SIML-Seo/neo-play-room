/**
 * 주제별 문제 풀 관리 서비스
 * Firestore를 사용하여 주제별 단어 목록 관리
 * Gemini API로 주제별 단어 자동 생성
 */

import { collection, doc, getDoc, setDoc, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '@/firebase'
import type { ThemeWordPool } from '@/types/game.types'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
 */
export function selectRandomWords(words: string[], count: number): string[] {
  if (words.length < count) {
    throw new Error(`단어 목록(${words.length}개)이 요청 개수(${count}개)보다 적습니다.`)
  }

  const shuffled = [...words].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Gemini API로 주제에 맞는 단어 자동 생성
 */
export async function generateWordsForTheme(
  theme: string,
  count: number = 20,
  apiKey?: string
): Promise<string[]> {
  // API 키 확인
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY
  if (!key) {
    throw new Error('Gemini API 키가 설정되지 않았습니다.')
  }

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.8, // 다양성을 위해 약간 높게
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 500,
    },
  })

  const prompt = buildWordGenerationPrompt(theme, count)

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // JSON 파싱
    const words = parseWordsFromResponse(response)

    if (words.length === 0) {
      throw new Error('AI가 단어를 생성하지 못했습니다.')
    }

    console.log(`[generateWordsForTheme] ${theme}: ${words.length}개 단어 생성 완료`)
    return words
  } catch (error) {
    console.error(`[generateWordsForTheme] ${theme} 생성 실패:`, error)
    throw error
  }
}

/**
 * 단어 생성 프롬프트 작성
 */
function buildWordGenerationPrompt(theme: string, count: number): string {
  return `당신은 Pictionary 게임을 위한 문제 출제자입니다.

**주제**: ${theme}

**요구사항**:
1. "${theme}" 주제에 맞는 그림으로 표현 가능한 단어 ${count}개를 생성하세요.
2. 모든 단어는 **한글**로 작성하세요.
3. 단어는 **명사**여야 합니다 (동사, 형용사 금지).
4. 너무 쉽지도, 너무 어렵지도 않은 적절한 난이도로 선택하세요.
5. 다양성을 고려하여 중복되지 않는 단어들을 선택하세요.
6. 그림으로 표현하기 어려운 추상적인 개념은 피하세요.

**응답 형식** (JSON 배열만):
{
  "words": ["단어1", "단어2", "단어3", ...]
}

**예시**:
주제: "동화"
{
  "words": ["백설공주", "신데렐라", "콩쥐팥쥐", "흥부놀부", "견우직녀", "심청전", "춘향전", "피노키오", "인어공주", "잠자는숲속의공주", "빨간모자", "헨젤과그레텔", "엄지공주", "미운오리새끼", "성냥팔이소녀", "알라딘", "라푼젤", "개구리왕자", "브레멘음악대", "이솝우화"]
}

이제 "${theme}" 주제로 ${count}개의 단어를 생성하세요.`
}

/**
 * AI 응답에서 단어 배열 파싱
 */
function parseWordsFromResponse(response: string): string[] {
  try {
    // JSON 마크다운 제거
    let cleaned = response.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    const parsed = JSON.parse(cleaned)

    if (parsed.words && Array.isArray(parsed.words)) {
      return parsed.words.filter((w: any) => typeof w === 'string' && w.trim().length > 0)
    }

    // 배열이 직접 반환된 경우
    if (Array.isArray(parsed)) {
      return parsed.filter((w: any) => typeof w === 'string' && w.trim().length > 0)
    }

    throw new Error('words 배열을 찾을 수 없습니다.')
  } catch (error) {
    console.error('[parseWordsFromResponse] JSON 파싱 실패:', error)
    console.error('원본 응답:', response)
    throw new Error('AI 응답을 파싱할 수 없습니다.')
  }
}

/**
 * 주제별 문제 풀 자동 생성 및 저장 (마스터 계정만)
 */
export async function generateAndSaveWordPool(
  theme: string,
  description: string,
  createdBy: string,
  count: number = 20,
  apiKey?: string
): Promise<ThemeWordPool> {
  console.log(`[generateAndSaveWordPool] ${theme} 주제 단어 생성 시작...`)

  // AI로 단어 생성
  const words = await generateWordsForTheme(theme, count, apiKey)

  // Firestore에 저장
  await updateWordPool(theme, words, description, createdBy)

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
