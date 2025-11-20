# Project Da Vinci - AI 추론 로직 설계

> Gemini 1.5 Flash를 활용한 실시간 그림 판단 시스템

## 🤖 AI 역할 정의

Project Da Vinci에서 AI는 단순한 "도구"가 아닌 **게임의 핵심 플레이어**입니다.

### AI의 역할

- **판사 (Judge)**: 플레이어들이 그린 그림을 보고 단어를 추론
- **도전 대상**: 팀이 협력하여 AI를 "설득"해야 하는 대상
- **재미 요소**: AI의 엉뚱한 추론이 웃음과 전략 수정을 유도

### 핵심 설계 원칙

```
❌ 잘못된 방식: AI가 정답을 알고 "그림이 정답과 맞는지" 판단
   → 이건 게임이 아니라 그림 품질 검증

✅ 올바른 방식: AI가 정답을 모르고 "그림이 무엇인지" 추론
   → 진정한 "AI vs 인간" 게임
```

---

## 🎯 AI 모델 선택

### Google Gemini 1.5 Flash

| 항목 | 세부사항 |
|-----|----------|
| **모델 ID** | `gemini-1.5-flash-latest` |
| **입력** | 멀티모달 (텍스트 + 이미지) |
| **출력** | JSON 형식 구조화 응답 |
| **응답 속도** | ~2-3초 (실시간 게임에 적합) |
| **비용** | $0.00001875/이미지 (~300회 호출 시 $5-10) |
| **한국어 지원** | 네이티브 지원 (번역 불필요) |

### 왜 Gemini인가?

1. **Vision API 통합**: 이미지 입력을 네이티브로 처리
2. **저렴한 비용**: GPT-4V보다 10배 저렴
3. **빠른 응답**: Flash 모델은 실시간 게임에 최적화
4. **JSON 모드**: 구조화된 출력 보장

---

## 📝 프롬프트 엔지니어링

### 1. 기본 프롬프트 구조

```typescript
// functions/src/ai/prompts.ts

export function buildJudgePrompt(theme: string): string {
  return `You are playing a Pictionary game as the judge.
Your task is to look at the drawing and guess what it represents.

**Game Category**: ${theme}

**Rules**:
1. You do NOT know the correct answer.
2. You must guess based ONLY on what you see in the drawing.
3. Respond in Korean.
4. Be honest about your confidence level.

**Response Format** (JSON only):
{
  "guess": "your guess in Korean",
  "confidence": 0.85
}

**Examples**:
- If you see a red apple: {"guess": "사과", "confidence": 0.9}
- If you see a woman in a dress: {"guess": "공주", "confidence": 0.6}
- If you see unclear shapes: {"guess": "추상화", "confidence": 0.3}

Now, look at the drawing and make your guess.`;
}
```

### 2. 테마별 프롬프트 최적화

```typescript
// functions/src/ai/prompts.ts

export const THEME_HINTS: Record<string, string> = {
  '동화': `
Common fairy tale elements: princesses, castles, animals, magic items.
Examples: 백설공주 (Snow White), 신데렐라 (Cinderella), 피노키오 (Pinocchio)
`,
  '영화': `
Common movie elements: characters, iconic scenes, movie posters.
Examples: 기생충 (Parasite), 어벤져스 (Avengers), 타이타닉 (Titanic)
`,
  '음식': `
Common food items: fruits, dishes, ingredients.
Examples: 김치 (Kimchi), 피자 (Pizza), 라면 (Ramen)
`,
  '동물': `
Common animals: mammals, birds, sea creatures.
Examples: 코끼리 (Elephant), 독수리 (Eagle), 고래 (Whale)
`,
};

export function buildEnhancedPrompt(theme: string): string {
  const basePrompt = buildJudgePrompt(theme);
  const hint = THEME_HINTS[theme] || '';

  return `${basePrompt}

**Category Hints**:
${hint}

Remember: Your guess should match the category "${theme}".`;
}
```

### 3. Few-Shot Learning (선택 사항)

