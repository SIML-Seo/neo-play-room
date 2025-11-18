# Project Turing - Testing Strategy

테스트 전략 문서입니다.

---

## 🎯 테스트 목표

- **단위 테스트 커버리지**: 80% 이상
- **통합 테스트 커버리지**: 60% 이상
- **E2E 주요 시나리오**: 10개

---

## 📊 테스트 피라미드

```
        /\
       /E2E\        (10%) - Playwright
      /______\
     /통합테스트\    (30%) - Vitest + Firebase Emulator
    /__________\
   /  단위테스트 \  (60%) - Vitest + Testing Library
  /____________\
```

---

## 🧪 단위 테스트 (Unit Tests)

### 대상

#### Hooks
- `useAuth.test.ts`
- `useTimer.test.ts`
- `useVoting.test.ts`
- `useGameRoom.test.ts`

#### Utils
- `shuffle.test.ts`
- `sanitizer.test.ts`
- `timeFormatter.test.ts`
- `difficulty.test.ts`

#### Services
- `gameRoom.test.ts`
- `voting.test.ts`

### 예시: useTimer

```typescript
// frontend/src/hooks/useTimer.test.ts
import { renderHook, act } from '@testing-library/react'
import { useTimer } from './useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should countdown from duration', () => {
    const { result } = renderHook(() =>
      useTimer(60, Date.now())
    )

    expect(result.current.timeLeft).toBe(60)

    act(() => {
      vi.advanceTimersByTime(10000) // 10초 경과
    })

    expect(result.current.timeLeft).toBe(50)
  })

  it('should expire when time is up', () => {
    const { result } = renderHook(() =>
      useTimer(10, Date.now())
    )

    act(() => {
      vi.advanceTimersByTime(11000) // 11초 경과
    })

    expect(result.current.timeLeft).toBe(0)
    expect(result.current.isExpired).toBe(true)
  })
})
```

### 예시: shuffle

```typescript
// frontend/src/utils/shuffle.test.ts
import { shuffle } from './shuffle'

describe('shuffle', () => {
  it('should return same length array', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input)

    expect(result).toHaveLength(input.length)
  })

  it('should contain all original elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input)

    input.forEach(item => {
      expect(result).toContain(item)
    })
  })

  it('should not be same order (probabilistic)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = shuffle([...input])

    // 통계적으로 거의 불가능
    expect(result).not.toEqual(input)
  })
})
```

---

## 🔗 통합 테스트 (Integration Tests)

### 대상

- Firebase Emulator + Cloud Functions
- RTDB 읽기/쓰기
- Functions 호출

### 설정

```bash
# Firebase Emulator 시작
firebase emulators:start --only database,functions

# 테스트 실행
npm run test:integration
```

### 예시: checkVoteResult Function

```typescript
// functions/test/game/voting.integration.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { checkVoteResult } from '../../src/game/voting'

describe('checkVoteResult Integration', () => {
  let testEnv: RulesTestEnvironment
  let db: admin.database.Database

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      database: {
        host: 'localhost',
        port: 9000
      }
    })
    db = testEnv.database()
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  it('should identify AI correctly', async () => {
    // 1. 테스트 데이터 세팅
    const roomId = 'test-room-1'
    await db.ref(`/gameRooms/${roomId}`).set({
      aiPlayerId: 'player_3',
      currentTurn: 1,
      maxTurns: 5,
      turns: {
        1: {
          votes: {
            'user1': { votedFor: 'player_3' },
            'user2': { votedFor: 'player_3' },
            'user3': { votedFor: 'player_3' },
            'user4': { votedFor: 'player_1' },
            'user5': { votedFor: 'player_2' }
          }
        }
      }
    })

    // 2. Function 호출
    const result = await checkVoteResult({ roomId, turn: 1 })

    // 3. 검증
    expect(result.mostVotedPlayer).toBe('player_3')
    expect(result.isAI).toBe(true)
    expect(result.gameEnded).toBe(true)

    // 4. RTDB 상태 확인
    const voteResult = await db.ref(`/gameRooms/${roomId}/turns/1/voteResult`).once('value')
    expect(voteResult.val().isAI).toBe(true)
  })

  it('should continue to next turn if AI not found', async () => {
    const roomId = 'test-room-2'
    await db.ref(`/gameRooms/${roomId}`).set({
      aiPlayerId: 'player_3',
      currentTurn: 1,
      maxTurns: 5,
      turns: {
        1: {
          votes: {
            'user1': { votedFor: 'player_1' },  // 모두 player_1에 투표
            'user2': { votedFor: 'player_1' },
            'user3': { votedFor: 'player_1' },
            'user4': { votedFor: 'player_1' },
            'user5': { votedFor: 'player_1' }
          }
        }
      }
    })

    const result = await checkVoteResult({ roomId, turn: 1 })

    expect(result.mostVotedPlayer).toBe('player_1')
    expect(result.isAI).toBe(false)
    expect(result.gameEnded).toBe(false)

    // 다음 턴으로 진행 확인
    const currentTurn = await db.ref(`/gameRooms/${roomId}/currentTurn`).once('value')
    expect(currentTurn.val()).toBe(2)
  })
})
```

