# Project Da Vinci - 개발 체크리스트

> 8주 개발 일정 및 상세 작업 목록

## 📅 전체 일정 (8주)

| 주차 | 마일스톤 | 목표 | 상태 |
|-----|---------|------|------|
| **Week 1** | 환경 설정 및 프로젝트 초기화 | Firebase 프로젝트 생성, React 보일러플레이트 | ⚠️ 대부분 완료 (85%) |
| **Week 2** | 실시간 캔버스 동기화 | Fabric.js + Firebase RTDB 연동 | ⚠️ 대부분 완료 (75%) |
| **Week 3** | AI 추론 시스템 | Gemini API 연동 및 프롬프트 최적화 | ⚠️ 대부분 완료 (80%) |
| **Week 4** | 게임 로직 완성 | 턴 관리, 타이머, 결과 집계 | 🔄 진행 중 (40%) |
| **Week 5** | UI/UX 개선 | 디자인 시스템, 반응형 레이아웃 | 🔲 대기 |
| **Week 6** | 알파 테스트 | 5명 내부 테스트 및 버그 수정 | 🔲 대기 |
| **Week 7** | 최적화 및 안정화 | 성능 개선, 보안 강화 | 🔲 대기 |
| **Week 8** | 베타 테스트 및 출시 | 10-50명 테스트 → 정식 출시 | 🔲 대기 |

---

## Week 1: 환경 설정 및 프로젝트 초기화

**목표:** 개발 환경 구축 및 기본 인프라 설정

### ✅ 체크리스트

#### 1.1 Firebase 프로젝트 설정
- [x] Firebase Console에서 새 프로젝트 생성
  - 프로젝트 이름: `project-da-vinci-prod`
  - Region: `asia-northeast3` (서울)
- [x] Firebase CLI 설치 및 로그인
  ```bash
  npm install -g firebase-tools
  firebase login
  ```
- [x] Firebase 서비스 활성화
  - [x] Authentication (Google Sign-In)
  - [x] Realtime Database
  - [x] Cloud Functions (Blaze 플랜으로 업그레이드)
  - [x] Cloud Storage
  - [x] Hosting

#### 1.2 프론트엔드 초기화
- [x] React + Vite 프로젝트 생성
  ```bash
  cd games/project-da-vinci
  npm create vite@latest frontend -- --template react-ts
  cd frontend && npm install
  ```
- [x] 필수 패키지 설치 (package.json 정의 완료)
  ```bash
  npm install firebase fabric zustand react-router-dom
  npm install -D tailwindcss postcss autoprefixer
  npm install @headlessui/react @heroicons/react
  ```
  - ⚠️ **실제 npm install은 미실행** (UNMET DEPENDENCY)
  - ⚠️ **@headlessui/react, @heroicons/react 누락** (package.json에 없음)
- [x] Tailwind CSS 설정
  ```bash
  npx tailwindcss init -p
  ```
- [x] Firebase SDK 초기화 (`src/firebase.ts`)
- [x] 폴더 구조 생성 (components, pages, hooks, store, services, utils, types)

#### 1.3 백엔드 (Cloud Functions) 초기화
- [x] Functions 프로젝트 초기화
  ```bash
  firebase init functions
  # TypeScript 선택, ESLint 활성화
  ```
- [x] 필수 패키지 설치 (package.json 정의 완료)
  ```bash
  cd functions
  npm install @google/generative-ai
  npm install firebase-admin firebase-functions
  ```
  - ⚠️ **실제 npm install은 미실행**
