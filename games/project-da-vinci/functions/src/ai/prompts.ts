/**
 * AI 프롬프트 생성 모듈
 * Gemini 1.5 Flash를 위한 프롬프트 엔지니어링
 */

/**
 * AI 추측 히스토리 타입
 */
export interface AIGuessHistory {
  turn: number
  guess: string
  confidence: number
}

/**
 * 이전 추측 히스토리를 프롬프트 형식으로 변환
 */
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

/**
 * 기본 Judge 프롬프트 생성
 */
export function buildJudgePrompt(theme: string, previousGuesses: AIGuessHistory[] = []): string {
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
- If you see a woman in a dress: {"guess": "공주", "confidence": 0.6}
- If previous guesses were "나무꾼" and you see a fairy: {"guess": "선녀와나무꾼", "confidence": 0.85}

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
export function buildEnhancedPrompt(theme: string, previousGuesses: AIGuessHistory[] = []): string {
  const basePrompt = buildJudgePrompt(theme, previousGuesses)
  const hint = THEME_HINTS[theme] || ''

  return `${basePrompt}

**Category Hints**:
${hint}

Remember: Your guess should match the category "${theme}".`
}

/**
 * Few-Shot 프롬프트 (예시 포함)
 */
export function buildFewShotPrompt(theme: string, previousGuesses: AIGuessHistory[] = []): string {
  return `${buildEnhancedPrompt(theme, previousGuesses)}

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
export function buildHardPrompt(theme: string, previousGuesses: AIGuessHistory[] = []): string {
  const historySection = formatPreviousGuesses(previousGuesses)

  return `You are an AI judge in a Pictionary game.
Look at this drawing and make your best guess.

**Category**: ${theme}
${historySection}
**Important Rules**:
- You do NOT know the correct answer
- Be very strict and literal in your interpretation
- Only guess if you see clear, recognizable shapes
- Do NOT make creative assumptions
- If the drawing is unclear or abstract, make a simple literal guess
- If you have previous guesses, consider if they might combine with the current drawing

**Response Format** (JSON only):
{
  "guess": "your guess in Korean",
  "confidence": 0.5
}

**Examples**:
- If you see a circle: {"guess": "원", "confidence": 0.4}
- If you see stick figures: {"guess": "사람", "confidence": 0.3}
- If previous guesses were "나무꾼" and you see a fairy: {"guess": "선녀와나무꾼", "confidence": 0.6}

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
  difficulty: AIDifficulty = AIDifficulty.NORMAL,
  previousGuesses: AIGuessHistory[] = []
): string {
  switch (difficulty) {
    case AIDifficulty.EASY:
      return buildFewShotPrompt(theme, previousGuesses) // 많은 힌트 + 예시 + 이전 추측
    case AIDifficulty.NORMAL:
      return buildEnhancedPrompt(theme, previousGuesses) // 테마 힌트 + 이전 추측
    case AIDifficulty.HARD:
      return buildHardPrompt(theme, previousGuesses) // 힌트 최소, 엄격한 판단 + 이전 추측
  }
}
