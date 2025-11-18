/**
 * Firebase Cloud Functions Entry Point
 * Project Turing - AI Response & Game Logic Functions
 */

import * as admin from 'firebase-admin'

// Firebase Admin 초기화
admin.initializeApp({
  databaseURL: 'http://127.0.0.1:9000/?ns=project-turing-4bc25-default-rtdb',
})

// AI Functions
export { generateAIResponse } from './ai/respondAnswer'

// Game Functions
export { checkVoteResult } from './game/voting'
export { matchPlayers } from './game/matching'

// Utils
export { getServerTime } from './utils/time'