- [x] 환경 변수 설정
  - [x] Gemini API 키 발급 (https://ai.google.dev/)
  - [x] `.env.example` 파일 생성 및 템플릿 작성
  - ⚠️ **실제 .env 파일은 사용자가 직접 생성 필요**
- [ ] Firebase Emulator 설정
  ```bash
  firebase init emulators
  # Auth, Database, Functions, Storage 선택
  ```
  - ⚠️ **firebase.json에 emulator 설정 섹션 누락**

#### 1.4 Git 및 문서 설정
- [x] `.gitignore` 업데이트
  ```
  .env.local
  .runtimeconfig.json
  node_modules/
  dist/
  .firebase/
  ```
- [x] 초기 커밋
  ```bash
  git add .
  git commit -m "chore: 프로젝트 초기 설정 완료"
  ```

#### 1.5 로컬 개발 환경 테스트
- [ ] Firebase Emulator 실행 테스트
  ```bash
  firebase emulators:start
  ```
  - ⚠️ **Emulator 설정 미완료로 테스트 불가**
- [ ] 프론트엔드 개발 서버 실행 테스트
  ```bash
  cd frontend && npm run dev
  ```
  - ⚠️ **npm install 미실행으로 테스트 불가**

**완료 기준:**
- ⚠️ Firebase Emulator에서 Authentication, Database, Functions 정상 동작 (미검증)
- ⚠️ React 개발 서버에서 "Hello World" 페이지 렌더링 (미검증)
- ✅ Git 초기 커밋 완료

---

## Week 2: 실시간 캔버스 동기화

**목표:** Fabric.js 캔버스와 Firebase RTDB를 연동하여 5명의 실시간 드로잉 동기화 구현

### ✅ 체크리스트

#### 2.1 Fabric.js 캔버스 기본 구현
- [x] `Canvas.tsx` 컴포넌트 생성
  - [x] Fabric.js Canvas 초기화
  - [x] 기본 드로잉 기능 (프리 드로잉 모드)
  - [x] 캔버스 크기 반응형 처리 (800x600 기본)
- [x] `DrawingTools` 기능 구현
  - ⚠️ **별도 컴포넌트가 아닌 Canvas.tsx에 통합 구현**
  - [x] 브러시 색상 선택 (8가지 색상 - TODO 요구사항보다 많음)
  - [x] 브러시 두께 조절 (1-50px 슬라이더)
  - [x] 전체 지우기 버튼
  - [ ] 실행 취소/다시 실행 (선택 사항)

#### 2.2 Firebase RTDB 연동
- [x] `useCanvas` 기능 구현
  - ⚠️ **별도 훅이 아닌 Canvas.tsx의 forwardRef로 구현**
  - [x] `initCanvas()`: Canvas 초기화 (useEffect)
  - [x] `syncCanvas()`: RTDB에 캔버스 상태 저장 (onCanvasChange callback)
  - [x] `exportImage()`: Base64 이미지 추출 (getCanvasAsBase64 메서드)
- [x] `useGameRoom.ts` 커스텀 훅 생성
  - [x] `/gameRooms/{roomId}` 구독
  - ⚠️ `/liveDrawings/{roomId}` 구독은 별도 경로 없이 gameRoom 내부에 통합
  - [x] 실시간 데이터 동기화

#### 2.3 턴 기반 드로잉 권한 제어
- [x] 현재 턴 플레이어만 캔버스 수정 가능
  - [x] `isMyTurn` prop에 따라 `isDrawingMode` 토글 (GameRoom.tsx)
  - [x] 관전 중일 때 텍스트 표시 ("당신의 차례를 기다리는 중...")
  - ⚠️ **오버레이는 텍스트만 있고 시각적 효과 없음**
- [x] 다른 플레이어 캔버스 실시간 수신
  - [x] `canvas.loadFromJSON()` 자동 호출 (loadCanvasData 메서드)
  - [ ] Debounce 적용 (500ms) - **미구현**

#### 2.4 2인 테스트 환경 구축
- [ ] 간단한 게임 룸 생성 로직 (Cloud Function)
  - [ ] `createTestRoom` Function (2명 고정) - **미구현**
  - ⚠️ **대체: 프론트엔드 matchmaking.ts의 createGameRoom만 존재**
- [ ] 2개의 브라우저 창에서 동시 접속 테스트 - **미실행**
  - [ ] Player 1이 그리면 Player 2 캔버스에 즉시 반영
  - [ ] 턴 교체 기능 테스트

**완료 기준:**
- ⚠️ 2명이 동시에 접속하여 번갈아 그릴 수 있음 (이론상 가능, 미검증)
- ⚠️ 한 사람이 그린 내용이 다른 사람 화면에 1초 이내 반영 (미검증)
- ✅ 캔버스 상태가 RTDB에 정상 저장됨 (코드상 구현 완료)

---

## Week 3: AI 추론 시스템

**목표:** Gemini API를 연동하여 그림을 보고 단어를 추론하는 AI 판사 구현

### ✅ 체크리스트

#### 3.1 AI 프롬프트 설계
- [x] `prompts.ts` 파일 생성 (functions/src/ai/prompts.ts)
  - [x] `buildJudgePrompt()` 함수 (기본 프롬프트)
  - [x] `buildEnhancedPrompt()` 함수 (테마별 힌트 추가)
  - [x] `THEME_HINTS` 상수 (동화, 영화, 음식, 동물)
  - ✅ **추가 구현**: buildFewShotPrompt, buildPromptByDifficulty
- [ ] 프롬프트 단위 테스트 - **미구현**
  - [ ] 테스트 이미지로 Gemini API 호출
  - [ ] 응답 형식 검증 (JSON 파싱)

#### 3.2 Cloud Function 구현
- [x] `judgeDrawing` Function 생성 (judge.flow.ts)
  - [x] 입력: `{ roomId, imageBase64 }`
  - [x] 출력: `{ guess, confidence, isCorrect, turnCount, gameStatus }`
  - ✅ **TODO 요구사항보다 더 많은 정보 반환**
- [x] Gemini API 연동
  - [x] GoogleGenerativeAI 초기화
  - [x] Vision API 호출 (이미지 + 프롬프트)
  - [x] JSON 응답 파싱 (에러 핸들링 포함)
- [x] 게임 로직 통합
  - [x] 정답 확인 (`guess === targetWord`)
  - [x] 게임 상태 업데이트 (턴 증가 또는 종료)
  - [x] AI 추론 기록 저장 (`aiGuesses` 배열)

#### 3.3 프론트엔드 연동
- [x] `useAIJudge` 기능 구현
  - ⚠️ **별도 훅이 아닌 GameRoom.tsx에 submitDrawingToAI 함수로 통합**
  - [x] `judge()` 함수: Cloud Function 호출 (services/ai.ts)
  - [x] 로딩 상태 관리 (isJudging state)
  - [x] 에러 처리 (try-catch)
- [x] `AIGuessDisplay` 기능 구현
  - ⚠️ **별도 컴포넌트가 아닌 GameRoom.tsx 내부에 통합**
  - [x] 최신 AI 추론 결과 표시
  - [x] 추론 히스토리 목록 (최근 3개)
  - [ ] 정답/오답 애니메이션 (UI 개선 단계로 연기) - **미구현**
- [x] "턴 종료" 버튼 구현
  - [x] "AI에게 제출하기" 버튼 (GameRoom.tsx)
  - [x] 클릭 시 `canvas.toDataURL()` → AI 판단 요청
  - [x] 로딩 중 버튼 비활성화

#### 3.4 테스트 및 검증
- [ ] 단위 테스트: 5가지 테마별 정확도 측정 - **미실행**
  - [ ] 동화: "백설공주", "신데렐라" 그림 테스트
  - [ ] 영화: "기생충", "어벤져스" 그림 테스트
- [ ] 엣지 케이스 테스트 - **미실행**
  - [ ] 빈 캔버스 (흰색만)
  - [ ] 복잡한 그림 (여러 객체)
  - [ ] 추상적인 그림

**완료 기준:**
- ✅ AI가 그림을 보고 한국어로 단어 추론 (코드상 구현 완료)
- ✅ 정답 시 게임 종료, 오답 시 다음 턴으로 자동 전환 (코드상 구현 완료)
- ✅ AI 추론 결과가 UI에 실시간 표시 (코드상 구현 완료)

---

## Week 4: 게임 로직 완성

**목표:** 턴 관리, 타이머, 팀 매칭, 결과 집계 등 완전한 게임 플레이 구현

### ✅ 체크리스트

#### 4.1 게임 룸 생성 및 팀 매칭
- [ ] `matchPlayers` Cloud Function 생성 - **미구현**
  - ⚠️ **대체: frontend/services/matchmaking.ts에 createGameRoom 함수만 존재**
  - [x] 게임 룸 생성 (`/gameRooms/{roomId}`)
  - [x] 5명 팀 구성 로직
  - ⚠️ 테마/단어는 하드코딩 ("동물", "고양이")
  - [ ] 참가자 목록 읽기 (`/participants`) - **미구현**
  - [ ] 무작위 팀 구성 - **미구현**
  - [ ] 테마 및 단어 무작위 할당 - **미구현**
- [ ] 수동 매칭 API 엔드포인트 (테스트용) - **미구현**

#### 4.2 턴 관리 시스템
- [x] `TurnIndicator` 기능 구현
  - ⚠️ **별도 컴포넌트가 아닌 GameRoom.tsx 내부에 통합**
  - [x] 현재 턴 플레이어 이름 표시
  - [x] 턴 수 표시 (X / 10)
  - [x] 남은 시간 표시 (초 단위)
- [ ] 턴 타이머 구현 (선택 사항)
  - [x] 턴당 60초 제한 (타이머 카운트다운)
  - [ ] 시간 초과 시 자동 턴 넘김 - **미구현 (로직에 문제 가능성)**
- [x] 턴 순서 관리
  - [x] `turnOrder` 배열 순회 (gameRoom 데이터 사용)
  - [x] `currentTurnIndex` 자동 증가 (AI 제출 시)

#### 4.3 게임 상태 관리
- [ ] `gameStore.ts` Zustand 스토어 생성 - **미구현**
  - ⚠️ **authStore.ts만 존재 (게임 상태는 Firebase RTDB로 관리)**
  - [x] 게임 상태는 RTDB `/gameRooms/{roomId}`에서 관리
  - [x] `status`: 'waiting' | 'playing' | 'finished'
  - [x] `turnCount`, `currentTurn`, `startedAt`
- [ ] 게임 시작 로직 - **부분 구현**
  - [x] Lobby에서 "게임 시작" 버튼으로 시작
  - [ ] 모든 플레이어 "준비" 시 자동 시작 - **미구현**
  - [x] `status` → 'playing'
- [x] 게임 종료 로직
  - [x] 정답 시 즉시 종료 (judge.flow.ts)
  - [x] 최대 턴 초과 시 실패 처리 (judge.flow.ts)

#### 4.4 결과 화면 구현
- [ ] `Results.tsx` 페이지 생성 - **미구현**
  - [ ] 정답 단어 공개
  - [ ] 최종 턴 수 및 소요 시간
  - [ ] 최종 그림 이미지 표시
  - [ ] AI 추론 히스토리 전체 보기
- [ ] 리더보드 (다중 팀 지원) - **미구현**
  - [ ] 전체 팀 순위 표시
  - [ ] 1, 2, 3등 하이라이트
  - [ ] 리워드 안내 메시지

#### 4.5 채팅 시스템
- [ ] `Chat.tsx` 컴포넌트 생성 - **미구현**
  - [ ] 실시간 메시지 수신 (`/chatMessages/{roomId}`)
  - [ ] 메시지 전송 기능
  - [ ] 사용자 이름 표시
  - [ ] XSS 방지 (DOMPurify)
- [ ] `useChat.ts` 커스텀 훅 - **미구현**
  - [ ] `sendMessage()` 함수
  - [ ] `messages` 배열 실시간 구독

**완료 기준:**
- ⚠️ 5명이 게임 룸에 입장하여 순차적으로 플레이 가능 (이론상 가능, 미검증)
- ❌ 턴 순서, 타이머, 채팅 모두 정상 동작 (채팅 미구현)
- ❌ 게임 종료 후 결과 화면 표시 (Results 페이지 미구현)

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
  - [ ] Storage: 인증 사용자는 읽기만, 쓰기는 Cloud Functions 전용
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

## 📊 코드베이스 검증 리포트 (2025-11-12)

> 마지막 업데이트: 실제 코드와 TODO 항목 대조 완료

### 전체 완료율: **70%**

#### Week별 완료 현황

| Week | 완료율 | 주요 이슈 |
|------|--------|----------|
| **Week 1** | 85% | ⚠️ npm install 미실행, .firebaserc 누락, Emulator 설정 누락 |
| **Week 2** | 75% | ⚠️ 컴포넌트/훅 분리 부족 (통합 구현), Debounce 미적용 |
| **Week 3** | 80% | ⚠️ 컴포넌트/훅 분리 부족, 단위 테스트 없음 |
| **Week 4** | 40% | ❌ Results, Chat 미구현, matchPlayers CF 없음 |

### 크리티컬 이슈 (반드시 해결 필요)

1. **패키지 설치 필요**
   ```bash
   cd frontend && npm install
   cd ../functions && npm install
   ```

2. **.firebaserc 파일 생성 필요**
   ```bash
   firebase use --add
   # 프로젝트 선택 후 alias: default 설정
   ```

3. **누락된 패키지 추가**
   ```bash
   cd frontend
   npm install @headlessui/react @heroicons/react
   ```

4. **Firebase Emulator 설정**
   - firebase.json에 emulator 섹션 추가 필요

### 주요 누락 기능

#### Week 2
- [ ] Debounce 적용 (캔버스 동기화 최적화)
- [ ] 2인 테스트 환경 (createTestRoom Function)

#### Week 3
- [ ] 프롬프트 단위 테스트
- [ ] 테마별 정확도 테스트

#### Week 4
- [ ] `matchPlayers` Cloud Function (현재 프론트엔드에만 존재)
- [ ] `Results.tsx` 페이지
- [ ] `Chat.tsx` + `useChat.ts` (채팅 시스템)
- [ ] `gameStore.ts` (Zustand 스토어)
- [ ] 턴 타이머 자동 넘김 로직

### 아키텍처 차이점

TODO에서는 별도 파일 분리를 요구했으나, 실제 구현은 통합 방식:

| TODO 요구사항 | 실제 구현 | 평가 |
|-------------|----------|------|
| `DrawingTools.tsx` | Canvas.tsx에 통합 | ✅ 기능적으로 동일 |
| `useCanvas.ts` | Canvas.tsx forwardRef | ✅ 기능적으로 동일 |
| `useAIJudge.ts` | GameRoom.tsx + services/ai.ts | ✅ 기능적으로 동일 |
| `AIGuessDisplay.tsx` | GameRoom.tsx에 통합 | ✅ 기능적으로 동일 |
| `TurnIndicator.tsx` | GameRoom.tsx에 통합 | ✅ 기능적으로 동일 |
| `matchPlayers` CF | frontend/services/matchmaking.ts | ⚠️ 서버리스 아님 |

### 다음 우선순위

1. **즉시 해결 (Week 1 완료)**
   - [ ] npm install 실행
   - [ ] .firebaserc 생성
   - [ ] @headlessui, @heroicons 설치

2. **Week 4 완료**
   - [ ] Results.tsx 페이지 구현
   - [ ] Chat.tsx 채팅 시스템 구현
   - [ ] matchPlayers를 Cloud Function으로 이전

3. **최적화 (Week 7로 연기 가능)**
   - [ ] Debounce 적용
   - [ ] 컴포넌트 분리 (선택사항)
   - [ ] 단위 테스트 작성

---

**이제 개발을 시작할 준비가 완료되었습니다! 🚀**

**다음 단계**: 위의 크리티컬 이슈부터 해결하세요.
