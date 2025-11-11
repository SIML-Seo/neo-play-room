# Project Da Vinci - 개발 체크리스트

> 8주 개발 일정 및 상세 작업 목록

## 📅 전체 일정 (8주)

| 주차 | 마일스톤 | 목표 | 상태 |
|-----|---------|------|------|
| **Week 1** | 환경 설정 및 프로젝트 초기화 | Firebase 프로젝트 생성, React 보일러플레이트 | 🔲 준비 중 |
| **Week 2** | 실시간 캔버스 동기화 | Fabric.js + Firebase RTDB 연동 | 🔲 대기 |
| **Week 3** | AI 추론 시스템 | Gemini API 연동 및 프롬프트 최적화 | 🔲 대기 |
| **Week 4** | 게임 로직 완성 | 턴 관리, 타이머, 결과 집계 | 🔲 대기 |
| **Week 5** | UI/UX 개선 | 디자인 시스템, 반응형 레이아웃 | 🔲 대기 |
| **Week 6** | 알파 테스트 | 5명 내부 테스트 및 버그 수정 | 🔲 대기 |
| **Week 7** | 최적화 및 안정화 | 성능 개선, 보안 강화 | 🔲 대기 |
| **Week 8** | 베타 테스트 및 출시 | 10-50명 테스트 → 정식 출시 | 🔲 대기 |

---

## Week 1: 환경 설정 및 프로젝트 초기화

**목표:** 개발 환경 구축 및 기본 인프라 설정

### ✅ 체크리스트

#### 1.1 Firebase 프로젝트 설정
- [ ] Firebase Console에서 새 프로젝트 생성
  - 프로젝트 이름: `project-da-vinci-prod`
  - Region: `asia-northeast3` (서울)
- [ ] Firebase CLI 설치 및 로그인
  ```bash
  npm install -g firebase-tools
  firebase login
  ```
- [ ] Firebase 서비스 활성화
  - [ ] Authentication (Google Sign-In)
  - [ ] Realtime Database
  - [ ] Cloud Functions (Blaze 플랜으로 업그레이드)
  - [ ] Cloud Storage
  - [ ] Hosting

#### 1.2 프론트엔드 초기화
- [ ] React + Vite 프로젝트 생성
  ```bash
  cd games/project-da-vinci
  npm create vite@latest frontend -- --template react-ts
  cd frontend && npm install
  ```
- [ ] 필수 패키지 설치
  ```bash
  npm install firebase fabric zustand react-router-dom
  npm install -D tailwindcss postcss autoprefixer
  npm install @headlessui/react @heroicons/react
  ```
- [ ] Tailwind CSS 설정
  ```bash
  npx tailwindcss init -p
  ```
- [ ] Firebase SDK 초기화 (`src/firebase.ts`)
- [ ] 폴더 구조 생성 (components, pages, hooks, store, services, utils, types)

#### 1.3 백엔드 (Cloud Functions) 초기화
- [ ] Functions 프로젝트 초기화
  ```bash
  firebase init functions
  # TypeScript 선택, ESLint 활성화
  ```
- [ ] 필수 패키지 설치
  ```bash
  cd functions
  npm install @google/generative-ai
  npm install firebase-admin firebase-functions
  ```