AI의 정확도를 높이기 위해 예시 추가:

```typescript
export function buildFewShotPrompt(theme: string): string {
  return `${buildEnhancedPrompt(theme)}

**Past Game Examples** (for reference only):

Game 1 (Category: 동화):
- Drawing: A red apple + a woman sleeping + 7 small people
- Correct Guess: 백설공주 (Snow White) ✓

Game 2 (Category: 영화):
- Drawing: A staircase + a peach
- Correct Guess: 기생충 (Parasite) ✓

Game 3 (Category: 음식):
- Drawing: Red noodles in a bowl + chopsticks
- Wrong Guess: 스파게티 (Spaghetti) ✗
- Correct Answer: 라면 (Ramen)

Now, make your guess for the current drawing.`;
}
```

---

## 🔧 구현: Cloud Function

### 전체 흐름

```
[클라이언트]
    ↓ (canvas.toDataURL() → Base64)
httpsCallable('judgeDrawing', { roomId, imageBase64 })
    ↓
[Cloud Function: judgeDrawing]
    ↓
1. 게임 룸 정보 조회 (theme, targetWord)
2. 프롬프트 생성 (theme 기반)
3. Gemini API 호출 (image + prompt)
4. 응답 파싱 (JSON)
5. 정답 여부 판단
6. 게임 상태 업데이트 (RTDB)
    ↓
[응답]
{ guess: "백설공주", confidence: 0.85, isCorrect: true }
```

### 상세 구현

