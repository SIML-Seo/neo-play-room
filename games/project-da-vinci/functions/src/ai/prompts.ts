/**
 * AI 프롬프트 생성 모듈
 * Gemini 1.5 Flash를 위한 프롬프트 엔지니어링
 */

/**
 * 기본 Judge 프롬프트 생성
 */
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

Now, look at the drawing and make your guess.`
}

/**
 * 테마별 힌트
 */
export const THEME_HINTS: Record<string, string> = {
  동화: `
Common fairy tale elements: princesses, castles, animals, magic items.
Examples: 백설공주 (Snow White), 신데렐라 (Cinderella), 피노키오 (Pinocchio)
`,
  영화: `
Common movie elements: characters, iconic scenes, movie posters.
Examples: 기생충 (Parasite), 어벤져스 (Avengers), 타이타닉 (Titanic)
`,
  음식: `
Common food items: fruits, dishes, ingredients.
Examples: 김치 (Kimchi), 피자 (Pizza), 라면 (Ramen)
`,
  동물: `
Common animals: mammals, birds, sea creatures.
Examples: 코끼리 (Elephant), 독수리 (Eagle), 고래 (Whale)
`,
}

/**
 * 향상된 프롬프트 (테마 힌트 포함)
 */
export function buildEnhancedPrompt(theme: string): string {
  const basePrompt = buildJudgePrompt(theme)
  const hint = THEME_HINTS[theme] || ''

  return `${basePrompt}

**Category Hints**:
${hint}

Remember: Your guess should match the category "${theme}".`
}

/**
 * Few-Shot 프롬프트 (예시 포함)
 */
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

Now, make your guess for the current drawing.`
}

/**
 * Hard 난이도 프롬프트 (매우 어려움 - 힌트 최소)
 */
export function buildHardPrompt(theme: string): string {
  return `You are an AI judge in a Pictionary game.
Look at this drawing and make your best guess.

**Category**: ${theme}

**Important Rules**:
- You do NOT know the correct answer
- Be very strict and literal in your interpretation
- Only guess if you see clear, recognizable shapes
- Do NOT make creative assumptions
- If the drawing is unclear or abstract, make a simple literal guess

**Response Format** (JSON only):
{
  "guess": "your guess in Korean",
  "confidence": 0.5
}

**Examples**:
- If you see a circle: {"guess": "원", "confidence": 0.4}
- If you see stick figures: {"guess": "사람", "confidence": 0.3}

Make your guess now based ONLY on what you clearly see.`
}

/**
 * AI 난이도 레벨
 */
export enum AIDifficulty {
  EASY = 'easy', // 정답률 80% (Few-shot 프롬프트 - 힌트 많음)
  NORMAL = 'normal', // 정답률 60% (Enhanced 프롬프트 - 힌트 보통)
  HARD = 'hard', // 정답률 30-40% (Hard 프롬프트 - 힌트 최소)
}

/**
 * 난이도별 프롬프트 생성
 */
export function buildPromptByDifficulty(
  theme: string,
  difficulty: AIDifficulty = AIDifficulty.NORMAL
): string {
  switch (difficulty) {
    case AIDifficulty.EASY:
      return buildFewShotPrompt(theme) // 많은 힌트 + 예시
    case AIDifficulty.NORMAL:
      return buildEnhancedPrompt(theme) // 테마 힌트
    case AIDifficulty.HARD:
      return buildHardPrompt(theme) // 힌트 최소, 엄격한 판단
  }
}
