# 빠른 시작: AI 자동 문제 생성

> 5분 안에 AI 문제 생성 시스템 설정하기

---

## 1단계: Gemini API 키 발급 (2분)

1. https://ai.google.dev/ 접속
2. "Get API key in Google AI Studio" 클릭
3. "Create API key in new project" 선택
4. API 키 복사 (예: `AIzaSyC...`)

---

## 2단계: 환경 변수 설정 (1분)

**functions/.env 파일 생성**
```bash
# functions/.env.example을 복사
cd functions
cp .env.example .env

# .env 파일 편집
GEMINI_API_KEY=AIzaSyC...여기에붙여넣기
```

저장!

---

## 3단계: 테스트 (2분)

### 방법 A: 브라우저 콘솔에서 테스트

1. 마스터 계정으로 로그인
2. F12 → Console 탭
3. 다음 코드 실행:

```javascript
// 1. 함수 import
const { generateAndSaveWordPool } = await import('./src/services/wordPools')
const { useAuth } = await import('./src/hooks/useAuth')

// 2. 현재 사용자 UID 가져오기
const { user } = useAuth()
const uid = user.uid

// 3. AI로 문제 생성 (약 3-5초 소요)
await generateAndSaveWordPool(
  '우주',              // 주제
  '우주 탐험 주제',    // 설명
  uid,                 // 생성자 UID
  20                   // 단어 개수
)

// 콘솔 출력 확인:
// [generateWordsForTheme] 우주: 20개 단어 생성 완료
// [generateAndSaveWordPool] 우주 완료: 20개 단어 저장
```

### 방법 B: Admin 페이지에서 (더 간단!)

1. `/admin` 페이지 접속
2. "새 스케줄 추가"
3. 폼 입력:
   ```
   날짜: 2025-11-20
   시작: 14:00
   종료: 15:00
   주제: 우주       ← 새로운 주제!
   설명: 우주 탐험
   ```
4. "저장" 클릭
5. 콘솔 확인 (자동 생성됨!)

---

## 4단계: 확인

### Firestore에서 확인

1. Firebase Console → Firestore Database
2. `wordPools` 컬렉션 클릭
3. `우주` 문서 확인
4. `words` 배열 확인:
   ```json
   [
     "우주선", "로켓", "별", "행성", "달",
     "태양", "은하수", "우주비행사", "위성",
     "블랙홀", "혜성", "토성", "화성", ...
   ]
   ```

### 게임에서 확인

1. 11/20 14:00에 게임 플레이
2. 주제: "우주"
3. 정답: (랜덤으로 하나 선택됨)

---

## ✅ 완료!

이제 마스터는 **주제만 입력하면** AI가 자동으로 문제를 생성합니다!

### 예시 주제

```javascript
// 자유롭게 시도해보세요!
"바다"
"음악"
"스포츠"
"음식"
"건축물"
"감정"
"역사인물"
"교통수단"
...
```

---

## 🆘 문제 해결

### API 키 오류
```
Error: GEMINI_API_KEY가 설정되지 않았습니다.
```
→ `functions/.env` 파일에 `GEMINI_API_KEY` 추가 확인
→ Functions Emulator 재시작 필요

### 생성 실패
```
AI가 단어를 생성하지 못했습니다.
```
→ 네트워크 확인, API 할당량 확인 (15 req/min)

### JSON 파싱 오류
```
AI 응답을 파싱할 수 없습니다.
```
→ 콘솔에서 "원본 응답" 확인, 이슈 리포트

---

**더 자세한 내용**: [AI_WORD_GENERATION.md](./AI_WORD_GENERATION.md)