```typescript
// functions/src/ai/judge.flow.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildEnhancedPrompt } from './prompts';
import { logger } from 'firebase-functions';

interface JudgeRequest {
  roomId: string;
  imageBase64: string;  // "data:image/jpeg;base64,..."
}

interface JudgeResponse {
  guess: string;
  confidence: number;
  isCorrect: boolean;
  turnCount: number;
  gameStatus: 'in-progress' | 'finished';
}

export const judgeDrawing = onCall<JudgeRequest, Promise<JudgeResponse>>({
  region: 'asia-northeast3',
  timeoutSeconds: 30,
  memory: '512MiB',
  cors: true,
}, async (request) => {
  // 0. 인증 확인
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const { roomId, imageBase64 } = request.data;

  // 입력 검증
  if (!roomId || !imageBase64) {
    throw new HttpsError('invalid-argument', 'roomId와 imageBase64가 필요합니다.');
  }

  const db = getDatabase();

  // 1. 게임 룸 정보 조회
  const roomSnapshot = await db.ref(`/gameRooms/${roomId}`).once('value');
  if (!roomSnapshot.exists()) {
    throw new HttpsError('not-found', '게임 룸을 찾을 수 없습니다.');
  }

  const gameRoom = roomSnapshot.val();

  if (gameRoom.status !== 'in-progress') {
    throw new HttpsError('failed-precondition', '게임이 진행 중이 아닙니다.');
  }

  // 2. 프롬프트 생성
  const prompt = buildEnhancedPrompt(gameRoom.theme);
  logger.info(`프롬프트 생성 완료 (테마: ${gameRoom.theme})`);

  // 3. Gemini API 호출
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    generationConfig: {
      temperature: 0.7,  // 약간의 창의성 허용
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 100,  // JSON 응답은 짧음
    },
  });

  try {
    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),  // Base64 헤더 제거
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    logger.info('Gemini 원본 응답:', responseText);

    // 4. JSON 파싱 (Gemini가 가끔 마크다운으로 감싸는 경우 처리)
    let guess: string;
    let confidence: number;

    try {
      // ```json ... ``` 제거
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedText);

      guess = parsed.guess || parsed.단어 || parsed.추측;  // 다양한 키 허용
      confidence = parsed.confidence || parsed.신뢰도 || 0.5;
    } catch (parseError) {
      logger.warn('JSON 파싱 실패, 텍스트에서 추출 시도:', responseText);

      // Fallback: 정규식으로 추출
      const guessMatch = responseText.match(/"guess"\s*:\s*"([^"]+)"/);
      const confidenceMatch = responseText.match(/"confidence"\s*:\s*([\d.]+)/);

      guess = guessMatch ? guessMatch[1] : '알 수 없음';
      confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.3;
    }

    logger.info(`AI 추론: ${guess} (신뢰도: ${confidence})`);

    // 5. 정답 확인
    const isCorrect = guess.trim() === gameRoom.targetWord.trim();
    const newTurnCount = gameRoom.turnCount + 1;

    const aiGuess = {
      turn: newTurnCount,
      guess,
      confidence,
      timestamp: Date.now(),
    };

    // 6. 게임 상태 업데이트
    let gameStatus: 'in-progress' | 'finished' = 'in-progress';

    if (isCorrect) {
      // 정답! 게임 종료
      gameStatus = 'finished';
      await db.ref(`/gameRooms/${roomId}`).update({
        status: 'finished',
        endTime: Date.now(),
        turnCount: newTurnCount,
        aiGuesses: [...(gameRoom.aiGuesses || []), aiGuess],
      });

      logger.info(`🎉 정답! 룸: ${roomId}, 답: ${guess}`);

    } else if (newTurnCount >= gameRoom.maxTurns) {
      // 최대 턴 초과, 게임 실패
      gameStatus = 'finished';
      await db.ref(`/gameRooms/${roomId}`).update({
        status: 'finished',
        endTime: Date.now(),
        turnCount: newTurnCount,
        aiGuesses: [...(gameRoom.aiGuesses || []), aiGuess],
      });

      logger.warn(`❌ 최대 턴 초과! 룸: ${roomId}`);

    } else {
      // 오답, 다음 턴으로
      const nextTurnIndex = (gameRoom.currentTurnIndex + 1) % gameRoom.turnOrder.length;

      await db.ref(`/gameRooms/${roomId}`).update({
        currentTurnIndex: nextTurnIndex,
        currentTurn: gameRoom.turnOrder[nextTurnIndex],
        turnCount: newTurnCount,
        aiGuesses: [...(gameRoom.aiGuesses || []), aiGuess],
      });

      logger.info(`➡️ 다음 턴: ${gameRoom.turnOrder[nextTurnIndex]}`);
    }

    return {
      guess,
      confidence,
      isCorrect,
      turnCount: newTurnCount,
      gameStatus,
    };

  } catch (error: any) {
    logger.error('AI 추론 실패:', error);
    throw new HttpsError('internal', `AI 추론 중 오류 발생: ${error.message}`);
  }
});
```

---

## 🧪 프롬프트 테스트 전략

### 1. 단위 테스트 (로컬)

```typescript
// functions/test/ai.test.ts
import { buildEnhancedPrompt } from '../src/ai/prompts';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

describe('AI 프롬프트 테스트', () => {
  it('동화 테마: 백설공주 그림 인식', async () => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 테스트 이미지 (사과 + 공주 그림)
    const imageBase64 = fs.readFileSync('./test/images/snow-white.jpg', 'base64');

    const prompt = buildEnhancedPrompt('동화');
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
    ]);

    const response = JSON.parse(result.response.text());
    console.log('AI 추론:', response);

    expect(response.guess).toBe('백설공주');
    expect(response.confidence).toBeGreaterThan(0.6);
  });
});
```

### 2. A/B 테스트 (프로덕션)

```typescript
// 프롬프트 버전별 성능 비교
const PROMPT_VERSIONS = {
  v1: buildJudgePrompt,
  v2: buildEnhancedPrompt,
  v3: buildFewShotPrompt,
};

// 게임 로그에 프롬프트 버전 기록
const aiGuess = {
  // ...
  promptVersion: 'v2',
};

// 추후 분석: 어떤 프롬프트가 정답률이 높은지 확인
```

---

## 📊 성능 지표

### 목표 정확도

