# AI 자동 문제 생성 시스템

> Gemini API로 주제만 입력하면 자동으로 문제 풀 생성

---

## 🎯 개요

마스터 계정이 게임 스케줄에 **주제만 입력**하면, Gemini API가 자동으로 해당 주제에 맞는 단어 20개를 생성합니다.

### Before vs After

**이전 방식 (수동):**
```javascript
// 마스터가 직접 단어 목록 작성
const words = ["백설공주", "신데렐라", "콩쥐팥쥐", ...]
await updateWordPool("동화", words, ...)
```

**새로운 방식 (자동):**
```javascript
// 주제만 입력하면 AI가 자동 생성
await updateGameSchedule([
  { date: "2025-11-18", theme: "동화", ... }
], "마스터UID")

// 자동으로 실행:
// → Gemini API: "동화 주제로 단어 20개 생성해줘"
// → 응답: ["백설공주", "신데렐라", "콩쥐팥쥐", ...]
// → Firestore wordPools/동화 저장
```

---

## 🚀 사용 방법

### 1. 환경 변수 설정

**frontend/.env 파일:**
```bash
# Gemini API Key 추가
VITE_GEMINI_API_KEY=AIzaSyC...실제키
```

**API 키 발급:**
1. https://ai.google.dev/ 접속
2. "Get API key in Google AI Studio" 클릭
3. API 키 생성 및 복사

### 2. 게임 스케줄 등록

**방법 A: Admin 페이지에서**
1. `/admin` 페이지 접속
2. "새 스케줄 추가" 클릭
3. 폼 입력:
   ```
   날짜: 2025-11-18
   시작: 14:00
   종료: 15:00
   주제: 우주      ← 아무 주제나 입력 가능!
   설명: 우주 탐험 이벤트
   ```
4. "저장" 클릭

**자동 실행 과정:**
```
[1] 스케줄 저장 시작
    ↓
[2] "우주" 주제가 wordPools에 있는지 확인
    ↓
    없음! → 자동 생성 시작
    ↓
[3] Gemini API 호출
    프롬프트: "우주 주제로 그림으로 표현 가능한 단어 20개 생성"
    ↓
[4] AI 응답
    {
      "words": ["우주선", "로켓", "별", "행성", "달", "태양",
                "은하수", "우주비행사", "위성", "블랙홀", ...]
    }
    ↓
[5] Firestore 저장
    wordPools/우주 → { words: [...], createdAt, ... }
    ↓
[6] 스케줄 저장 완료
    ✅ "우주" 주제 문제 풀 생성 완료 (20개 단어)
```

**방법 B: 콘솔에서 직접**
```javascript
import { updateGameSchedule } from '@/services/schedule'

await updateGameSchedule([
  {
    date: '2025-11-18',
    start: '14:00',
    end: '15:00',
    theme: '우주',  // 새로운 주제
    description: '우주 탐험'
  }
], '마스터UID')

// 콘솔 출력:
// [updateGameSchedule] "우주" 주제의 문제 풀이 없습니다. 자동 생성 시작...
// [generateWordsForTheme] 우주: 20개 단어 생성 완료
// [updateGameSchedule] ✅ "우주" 주제 문제 풀 생성 완료
```

### 3. 수동 생성 (필요 시)

특정 주제만 따로 생성하고 싶을 때:

```javascript
import { generateAndSaveWordPool } from '@/services/wordPools'

// "역사인물" 주제 생성
await generateAndSaveWordPool(
  '역사인물',           // 주제
  '한국 역사 인물',     // 설명
  '마스터UID',          // 생성자
  30                    // 단어 개수 (기본 20)
)

// 콘솔 출력:
// [generateWordsForTheme] 역사인물: 30개 단어 생성 완료
// [generateAndSaveWordPool] 역사인물 완료: 30개 단어 저장
```

---

## 🤖 AI 프롬프트 전략

### 프롬프트 구조

