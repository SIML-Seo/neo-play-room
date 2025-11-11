# Project Da Vinci - 테스트 전략

> 포괄적인 테스트 계획 및 구체적인 테스트 케이스

## 📋 목차

1. [테스트 전략 개요](#테스트-전략-개요)
2. [단위 테스트 (Unit Tests)](#단위-테스트)
3. [통합 테스트 (Integration Tests)](#통합-테스트)
4. [E2E 테스트 (End-to-End)](#e2e-테스트)
5. [AI 추론 테스트](#ai-추론-테스트)
6. [성능 테스트](#성능-테스트)
7. [테스트 환경 설정](#테스트-환경-설정)

---

## 🎯 테스트 전략 개요

### 테스트 피라미드

```
        /\
       /  \
      / E2E \ (10% - 느림, 비쌈)
     /______\
    /        \
   / 통합 테스트 \ (30% - 보통)
  /____________\
 /              \
/   단위 테스트   \ (60% - 빠름, 저렴)
/________________\
```

### 커버리지 목표

| 유형 | 목표 커버리지 | 실행 시점 |
|-----|--------------|----------|
| **단위 테스트** | 80% | 매 커밋 (pre-commit hook) |
| **통합 테스트** | 60% | PR 생성 시 (CI/CD) |
| **E2E 테스트** | 주요 시나리오 10개 | 배포 전 (주 1회) |
| **AI 테스트** | 테마별 5개씩 (총 20개) | AI 프롬프트 변경 시 |
| **성능 테스트** | 핵심 기능 5개 | 배포 전 (주 1회) |

---

## 🧪 단위 테스트 (Unit Tests)

### 1. 프론트엔드 유틸리티 함수

#### 1.1 캔버스 직렬화/역직렬화

**파일:** `frontend/src/utils/canvasSerializer.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { fabric } from 'fabric';
import { serializeCanvas, deserializeCanvas } from './canvasSerializer';

describe('canvasSerializer', () => {
  let canvas: fabric.Canvas;

  beforeEach(() => {
    canvas = new fabric.Canvas(null, { width: 800, height: 600 });
  });

  it('빈 캔버스를 JSON으로 직렬화', () => {
    const json = serializeCanvas(canvas);
    expect(json).toHaveProperty('version');
    expect(json).toHaveProperty('objects');
    expect(json.objects).toHaveLength(0);
  });

  it('사각형을 그린 캔버스 직렬화', () => {
    const rect = new fabric.Rect({ left: 100, top: 100, width: 50, height: 50, fill: 'red' });
    canvas.add(rect);

    const json = serializeCanvas(canvas);
    expect(json.objects).toHaveLength(1);
    expect(json.objects[0].type).toBe('rect');
    expect(json.objects[0].fill).toBe('red');
  });

  it('직렬화 후 역직렬화 시 원본과 동일', () => {
    const rect = new fabric.Rect({ left: 100, top: 100, width: 50, height: 50 });
    canvas.add(rect);

    const json = serializeCanvas(canvas);
    const newCanvas = new fabric.Canvas(null);
    deserializeCanvas(newCanvas, json);

    expect(newCanvas.getObjects()).toHaveLength(1);
    expect(newCanvas.getObjects()[0].type).toBe('rect');
  });

  it('JSON 크기가 100KB 초과 시 에러', () => {
    // 100KB 초과하는 거대한 객체 생성
    for (let i = 0; i < 1000; i++) {
      const rect = new fabric.Rect({ left: i, top: i, width: 50, height: 50 });
      canvas.add(rect);
    }

    expect(() => serializeCanvas(canvas)).toThrow('Canvas JSON exceeds 100KB');
  });
});
```

#### 1.2 시간 포맷팅

**파일:** `frontend/src/utils/timeFormatter.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatElapsedTime, formatTimestamp } from './timeFormatter';

describe('timeFormatter', () => {
  it('초를 분:초 형식으로 변환', () => {
    expect(formatElapsedTime(0)).toBe('0:00');
    expect(formatElapsedTime(59)).toBe('0:59');
    expect(formatElapsedTime(60)).toBe('1:00');
    expect(formatElapsedTime(125)).toBe('2:05');
    expect(formatElapsedTime(3661)).toBe('61:01');
  });

  it('Unix timestamp를 한국 시간으로 변환', () => {
    const timestamp = 1678886400000; // 2023-03-15 18:00:00 KST
    expect(formatTimestamp(timestamp)).toBe('2023-03-15 18:00:00');
  });
});
```

#### 1.3 XSS 방지 (채팅 메시지 sanitize)

**파일:** `frontend/src/utils/sanitizer.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { sanitizeMessage } from './sanitizer';

describe('sanitizer', () => {
  it('일반 텍스트는 그대로 반환', () => {
    expect(sanitizeMessage('안녕하세요')).toBe('안녕하세요');
    expect(sanitizeMessage('제가 사과 그릴게요')).toBe('제가 사과 그릴게요');
  });

  it('HTML 태그 제거', () => {
    expect(sanitizeMessage('<script>alert("XSS")</script>')).toBe('');
    expect(sanitizeMessage('안녕<b>하세요</b>')).toBe('안녕하세요');
    expect(sanitizeMessage('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('특수 문자 이스케이프', () => {
    expect(sanitizeMessage('<script>')).toBe('');
    expect(sanitizeMessage('1 < 2')).toBe('1 < 2');  // 수식은 허용
  });

  it('빈 문자열 처리', () => {
    expect(sanitizeMessage('')).toBe('');
    expect(sanitizeMessage('   ')).toBe('   ');
  });
});
```

---

### 2. 백엔드 (Cloud Functions) 테스트

#### 2.1 AI 프롬프트 생성

**파일:** `functions/src/ai/prompts.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { buildJudgePrompt, buildEnhancedPrompt, THEME_HINTS } from './prompts';

describe('AI 프롬프트 생성', () => {
  it('기본 프롬프트에 테마 포함', () => {
    const prompt = buildJudgePrompt('동화');
    expect(prompt).toContain('동화');
    expect(prompt).toContain('Pictionary');
    expect(prompt).toContain('Korean');
  });

  it('Enhanced 프롬프트에 테마별 힌트 추가', () => {
    const prompt = buildEnhancedPrompt('영화');
    expect(prompt).toContain('영화');
    expect(prompt).toContain(THEME_HINTS['영화']);
    expect(prompt).toContain('기생충');
  });

  it('지원되지 않는 테마는 힌트 없음', () => {
    const prompt = buildEnhancedPrompt('미지원테마');
    expect(prompt).not.toContain('Category Hints');
  });

  it('JSON 응답 형식 명시', () => {
    const prompt = buildJudgePrompt('동화');
    expect(prompt).toContain('"guess"');
    expect(prompt).toContain('"confidence"');
  });
});
```

#### 2.2 팀 매칭 로직

**파일:** `functions/src/game/matching.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { shuffleArray, createTeams } from './matching';

describe('팀 매칭 로직', () => {
  it('참가자를 무작위로 섞기', () => {
    const participants = [
      { uid: '1', name: 'A' },
      { uid: '2', name: 'B' },
      { uid: '3', name: 'C' },
      { uid: '4', name: 'D' },
      { uid: '5', name: 'E' },
    ];

    const shuffled = shuffleArray([...participants]);
    expect(shuffled).toHaveLength(5);
    expect(shuffled).not.toEqual(participants); // 순서가 바뀌었을 확률 높음
  });

  it('10명을 2개 팀으로 분할', () => {
    const participants = Array.from({ length: 10 }, (_, i) => ({
      uid: `uid-${i}`,
      name: `Player ${i}`,
    }));

    const teams = createTeams(participants, 5);
    expect(teams).toHaveLength(2);
    expect(teams[0]).toHaveLength(5);
    expect(teams[1]).toHaveLength(5);
  });

  it('7명은 1개 팀만 생성 (나머지 2명 제외)', () => {
    const participants = Array.from({ length: 7 }, (_, i) => ({
      uid: `uid-${i}`,
      name: `Player ${i}`,
    }));

    const teams = createTeams(participants, 5);
    expect(teams).toHaveLength(1);
    expect(teams[0]).toHaveLength(5);
  });

  it('참가자가 5명 미만이면 빈 배열 반환', () => {
    const participants = [
      { uid: '1', name: 'A' },
      { uid: '2', name: 'B' },
    ];

    const teams = createTeams(participants, 5);
    expect(teams).toHaveLength(0);
  });
});
```

#### 2.3 게임 로직 유틸리티

**파일:** `functions/src/game/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getNextTurnIndex, isGameFinished } from './utils';

describe('게임 유틸리티', () => {
  it('다음 턴 인덱스 계산 (순환)', () => {
    const turnOrder = ['uid-1', 'uid-2', 'uid-3', 'uid-4', 'uid-5'];

    expect(getNextTurnIndex(0, turnOrder)).toBe(1);
    expect(getNextTurnIndex(4, turnOrder)).toBe(0); // 순환
    expect(getNextTurnIndex(2, turnOrder)).toBe(3);
  });

  it('게임 종료 조건: 정답 맞춤', () => {
    expect(isGameFinished('백설공주', '백설공주', 5, 10)).toBe(true);
  });

  it('게임 종료 조건: 최대 턴 초과', () => {
    expect(isGameFinished('사과', '백설공주', 10, 10)).toBe(true);
    expect(isGameFinished('사과', '백설공주', 11, 10)).toBe(true);
  });

  it('게임 진행 중', () => {
    expect(isGameFinished('사과', '백설공주', 5, 10)).toBe(false);
    expect(isGameFinished('공주', '백설공주', 9, 10)).toBe(false);
  });
});
```

---

## 🔗 통합 테스트 (Integration Tests)

### 1. Firebase Realtime Database 연동

**파일:** `frontend/src/services/database.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

// Firebase Emulator 사용
const firebaseConfig = {
  apiKey: 'fake-api-key',
  databaseURL: 'http://127.0.0.1:9000?ns=test-project',
};

describe('Firebase RTDB 통합 테스트', () => {
  let database;

  beforeAll(() => {
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  });

  it('캔버스 상태 저장 및 읽기', async () => {
    const roomId = 'test-room-001';
    const canvasState = JSON.stringify({ version: '5.3.0', objects: [] });

    // 쓰기
    await set(ref(database, `/liveDrawings/${roomId}/canvasState`), canvasState);

    // 읽기
    const snapshot = await get(ref(database, `/liveDrawings/${roomId}/canvasState`));
    expect(snapshot.val()).toBe(canvasState);
  });

  it('게임 룸 생성 및 조회', async () => {
    const roomId = 'test-room-002';
    const gameRoom = {
      status: 'waiting',
      theme: '동화',
      targetWord: '백설공주',
      currentTurn: 'uid-1',
      turnOrder: ['uid-1', 'uid-2', 'uid-3', 'uid-4', 'uid-5'],
      currentTurnIndex: 0,
      maxTurns: 10,
      turnCount: 0,
      startTime: Date.now(),
    };

    await set(ref(database, `/gameRooms/${roomId}`), gameRoom);

    const snapshot = await get(ref(database, `/gameRooms/${roomId}`));
    expect(snapshot.val()).toMatchObject({
      status: 'waiting',
      theme: '동화',
      targetWord: '백설공주',
    });
  });

  it('채팅 메시지 추가', async () => {
    const roomId = 'test-room-003';
    const message = {
      uid: 'uid-1',
      displayName: '김개발',
      text: '제가 사과 먼저 그릴게요',
      timestamp: Date.now(),
    };

    await set(ref(database, `/chatMessages/${roomId}/msg-001`), message);

    const snapshot = await get(ref(database, `/chatMessages/${roomId}/msg-001`));
    expect(snapshot.val().text).toBe('제가 사과 먼저 그릴게요');
  });
});
```

### 2. Cloud Functions 통합 테스트

**파일:** `functions/test/judgeDrawing.integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions-test';
import { judgeDrawing } from '../src/ai/judge.flow';
import * as fs from 'fs';

const testEnv = functions();

describe('judgeDrawing Cloud Function', () => {
  beforeAll(() => {
    admin.initializeApp();
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  it('백설공주 그림 인식 (정답)', async () => {
    // 테스트 이미지 (사과 + 공주 그림)
    const imageBase64 = 'data:image/jpeg;base64,' +
      fs.readFileSync('./test/images/snow-white.jpg', 'base64');

    // 게임 룸 Mock 데이터 설정
    const roomId = 'test-room-ai-001';
    await admin.database().ref(`/gameRooms/${roomId}`).set({
      status: 'in-progress',
      theme: '동화',
      targetWord: '백설공주',
      turnCount: 4,
      maxTurns: 10,
    });

    const result = await judgeDrawing({ roomId, imageBase64 }, { auth: { uid: 'test-uid' } });

    expect(result.guess).toBe('백설공주');
    expect(result.isCorrect).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.6);
  }, 30000); // AI 호출 시간 고려 (30초 타임아웃)

  it('추상 그림 인식 (오답)', async () => {
    const imageBase64 = 'data:image/jpeg;base64,' +
      fs.readFileSync('./test/images/abstract.jpg', 'base64');

    const roomId = 'test-room-ai-002';
    await admin.database().ref(`/gameRooms/${roomId}`).set({
      status: 'in-progress',
      theme: '동화',
      targetWord: '백설공주',
      turnCount: 1,
      maxTurns: 10,
    });

    const result = await judgeDrawing({ roomId, imageBase64 }, { auth: { uid: 'test-uid' } });

    expect(result.guess).not.toBe('백설공주');
    expect(result.isCorrect).toBe(false);
    expect(result.gameStatus).toBe('in-progress'); // 게임 계속
  }, 30000);

  it('최대 턴 초과 시 게임 종료', async () => {
    const imageBase64 = 'data:image/jpeg;base64,' +
      fs.readFileSync('./test/images/abstract.jpg', 'base64');

    const roomId = 'test-room-ai-003';
    await admin.database().ref(`/gameRooms/${roomId}`).set({
      status: 'in-progress',
      theme: '동화',
      targetWord: '백설공주',
      turnCount: 9, // 다음이 10턴
      maxTurns: 10,
    });

    const result = await judgeDrawing({ roomId, imageBase64 }, { auth: { uid: 'test-uid' } });

    expect(result.gameStatus).toBe('finished');
    expect(result.turnCount).toBe(10);
  }, 30000);
});
```

---

## 🎭 E2E 테스트 (End-to-End)

**도구:** Playwright

### 1. 전체 게임 플레이 시나리오

**파일:** `frontend/e2e/game-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('전체 게임 플레이', () => {
  test('5명이 게임 완료까지 플레이', async ({ browser }) => {
    // 5명의 브라우저 컨텍스트 생성
    const contexts = await Promise.all(
      Array.from({ length: 5 }, () => browser.newContext())
    );
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    // 1. 모든 플레이어 로그인
    for (let i = 0; i < 5; i++) {
      await pages[i].goto('http://localhost:5173');
      await pages[i].click('button:has-text("Google로 로그인")');
      // Firebase Emulator 자동 로그인
      await pages[i].waitForURL('**/lobby');
    }

    // 2. 게임 룸 입장
    const roomId = 'test-room-e2e-001';
    for (let i = 0; i < 5; i++) {
      await pages[i].goto(`http://localhost:5173/game/${roomId}`);
    }

    // 3. 턴 1: Player 1 그리기
    await pages[0].waitForSelector('canvas');
    const canvas0 = await pages[0].locator('canvas');
    await canvas0.click({ position: { x: 100, y: 100 } });
    await canvas0.dragTo(canvas0, { sourcePosition: { x: 100, y: 100 }, targetPosition: { x: 200, y: 200 } });

    // 4. 다른 플레이어들이 실시간으로 캔버스 업데이트 확인
    for (let i = 1; i < 5; i++) {
      await pages[i].waitForTimeout(1000);
      const canvasState = await pages[i].evaluate(() => {
        const canvas = document.querySelector('canvas');
        return canvas ? (canvas as any).toDataURL() : null;
      });
      expect(canvasState).toBeTruthy();
    }

    // 5. 턴 종료 및 AI 판단
    await pages[0].click('button:has-text("턴 종료")');
    await pages[0].waitForSelector('text=AI의 추론');

    // 6. 게임 종료 확인 (정답 또는 10턴 후)
    // ... (반복)

    // 정리
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  test('채팅 메시지 실시간 동기화', async ({ browser }) => {
    const [page1, page2] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
    ]);

    const roomId = 'test-room-chat-001';
    await page1.goto(`http://localhost:5173/game/${roomId}`);
    await page2.goto(`http://localhost:5173/game/${roomId}`);

    // Player 1이 메시지 전송
    await page1.fill('input[placeholder*="전략"]', '제가 사과 그릴게요');
    await page1.press('input[placeholder*="전략"]', 'Enter');

    // Player 2가 메시지 수신 확인
    await expect(page2.locator('text=제가 사과 그릴게요')).toBeVisible({ timeout: 2000 });
  });
});
```

### 2. 인증 플로우 테스트

**파일:** `frontend/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('인증', () => {
  test('Google SSO 로그인', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 로그인 전 상태 확인
    await expect(page.locator('button:has-text("Google로 로그인")')).toBeVisible();

    // 로그인 클릭 (Firebase Emulator 자동 로그인)
    await page.click('button:has-text("Google로 로그인")');

    // 로그인 후 리다이렉트 확인
    await page.waitForURL('**/lobby');
    await expect(page.locator('text=대기실')).toBeVisible();
  });

  test('로그아웃', async ({ page }) => {
    // 로그인 상태에서 시작
    await page.goto('http://localhost:5173/lobby');

    await page.click('button:has-text("로그아웃")');
    await page.waitForURL('http://localhost:5173/');
    await expect(page.locator('button:has-text("Google로 로그인")')).toBeVisible();
  });
});
```

---

## 🤖 AI 추론 테스트

### 테마별 정확도 테스트

**파일:** `functions/test/ai-accuracy.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildEnhancedPrompt } from '../src/ai/prompts';
import * as fs from 'fs';

