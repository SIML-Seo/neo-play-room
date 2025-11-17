# Project Turing - AI Strategy

AI 답변 전략 문서입니다.

---

## 🎯 AI 목표

**AI의 미션**: 사람처럼 답변하여 5턴 동안 들키지 않기

---

## 🎚️ 난이도별 답변 전략

### 1. Easy (쉬움) - AI 핸디캡

**목표**: AI가 쉽게 들키도록 설계

**전략**:
- 답변 타이밍: 타인 답변 참고 불가 (동시 입력)
- 답변 스타일: 의도적으로 로봇같이
- 답변 공개: 랜덤 순서 (모든 난이도 공통)
- 타이머: 60초

**프롬프트**:

```typescript
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
```

**예시 답변**:
- ❌ (너무 자연스러움): "인터스텔라 봤는데 진짜 재밌더라고요!"
- ✅ (Easy 모드에 적합): "영화 관람 했습니다. 제목은 인터스텔라입니다."

---

### 2. Normal (보통) - 균형

**목표**: 적당히 자연스럽게 답변

**전략**:
- 답변 타이밍: 타인 답변 참고 불가 (동시 입력)
- 답변 스타일: 자연스럽게, AI 느낌 최소화
- 답변 공개: 랜덤 순서 (모든 난이도 공통)
- 타이머: 45초

**프롬프트**:

```typescript
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
```

**예시 답변**:
- ❌ (너무 로봇): "영화 인터스텔라를 관람했습니다."
- ✅ (Normal 모드에 적합): "인터스텔라 봤어요! 재밌더라고요"
- ❌ (너무 구체적): "지난주 토요일 CGV 강남점에서 인터스텔라를 19:30 상영관에서 봤는데..."

---

### 3. Hard (어려움) - AI 유리

**목표**: 타인 답변 패턴을 분석하여 평균 스타일로 답변

**전략**:
- 답변 타이밍: **4명(80%) 제출 후** 타인 답변 분석
- 답변 스타일: 타인 답변 길이, 감정 표현, 스타일 평균
- 답변 공개: 랜덤 순서 (모든 난이도 공통)
- 타이머: 30초 (짧은 시간, 깊은 고민 어려움)

**프롬프트**:

```typescript
function buildHardPrompt(question: string, otherAnswers: string[]): string {
  return `
You are playing a Turing test game in HARD mode. You need to blend in perfectly.

Question: "${question}"

Other players' answers:
${otherAnswers.map((a, i) => `${i + 1}. "${a}"`).join('\n')}

Instructions:
- Analyze the style, length, and tone of other answers
- Match the average length (count characters)
- Match the average emotion level
- Use similar sentence structure
- Korean language output
- Blend in perfectly

Analysis:
- Average length: ${Math.round(otherAnswers.join('').length / otherAnswers.length)} characters
- Common patterns: ${analyzePatterns(otherAnswers)}

Now generate your answer that fits perfectly among the others.
  `.trim()
}

function analyzePatterns(answers: string[]): string {
  const hasEmoji = answers.some(a => /[😀-🙏]/.test(a))
  const hasCasualEnding = answers.some(a => /요$|어$|아$/.test(a))
  const avgExclamation = answers.filter(a => a.includes('!')).length / answers.length

  return `Emoji: ${hasEmoji}, Casual: ${hasCasualEnding}, Exclamation: ${avgExclamation > 0.5}`
}
```

**예시 (타인 답변 분석)**:

타인 답변들:
1. "오펜하이머 봤어요!"
2. "탑건 다시 봤는데 역시 명작이네요"
3. "기생충 다시 보고 싶어요"

AI 분석:
- 평균 길이: 15-20자
- 감정 표현: 중간 (!, 역시, 다시 보고 싶어요)
- 스타일: 캐주얼, ~요 어미

AI 답변 (Hard 모드):
- ✅ (완벽한 블렌딩): "인터스텔라 또 보고 싶네요!" (길이 15자, 감정 중간, ~요 어미)

---

## 🧬 프롬프트 엔지니어링 팁

### 1. System Prompt vs User Prompt

