# 동적 주제별 랜덤 문제 시스템

> 마스터 계정이 스케줄과 주제를 설정하면, 각 게임 방마다 해당 주제의 문제가 랜덤하게 출제됩니다.

---

## 🎯 기능 요약

### 기존 방식 (Before)
```typescript
// 모든 게임에서 동일한 문제
theme = "동물"
targetWord = "고양이"  // 항상 고정
```

### 새로운 방식 (After)
```typescript
// 마스터 계정이 설정
스케줄: 11/18 14:00-15:00, 주제 "동화"

// 방마다 다른 문제 (랜덤)
방1: "백설공주"
방2: "신데렐라"
방3: "콩쥐팥쥐"
...
```

---

## 📊 구현 내용

### 1. 타입 정의 확장

**frontend/src/types/game.types.ts**
```typescript
// 스케줄에 주제 추가
export interface GameScheduleDateRange {
  date: string
  start: string
  end: string
  theme: string  // ← 추가
  description?: string
}

// 주제별 문제 풀 타입 추가
export interface ThemeWordPool {
  theme: string
  words: string[]
  description?: string
  createdAt?: any
  updatedAt?: any
  createdBy?: string
}
```

### 2. 주제별 문제 풀 서비스

**frontend/src/services/wordPools.ts** (신규 생성)

**주요 함수:**
- `getWordPoolByTheme(theme)` - 특정 주제의 문제 풀 조회
- `selectRandomWord(words)` - 배열에서 랜덤 단어 선택
- `updateWordPool(...)` - 주제별 문제 풀 업데이트 (마스터 전용)

**기본 제공 주제:**
- **동화**: 백설공주, 신데렐라, 콩쥐팥쥐, ... (15개)
- **영화**: 어벤져스, 기생충, 타이타닉, ... (15개)
- **음식**: 김치찌개, 비빔밥, 불고기, ... (20개)
- **동물**: 고양이, 강아지, 사자, ... (20개)
- **직업**: 의사, 선생님, 경찰관, ... (20개)

### 3. 스케줄 서비스 확장

**frontend/src/services/schedule.ts**

```typescript
// 현재 시간의 활성 주제 가져오기
export function getCurrentTheme(schedule: GameScheduleConfig | null): string | null {
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()

  const todaySchedules = schedule.dateRanges.filter(range => range.date === currentDate)

  for (const timeSlot of todaySchedules) {
    // 시간 비교 로직
    if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
      return timeSlot.theme  // ← 주제 반환
    }
  }

  return null
}
```

### 4. 게임 생성 로직 수정

**frontend/src/services/matchmaking.ts**

```typescript
export async function createGameRoom(players: WaitingPlayer[]): Promise<string> {
  let theme: string
  let targetWord: string

  if (ENV.isDevelopment) {
    theme = '테스트'
    targetWord = '집'  // 개발: 고정
  } else {
    // 1. 스케줄에서 현재 주제 가져오기
    const schedule = await getGameSchedule()
    const currentTheme = getCurrentTheme(schedule)

    if (currentTheme) {
      theme = currentTheme

      // 2. 주제별 문제 풀 조회
      const wordPool = await getWordPoolByTheme(currentTheme)

      if (wordPool && wordPool.words.length > 0) {
        // 3. 랜덤 단어 선택
        targetWord = selectRandomWord(wordPool.words)
      } else {
        targetWord = '고양이'  // 기본값
      }
    } else {
      theme = '동물'
      targetWord = '고양이'
    }
  }

  // 게임 룸 생성
  await set(newRoomRef, { theme, ... })
  await setRoomSecret(roomId, targetWord)

  console.log(`게임 생성 완료 - 주제: ${theme}, 정답: ${targetWord}`)
  return roomId
}
```

### 5. 초기화 유틸리티

**frontend/src/utils/initWordPools.ts** (신규 생성)

```typescript
// 마스터 계정으로 실행
await initializeWordPools('마스터UID')

// 결과:
// ✅ 동화: 15개 단어 저장 완료
// ✅ 영화: 15개 단어 저장 완료
// ...
```

---

## 🗄️ Firestore 데이터 구조

```
Firestore
├── gameSchedules/config
│   └── {
│         dateRanges: [
│           {
│             date: "2025-11-18",
│             start: "14:00",
│             end: "15:00",
│             theme: "동화",  ← 주제 지정
│             description: "팀 빌딩 이벤트"
│           }
│         ]
│       }
│
└── wordPools/
    ├── 동화 → { theme: "동화", words: ["백설공주", "신데렐라", ...] }
    ├── 영화 → { theme: "영화", words: ["어벤져스", "기생충", ...] }
    ├── 음식 → { theme: "음식", words: ["김치찌개", "비빔밥", ...] }
    └── ...
```