| 턴 수 | 목표 정답률 |
|------|-----------|
| 1-2턴 | 10-20% (매우 어려움) |
| 3-5턴 | 40-60% (적절한 난이도) |
| 6-8턴 | 70-85% (쉬움) |
| 9-10턴 | 90%+ (거의 정답) |

**이상적인 게임**: 5-7턴 내에 정답 (팀 협력 필수)

### 실제 성능 측정

```typescript
// 게임 로그 분석
const logs = await db.ref('/gameLogs').once('value');
const games = Object.values(logs.val());

const avgTurns = games.reduce((sum, g) => sum + g.finalTurnCount, 0) / games.length;
const successRate = games.filter(g => g.finalTurnCount <= 10).length / games.length;

console.log(`평균 턴 수: ${avgTurns}`);
console.log(`성공률: ${successRate * 100}%`);
```

---

## 🔧 AI 응답 품질 개선

### 문제 1: AI가 영어로 응답

**원인:** 프롬프트에 "Respond in Korean" 명시했지만 무시

**해결:**
```typescript
// 응답 후 한국어 강제 변환
import { translate } from '@google-cloud/translate';

if (!/[가-힣]/.test(guess)) {
  // 한글이 없으면 번역
  const [translation] = await translate.translate(guess, 'ko');
  guess = translation;
}
```

### 문제 2: AI가 JSON 형식 무시

**원인:** Gemini가 가끔 마크다운으로 감싸거나 설명 추가

**해결:**
```typescript
// 정규식으로 JSON 추출
const jsonMatch = responseText.match(/\{[^}]+\}/);
if (jsonMatch) {
  const parsed = JSON.parse(jsonMatch[0]);
  guess = parsed.guess;
}
```

### 문제 3: 신뢰도가 항상 높음 (0.9+)

**원인:** AI가 과신하는 경향

**해결:**
```typescript
// 신뢰도 조정 (calibration)
const calibratedConfidence = Math.max(0.3, confidence * 0.7);
```

---

## 💡 향후 개선 아이디어

### 1. 점진적 힌트 제공

```typescript
// 턴 수에 따라 AI에게 힌트 제공
if (turnCount >= 5) {
  prompt += `\n\nHint: The answer starts with "${targetWord[0]}".`;
}
```

### 2. AI 난이도 조절

```typescript
export enum AIDifficulty {
  EASY = 'easy',    // 정답률 80% (Few-shot 프롬프트)
  NORMAL = 'normal', // 정답률 60% (Enhanced 프롬프트)
  HARD = 'hard',    // 정답률 40% (Basic 프롬프트)
}

export function buildPromptByDifficulty(theme: string, difficulty: AIDifficulty): string {
  switch (difficulty) {
    case AIDifficulty.EASY:
      return buildFewShotPrompt(theme);
    case AIDifficulty.NORMAL:
      return buildEnhancedPrompt(theme);
    case AIDifficulty.HARD:
      return buildJudgePrompt(theme);
  }
}
```

### 3. ✅ AI 누적 추론 (Cooperative Clue System)

**상태: 구현 완료** 🎉

AI가 이전 턴의 추측을 기억하고, 누적된 단서를 조합하여 정답을 추론합니다.

#### 핵심 개념

```
❌ 기존 방식 (독립적 판단):
  턴 1: [산 그림] → AI: "산" (40%)
  턴 2: [집 그림] → AI: "집" (75%) ← 이전 "산" 모름
  턴 3: [나무꾼] → AI: "나무꾼" (70%) ← 조합 불가
  턴 4: [요정] → AI: "요정" (70%) ← 여전히 개별 판단

✅ 개선 방식 (누적 추론):
  턴 1: [산 그림] → AI: "산" (40%)
  턴 2: [집 그림] → AI: "집" (75%) + 기억: [산]
  턴 3: [나무꾼] → AI: "나무꾼" (70%) + 기억: [산, 집]
  턴 4: [요정] → AI: "선녀와나무꾼" (85%) ✅
              ↑ 조합: "나무꾼" + "요정" = "선녀와나무꾼"
```

#### 구현