```typescript
당신은 Pictionary 게임을 위한 문제 출제자입니다.

**주제**: ${theme}

**요구사항**:
1. "${theme}" 주제에 맞는 그림으로 표현 가능한 단어 20개를 생성하세요.
2. 모든 단어는 **한글**로 작성하세요.
3. 단어는 **명사**여야 합니다 (동사, 형용사 금지).
4. 너무 쉽지도, 너무 어렵지도 않은 적절한 난이도로 선택하세요.
5. 다양성을 고려하여 중복되지 않는 단어들을 선택하세요.
6. 그림으로 표현하기 어려운 추상적인 개념은 피하세요.

**응답 형식** (JSON):
{
  "words": ["단어1", "단어2", ...]
}
```

### 예시 응답

**주제: "우주"**
```json
{
  "words": [
    "우주선", "로켓", "별", "행성", "달", "태양",
    "은하수", "우주비행사", "위성", "블랙홀",
    "혜성", "토성", "화성", "금성", "수성",
    "UFO", "외계인", "망원경", "인공위성", "우주정거장"
  ]
}
```

**주제: "음악"**
```json
{
  "words": [
    "피아노", "기타", "바이올린", "드럼", "트럼펫",
    "플루트", "하프", "첼로", "색소폰", "마이크",
    "스피커", "헤드폰", "음표", "가수", "지휘자",
    "오케스트라", "콘서트", "악보", "마라카스", "탬버린"
  ]
}
```

---

## 🔍 게임 진행 플로우

```
[1] 마스터가 스케줄 등록
    날짜: 11/18 14:00-15:00
    주제: "우주"
    ↓
[2] 자동 문제 생성
    Gemini API → 20개 단어 생성
    Firestore 저장
    ↓
[3] 플레이어 5명 매칭 (14:05)
    ↓
[4] createGameRoom()
    getCurrentTheme() → "우주"
    getWordPoolByTheme("우주") → ["우주선", "로켓", ...]
    selectRandomWord() → "로켓" (랜덤)
    ↓
[5] 게임 시작
    주제: "우주"
    정답: "로켓"
```

---

## ⚙️ 설정 옵션

### autoGenerateWords 옵션

스케줄 저장 시 자동 생성 끄기/켜기:

```javascript
// 자동 생성 ON (기본)
await updateGameSchedule(dateRanges, uid, true)

// 자동 생성 OFF (수동 관리)
await updateGameSchedule(dateRanges, uid, false)
```

### 생성 단어 개수 조정

```javascript
// 기본 20개
await generateAndSaveWordPool(theme, desc, uid)

// 30개로 늘리기
await generateAndSaveWordPool(theme, desc, uid, 30)

// 10개로 줄이기
await generateAndSaveWordPool(theme, desc, uid, 10)
```

---

## 🛡️ 안전성 보장

### Q: AI가 문제를 생성하면, 게임 중 판정할 때 정답을 알고 있지 않나요?

**A: 안전합니다!** 이유:

1. **Stateless API**: 각 Gemini API 호출은 완전히 독립적
   ```typescript
   // 세션 1: 문제 생성
   Gemini API 호출 #1
   입력: "우주 주제로 단어 생성"
   출력: ["우주선", "로켓", ...]
   → 세션 종료 (메모리 삭제)

   // 세션 2: 게임 판정 (완전히 새로운 세션)
   Gemini API 호출 #2
   입력: "이 그림이 뭐야?"
   출력: "로켓" (순수하게 그림만 보고 추론)
   → 이전 세션과 무관
   ```

2. **프롬프트에 정답 없음**:
   ```typescript
   // judge.flow.ts
   const prompt = `
     주제: ${theme}
     이 그림이 뭐야?
   `
   // targetWord는 절대 포함 안 됨!
   ```

3. **명시적 규칙**:
   ```
   **Rules**:
   1. You do NOT know the correct answer.
   2. You must guess based ONLY on what you see.
   ```