- [ ] 환경 변수 설정
  - [ ] Gemini API 키 발급 (https://ai.google.dev/)
  - [ ] `.env.local` 파일 생성 및 키 저장
  ```bash
  echo "GEMINI_API_KEY=your-api-key" > .env.local
  ```
- [ ] Firebase Emulator 설정
  ```bash
  firebase init emulators
  # Auth, Database, Functions, Storage 선택
  ```

#### 1.4 Git 및 문서 설정
- [ ] `.gitignore` 업데이트
  ```
  .env.local
  .runtimeconfig.json
  node_modules/
  dist/
  .firebase/
  ```
- [ ] 초기 커밋
  ```bash
  git add .
  git commit -m "chore: 프로젝트 초기 설정 완료"
  ```

#### 1.5 로컬 개발 환경 테스트
- [ ] Firebase Emulator 실행 테스트
  ```bash
  firebase emulators:start
  ```
- [ ] 프론트엔드 개발 서버 실행 테스트
  ```bash
  cd frontend && npm run dev
  ```

**완료 기준:**
- ✅ Firebase Emulator에서 Authentication, Database, Functions 정상 동작
- ✅ React 개발 서버에서 "Hello World" 페이지 렌더링
- ✅ Git 초기 커밋 완료

---

## Week 2: 실시간 캔버스 동기화

**목표:** Fabric.js 캔버스와 Firebase RTDB를 연동하여 5명의 실시간 드로잉 동기화 구현

### ✅ 체크리스트

#### 2.1 Fabric.js 캔버스 기본 구현
- [ ] `Canvas.tsx` 컴포넌트 생성
  - [ ] Fabric.js Canvas 초기화
  - [ ] 기본 드로잉 기능 (프리 드로잉 모드)
  - [ ] 캔버스 크기 반응형 처리 (800x600 기본)
- [ ] `DrawingTools.tsx` 컴포넌트 생성
  - [ ] 브러시 색상 선택 (5가지 색상)
  - [ ] 브러시 두께 조절 (2px, 5px, 10px, 15px)
  - [ ] 전체 지우기 버튼
  - [ ] 실행 취소/다시 실행 (선택 사항)

#### 2.2 Firebase RTDB 연동
- [ ] `useCanvas.ts` 커스텀 훅 생성
  - [ ] `initCanvas()`: Canvas 초기화
  - [ ] `syncCanvas()`: RTDB에 캔버스 상태 저장
  - [ ] `exportImage()`: Base64 이미지 추출
- [ ] `useGameRoom.ts` 커스텀 훅 생성
  - [ ] `/gameRooms/{roomId}` 구독
  - [ ] `/liveDrawings/{roomId}` 구독
  - [ ] 실시간 데이터 동기화

#### 2.3 턴 기반 드로잉 권한 제어
- [ ] 현재 턴 플레이어만 캔버스 수정 가능
  - [ ] `isMyTurn` prop에 따라 `isDrawingMode` 토글
  - [ ] 관전 중일 때 오버레이 표시
- [ ] 다른 플레이어 캔버스 실시간 수신
  - [ ] `canvas.loadFromJSON()` 자동 호출
  - [ ] Debounce 적용 (500ms)

#### 2.4 2인 테스트 환경 구축
- [ ] 간단한 게임 룸 생성 로직 (Cloud Function)
  - [ ] `createTestRoom` Function (2명 고정)
- [ ] 2개의 브라우저 창에서 동시 접속 테스트
  - [ ] Player 1이 그리면 Player 2 캔버스에 즉시 반영
  - [ ] 턴 교체 기능 테스트

**완료 기준:**
- ✅ 2명이 동시에 접속하여 번갈아 그릴 수 있음
- ✅ 한 사람이 그린 내용이 다른 사람 화면에 1초 이내 반영
- ✅ 캔버스 상태가 RTDB에 정상 저장됨

---

## Week 3: AI 추론 시스템

**목표:** Gemini API를 연동하여 그림을 보고 단어를 추론하는 AI 판사 구현

### ✅ 체크리스트

#### 3.1 AI 프롬프트 설계
- [ ] `prompts.ts` 파일 생성
  - [ ] `buildJudgePrompt()` 함수 (기본 프롬프트)
  - [ ] `buildEnhancedPrompt()` 함수 (테마별 힌트 추가)
  - [ ] `THEME_HINTS` 상수 (동화, 영화, 음식, 동물)
- [ ] 프롬프트 단위 테스트
  - [ ] 테스트 이미지로 Gemini API 호출
  - [ ] 응답 형식 검증 (JSON 파싱)

#### 3.2 Cloud Function 구현
- [ ] `judgeDrawing` Function 생성
  - [ ] 입력: `{ roomId, imageBase64 }`
  - [ ] 출력: `{ guess, confidence, isCorrect }`
- [ ] Gemini API 연동
  - [ ] GoogleGenerativeAI 초기화
  - [ ] Vision API 호출 (이미지 + 프롬프트)
  - [ ] JSON 응답 파싱 (에러 핸들링 포함)
- [ ] 게임 로직 통합
  - [ ] 정답 확인 (`guess === targetWord`)
  - [ ] 게임 상태 업데이트 (턴 증가 또는 종료)
  - [ ] AI 추론 기록 저장 (`aiGuesses` 배열)

#### 3.3 프론트엔드 연동
- [ ] `useAIJudge.ts` 커스텀 훅 생성
  - [ ] `judge()` 함수: Cloud Function 호출
  - [ ] 로딩 상태 관리
  - [ ] 에러 처리
- [ ] `AIGuessDisplay.tsx` 컴포넌트 생성
  - [ ] 최신 AI 추론 결과 표시
  - [ ] 추론 히스토리 목록
  - [ ] 정답/오답 애니메이션
- [ ] "턴 종료" 버튼 구현
  - [ ] 클릭 시 `canvas.toDataURL()` → AI 판단 요청
  - [ ] 로딩 중 버튼 비활성화

#### 3.4 테스트 및 검증
- [ ] 단위 테스트: 5가지 테마별 정확도 측정
  - [ ] 동화: "백설공주", "신데렐라" 그림 테스트
  - [ ] 영화: "기생충", "어벤져스" 그림 테스트
- [ ] 엣지 케이스 테스트
  - [ ] 빈 캔버스 (흰색만)
  - [ ] 복잡한 그림 (여러 객체)
  - [ ] 추상적인 그림

**완료 기준:**
- ✅ AI가 그림을 보고 한국어로 단어 추론
- ✅ 정답 시 게임 종료, 오답 시 다음 턴으로 자동 전환
- ✅ AI 추론 결과가 UI에 실시간 표시

---

## Week 4: 게임 로직 완성

**목표:** 턴 관리, 타이머, 팀 매칭, 결과 집계 등 완전한 게임 플레이 구현

### ✅ 체크리스트

#### 4.1 게임 룸 생성 및 팀 매칭
- [ ] `matchPlayers` Cloud Function 생성
  - [ ] 참가자 목록 읽기 (`/participants`)
  - [ ] 5명씩 무작위 팀 구성
  - [ ] 게임 룸 생성 (`/gameRooms/{roomId}`)
  - [ ] 테마 및 단어 무작위 할당
- [ ] 수동 매칭 API 엔드포인트 (테스트용)
  ```bash
  curl -X POST https://...cloudfunctions.net/matchPlayers
  ```

#### 4.2 턴 관리 시스템
- [ ] `TurnIndicator.tsx` 컴포넌트 생성
  - [ ] 현재 턴 플레이어 이름 표시
  - [ ] 턴 수 표시 (X / 10)
  - [ ] 경과 시간 표시 (분:초)
- [ ] 턴 타이머 구현 (선택 사항)
  - [ ] 턴당 60초 제한
  - [ ] 시간 초과 시 자동 턴 넘김
- [ ] 턴 순서 관리
  - [ ] `turnOrder` 배열 순회
  - [ ] `currentTurnIndex` 자동 증가

#### 4.3 게임 상태 관리
- [ ] `gameStore.ts` Zustand 스토어 생성
  - [ ] `status`: 'waiting' | 'in-progress' | 'finished'
  - [ ] `turnCount`, `currentTurn`, `startTime`
- [ ] 게임 시작 로직
  - [ ] 모든 플레이어 "준비" 시 자동 시작
  - [ ] `status` → 'in-progress'
- [ ] 게임 종료 로직
  - [ ] 정답 시 즉시 종료
  - [ ] 최대 턴 초과 시 실패 처리

#### 4.4 결과 화면 구현
- [ ] `Results.tsx` 페이지 생성
  - [ ] 정답 단어 공개
  - [ ] 최종 턴 수 및 소요 시간
  - [ ] 최종 그림 이미지 표시
  - [ ] AI 추론 히스토리 전체 보기
- [ ] 리더보드 (다중 팀 지원)
  - [ ] 전체 팀 순위 표시
  - [ ] 1, 2, 3등 하이라이트
  - [ ] 리워드 안내 메시지

#### 4.5 채팅 시스템
- [ ] `Chat.tsx` 컴포넌트 생성
  - [ ] 실시간 메시지 수신 (`/chatMessages/{roomId}`)
  - [ ] 메시지 전송 기능
  - [ ] 사용자 이름 표시
  - [ ] XSS 방지 (DOMPurify)
- [ ] `useChat.ts` 커스텀 훅
  - [ ] `sendMessage()` 함수
  - [ ] `messages` 배열 실시간 구독

**완료 기준:**
- ✅ 5명이 게임 룸에 입장하여 순차적으로 플레이 가능
- ✅ 턴 순서, 타이머, 채팅 모두 정상 동작
- ✅ 게임 종료 후 결과 화면 표시

---

## Week 5: UI/UX 개선

**목표:** 디자인 시스템 적용 및 사용자 경험 개선

### ✅ 체크리스트

#### 5.1 디자인 시스템 구축
- [ ] Tailwind 색상 팔레트 정의
  ```javascript
  // tailwind.config.js
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',  // Indigo
        secondary: '#8B5CF6', // Purple
        success: '#10B981',   // Green
        warning: '#F59E0B',   // Amber
        danger: '#EF4444',    // Red
      }
    }
  }
  ```
- [ ] 공통 컴포넌트 스타일링
  - [ ] `Button.tsx` (primary, secondary, danger 변형)
  - [ ] `Modal.tsx` (다이얼로그)
  - [ ] `Loader.tsx` (스피너)

#### 5.2 페이지별 UI 개선
- [ ] **Home.tsx** (로그인 페이지)
  - [ ] 히어로 섹션 (게임 소개)
  - [ ] "Google로 로그인" 버튼 디자인
  - [ ] 로딩 애니메이션
- [ ] **Lobby.tsx** (대기실)
  - [ ] 팀원 카드 레이아웃 (프로필 사진, 이름, 부서)
  - [ ] "준비" 체크박스
  - [ ] 대기 중 애니메이션
- [ ] **GameRoom.tsx** (메인 게임)
  - [ ] 2칼럼 레이아웃 (캔버스 | 사이드바)
  - [ ] 사이드바: 플레이어 목록 + 채팅 + AI 추론
  - [ ] 턴 인디케이터 강조 (그라데이션 배경)
- [ ] **Results.tsx** (결과 화면)
  - [ ] 축하 애니메이션 (confetti)
  - [ ] 최종 그림 확대 보기 모달
  - [ ] "다시 플레이" 버튼

#### 5.3 반응형 디자인
- [ ] 모바일 레이아웃 (768px 이하)
  - [ ] 캔버스 세로 배치
  - [ ] 사이드바 하단 배치 (탭 전환)
- [ ] 태블릿 레이아웃 (768px-1024px)
  - [ ] 캔버스 60% | 사이드바 40%
- [ ] 터치 이벤트 지원
  - [ ] Fabric.js는 기본 지원 (추가 작업 불필요)

#### 5.4 애니메이션 및 피드백
- [ ] 턴 전환 시 알림 (Toast)
- [ ] AI 추론 중 로딩 애니메이션
- [ ] 정답 시 축하 효과 (Confetti.js 또는 Lottie)
- [ ] 오답 시 Shake 애니메이션

**완료 기준:**
- ✅ 모든 페이지가 일관된 디자인 시스템 적용
- ✅ 모바일/태블릿/데스크톱 모두 정상 동작
- ✅ 주요 인터랙션에 피드백 애니메이션 추가

---

## Week 6: 알파 테스트

**목표:** 소규모 내부 테스트 (5명)를 통한 버그 발견 및 수정

### ✅ 체크리스트

#### 6.1 테스트 준비
- [ ] Firebase 프로덕션 환경에 배포
  ```bash
  firebase deploy
  ```
- [ ] 테스트 계정 생성 (5명)
- [ ] 테스트 시나리오 문서 작성
  - [ ] 시나리오 1: 정상 게임 플레이 (5턴 내 정답)
  - [ ] 시나리오 2: 최대 턴 초과 (10턴 실패)
  - [ ] 시나리오 3: 중간에 플레이어 이탈

#### 6.2 알파 테스트 진행
- [ ] 테스트 날짜 지정 (예: 6주차 금요일 오후)
- [ ] 참가자: 소통위원회 + 개발팀 (5명)
- [ ] 테스트 중 실시간 로그 모니터링
  ```bash
  firebase functions:log --only judgeDrawing
  ```

#### 6.3 버그 수집 및 분류
- [ ] 크리티컬 버그 (게임 진행 불가)
  - [ ] 예: 턴 전환 안 됨, AI 응답 없음
- [ ] 주요 버그 (사용자 경험 저하)
  - [ ] 예: 캔버스 동기화 지연, UI 깨짐
- [ ] 사소한 버그 (기능 개선 필요)
  - [ ] 예: 버튼 텍스트 오타, 색상 가독성

#### 6.4 피드백 수집
- [ ] Google Form 설문 생성
  - [ ] 게임 재미도 (1-5점)
  - [ ] AI 정확도 만족도
  - [ ] UI/UX 편의성
  - [ ] 개선 제안 (자유 기입)

#### 6.5 버그 수정
- [ ] 크리티컬 버그 즉시 수정 (24시간 이내)
- [ ] 주요 버그 1주일 내 수정
- [ ] 사소한 버그는 Week 7에서 처리

**완료 기준:**
- ✅ 5명이 게임을 끝까지 완료
- ✅ 크리티컬 버그 0건
- ✅ 피드백 설문 응답 5건 수집

---

## Week 7: 최적화 및 안정화

**목표:** 성능 개선, 보안 강화, 코드 리팩토링

### ✅ 체크리스트

#### 7.1 성능 최적화
- [ ] 캔버스 동기화 최적화
  - [ ] Debounce 적용 (500ms)
  - [ ] JSON 크기 제한 (100KB)
  - [ ] Gzip 압축 (RTDB 자동 지원)
- [ ] 이미지 최적화
  - [ ] `toDataURL('image/jpeg', 0.8)` 품질 조정
  - [ ] 이미지 크기 축소 (640x480)
- [ ] Code splitting
  - [ ] React.lazy로 페이지 분할
  - [ ] Fabric.js 동적 임포트

#### 7.2 보안 강화
- [ ] Firebase 보안 규칙 재검토
  - [ ] RTDB: 자신의 게임 룸만 접근
  - [ ] Storage: 인증된 사용자만 업로드
- [ ] XSS 방지
  - [ ] 채팅 메시지 sanitize (DOMPurify)
  - [ ] Fabric.js 객체 검증
- [ ] Rate limiting
  - [ ] Cloud Function 호출 제한 (1분당 10회)
  - [ ] 채팅 메시지 스팸 방지

#### 7.3 코드 품질 개선
- [ ] ESLint 규칙 추가
  ```bash
  npm install -D @typescript-eslint/eslint-plugin
  ```
- [ ] Prettier 설정
  ```bash
  npm install -D prettier
  ```
- [ ] 타입 안전성 강화
  - [ ] `any` 타입 제거
  - [ ] Strict mode 활성화

#### 7.4 에러 핸들링
- [ ] 전역 에러 바운더리
  ```typescript
  <ErrorBoundary fallback={<ErrorPage />}>
    <App />
  </ErrorBoundary>
  ```
- [ ] Firebase 에러 처리
  - [ ] 네트워크 에러 → 재시도 로직
  - [ ] 인증 에러 → 로그인 페이지로 리다이렉트
- [ ] AI 추론 실패 시 Fallback
  - [ ] 3회 재시도 후 "AI 판단 불가" 메시지

#### 7.5 모니터링 설정
- [ ] Google Analytics 통합 (선택 사항)
  - [ ] 페이지뷰 추적
  - [ ] 게임 완료율 측정
- [ ] Sentry 에러 추적 (선택 사항)
  ```bash
  npm install @sentry/react
  ```

**완료 기준:**
- ✅ Lighthouse 성능 점수 90+ (모바일/데스크톱)
- ✅ 보안 규칙 테스트 통과
- ✅ ESLint/Prettier 0 에러

---

## Week 8: 베타 테스트 및 정식 출시

**목표:** 대규모 테스트 (10-50명) 및 정식 게임 이벤트 진행

### ✅ 체크리스트

#### 8.1 베타 테스트 (10명)
- [ ] 테스트 날짜: 8주차 월요일-화요일
- [ ] 참가자: 부서별 자원자 (2팀, 10명)
- [ ] 모니터링 대시보드 실시간 확인
  - [ ] Firebase Console: Database 읽기/쓰기 횟수
  - [ ] Cloud Functions: 실행 시간, 에러율
  - [ ] Gemini API: 호출 횟수, 비용

#### 8.2 최종 버그 수정
- [ ] 베타 테스트 중 발견된 버그 즉시 수정
- [ ] Hotfix 배포
  ```bash
  firebase deploy --only functions:judgeDrawing
  ```

#### 8.3 정식 출시 준비
- [ ] 참가자 모집 공지 (사내 메일/Slack)
  - [ ] 게임 일시: 8주차 금요일 오후 3시
  - [ ] 참가 신청 마감: 목요일 자정
- [ ] 팀 매칭 실행 (금요일 오전)
  ```bash
  firebase functions:call matchPlayers
  ```
- [ ] 참가자에게 게임 룸 링크 전송

#### 8.4 정식 게임 진행
- [ ] D-Day: 50명 동시 접속 (10팀)
- [ ] 실시간 리더보드 갱신 확인
- [ ] 게임 종료 후 우승팀 발표
- [ ] 리워드 지급 (점심 회식비 쿠폰)

#### 8.5 사후 분석
- [ ] 게임 로그 분석
  - [ ] 평균 턴 수: 목표 5-7턴
  - [ ] AI 정답률: 턴별 정확도 분석
  - [ ] 평균 게임 시간: 목표 3-5분
- [ ] 참가자 만족도 설문
  - [ ] 목표 평균 점수: 4.0/5.0
- [ ] 회고록 작성
  - [ ] 잘된 점, 개선할 점
  - [ ] Cycle 2 아이디어 도출

**완료 기준:**
- ✅ 50명 참가, 10팀 모두 게임 완료
- ✅ 크리티컬 버그 0건
- ✅ 우승팀 리워드 지급 완료

---

## 🎯 MVP (최소 기능 제품) 범위

**Cycle 1에서 반드시 포함:**
- ✅ Google SSO 로그인
- ✅ 5인 1팀 게임 룸
- ✅ 실시간 캔버스 동기화 (Fabric.js + RTDB)
- ✅ AI 추론 (Gemini API)
- ✅ 턴 관리 (최대 10턴)
- ✅ 채팅
- ✅ 결과 화면 (순위, 리더보드)

**Cycle 2-3으로 연기:**
- 🔲 4-6인 유연한 팀 구성
- 🔲 스마트펜 연동
- 🔲 리플레이 기능 (캔버스 애니메이션)
- 🔲 상세 통계 대시보드
- 🔲 AI 난이도 조절

---

## 📊 성공 지표 (KPI)

| 지표 | 목표 | 측정 방법 |
|-----|------|----------|
| **참가율** | 50명 중 80% (40명) | 참가 신청 수 |
| **완료율** | 90% | 게임 종료까지 도달한 팀 수 |
| **평균 게임 시간** | 3-5분 | `/gameLogs`의 `finalTime` 분석 |
| **AI 정답률 (5턴 기준)** | 50-70% | `/gameLogs`의 턴별 정답률 |
| **만족도** | 4.0/5.0 | 설문 조사 평균 점수 |
| **비용** | $20 이하/월 | Firebase 청구서 확인 |

---

## 🚨 위험 요소 및 대응 계획

| 위험 | 확률 | 영향도 | 대응 방안 |
|-----|------|--------|----------|
| **AI 정확도 낮음** | 중 | 높음 | 프롬프트 최적화, Few-shot 학습 |
| **캔버스 동기화 지연** | 중 | 중 | Debounce, JSON 압축 |
| **8주 일정 초과** | 높음 | 중 | MVP 범위 축소, 비필수 기능 제외 |
| **Firebase 비용 초과** | 낮음 | 낮음 | 이미지 압축, 호출 횟수 제한 |
| **참가자 부족** | 중 | 높음 | 사전 홍보 강화, 리워드 강조 |

---

## 📞 도움 요청

막히는 부분이 있으면 언제든지 질문하세요:

- **Firebase 설정**: [Firebase 공식 문서](https://firebase.google.com/docs)
- **Fabric.js**: [Fabric.js Demos](http://fabricjs.com/demos/)
- **Gemini API**: [Google AI Studio](https://ai.google.dev/)
- **React/TypeScript**: [React 공식 문서](https://react.dev/)

---

**이제 개발을 시작할 준비가 완료되었습니다! 🚀**

**다음 단계**: Week 1 체크리스트부터 하나씩 실행하세요.