```typescript
// functions/src/ai/prompts.ts

export interface AIGuessHistory {
  turn: number
  guess: string
  confidence: number
}

function formatPreviousGuesses(previousGuesses: AIGuessHistory[]): string {
  if (!previousGuesses || previousGuesses.length === 0) {
    return ''
  }

  const guessesText = previousGuesses
    .map((g) => `  턴 ${g.turn}: "${g.guess}" (신뢰도 ${(g.confidence * 100).toFixed(0)}%)`)
    .join('\n')

  return `
**Your Previous Guesses** (from earlier drawings by teammates):
${guessesText}

**IMPORTANT**: This is a COOPERATIVE game where multiple players draw clues in sequence.
- You saw these earlier drawings and made the guesses above
- Now you're seeing a NEW drawing from another teammate
- Consider ALL the clues together - players are building up hints
- Try to combine the previous guesses with the current drawing
- If previous guesses suggest parts of an answer (like "나무꾼" and "요정"),
  consider if they could combine into one answer (like "선녀와나무꾼")
- The final answer might be a combination of multiple clues
`
}

export function buildJudgePrompt(
  theme: string,
  previousGuesses: AIGuessHistory[] = []
): string {
  const historySection = formatPreviousGuesses(previousGuesses)

  return `You are playing a Pictionary game as the judge.
Your task is to look at the drawing and guess what it represents.

**Game Category**: ${theme}
${historySection}
**Rules**:
1. You do NOT know the correct answer.
2. You must guess based on what you see in the CURRENT drawing AND previous clues.
3. Respond in Korean.
4. Be honest about your confidence level.
5. Consider if this drawing adds to previous clues to form a complete answer.

**Response Format** (JSON only):
{
  "guess": "your guess in Korean",
  "confidence": 0.85
}

**Examples**:
- If you see a red apple: {"guess": "사과", "confidence": 0.9}
- If previous guesses were "나무꾼" and you see a fairy: {"guess": "선녀와나무꾼", "confidence": 0.85}

Now, look at the drawing and make your guess.`
}
```

#### 호출 예시

```typescript
// functions/src/ai/judge.flow.ts

// 이전 추측 히스토리 변환
const previousGuesses = (gameRoom.aiGuesses || []).map((g: any) => ({
  turn: g.turn,
  guess: g.guess,
  confidence: g.confidence,
}))

const prompt = buildPromptByDifficulty(gameRoom.theme, difficulty, previousGuesses)
logger.info(`프롬프트 생성 (이전 추측: ${previousGuesses.length}개)`)
```

#### 게임 경험 개선

**Before**: 한 장의 그림으로 "선녀와나무꾼" 표현 필요 (거의 불가능)

**After**:
- 턴 1: 산 그리기 → AI: "산"
- 턴 2: 나무꾼 그리기 → AI: "나무꾼"
- 턴 3: 요정(선녀) 그리기 → AI: "선녀와나무꾼" ✅

참가자들이 **단서를 하나씩 쌓아가며** AI를 가이드할 수 있습니다!

---

## 🔍 디버깅 및 모니터링

### Cloud Functions 로그

```bash
# 실시간 로그 확인
firebase functions:log --only judgeDrawing

# 특정 기간 로그
firebase functions:log --since 2h
```

### AI 응답 품질 대시보드 (향후)

```typescript
// Firestore에 AI 성능 메트릭 저장
await db.ref('/aiMetrics').push({
  timestamp: Date.now(),
  theme: gameRoom.theme,
  targetWord: gameRoom.targetWord,
  guess,
  confidence,
  isCorrect,
  turnCount,
  responseTime: Date.now() - startTime,
});

// 분석: 어떤 테마/단어가 어려운지 파악
```

---

## 📚 참고 자료

- [Gemini API Cookbook](https://github.com/google-gemini/cookbook)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Vision API Best Practices](https://ai.google.dev/gemini-api/docs/vision)

---

**다음 문서**: [TODO.md](./TODO.md) - 개발 체크리스트 및 마일스톤