---

## 📋 Firestore 데이터 구조

```
wordPools/
├── 우주/
│   └── {
│         theme: "우주",
│         words: ["우주선", "로켓", "별", ...],
│         description: "우주 주제 (자동 생성)",
│         createdAt: Timestamp,
│         updatedAt: Timestamp,
│         createdBy: "마스터UID"
│       }
├── 음악/
│   └── { ... }
└── 역사인물/
    └── { ... }
```

---

## 🎨 예시 주제 아이디어

자유롭게 어떤 주제든 입력 가능합니다!

| 카테고리 | 예시 주제 |
|---------|----------|
| **자연** | 우주, 바다, 산, 숲, 날씨, 계절 |
| **문화** | 음악, 미술, 춤, 스포츠, 요리 |
| **역사** | 역사인물, 문화재, 전통, 발명품 |
| **과학** | 동물, 식물, 곤충, 화학, 물리 |
| **장소** | 나라, 도시, 건축물, 랜드마크 |
| **감정** | 기쁨, 슬픔, 놀람, 화남 (추상적이지만 시도 가능) |
| **직업** | 의사, 선생님, 경찰, 소방관, 예술가 |
| **교통** | 비행기, 자동차, 배, 기차, 자전거 |

---

## 🧪 테스트 시나리오

### 시나리오 1: 새 주제 자동 생성

```bash
# 1. 스케줄 등록
주제: "바다"

# 2. 콘솔 로그 확인
[updateGameSchedule] "바다" 주제의 문제 풀이 없습니다. 자동 생성 시작...
[generateWordsForTheme] 바다: 20개 단어 생성 완료
[updateGameSchedule] ✅ "바다" 주제 문제 풀 생성 완료

# 3. Firestore 확인
wordPools/바다 → { words: ["물고기", "파도", "산호초", ...] }

# 4. 게임 플레이
방1 → 정답: "물고기"
방2 → 정답: "파도"
방3 → 정답: "상어"
```

### 시나리오 2: 기존 주제 재사용

```bash
# 1. 스케줄 등록
주제: "바다" (이미 생성됨)

# 2. 콘솔 로그 확인
[updateGameSchedule] "바다" 주제 문제 풀이 이미 존재 (20개 단어)

# 3. 생성 건너뛰고 스케줄만 저장
```

### 시나리오 3: 수동 생성

```javascript
// 브라우저 콘솔에서
await generateAndSaveWordPool('악기', '악기 종류', '마스터UID', 25)

// 결과: 25개 단어 생성
```

---

## ⚠️ 주의사항

### 1. API 키 보안

- ❌ `.env` 파일을 Git에 커밋하지 마세요
- ✅ `.env.example`만 커밋
- ✅ 실제 키는 `.env.local`에 저장

### 2. API 할당량

Gemini API 무료 할당량:
- **15 requests/minute**
- 주제 1개 생성 = 1 request

따라서:
- 한 번에 10개 이상 주제 등록 시 주의
- 필요하면 지연 추가 또는 유료 플랜 사용

### 3. 생성된 단어 검토

AI가 생성한 단어가 부적절하거나 너무 어려운 경우:

```javascript
// 1. Firestore에서 직접 수정
wordPools/우주 → words 배열 편집

// 또는

// 2. 재생성
await generateAndSaveWordPool('우주', '우주 주제', '마스터UID', 20)
```

---

## 🚀 배포 체크리스트

- [ ] Gemini API 키 발급 및 `.env`에 추가
- [ ] 스케줄 등록 테스트 (새 주제)
- [ ] Firestore에서 자동 생성된 단어 확인
- [ ] 게임 플레이 테스트 (랜덤 문제 확인)
- [ ] 콘솔 로그로 생성 과정 모니터링
- [ ] 상용 배포 전 모든 주제 검토

---

**마지막 업데이트**: 2025-11-17
