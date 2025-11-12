/**
 * 환경 변수 설정
 *
 * Vite 환경변수를 타입 안전하게 사용하기 위한 설정 파일
 * .env.development / .env.production 파일의 값을 읽어옴
 */

export const ENV = {
  // 환경 구분
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.VITE_ENV || 'DEV',

  // Firebase 설정
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },

  // 게임 설정
  game: {
    maxPlayers: Number(import.meta.env.VITE_MAX_PLAYERS) || 5,
    maxTurns: Number(import.meta.env.VITE_MAX_TURNS) || 10,
    turnTimeLimit: Number(import.meta.env.VITE_TURN_TIME_LIMIT) || 60,
  },

  // 디버깅 설정
  debug: {
    enableConsoleLog: import.meta.env.VITE_ENABLE_CONSOLE_LOG === 'true',
  },
} as const

// 개발 환경에서만 설정 출력
if (ENV.isDevelopment) {
  console.log('🔧 Environment Config:', {
    mode: ENV.mode,
    maxPlayers: ENV.game.maxPlayers,
    maxTurns: ENV.game.maxTurns,
    turnTimeLimit: ENV.game.turnTimeLimit,
    consoleLog: ENV.debug.enableConsoleLog,
  })
}
