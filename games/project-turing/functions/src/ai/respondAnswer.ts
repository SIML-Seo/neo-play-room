/**
 * generateAIResponse - AI 답변 생성 Function
 * 난이도별로 다른 전략으로 AI 답변 생성
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildPrompt } from './prompts'

export const generateAIResponse = onCall(async (request) => {
  // 1. 인증 확인
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
  }

  // 2. 파라미터 추출
  const { roomId, turn } = request.data

  if (!roomId || !turn) {
    throw new HttpsError('invalid-argument', 'roomId와 turn이 필요합니다.')
  }

  try {
    // 3. 게임 룸 데이터 가져오기
    const gameRoomSnapshot = await admin
      .database()
      .ref(`/gameRooms/${roomId}`)
      .once('value')
    const gameRoom = gameRoomSnapshot.val()

    if (!gameRoom) {
      throw new HttpsError('not-found', '게임 룸을 찾을 수 없습니다.')
    }

    // 4. AI 플레이어 ID 확인
    const aiPlayerId = gameRoom.aiPlayerId

    // 5. 현재 턴 데이터
    const currentTurn = gameRoom.turns[turn]
    if (!currentTurn) {
      throw new HttpsError('not-found', '해당 턴을 찾을 수 없습니다.')
    }

    const question = currentTurn.question
    const difficulty = gameRoom.difficulty
    const otherAnswers = currentTurn.answers || {}

    // 6. 난이도별 프롬프트 생성
    const prompt = buildPrompt(difficulty, question, Object.values(otherAnswers))

    // 7. Gemini API 호출
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Gemini API 키가 설정되지 않았습니다.')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: difficulty === 'easy' ? 0.3 : difficulty === 'normal' ? 0.7 : 0.9,
        maxOutputTokens: 200,
      },
    })

    const result = await model.generateContent(prompt)
    const answer = result.response.text().trim()

    // 8. RTDB에 답변 저장
    await admin
      .database()
      .ref(`/gameRooms/${roomId}/turns/${turn}/answers/${aiPlayerId}`)
      .set({
        text: answer,
        submittedAt: admin.database.ServerValue.TIMESTAMP,
        isAI: true, // 보안 규칙으로 읽기 차단
      })

    console.log('AI 답변 생성 완료', {
      roomId,
      turn,
      difficulty,
      answerLength: answer.length,
    })

    return { success: true, answerId: aiPlayerId }
  } catch (error) {
    console.error('AI 답변 생성 실패:', error)
    throw new HttpsError('internal', 'AI 답변 생성에 실패했습니다.')
  }
})