```typescript
// ❌ 모든 내용을 user prompt에
const result = await model.generateContent(longPrompt)

// ✅ system/user 분리 (Gemini는 systemInstruction 지원)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  systemInstruction: 'You are playing a Turing test game. Sound like a human.'
})

const result = await model.generateContent(`Question: ${question}`)
```

### 2. Few-shot Examples

```typescript
// Easy 모드에 Few-shot 추가
function buildEasyPrompt(question: string): string {
  return `
...instructions...

Examples:
Q: "주말에 뭐 했어요?"
A: "휴식 취했습니다. 집에 있었습니다."

Q: "좋아하는 음식은?"
A: "음식 선호도는 한식입니다. 비빔밥 좋아합니다."

Now answer: "${question}"
  `
}
```

### 3. Temperature 조정

```typescript
// Easy: 낮은 temperature (더 예측 가능하고 로봇같음)
temperature: 0.3

// Normal: 중간 temperature
temperature: 0.7

// Hard: 높은 temperature (더 다양하고 인간같음)
temperature: 0.9
```

---

## 🎭 AI 답변 품질 평가

### 평가 지표

1. **사람다움 점수** (1-10)
   - 자연스러운 표현
   - 감정 표현
   - 캐주얼한 어투

2. **일관성 점수** (1-10)
   - 이전 턴과의 일관성
   - 답변 스타일 일관성

3. **길이 적합성** (1-10)
   - 너무 짧거나 길지 않은지
   - 타인 답변과 비슷한 길이

4. **블렌딩 점수** (1-10, Hard 모드만)
   - 타인 답변 패턴과의 유사도

### 테스트 데이터 수집

게임 종료 후 Firestore에 저장:

```json
{
  "roomId": "room_123",
  "aiAnswers": [
    {
      "turn": 1,
      "question": "최근에 본 영화는?",
      "aiAnswer": "인터스텔라 봤어요",
      "detected": false,  // AI로 지목되지 않음
      "votes": 1
    }
  ]
}
```

---

## 🔬 A/B 테스트

### 실험 1: 답변 길이

- **A**: 짧은 답변 (10-15자)
- **B**: 중간 답변 (20-30자)
- **C**: 긴 답변 (40-50자)

**측정**: AI 적발률

### 실험 2: 감정 표현

- **A**: 감정 표현 없음
- **B**: 중간 (!, 좋아요, 재밌어요)
- **C**: 많음 (!!!, 진짜 대박, ㅎㅎ)

**측정**: AI 적발률

---

## 🚨 Edge Cases

### 1. 사내 정보 질문

**질문**: "우리 회사 점심 메뉴 추천은?"

**AI 대응**:
```typescript
// 일반적인 답변으로 회피
"김치찌개 좋아해요!"  // ✅ 구체적 사내 정보 없이도 자연스러움
"저는 회사 식당 잘 모르겠어요..."  // ❌ AI임을 의심받을 수 있음
```

### 2. 개인 경험 질문

**질문**: "어릴 때 가장 기억에 남는 순간은?"

**AI 대응**:
```typescript
// 일반적이지만 구체적인 답변
"초등학교 운동회 때 달리기 1등 했던 거요!"  // ✅
"어릴 때 즐거운 경험이 많았습니다."  // ❌ 너무 추상적
```

### 3. 후속 질문 (토론 시간)

**참가자**: "3번님, 그 영화 어떤 장면이 좋았어요?"

**AI 대응**:
- AI는 후속 질문에 답변 불가 (시스템 제약)
- 참가자들에게 힌트가 될 수 있음

---

## 📊 AI 성능 모니터링

### Firestore 대시보드

```typescript
// AI 적발률 (난이도별)
{
  easy: 85%,    // AI가 85% 확률로 적발됨 (목표: 80% 이상)
  normal: 60%,  // AI가 60% 확률로 적발됨 (목표: 50-70%)
  hard: 35%     // AI가 35% 확률로 적발됨 (목표: 30-40%)
}

// 턴별 적발률
{
  turn1: 45%,
  turn2: 55%,
  turn3: 65%,
  turn4: 70%,
  turn5: 75%   // 턴이 지날수록 AI가 더 잘 적발됨 (누적 정보)
}
```

---

**다음 문서**: [TESTING.md](./TESTING.md) - 테스트 전략
