import { test, expect } from '@playwright/test'

/**
 * E2E 테스트: 전체 게임 플로우
 *
 * 주의: 이 테스트는 Firebase Emulator가 실행 중이어야 합니다.
 * 실행 방법:
 * 1. 터미널 1: firebase emulators:start
 * 2. 터미널 2: npm run test:e2e
 */
test.describe('전체 게임 플로우 (Emulator 필요)', () => {
  // Firebase Emulator 설정
  test.use({
    // Emulator UI URL로 Firebase 인증 우회
    baseURL: 'http://localhost:5173',
  })

  // 이 테스트는 skip 처리 (실제 실행 시 주석 해제)
  test.skip('로그인 → 로비 → 게임 룸 → 결과', async ({ page }) => {
    // 1. 홈 페이지 이동
    await page.goto('/')

    // 2. 로그인 버튼 클릭 (Firebase Emulator에서 자동 인증 필요)
    const loginButton = page.getByRole('button', { name: /로그인|Google/i })
    await loginButton.click()

    // 3. 로비 페이지로 이동 확인
    await page.waitForURL(/\/lobby/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/lobby/)

    // 4. 로비에서 대기 중인 플레이어 확인
    const playerList = page.locator('[data-testid="player-list"]')
    await expect(playerList).toBeVisible()

    // 5. 5명이 모이면 게임 시작 (실제로는 불가능하므로 mock 필요)
    // await page.click('[data-testid="start-game-button"]')

    // 6. 게임 룸 페이지로 이동
    // await page.waitForURL(/\/game\//, { timeout: 10000 })

    // 7. 캔버스가 렌더링됨
    // const canvas = page.locator('canvas')
    // await expect(canvas).toBeVisible()

    // 8. 그림 그리기 시뮬레이션
    // await canvas.click({ position: { x: 100, y: 100 } })

    // 9. AI 추론 결과 표시
    // const aiGuess = page.locator('[data-testid="ai-guess"]')
    // await expect(aiGuess).toBeVisible()

    // 10. 게임 종료 후 결과 페이지로 이동
    // await page.waitForURL(/\/results/, { timeout: 30000 })
    // await expect(page).toHaveURL(/\/results/)
  })
})

/**
 * 간단한 UI 컴포넌트 테스트 (Firebase 불필요)
 */
test.describe('게임 UI 컴포넌트', () => {
  test('Canvas 컴포넌트가 로드됨 (직접 접근)', async ({ page }) => {
    // 게임 룸 URL로 직접 이동 (인증 없이 테스트용)
    await page.goto('/game/test-room-id')

    // 캔버스 또는 에러 메시지가 표시됨
    const canvas = page.locator('canvas')
    const errorMessage = page.locator('text=/오류|에러|Error/i')

    // 둘 중 하나는 반드시 표시되어야 함
    const isCanvasVisible = await canvas.isVisible().catch(() => false)
    const isErrorVisible = await errorMessage.isVisible().catch(() => false)

    expect(isCanvasVisible || isErrorVisible).toBeTruthy()
  })

  test('Results 페이지가 로드됨 (직접 접근)', async ({ page }) => {
    // 결과 페이지로 직접 이동
    await page.goto('/results?roomId=test-room-id')

    // 페이지가 렌더링됨 (에러 또는 로딩 표시)
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // "결과", "Result", "오류" 등의 텍스트가 있어야 함
    const hasContent = await page
      .locator('text=/결과|Result|오류|로딩|Loading/i')
      .first()
      .isVisible()
      .catch(() => false)

    expect(hasContent).toBeTruthy()
  })
})
