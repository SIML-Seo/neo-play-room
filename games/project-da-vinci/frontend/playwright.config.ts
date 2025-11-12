import { defineConfig, devices } from '@playwright/test'

/**
 * E2E 테스트 설정 (Playwright)
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // 각 테스트 타임아웃 (30초)
  timeout: 30000,

  // 테스트 실행 설정
  fullyParallel: false, // 순차 실행 (Firebase Emulator 공유)
  forbidOnly: !!process.env.CI, // CI에서는 .only() 금지
  retries: process.env.CI ? 2 : 0, // CI에서만 재시도
  workers: process.env.CI ? 1 : 1, // 단일 워커 (Emulator 충돌 방지)

  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // 모든 테스트에 적용되는 설정
  use: {
    // 베이스 URL (로컬 dev 서버)
    baseURL: 'http://localhost:5173',

    // 스크린샷 (실패 시만)
    screenshot: 'only-on-failure',

    // 비디오 녹화 (실패 시만)
    video: 'retain-on-failure',

    // 트레이스 수집 (실패 시만)
    trace: 'on-first-retry',
  },

  // 브라우저 프로젝트
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 필요시 추가
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 테스트 실행 전 dev 서버 자동 시작
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2분
  },
})