---

## 🎭 E2E 테스트 (End-to-End Tests)

### 도구

- **Playwright**: 멀티 브라우저 E2E 테스트

### 주요 시나리오

1. **로그인 → 매칭 → 게임 → 결과**
2. **5명 동시 접속 시뮬레이션**
3. **AI 답변 생성 확인**
4. **투표 → 결과 확인**
5. **난이도 변경**
6. **채팅 기능**
7. **타이머 만료 시 동작**
8. **네트워크 끊김 시 재연결**
9. **리더보드 표시**
10. **게임 중도 이탈**

### 예시: 전체 게임 플로우

```typescript
// frontend/e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Full Game Flow', () => {
  test('should complete game successfully', async ({ page, context }) => {
    // 1. 로그인
    await page.goto('http://localhost:5173')
    await page.click('text=Google로 로그인')
    // (Google SSO 모의)

    // 2. Lobby
    await expect(page).toHaveURL(/\/lobby/)
    await expect(page.locator('text=대기 중')).toBeVisible()

    // 3. 5명 매칭 시뮬레이션 (4개의 추가 브라우저 컨텍스트)
    const otherPlayers = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage(),
      context.newPage()
    ])

    for (const playerPage of otherPlayers) {
      await playerPage.goto('http://localhost:5173/lobby')
      // 로그인 및 대기
    }

    // 4. 게임 룸 이동
    await expect(page).toHaveURL(/\/game\//)

    // 5. 난이도 선택
    await page.click('text=Normal')

    // 6. 준비 완료
    await page.click('text=준비 완료')

    // 모든 플레이어 준비 완료
    for (const playerPage of otherPlayers) {
      await playerPage.click('text=준비 완료')
    }

    // 7. 게임 시작
    await page.click('text=게임 시작')

    // 8. 답변 입력
    await expect(page.locator('textarea')).toBeVisible()
    await page.fill('textarea', '인터스텔라 봤어요')
    await page.click('text=답변 제출')

    // 9. 모든 플레이어 답변 대기
    await expect(page.locator('text=6/6명 답변 완료')).toBeVisible()

    // 10. 토론 시간
    await expect(page.locator('text=토론 시간')).toBeVisible()
    await page.fill('input[placeholder="메시지 입력..."]', '3번이 AI 같은데요?')
    await page.press('input', 'Enter')

    // 11. 투표
    await expect(page.locator('text=누가 AI일까요?')).toBeVisible()
    await page.click('input[value="player_3"]')
    await page.click('text=투표하기')

    // 12. 결과 확인
    await expect(page.locator('text=player_3')).toBeVisible()
    await expect(page.locator('text=AI입니다' | 'text=AI가 아닙니다')).toBeVisible()

    // 13. 게임 종료 (성공 or 다음 턴)
    // ...
  })
})
```

---

## 🚀 CI/CD 파이프라인

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
    branches: [main, develop]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd games/project-turing/frontend
          npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Coverage report
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Start emulators
        run: firebase emulators:start --only database,functions &

      - name: Run integration tests
        run: npm run test:integration

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📊 커버리지 목표

### 단위 테스트

| 모듈 | 목표 | 현재 |
|-----|------|------|
| Hooks | 90% | - |
| Utils | 95% | - |
| Services | 85% | - |
| Components | 75% | - |

### 통합 테스트

| 모듈 | 목표 | 현재 |
|-----|------|------|
| Cloud Functions | 80% | - |
| RTDB 로직 | 70% | - |

---

## 🔍 테스트 실행

### 로컬 개발

```bash
# 단위 테스트 (Watch 모드)
npm run test

# 단위 테스트 (단일 실행)
npm run test:run

# 커버리지
npm run test:coverage

# 통합 테스트
firebase emulators:start &
npm run test:integration

# E2E 테스트
npm run dev &
npm run test:e2e
```

### pre-commit Hook

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"  // 변경된 파일 관련 테스트만
    ]
  }
}
```

---

## 🐛 테스트 디버깅

### Vitest UI

```bash
npm run test:ui
```

브라우저에서 http://localhost:51204 접속

### Playwright Debug

```bash
npx playwright test --debug
```

---

**다음 문서**: [TODO.md](./TODO.md) - 개발 일정