describe('AI 정확도 테스트', () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // 테스트 데이터셋
  const testCases = [
    { theme: '동화', word: '백설공주', image: './test/images/snow-white.jpg' },
    { theme: '동화', word: '신데렐라', image: './test/images/cinderella.jpg' },
    { theme: '영화', word: '기생충', image: './test/images/parasite.jpg' },
    { theme: '영화', word: '어벤져스', image: './test/images/avengers.jpg' },
    { theme: '음식', word: '김치', image: './test/images/kimchi.jpg' },
  ];

  testCases.forEach(({ theme, word, image }) => {
    it(`${theme} - ${word} 인식`, async () => {
      const imageBase64 = fs.readFileSync(image, 'base64');
      const prompt = buildEnhancedPrompt(theme);

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
      ]);

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ''));

      console.log(`AI 추론: ${parsed.guess} (정답: ${word}, 신뢰도: ${parsed.confidence})`);

      expect(parsed.guess).toBe(word);
      expect(parsed.confidence).toBeGreaterThan(0.5);
    }, 30000);
  });

  it('빈 캔버스는 낮은 신뢰도', async () => {
    const emptyCanvas = fs.readFileSync('./test/images/empty-canvas.jpg', 'base64');
    const prompt = buildEnhancedPrompt('동화');

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: emptyCanvas, mimeType: 'image/jpeg' } },
    ]);

    const parsed = JSON.parse(result.response.text());
    expect(parsed.confidence).toBeLessThan(0.3);
  }, 30000);
});
```

---

## ⚡ 성능 테스트

### 1. 실시간 동기화 지연 시간 측정

**파일:** `frontend/test/performance/sync-latency.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test('캔버스 동기화 지연 시간 < 1초', async ({ browser }) => {
  const [page1, page2] = await Promise.all([
    browser.newPage(),
    browser.newPage(),
  ]);

  const roomId = 'perf-test-001';
  await page1.goto(`http://localhost:5173/game/${roomId}`);
  await page2.goto(`http://localhost:5173/game/${roomId}`);

  // Player 1이 그리기 시작
  const startTime = Date.now();
  await page1.locator('canvas').click({ position: { x: 100, y: 100 } });

  // Player 2가 변경 감지
  await page2.waitForFunction(() => {
    const canvas = document.querySelector('canvas');
    return canvas && (canvas as any).toDataURL() !== 'data:image/png;base64,iVBORw0KGgoAAAANSU...'; // 빈 캔버스
  });

  const latency = Date.now() - startTime;
  console.log(`캔버스 동기화 지연: ${latency}ms`);

  expect(latency).toBeLessThan(1000); // 1초 이내
});
```

### 2. AI 추론 응답 시간 측정

**파일:** `functions/test/performance/ai-response-time.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