---

## 📈 게임 진행 플로우

```
[1] 마스터가 스케줄 등록
    ↓
    11/18 14:00-15:00, 주제: "동화"
    ↓
[2] 플레이어 5명 매칭 (14:05)
    ↓
[3] createGameRoom() 실행
    ↓
    getCurrentTheme(schedule) → "동화"
    ↓
[4] getWordPoolByTheme("동화")
    ↓
    { words: ["백설공주", "신데렐라", "콩쥐팥쥐", ...] }
    ↓
[5] selectRandomWord(words) → "신데렐라" (랜덤)
    ↓
[6] 게임 시작
    ↓
    주제: "동화"
    정답: "신데렐라"
```

**동시간대 다른 방:**
```
방1 (14:05 생성) → 주제: "동화", 정답: "백설공주"
방2 (14:08 생성) → 주제: "동화", 정답: "신데렐라"
방3 (14:12 생성) → 주제: "동화", 정답: "콩쥐팥쥐"
```

---

## 🔧 마스터 계정 사용법

### 1. 초기 설정 (최초 1회)

```javascript
// 브라우저 콘솔에서
import { initializeWordPools } from '@/utils/initWordPools'
await initializeWordPools('마스터UID')
```

### 2. 게임 스케줄 등록

**Admin 페이지에서:**
1. `/admin` 접속
2. "새 스케줄 추가" 클릭
3. 폼 입력:
   - 날짜: 2025-11-18
   - 시작: 14:00
   - 종료: 15:00
   - **주제: 동화** ← wordPools에 존재하는 주제
   - 설명: 팀 빌딩 이벤트
4. 저장

**또는 콘솔에서:**
```javascript
import { updateGameSchedule } from '@/services/schedule'

await updateGameSchedule([
  {
    date: '2025-11-18',
    start: '14:00',
    end: '15:00',
    theme: '동화',
    description: '팀 빌딩 이벤트'
  }
], '마스터UID')
```

### 3. 새 주제 추가

```javascript
import { updateWordPool } from '@/services/wordPools'

await updateWordPool(
  '역사인물',  // 새 주제
  ['김구', '세종대왕', '신사임당', '이순신', ...],
  '한국의 위인들',
  '마스터UID'
)
```

---

## 🎨 코드 파일 목록

### 신규 생성
- `frontend/src/services/wordPools.ts` - 주제별 문제 풀 관리
- `frontend/src/utils/initWordPools.ts` - 초기 데이터 세팅
- `docs/THEME_WORD_POOL_GUIDE.md` - 사용 가이드

### 수정
- `frontend/src/types/game.types.ts` - 타입 정의 확장
- `frontend/src/services/schedule.ts` - getCurrentTheme 함수 추가
- `frontend/src/services/matchmaking.ts` - 랜덤 문제 선택 로직

---

## ✅ 테스트 시나리오

### 시나리오 1: 정상 동작
```
1. 마스터가 스케줄 등록 (11/18 14:00, 주제: "동화")
2. 14:05에 5명 매칭
3. 게임 생성 → 주제 "동화", 정답 랜덤 선택
4. 콘솔 확인: "[createGameRoom] 게임 생성 완료 - 주제: 동화, 정답: 백설공주"
```

### 시나리오 2: 주제 문제 풀 없음
```
1. 스케줄: theme: "역사인물"
2. wordPools에 "역사인물" 없음
3. 경고 로그: "역사인물 주제의 문제 풀이 없습니다. 기본값 사용."
4. targetWord = "고양이" (기본값)
```

### 시나리오 3: 스케줄 없음
```
1. 스케줄 없음
2. 경고 로그: "현재 활성 스케줄이 없습니다. 기본 주제 사용."
3. theme = "동물", targetWord = "고양이"
```

---

## 🚀 배포 체크리스트

- [ ] Firestore에 wordPools 컬렉션 생성
- [ ] 기본 주제별 문제 풀 업로드 (initializeWordPools 실행)
- [ ] Admin 페이지에서 스케줄 등록 테스트
- [ ] 개발 환경에서 게임 생성 테스트
- [ ] 콘솔 로그로 랜덤 문제 확인
- [ ] 상용 배포 전 모든 주제 문제 풀 검증

---

**마지막 업데이트**: 2025-11-17
