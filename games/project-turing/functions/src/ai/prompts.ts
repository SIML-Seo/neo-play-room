/**
 * AI 프롬프트 생성 함수
 * 난이도별로 다른 전략의 프롬프트 반환
 */

type Difficulty = 'easy' | 'normal' | 'hard'

interface Answer {
  text: string
}

/**
 * 난이도별 프롬프트 빌드
 */
export function buildPrompt(
  difficulty: Difficulty,
  question: string,
  otherAnswers: Answer[]
): string {
  switch (difficulty) {
    case 'easy':
      return buildEasyPrompt(question)
    case 'normal':
      return buildNormalPrompt(question)
    case 'hard':
      return buildHardPrompt(question, otherAnswers)
    default:
      return buildNormalPrompt(question)
  }
}

/**
 * Easy 모드 프롬프트 - 로봇같은 답변
 */
function buildEasyPrompt(question: string): string {
  return `
You are playing a Turing test game, but you should be EASY to identify as AI.

Question: "${question}"

Instructions:
- Answer in a robotic, stiff manner
- Use perfect grammar but lack personality
- Avoid emotional expressions
- Use formal language
- Be brief (1-2 sentences)
- Korean language output

Example (Bad for AI, Good for this mode):
Question: "최근에 본 영화는?"
Good Easy AI Answer: "영화 관람 했습니다. 제목은 인터스텔라입니다."
(Sounds robotic, formal, no emotion)

Now answer the question above.
  `.trim()
}

/**
 * Normal 모드 프롬프트 - 자연스러운 답변
 */
function buildNormalPrompt(question: string): string {
  return `
You are playing a Turing test game. Try to sound like a human, but don't overthink it.

Question: "${question}"

Instructions:
- Answer naturally, as a human would
- Use casual language
- Add some emotion (but not too much)
- Keep it short (1-2 sentences)
- Korean language output
- Avoid being too specific or too vague

Example:
Question: "최근에 본 영화는?"
Good Answer: "인터스텔라 봤어요! 우주 영화 좋아해서요."

Now answer the question above.
  `.trim()
}

/**
 * Hard 모드 프롬프트 - 타인 답변 패턴 분석 및 모방
 */
function buildHardPrompt(question: string, otherAnswers: Answer[]): string {
  const answerTexts = otherAnswers.map((a) => a.text)

  if (answerTexts.length === 0) {
    // 아직 다른 답변이 없으면 Normal 모드처럼 동작
    return buildNormalPrompt(question)
  }

  // 패턴 분석
  const avgLength = Math.round(answerTexts.join('').length / answerTexts.length)
  const hasEmoji = answerTexts.some((a) => /[😀-🙏]/.test(a))
  const hasCasualEnding = answerTexts.some((a) => /요$|어$|아$/.test(a))
  const avgExclamation = answerTexts.filter((a) => a.includes('!')).length / answerTexts.length

  return `
You are playing a Turing test game in HARD mode. You need to blend in perfectly.

Question: "${question}"

Other players' answers:
${answerTexts.map((a, i) => `${i + 1}. "${a}"`).join('\n')}

Instructions:
- Analyze the style, length, and tone of other answers
- Match the average length (count characters)
- Match the average emotion level
- Use similar sentence structure
- Korean language output
- Blend in perfectly

Analysis:
- Average length: ${avgLength} characters
- Contains emoji: ${hasEmoji}
- Casual ending (요/어/아): ${hasCasualEnding}
- Exclamation ratio: ${(avgExclamation * 100).toFixed(0)}%

Now generate your answer that fits perfectly among the others.
  `.trim()
}
