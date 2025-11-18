import { ref, onValue, update, get, set } from 'firebase/database'
import { database, firestore } from '@/firebase'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import type { GameRoom, Difficulty, Category } from '@/types/game.types'

/**
 * 게임 룸 실시간 구독
 */
export function subscribeToGameRoom(
  roomId: string,
  callback: (gameRoom: GameRoom | null) => void
): () => void {
  const roomRef = ref(database, `gameRooms/${roomId}`)

  const unsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val()
    callback(data)
  })

  return unsubscribe
}

/**
 * 플레이어 준비 상태 업데이트
 */
export async function updatePlayerReady(
  roomId: string,
  playerId: string,
  ready: boolean
): Promise<void> {
  await update(ref(database, `gameRooms/${roomId}/players/${playerId}`), {
    ready,
  })
}

/**
 * 난이도 변경
 */
export async function updateDifficulty(roomId: string, difficulty: Difficulty): Promise<void> {
  await update(ref(database, `gameRooms/${roomId}`), {
    difficulty,
  })
}

/**
 * 게임 시작
 */
export async function startGame(roomId: string): Promise<void> {
  const roomRef = ref(database, `gameRooms/${roomId}`)

  // 첫 번째 턴 질문 선택
  const question = await selectQuestion(1)

  await update(roomRef, {
    status: 'in-progress',
    startTime: Date.now(),
    [`turns/1/question`]: question.text,
    [`turns/1/category`]: question.category,
    [`turns/1/startTime`]: Date.now(),
    [`turns/1/answers`]: {},
    [`turns/1/votes`]: {},
  })

  console.log('[startGame] 게임 시작 완료, 첫 번째 질문:', question.text)
}

/**
 * 질문 선택 (Firestore에서 랜덤)
 */
async function selectQuestion(turnNumber: number): Promise<{ text: string; category: Category }> {
  // 카테고리 결정 (턴 번호 % 5)
  const categories: Category[] = ['personal', 'company', 'creative', 'trend', 'values']
  const category = categories[(turnNumber - 1) % 5]

  // Firestore에서 해당 카테고리 질문 랜덤 선택
  const questionsRef = collection(firestore, 'questions')
  const q = query(questionsRef, where('category', '==', category), limit(20))

  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    // 질문이 없으면 기본 질문 반환
    console.warn(`[selectQuestion] ${category} 카테고리 질문이 없습니다. 기본 질문 사용.`)
    return {
      text: '오늘 기분은 어떠신가요?',
      category: 'personal',
    }
  }

  // 랜덤 선택
  const questions = snapshot.docs.map((doc) => ({
    text: doc.data().text,
    category: doc.data().category,
  }))

  const randomIndex = Math.floor(Math.random() * questions.length)
  return questions[randomIndex]
}

/**
 * 답변 제출
 */
export async function submitAnswer(
  roomId: string,
  turnNumber: number,
  anonymousId: string,
  answerText: string
): Promise<void> {
  const answerRef = ref(database, `gameRooms/${roomId}/turns/${turnNumber}/answers/${anonymousId}`)

  await set(answerRef, {
    text: answerText,
    submittedAt: Date.now(),
  })

  console.log('[submitAnswer] 답변 제출 완료:', { turnNumber, anonymousId })
}

/**
 * 투표 제출
 */
export async function submitVote(
  roomId: string,
  turnNumber: number,
  uid: string,
  votedFor: string
): Promise<void> {
  const voteRef = ref(database, `gameRooms/${roomId}/turns/${turnNumber}/votes/${uid}`)

  await set(voteRef, {
    votedFor,
    submittedAt: Date.now(),
  })

  console.log('[submitVote] 투표 제출 완료:', { turnNumber, votedFor })
}

/**
 * 답변 개수 확인 (Hard 모드 AI 타이밍 체크용)
 */
export async function getAnswerCount(roomId: string, turnNumber: number): Promise<number> {
  const answersRef = ref(database, `gameRooms/${roomId}/turns/${turnNumber}/answers`)
  const snapshot = await get(answersRef)

  if (!snapshot.exists()) {
    return 0
  }

  return Object.keys(snapshot.val()).length
}

/**
 * 다음 턴 시작
 */
export async function nextTurn(roomId: string): Promise<void> {
  const roomRef = ref(database, `gameRooms/${roomId}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) {
    throw new Error('게임 룸을 찾을 수 없습니다.')
  }

  const gameRoom = snapshot.val() as GameRoom
  const nextTurnNumber = gameRoom.currentTurn + 1

  // 최대 턴 수 체크
  if (nextTurnNumber > gameRoom.maxTurns) {
    await update(roomRef, {
      status: 'finished',
      endTime: Date.now(),
    })
    console.log('[nextTurn] 최대 턴 수 도달, 게임 종료')
    return
  }

  // 다음 턴 질문 선택
  const question = await selectQuestion(nextTurnNumber)

  await update(roomRef, {
    currentTurn: nextTurnNumber,
    [`turns/${nextTurnNumber}/question`]: question.text,
    [`turns/${nextTurnNumber}/category`]: question.category,
    [`turns/${nextTurnNumber}/startTime`]: Date.now(),
    [`turns/${nextTurnNumber}/answers`]: {},
    [`turns/${nextTurnNumber}/votes`]: {},
  })

  console.log('[nextTurn] 다음 턴 시작:', nextTurnNumber, question.text)
}
