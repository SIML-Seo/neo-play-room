/**
 * AI Judge Cloud Function
 * Gemini 1.5 Flash를 사용하여 그림 판단
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildPromptByDifficulty, AIDifficulty } from './prompts'
import { logger } from 'firebase-functions'
import { processGameFinalization } from '../game/finalize'

interface JudgeRequest {
  roomId: string
  imageBase64: string // "data:image/png;base64,..."
}

interface JudgeResponse {
  guess: string
  confidence: number
  isCorrect: boolean
  turnCount: number
  gameStatus: 'in-progress' | 'finished'
}

/**
 * 그림 판단 Cloud Function
 */
export const judgeDrawing = onCall<JudgeRequest, Promise<JudgeResponse>>(
  {
    region: 'asia-northeast3',
    timeoutSeconds: 30,
    memory: '512MiB',
    cors: true,
  },
  async (request) => {
    // 0. 인증 확인
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.')
    }

    const { roomId, imageBase64 } = request.data

    // 입력 검증
    if (!roomId || !imageBase64) {
      throw new HttpsError('invalid-argument', 'roomId와 imageBase64가 필요합니다.')
    }

    const db = getDatabase()

    // 1. 게임 룸 정보 조회
    const roomSnapshot = await db.ref(`/gameRooms/${roomId}`).once('value')
    if (!roomSnapshot.exists()) {
      throw new HttpsError('not-found', '게임 룸을 찾을 수 없습니다.')
    }

    const gameRoom = roomSnapshot.val()

    if (gameRoom.status !== 'in-progress') {
      throw new HttpsError('failed-precondition', '게임이 진행 중이 아닙니다.')
    }

    const playerUid = request.auth.uid
    if (gameRoom.currentTurn !== playerUid) {
      throw new HttpsError('permission-denied', '현재 턴이 아닌 플레이어는 AI를 호출할 수 없습니다.')
    }

    // 정답 단어 조회 (roomSecrets)
    const targetWordSnapshot = await db.ref(`/roomSecrets/${roomId}/targetWord`).once('value')
    if (!targetWordSnapshot.exists()) {
      throw new HttpsError('failed-precondition', '정답 단어를 찾을 수 없습니다.')
    }
    const targetWord: string = targetWordSnapshot.val()

    // 2. 프롬프트 생성 (난이도 적용 + 이전 추측 히스토리)
    const difficulty = (gameRoom.difficulty as AIDifficulty) || AIDifficulty.NORMAL

    // 이전 추측 히스토리 변환 (AIGuessHistory 형식)
    const previousGuesses = (gameRoom.aiGuesses || []).map((g: any) => ({
      turn: g.turn,
      guess: g.guess,
      confidence: g.confidence,
    }))

    const prompt = buildPromptByDifficulty(gameRoom.theme, difficulty, previousGuesses)
    logger.info(`프롬프트 생성 완료 (테마: ${gameRoom.theme}, 난이도: ${difficulty}, 이전 추측: ${previousGuesses.length}개)`)

    // 3. Gemini API 호출
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'GEMINI_API_KEY가 설정되지 않았습니다.')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7, // 약간의 창의성 허용
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 100, // JSON 응답은 짧음
      },
    })

    try {
      const imagePart = {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''), // Base64 헤더 제거
          mimeType: 'image/png',
        },
      }

      const result = await model.generateContent([prompt, imagePart])
      const responseText = result.response.text()

      logger.info('Gemini 원본 응답:', responseText)

      // 4. JSON 파싱 (Gemini가 가끔 마크다운으로 감싸는 경우 처리)
      let guess: string
      let confidence: number

      try {
        // ```json ... ``` 제거
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim()
        const parsed = JSON.parse(cleanedText)

        guess = parsed.guess || parsed.단어 || parsed.추측 // 다양한 키 허용
        confidence = parsed.confidence || parsed.신뢰도 || 0.5
      } catch (parseError) {
        logger.warn('JSON 파싱 실패, 텍스트에서 추출 시도:', responseText)

        // Fallback: 정규식으로 추출
        const guessMatch = responseText.match(/"guess"\s*:\s*"([^"]+)"/)
        const confidenceMatch = responseText.match(/"confidence"\s*:\s*([\d.]+)/)

        guess = guessMatch ? guessMatch[1] : '알 수 없음'
        confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.3
      }

      // 한글이 없으면 경고
      if (!/[가-힣]/.test(guess)) {
        logger.warn(`AI가 한국어로 응답하지 않음: ${guess}`)
      }

      logger.info(`AI 추론: ${guess} (신뢰도: ${confidence})`)

      // 5. Storage에 이미지 저장
      let imageUrl = ''
      try {
        const storage = getStorage()
        const bucket = storage.bucket()

        // Base64 헤더 제거 후 Buffer로 변환
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
        const imageBuffer = Buffer.from(base64Data, 'base64')

        // 파일명: turns/{roomId}/turn_{turnCount}.png
        const turnCount = gameRoom.turnCount + 1
        const fileName = `turns/${roomId}/turn_${turnCount}.png`
        const file = bucket.file(fileName)

        await file.save(imageBuffer, {
          metadata: {
            contentType: 'image/png',
            metadata: {
              roomId,
              turn: turnCount.toString(),
              guess,
              confidence: confidence.toString(),
              timestamp: Date.now().toString(),
            },
          },
        })

        // Public URL 생성 (환경에 따라 다른 URL)
        await file.makePublic()

        // Emulator 환경 확인
        const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true'
        if (isEmulator) {
          // Emulator: http://127.0.0.1:9199/{bucket}/{fileName}?alt=media
          const storageEmulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199'
          imageUrl = `http://${storageEmulatorHost}/${bucket.name}/${fileName}?alt=media`
        } else {
          // Production: googleapis.com URL 사용
          imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
        }

        logger.info(`✅ 이미지 저장 완료 (${isEmulator ? 'Emulator' : 'Production'}): ${imageUrl}`)
      } catch (storageError) {
        logger.error('❌ 이미지 저장 실패:', storageError)
        // 이미지 저장 실패해도 게임은 계속 진행
      }

      // 6. 정답 확인
      const normalizedGuess = guess.trim()
      const normalizedTarget = targetWord.trim()
      const isCorrect = normalizedGuess === normalizedTarget
      const newTurnCount = gameRoom.turnCount + 1

      const updatedGuesses = [
        ...(gameRoom.aiGuesses || []),
        {
          turn: newTurnCount,
          guess,
          confidence,
          timestamp: Date.now(),
          imageUrl, // Storage URL 추가
        },
      ]

      // 6. 게임 상태 업데이트
      let gameStatus: 'in-progress' | 'finished' = 'in-progress'

      if (isCorrect) {
        // 정답! 게임 종료
        gameStatus = 'finished'
        await db.ref(`/gameRooms/${roomId}`).update({
          status: 'finished',
          endTime: Date.now(),
          turnCount: newTurnCount,
          result: 'success',
          failReason: null,
          lastGuess: guess,
          targetWordReveal: targetWord,
          aiGuesses: updatedGuesses,
        })

        logger.info(`🎉 정답! 룸: ${roomId}, 답: ${guess}`)

        // Emulator Trigger 버그 대응: 게임 종료 처리 직접 호출
        try {
          await processGameFinalization(roomId)
        } catch (finalizationError) {
          logger.error(`❌ 게임 종료 처리 실패 (정답):`, finalizationError)
        }
      } else if (newTurnCount >= gameRoom.maxTurns) {
        // 최대 턴 초과, 게임 실패
        gameStatus = 'finished'
        await db.ref(`/gameRooms/${roomId}`).update({
          status: 'finished',
          endTime: Date.now(),
          turnCount: newTurnCount,
          result: 'failure',
          failReason: 'turnLimitExceeded',
          lastGuess: guess,
          targetWordReveal: targetWord,
          aiGuesses: updatedGuesses,
        })

        logger.warn(`❌ 최대 턴 초과! 룸: ${roomId}`)

        // Emulator Trigger 버그 대응: 게임 종료 처리 직접 호출
        try {
          await processGameFinalization(roomId)
        } catch (finalizationError) {
          logger.error(`❌ 게임 종료 처리 실패 (턴 초과):`, finalizationError)
        }
      } else {
        // 오답, 다음 턴으로
        const nextTurnIndex = (gameRoom.currentTurnIndex + 1) % gameRoom.turnOrder.length

        await db.ref(`/gameRooms/${roomId}`).update({
          currentTurnIndex: nextTurnIndex,
          currentTurn: gameRoom.turnOrder[nextTurnIndex],
          turnCount: newTurnCount,
          turnStartTime: Date.now(),
          canvasData: '', // 캔버스 초기화
          lastGuess: guess,
          aiGuesses: updatedGuesses,
        })

        logger.info(`➡️ 다음 턴: ${gameRoom.turnOrder[nextTurnIndex]}`)
      }

      return {
        guess,
        confidence,
        isCorrect,
        turnCount: newTurnCount,
        gameStatus,
      }
    } catch (error: unknown) {
      logger.error('AI 추론 실패:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpsError('internal', `AI 추론 중 오류 발생: ${errorMessage}`)
    }
  }
)
