/**
 * 서버 시간 동기화 유틸리티
 */

import { onCall } from 'firebase-functions/v2/https'

/**
 * 서버 시간 반환 (클라이언트 시간 오프셋 계산용)
 */
export const getServerTime = onCall(async () => {
  return { serverTime: Date.now() }
})
