import { test, expect } from '@playwright/test'

/**
 * E2E 테스트: Canvas 상호작용
 *
 * Fabric.js 캔버스의 실제 드로잉 동작을 테스트합니다.
 * 이 테스트는 Firebase 인증 없이 Canvas 컴포넌트만 테스트합니다.
 */
test.describe('Canvas 드로잉 테스트', () => {
  // 테스트용 간단한 HTML 페이지 생성
  test.beforeEach(async ({ page }) => {
    // Canvas 컴포넌트를 테스트하기 위한 임시 페이지
    // 실제로는 Storybook이나 별도의 테스트 페이지가 필요할 수 있음
    await page.goto('/')
  })

  test('페이지가 로드됨', async ({ page }) => {
    await expect(page).toHaveTitle(/Vite|Project/)
  })

  test.skip('Canvas에 그림 그리기 (실제 게임 룸 필요)', async ({ page }) => {
    // 실제 게임 룸으로 이동 (인증 후)
    // await page.goto('/game/test-room')

    // Canvas 요소 찾기
    // const canvas = page.locator('canvas').first()
    // await expect(canvas).toBeVisible()

    // Canvas 크기 확인
    // const box = await canvas.boundingBox()
    // expect(box).not.toBeNull()
    // expect(box!.width).toBeGreaterThan(0)
    // expect(box!.height).toBeGreaterThan(0)

    // 마우스로 그림 그리기 시뮬레이션
    // await canvas.hover({ position: { x: 100, y: 100 } })
    // await page.mouse.down()
    // await canvas.hover({ position: { x: 200, y: 200 } })
    // await page.mouse.up()

    // Canvas 데이터가 변경되었는지 확인 (Firebase 업데이트 호출)
    // await page.waitForTimeout(1000) // debounce 대기
  })
})

/**
 * 드로잉 툴바 테스트
 */
test.describe('드로잉 툴바', () => {
  test.skip('색상 선택 버튼이 작동함', async ({ page }) => {
    // await page.goto('/game/test-room')

    // 색상 선택 버튼 클릭
    // const colorButton = page.locator('[data-testid="color-red"]')
    // await colorButton.click()

    // Canvas의 브러시 색상이 변경되었는지 확인
    // (실제로는 브러시 상태를 확인하기 어려우므로 UI 상태만 확인)
    // await expect(colorButton).toHaveClass(/active|selected/)
  })

  test.skip('브러시 두께 조절이 작동함', async ({ page }) => {
    // await page.goto('/game/test-room')

    // 두께 슬라이더 조정
    // const widthSlider = page.locator('[data-testid="brush-width"]')
    // await widthSlider.fill('10')

    // 브러시 두께 표시 확인
    // const widthDisplay = page.locator('[data-testid="width-display"]')
    // await expect(widthDisplay).toHaveText('10')
  })

  test.skip('지우기 버튼이 작동함', async ({ page }) => {
    // await page.goto('/game/test-room')

    // 그림 그리기
    // const canvas = page.locator('canvas')
    // await canvas.hover({ position: { x: 100, y: 100 } })
    // await page.mouse.down()
    // await canvas.hover({ position: { x: 200, y: 200 } })
    // await page.mouse.up()

    // 지우기 버튼 클릭
    // const clearButton = page.locator('[data-testid="clear-button"]')
    // await clearButton.click()

    // 확인 다이얼로그가 표시되면 확인 클릭
    // page.on('dialog', (dialog) => dialog.accept())

    // Canvas가 비워졌는지 확인 (실제로는 Firebase 데이터로 확인)
  })
})

/**
 * 접근성 테스트
 */
test.describe('접근성 (a11y)', () => {
  test('키보드로 네비게이션 가능', async ({ page }) => {
    await page.goto('/')

    // Tab 키로 로그인 버튼으로 이동
    await page.keyboard.press('Tab')

    // 포커스된 요소가 버튼인지 확인
    const focusedElement = await page.locator(':focus')
    const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase())

    expect(['button', 'a', 'input']).toContain(tagName)
  })

  test.skip('스크린 리더 레이블이 존재함', async ({ page }) => {
    await page.goto('/')

    // aria-label 또는 alt 텍스트가 있는지 확인
    const loginButton = page.getByRole('button', { name: /로그인|Google/i })
    const ariaLabel = await loginButton.getAttribute('aria-label')

    // aria-label이 없어도 텍스트 콘텐츠로 충분
    const textContent = await loginButton.textContent()

    expect(ariaLabel || textContent).toBeTruthy()
  })
})