describe('AI 응답 시간', () => {
  it('Gemini API 응답 < 5초', async () => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imageBase64 = fs.readFileSync('./test/images/snow-white.jpg', 'base64');

    const startTime = Date.now();
    const result = await model.generateContent([
      '이 그림이 무엇인가요?',
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
    ]);
    const responseTime = Date.now() - startTime;

    console.log(`AI 응답 시간: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(5000); // 5초 이내
  }, 10000);
});
```

---

## 🛠️ 테스트 환경 설정

### 1. Vitest 설정 (프론트엔드)

**파일:** `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
    },
  },
});
```

**파일:** `frontend/src/test/setup.ts`

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### 2. Firebase Emulator 설정

**파일:** `firebase.json`

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "database": {
      "port": 9000
    },
    "functions": {
      "port": 5001
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 3. Playwright 설정 (E2E)

**파일:** `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📦 테스트 실행 스크립트

### package.json (프론트엔드)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### package.json (Cloud Functions)

```json
{
  "scripts": {
    "test": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:emulator": "firebase emulators:exec --only database,functions 'npm test'"
  }
}
```

---

## 🎯 CI/CD 파이프라인 통합

### GitHub Actions Workflow

**파일:** `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies (Frontend)
        run: cd frontend && npm ci

      - name: Run unit tests
        run: cd frontend && npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Install dependencies (Functions)
        run: cd functions && npm ci

      - name: Start Firebase Emulators
        run: firebase emulators:exec --only database,functions 'npm test'
        working-directory: ./functions

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps

      - name: Run E2E tests
        run: cd frontend && npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## 📊 테스트 커버리지 목표

| 모듈 | 목표 커버리지 | 현재 커버리지 |
|-----|--------------|--------------|
| **Utils** | 90% | - |
| **Components** | 80% | - |
| **Hooks** | 85% | - |
| **Services** | 75% | - |
| **Cloud Functions** | 80% | - |
| **전체 평균** | **80%** | - |

---

## 🚀 다음 단계

1. **Week 1**: 테스트 환경 설정 (Vitest, Playwright, Firebase Emulator)
2. **Week 2-4**: 개발과 동시에 단위 테스트 작성 (TDD)
3. **Week 5**: 통합 테스트 작성
4. **Week 6**: E2E 테스트 작성 및 알파 테스트
5. **Week 7**: 성능 테스트 및 최적화
6. **Week 8**: 전체 테스트 suite 실행 후 배포

---

**테스트는 선택이 아닌 필수입니다!** 🧪
