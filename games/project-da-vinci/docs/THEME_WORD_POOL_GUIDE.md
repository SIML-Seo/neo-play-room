# 주제별 문제 풀 관리 가이드

> 마스터 계정으로 게임 스케줄과 주제별 문제를 관리하는 방법

---

## 📋 목차

1. [개요](#개요)
2. [시스템 구조](#시스템-구조)
3. [초기 설정 (최초 1회)](#초기-설정-최초-1회)
4. [게임 스케줄 등록 방법](#게임-스케줄-등록-방법)
5. [주제별 문제 풀 관리](#주제별-문제-풀-관리)
6. [게임 진행 흐름](#게임-진행-흐름)

---

## 개요

**Project Da Vinci**는 마스터 계정이 게임 일정과 주제를 설정하면, 각 게임 방마다 해당 주제의 문제가 랜덤하게 출제되는 시스템입니다.

### 예시

```
📅 11월 18일 14:00-15:00 | 주제: "동화"
   → 방1: 백설공주
   → 방2: 신데렐라
   → 방3: 콩쥐팥쥐
   → ...
```

---

## 시스템 구조

### 1. Firestore 컬렉션 구조

```
Firestore
├── gameSchedules/config           # 게임 스케줄 설정
│   └── dateRanges: [
│         {
│           date: "2025-11-18",
│           start: "14:00",
│           end: "15:00",
│           theme: "동화",
│           description: "팀 빌딩 이벤트"
│         },
│         ...
│       ]
│
└── wordPools/{theme}              # 주제별 문제 풀
    ├── 동화/
    │   └── { theme: "동화", words: ["백설공주", "신데렐라", ...] }
    ├── 영화/
    │   └── { theme: "영화", words: ["어벤져스", "기생충", ...] }
    ├── 음식/
    │   └── { theme: "음식", words: ["김치찌개", "된장찌개", ...] }
    └── ...
```

### 2. 데이터 플로우

```
[마스터 계정]
    ↓
[스케줄 등록: 11/18 14:00 - 주제 "동화"]
    ↓
[플레이어들이 14:00에 접속]
    ↓
[5명 매칭 완료]
    ↓
[createGameRoom 함수 실행]
    ↓
[getCurrentTheme() → "동화"]
    ↓
[getWordPoolByTheme("동화") → ["백설공주", "신데렐라", ...]]
    ↓
[selectRandomWord() → "백설공주" (랜덤 선택)]
    ↓
[게임 시작: 주제="동화", 정답="백설공주"]
```

---

## 초기 설정 (최초 1회)

### 1단계: 주제별 문제 풀 초기화

마스터 계정으로 로그인 후, **브라우저 개발자 도구 콘솔**에서 실행:

```javascript
// 1. 개발자 도구 열기 (F12)
// 2. Console 탭으로 이동
// 3. 다음 코드 실행

// 초기 데이터 로드
import { initializeWordPools } from './src/utils/initWordPools'

// 실행 (UID는 Firebase Auth에서 확인)
await initializeWordPools('마스터계정UID')
```

**실행 결과:**
```
[initializeWordPools] 주제별 문제 풀 초기화 시작...
✅ 동화: 15개 단어 저장 완료
✅ 영화: 15개 단어 저장 완료
✅ 음식: 20개 단어 저장 완료
✅ 동물: 20개 단어 저장 완료
✅ 직업: 20개 단어 저장 완료
[initializeWordPools] 초기화 완료!
총 5개 주제 저장됨
```

### 2단계: Firebase Console에서 확인

1. https://console.firebase.google.com/ 접속
2. **Firestore Database** 클릭
3. **wordPools** 컬렉션 확인
4. 각 주제 문서 확인:
   - `동화` → words 배열 확인
   - `영화` → words 배열 확인
   - ...

---

## 게임 스케줄 등록 방법

### Admin 페이지에서 등록 (권장)

마스터 계정으로 로그인 후:

1. `/admin` 페이지 접속
2. "게임 스케줄 관리" 섹션
3. "새 스케줄 추가" 버튼 클릭
4. 폼 입력:
   ```
   날짜: 2025-11-18
   시작 시간: 14:00
   종료 시간: 15:00
   주제: 동화          ← 반드시 Firestore wordPools에 존재하는 주제 이름
   설명: 팀 빌딩 이벤트
   ```
5. "저장" 버튼 클릭

### 콘솔에서 직접 등록 (개발자용)

```javascript
import { updateGameSchedule } from './src/services/schedule'

const newSchedule = [
  {
    date: '2025-11-18',
    start: '14:00',
    end: '15:00',
    theme: '동화',
    description: '팀 빌딩 이벤트'
  },
  {
    date: '2025-11-18',
    start: '16:00',
    end: '17:00',
    theme: '영화',
    description: '오후 이벤트'
  }
]

await updateGameSchedule(newSchedule, '마스터UID')
```

---

## 주제별 문제 풀 관리

### 기본 제공 주제

| 주제 | 단어 개수 | 예시 |
|-----|---------|------|
| **동화** | 15개 | 백설공주, 신데렐라, 콩쥐팥쥐, 흥부놀부, ... |
| **영화** | 15개 | 어벤져스, 기생충, 타이타닉, 겨울왕국, ... |
| **음식** | 20개 | 김치찌개, 된장찌개, 비빔밥, 불고기, ... |
| **동물** | 20개 | 고양이, 강아지, 사자, 호랑이, 코끼리, ... |
| **직업** | 20개 | 의사, 간호사, 선생님, 경찰관, ... |

### 새 주제 추가

```javascript
import { updateWordPool } from './src/services/wordPools'

const newWords = [
  '김구',
  '세종대왕',
  '신사임당',
  '이순신',
  '유관순',
  '장영실',
  // ... 더 많은 단어
]

await updateWordPool(
  '역사인물',              // 주제 이름
  newWords,                 // 단어 배열
  '한국의 위인들',          // 설명
  '마스터UID'               // 생성자
)
```

### 기존 주제 수정

```javascript
import { updateWordPool } from './src/services/wordPools'

// 기존 "동화" 주제에 단어 추가
const updatedWords = [
  '백설공주',
  '신데렐라',
  '콩쥐팥쥐',
  '흥부놀부',
  // ... 기존 단어들
  '토끼와거북이',  // 새로 추가
  '개미와베짱이',  // 새로 추가
]

await updateWordPool(
  '동화',
  updatedWords,
  '동화 속 주인공과 이야기',
  '마스터UID'
)
```

### 문제 풀 조회

```javascript
import { getWordPoolByTheme, getAllWordPools } from './src/services/wordPools'

// 특정 주제 조회
const fairytalePool = await getWordPoolByTheme('동화')
console.log(fairytalePool.words)

// 모든 주제 조회
const allPools = await getAllWordPools()
console.log(allPools.map(p => `${p.theme}: ${p.words.length}개`))
```

---

## 게임 진행 흐름

### 1. 플레이어 입장 (Lobby)

```
14시 00분 - 5명 접속
   ↓
getCurrentTheme() 호출
   ↓
"동화" 확인
   ↓
Lobby UI에 주제 표시: "오늘의 주제: 동화"
```

### 2. 게임 룸 생성 (자동)

```javascript
// matchmaking.ts의 createGameRoom 함수 자동 실행

// 1. 스케줄에서 현재 주제 가져오기
const schedule = await getGameSchedule()
const theme = getCurrentTheme(schedule)  // "동화"

// 2. 주제별 문제 풀 조회
const wordPool = await getWordPoolByTheme("동화")
// { theme: "동화", words: ["백설공주", "신데렐라", ...] }

// 3. 랜덤 단어 선택
const targetWord = selectRandomWord(wordPool.words)  // "백설공주"

// 4. 게임 룸 생성
await set(newRoomRef, {
  theme: "동화",
  ...
})

// 5. 비공개 정답 저장
await setRoomSecret(roomId, "백설공주")
```

### 3. 게임 진행

```
플레이어들은 주제만 보고 그림을 그림
   ↓
"동화"라는 힌트만 제공
   ↓
AI는 "백설공주"를 맞춰야 함
```

### 4. 같은 시간대, 다른 방

```
방1 (14:00 생성)
   주제: "동화"
   정답: "백설공주" (랜덤 선택)

방2 (14:05 생성)
   주제: "동화" (같음)
   정답: "신데렐라" (랜덤 선택)

방3 (14:10 생성)
   주제: "동화" (같음)
   정답: "콩쥐팥쥐" (랜덤 선택)
```

---

## 🚨 주의사항

### 1. 주제 이름 일치

스케줄의 `theme`과 wordPools의 문서 ID가 **정확히 일치**해야 합니다:

❌ 잘못된 예:
```javascript
// 스케줄
{ date: "2025-11-18", theme: "동화" }

// Firestore
wordPools/동화이야기  ← 이름이 다름!
```

✅ 올바른 예:
```javascript
// 스케줄
{ date: "2025-11-18", theme: "동화" }

// Firestore
wordPools/동화  ← 정확히 일치
```

### 2. 문제 풀이 비어있으면?

주제는 있지만 단어가 없는 경우:

```javascript
// 스케줄: theme: "동화"
// Firestore: wordPools/동화 → words: []

// 결과:
console.warn('[createGameRoom] 동화 주제의 문제 풀이 없습니다. 기본값 사용.')
// 정답: "고양이" (기본값)
```

**해결책**: 항상 주제를 등록하기 전에 문제 풀부터 생성하세요!

### 3. 개발 환경 vs 상용 환경

```typescript
// .env.development
VITE_ENV=DEV

// 결과:
theme = "테스트"
targetWord = "집"  // 항상 고정
```

```typescript
// .env.production
VITE_ENV=PROD

// 결과:
theme = getCurrentTheme(schedule)  // 스케줄에서 가져옴
targetWord = selectRandomWord(...)  // 랜덤 선택
```

---

## 📞 문의

문제가 발생하면:

1. **Firestore 확인**:
   - wordPools 컬렉션에 주제가 있는지
   - words 배열이 비어있지 않은지

2. **Console 로그 확인**:
   ```
   [createGameRoom] 게임 생성 완료 - 주제: 동화, 정답: 백설공주
   ```

3. **GitHub Issues** 등록

---

**마지막 업데이트**: 2025-11-17
