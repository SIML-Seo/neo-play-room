/**
 * Firebase Cloud Functions Entry Point
 * Project Da Vinci - AI Judge Functions
 */

import * as admin from 'firebase-admin'

// Firebase Admin 초기화
admin.initializeApp()

// AI Judge Function Export
export { judgeDrawing } from './ai/judge.flow'

// AI Word Generator Function Export
export { generateWords } from './ai/wordGenerator'

// Game Finalize Trigger Export
export { finalizeGame, finalizeGameManual } from './game/finalize'
