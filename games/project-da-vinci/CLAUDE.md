# Project Da Vinci - CLAUDE.md

이 파일은 **Project Da Vinci (5인 협동 AI Pictionary)** 프로젝트 특화 개발 가이드입니다.

**⚠️ 주의**: 이 프로젝트 작업 전에 루트 `/CLAUDE.md`를 먼저 읽어 레포지토리 공통 원칙을 이해하세요.

---

## 🎯 프로젝트 개요

**Project Da Vinci**는 5명이 협동하여 AI에게 그림을 그려 보여주고, AI가 그림을 맞추는 협동 게임입니다.

### 핵심 컨셉

- **AI를 "플레이어"로 설계**: AI는 정답을 모르고 그림만 보고 추론
- **진정한 협동 게임**: 5명이 함께 그림을 그려 AI에게 단어를 알림
- **난이도별 밸런스**: Easy/Normal/Hard 난이도에 따른 AI 정확도 조정

---

## 🏗️ 프로젝트 구조

```
games/project-da-vinci/
├── CLAUDE.md                    # 이 파일 - project-da-vinci 특화 가이드
├── README.md                    # 게임 개요 및 룰
├── docs/                        # 상세 설계 문서
│   ├── ARCHITECTURE.md          # 시스템 아키텍처
│   ├── FRONTEND.md              # 프론트엔드 설계
│   ├── BACKEND.md               # Cloud Functions 설계
│   ├── AI.md                    # Gemini API 프롬프트 전략
│   ├── TESTING.md               # 테스트 전략 (Vitest, Playwright)
│   └── TODO.md                  # 8주 개발 일정
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── main.tsx             # 앱 진입점
│   │   ├── App.tsx              # 라우팅
│   │   ├── components/          # UI 컴포넌트
│   │   │   ├── game/            # Canvas, DrawingTools, Chat, AIGuessDisplay
│   │   │   └── common/          # Button, Modal, Loader
│   │   ├── pages/               # Home, Lobby, GameRoom, Results
│   │   ├── hooks/               # useAuth, useGameRoom, useCanvas, useAIJudge
│   │   ├── stores/              # Zustand (authStore만 사용)
│   │   ├── services/            # Firebase SDK 래퍼
│   │   ├── types/               # game.types.ts
│   │   └── utils/               # timeFormatter, sanitizer
│   ├── vite.config.ts           # Vite 설정
│   └── package.json             # React 19, Fabric.js 6, Zustand 5
├── functions/                   # Cloud Functions (Node 20)
│   ├── src/
│   │   ├── index.ts             # 진입점
│   │   ├── ai/                  # ⚠️ AI 관련 로직은 여기만!
│   │   │   ├── judge.flow.ts    # 그림 판정
│   │   │   ├── wordGenerator.ts # 단어 생성
│   │   │   └── prompts.ts       # 프롬프트 템플릿
│   │   └── game/                # matchPlayers, finalizeGame
│   ├── .env                     # ⚠️ 민감한 키
│   ├── .env.example             # 환경 변수 템플릿
│   └── package.json             # Gemini AI 0.21, Firebase Admin 12.7
├── firebase.json                # Firebase 배포 설정
└── database.rules.json          # RTDB 보안 규칙
```

---

## 🚀 개발 환경 설정 및 빌드 명령어

### 프론트엔드 (frontend/)

```bash
# 작업 디렉토리
cd games/project-da-vinci/frontend

# 개발 서버 실행 (Vite HMR)
npm run dev                    # → http://localhost:5173

# 빌드 (TypeScript 검사 + Vite 번들링)
npm run build                  # → dist/

# 빌드 결과 미리보기
npm run preview

# 코드 품질
npm run lint                   # ESLint 검사
npm run lint:fix               # ESLint 자동 수정
npm run format                 # Prettier 포맷팅

# 테스트 (Vitest)
npm run test                   # Watch 모드
npm run test:ui                # Vitest UI
npm run test:run               # 단일 실행 (CI용)
npm run test:coverage          # 커버리지 리포트
```

### Cloud Functions (functions/)

```bash
# 작업 디렉토리
cd games/project-da-vinci/functions

# Functions 빌드
npm run build                  # TypeScript → lib/

# 로컬 개발 (Emulator)
npm run serve                  # Emulator 실행 (빌드 후)

# 배포
npm run deploy                 # firebase deploy --only functions

# 로그 확인
npm run logs                   # firebase functions:log
```

### Firebase Emulator (전체 개발 환경)

```bash
# 프로젝트 루트에서
cd games/project-da-vinci
firebase emulators:start

# 실행되는 서비스:
# - Auth: http://localhost:9099
# - Realtime Database: http://localhost:9000
# - Functions: http://localhost:5001
# - Storage: http://localhost:9199
# - Emulator UI: http://localhost:4000
```

### Firebase 배포

```bash
# 전체 배포 (Hosting + Functions)
firebase deploy

# Functions만 배포
firebase deploy --only functions

# 특정 Function만 배포
firebase deploy --only functions:judgeDrawing

# Hosting만 배포
firebase deploy --only hosting
```

---

## 📐 아키텍처 핵심 원칙

### 0. ⚠️ **최우선 규칙: 기존 구현 패턴 준수** ⚠️

**새로운 기능 구현 시 반드시 다음을 확인:**

1. **기존 유사 기능이 있는지 먼저 확인**
   - 예: AI 기능 추가 시 → `functions/src/ai/judge.flow.ts` 확인 필수
   - 예: Firebase 인증 추가 시 → `frontend/src/hooks/useAuth.ts` 확인 필수
   - 예: Firestore 접근 시 → `frontend/src/services/` 확인 필수

2. **기존 패턴을 반드시 따를 것**
   - ❌ **절대 금지**: Frontend에서 직접 외부 API 키 사용
   - ✅ **올바른 방법**: Cloud Functions를 통해 API 호출
   - ❌ **절대 금지**: 다른 모델/라이브러리 버전 사용
   - ✅ **올바른 방법**: 기존 구현과 동일한 모델/버전 사용

3. **보안 원칙 (Security First)**
   - **API 키는 절대 Frontend에 노출 금지**
   - **모든 민감한 로직은 Cloud Functions에서 실행**
   - **환경 변수 위치:**
     - Frontend: `frontend/.env` → `VITE_` 접두사 (public 데이터만)
     - Functions: `functions/.env` → 민감한 키 (API 키 등)

4. **기존 코드 참조 체크리스트**
   ```
   [ ] 유사 기능이 이미 구현되어 있는지 확인했는가?
   [ ] 기존 구현의 모델/라이브러리 버전을 확인했는가?
   [ ] 기존 구현의 보안 패턴을 확인했는가?
   [ ] 기존 구현의 에러 처리 방식을 확인했는가?
   [ ] 기존 구현의 로깅 방식을 확인했는가?
   ```

**실제 사례 (반면교사):**
```typescript
// ❌ 잘못된 예: judge.flow.ts를 확인하지 않고 구현
// frontend/src/services/wordPools.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
const key = import.meta.env.VITE_GEMINI_API_KEY // 🚨 보안 위험!
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }) // 🚨 다른 모델!

// ✅ 올바른 예: judge.flow.ts 패턴 확인 후 구현
// functions/src/ai/wordGenerator.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
const apiKey = process.env.GEMINI_API_KEY // ✅ 서버 사이드
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' }) // ✅ 동일 모델
```

### 1. 서버리스 우선 (Serverless-First)
- **백엔드 서버 없음**: Firebase BaaS로 인프라 관리 최소화
- **Cloud Functions**: HTTP Callable로 AI 추론 등 서버 로직 처리
- **Realtime Database**: WebSocket 기반 실시간 동기화 (Firestore 대신 RTDB 선택 이유: 낮은 지연시간)
- **⚠️ 중요**: 모든 외부 API 호출은 Cloud Functions에서만 실행

### 2. 게임 상태의 단일 진실 공급원 (Single Source of Truth)
- **Zustand**: 클라이언트 인증 상태만 관리 (`authStore`)
- **Firebase RTDB**: 게임 상태는 모두 RTDB에 저장 (GameRoom, LiveDrawing, ChatMessages)
- **React 훅이 RTDB 구독**: `useGameRoom(roomId)` → `onValue()` 리스너로 실시간 반영

### 3. AI를 "플레이어"로 설계
- ❌ **잘못된 접근**: AI가 정답을 알고 "그림이 정답과 맞는지" 평가
- ✅ **올바른 접근**: AI가 정답을 모르고 "그림이 무엇인지" 추론 → 진정한 협동 게임

### 4. 실시간 캔버스 동기화
```
Player A (턴)                    Firebase RTDB                     Player B-E (관전)
    │                                 │                                  │
    ├─ 마우스로 그림 그리기                │                                  │
    ├─ canvas.toJSON()                 │                                  │
    ├─ set('/liveDrawings/roomId') ──→ │                                  │
    │                                 ├─ onValue() 리스너 ──────────────→ │
    │                                 │                                  ├─ canvas.loadFromJSON()
    │                                 │                                  └─ 즉시 렌더링
```

**최적화:**
- Debounce (500ms): 과도한 RTDB 쓰기 방지
- JSON 크기 제한 (100KB): 성능 저하 방지
- 현재 턴 플레이어만 쓰기 권한 (RTDB Rules)

### 5. AI 추론 파이프라인 (+ 학습 데이터 수집)
```
[Player 턴 종료]
    ↓
[클라이언트] canvas.toDataURL('image/png', 0.8) → Base64
    ↓
[Cloud Function: judgeDrawing]
    - RTDB에서 GameRoom 조회 (theme, targetWord, difficulty)
    - 난이도별 프롬프트 생성 (buildPromptByDifficulty(theme, difficulty))
      - easy: Few-shot 프롬프트 (AI 정확도 80%, 45초/턴, 최대 15턴)
      - normal: Enhanced 프롬프트 (AI 정확도 60%, 30초/턴, 최대 10턴)
      - hard: Minimal 프롬프트 (AI 정확도 30-40%, 20초/턴, 최대 5턴)
    - Gemini 1.5 Flash 호출 (이미지 + 프롬프트)
    - JSON 파싱 { guess: "백설공주", confidence: 0.85 }
    - **Storage에 이미지 저장 (AI 학습 데이터용)**
      - 경로: turns/{roomId}/turn_{턴번호}.png
      - 메타데이터: roomId, turn, guess, confidence, timestamp
      - Public URL 생성
    - 정답 확인 (guess === targetWord)
    - 게임 상태 업데이트 (aiGuesses에 imageUrl 포함)
    ↓
[응답] { guess, confidence, isCorrect, gameStatus }
    ↓
[클라이언트] UI 업데이트 (AI 추론 결과 표시)
    ↓
[게임 종료 시]
    - Firestore gameLogs에 모든 aiGuesses 저장 (이미지 URL 포함)
    - 난이도별 점수 보정 적용: score = (turnCount / multiplier) * 1000 + (time / 1000)
      - easy: multiplier = 1.0 (기준)
      - normal: multiplier = 1.3 (30% 보정)
      - hard: multiplier = 1.6 (60% 보정)
    - 리더보드에서 턴별 이미지 + 판정 + 보정 점수 확인 가능
```

**데이터 활용**:
- 그림 + 정답 + AI 추측 쌍으로 학습 데이터셋 구축
- 프롬프트 최적화 및 게임 밸런스 조정에 활용

**점수 계산 시스템**:
- 낮은 점수일수록 높은 순위 (골프 스코어 방식)
- 어려운 난이도일수록 같은 턴 수에도 더 낮은 점수 획득
- 예시:
  - Easy 3턴 120초 = 3,120점
  - Hard 3턴 90초 = 1,965점 (hard가 더 높은 순위)

### 6. 협의 기반 게임 시작 플로우
```
[Lobby: 5명 매칭 완료]
    ↓
[GameRoom 생성 (status: waiting, difficulty: normal)]
    ↓
[대기실 UI]
    - 난이도 선택 (모든 참가자가 실시간 수정 가능)
    - 채팅으로 난이도 협의
    - 각 플레이어 "준비 완료" 버튼 클릭
    ↓
[모든 플레이어 ready: true]
    ↓
[게임 시작 버튼 활성화]
    ↓
[클릭 시 status: in-progress]
    ↓
[게임 진행 (Canvas + AI 추론)]
```

**협동 게임 철학:**
- 난이도는 한 사람이 아닌 **모두가 협의**하여 결정
- 준비 완료 시스템으로 **모든 플레이어가 동의** 후 시작
- 대기실 채팅을 통한 **원활한 소통**

---

## 🎨 주요 기술 스택 & 버전

| 카테고리 | 기술 | 버전 | 용도 |
|---------|------|------|------|
| **Frontend** | React | 19.2.0 | UI 라이브러리 (최신 Concurrent 렌더링) |
| | TypeScript | 5.9.3 | 정적 타입 검사 (Strict Mode) |
| | Vite | 7.2.2 | 빌드 도구 (HMR) |
| | Tailwind CSS | 4.1.17 | 유틸리티 기반 스타일링 |
| | Fabric.js | 6.9.0 | HTML5 Canvas 객체 제어 |
| | Zustand | 5.0.8 | 경량 상태 관리 (authStore) |
| | React Router | 7.9.5 | 클라이언트 라우팅 |
| | DOMPurify | 3.3.0 | XSS 방지 (채팅 메시지 sanitize) |
| **Backend** | Firebase Admin | 12.7.0 | Firebase 서버 SDK |
| | Firebase Functions | 6.1.1 | Cloud Functions v2 |
| | Gemini API | 0.21.0 | Google AI Vision 모델 |
| | Node.js | 20 | Functions 런타임 |
| **BaaS** | Firebase Auth | - | Google SSO (@neolab.net 도메인 제한) |
| | Realtime Database | - | 실시간 동기화 (WebSocket 기반) |
| | Firestore | - | 게임 로그, 분석 데이터, 스케줄 저장 |
| | Cloud Storage | - | AI 학습 데이터 (턴별 이미지 + 판정) |
| | Hosting | - | React SPA 정적 파일 서빙 (CDN) |
| **Testing** | Vitest | 4.0.8 | 단위 테스트 (jsdom 환경) |
| | Testing Library | 16.3.0 | React 컴포넌트 테스트 |
| | Playwright | - | E2E 테스트 (향후 추가 예정) |
| **Code Quality** | ESLint | 9.39.1 | Flat Config v9 + TypeScript ESLint |
| | Prettier | 3.6.2 | 코드 포맷팅 |
| | Husky | 9.1.7 | Git Hooks (pre-commit) |
| | lint-staged | 16.2.6 | 변경된 파일만 lint + test |

---

## 🎨 UI/UX 디자인 시스템

### 미술관/갤러리 테마 컨셉

Project Da Vinci는 **참가자들이 그린 그림이 액자로 전시되는 우아한 갤러리**라는 컨셉으로 디자인되었습니다. 클래식하고 고딕스러운 미술관 분위기로, 게임의 협동 창작 정신을 시각적으로 표현합니다.

### Tailwind 설정 (frontend/tailwind.config.js)

#### 색상 팔레트
```javascript
colors: {
  gallery: {
    wall: '#2B2520',        // Dark wood/museum wall (배경)
    'wall-light': '#3A332E', // Lighter wall tone
    floor: '#1A1512',       // Dark floor
    cream: '#F5F5DC',       // Cream/Beige
    ivory: '#FFFEF0',       // Ivory white (주요 텍스트)
  },
  gold: {
    frame: '#D4AF37',       // Gold frame (액자 테두리, 강조)
    dark: '#B8860B',        // Dark gold
    light: '#FFD700',       // Bright gold
  },
  wood: {
    dark: '#3E2723',        // Dark brown
    medium: '#5D4037',      // Medium brown
    light: '#6D4C41',       // Light brown
  },
  velvet: {
    red: '#8B0000',         // Deep red velvet (헤더)
    burgundy: '#A52A2A',    // Burgundy
  },
}
```

#### 타이포그래피
```javascript
fontFamily: {
  playfair: ['Playfair Display', 'serif'],    // 타이틀, 헤딩 (우아한 세리프)
  cormorant: ['Cormorant Garamond', 'serif'], // 본문 텍스트 (가독성)
  crimson: ['Crimson Text', 'serif'],         // 라벨, 캡션 (뮤지엄 스타일)
}
```

**Google Fonts Import** (`frontend/src/index.css`):
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Cormorant+Garamond:wght@300;400;600;700&family=Crimson+Text:wght@400;600;700&display=swap');
```

#### 애니메이션
```javascript
keyframes: {
  fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
  scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
  slideIn: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
  frameReveal: { '0%': { opacity: '0', transform: 'scale(0.9) rotateZ(-2deg)' }, '100%': { opacity: '1', transform: 'scale(1) rotateZ(0)' } },
  spotlight: { '0%, 100%': { transform: 'translate(0, 0)' }, '50%': { transform: 'translate(10px, 10px)' } },
}
```

#### 커스텀 그림자
```javascript
boxShadow: {
  'frame-gold': '0 0 0 8px #D4AF37, 0 0 0 12px #B8860B, 0 15px 40px rgba(0, 0, 0, 0.4)',
  'frame-wood': '0 0 0 10px #6D4C41, 0 0 0 14px #5D4037, 0 15px 40px rgba(0, 0, 0, 0.5)',
  'canvas': 'inset 0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)',
  'gallery': '0 20px 60px rgba(0, 0, 0, 0.3)',
}
```

### 주요 UI 클래스 (`frontend/src/index.css`)

#### 1. gallery-frame
금색 액자 효과 (다층 그림자, 스포트라이트)
```css
.gallery-frame {
  position: relative;
  padding: 16px;
  background: linear-gradient(135deg, #D4AF37, #B8860B, #D4AF37);
  box-shadow:
    0 0 0 8px #2B2520,
    0 0 0 12px #D4AF37,
    0 0 0 16px #B8860B,
    0 15px 40px rgba(0, 0, 0, 0.6),
    inset 0 0 30px rgba(212, 175, 55, 0.2);
}
```

#### 2. gallery-placard
미술관 작품 설명 라벨 스타일
```css
.gallery-placard {
  background-color: #3E2723;
  color: #F5F5DC;
  padding: 0.75rem 1.5rem;
  font-family: 'Crimson Text', serif;
  border: 1px solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

#### 3. velvet-bg
애니메이션이 있는 벨벳 커튼 배경
```css
.velvet-bg {
  background: linear-gradient(180deg, #8B0000 0%, #6B0000 50%, #8B0000 100%);
  background-size: 100% 200%;
  animation: velvet-shimmer 4s ease-in-out infinite;
}
```

#### 4. gold-glow
금색 텍스트 글로우 효과
```css
.gold-glow {
  text-shadow:
    0 0 10px rgba(212, 175, 55, 0.5),
    0 0 20px rgba(212, 175, 55, 0.3),
    0 0 30px rgba(212, 175, 55, 0.2);
}
```

#### 5. museum-label
뮤지엄 라벨 타이포그래피
```css
.museum-label {
  font-family: 'Crimson Text', serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: rgba(245, 245, 220, 0.8);
}
```

### 페이지별 컨셉

#### Home (미술관 입구)
- 벨벳 커튼 헤더 (`velvet-bg`) with gold border
- 로마 숫자 전시 관람 안내 (I, II, III, IV)
- "Google로 갤러리 입장" 버튼 (금색, 그림자 효과)
- 하단: "NEOLAB CONVERGENCE DIGITAL GALLERY • EST. 2025" (`museum-label`)

#### Lobby (작가 대기실)
- 참여 작가 목록을 `gallery-frame` 스타일로 표시
- 금색 그라데이션 매칭 진행 바 (`from-gold-dark to-gold-frame`)
- 전시 정보 카드 (필요 작가, 현재 대기, 최대 턴, 턴당 시간)
- 협동 창작 규칙 섹션 (`gallery-placard`)

#### GameRoom (전시실)
- Header: Dark wood (`bg-wood-dark`) with gold border (`border-gold-frame`)
- 대기 화면: 난이도 선택, 플레이어 준비 상태
- 게임 진행: 캔버스를 중심으로 한 액자 전시 레이아웃
- 난이도 배지: Easy=gold, Normal=gold-dark, Hard=velvet-red

#### Results (전시회)
- 최종 작품 갤러리 전시
- 턴별 이미지를 액자로 표시 (`gallery-frame`)
- 성공/실패 아이콘 with 애니메이션
- 리더보드 (금색 강조)

### 반응형 디자인 원칙

```javascript
// Tailwind breakpoints
screens: {
  sm: '640px',  // 모바일 가로/소형 태블릿
  md: '768px',  // 태블릿
  lg: '1024px', // 데스크탑
  xl: '1280px', // 대형 데스크탑
}
```

**적용 예시:**
```tsx
<h1 className="text-5xl md:text-7xl font-playfair">
  Project Da Vinci
</h1>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 모바일: 1열, 태블릿: 2열, 데스크탑: 3열 */}
</div>
```

### UI 개발 시 주의사항

1. **테마 일관성**: 모든 페이지는 미술관/갤러리 테마를 따를 것
2. **폰트 사용**:
   - 타이틀: `font-playfair`
   - 본문: `font-cormorant` (또는 기본 `gallery-text` 클래스)
   - 라벨: `font-crimson` (또는 `museum-label` 클래스)
3. **색상 사용**:
   - 주요 배경: `bg-gallery-wall`, `bg-wood-dark`
   - 강조: `text-gold-frame`, `border-gold-frame`
   - 텍스트: `text-gallery-ivory`, `text-gallery-cream`
4. **애니메이션**: 과도하지 않게, 우아하게 (`animate-fadeIn`, `animate-scaleIn`)
5. **접근성**: 금색과 배경의 대비 유지 (WCAG AA 준수)

---

## 📂 핵심 파일 & 모듈 가이드

### Frontend 주요 파일

| 파일 경로 | 역할 | 주요 로직 |
|----------|------|----------|
| **src/main.tsx** | 앱 진입점 | React.createRoot() + Firebase 초기화 |
| **src/App.tsx** | 라우팅 | React Router (/, /lobby, /game/:roomId, /results) |
| **src/firebase.ts** | Firebase SDK 초기화 | auth, database, functions export |
| **src/types/game.types.ts** | 타입 정의 | GameRoom, AIGuess, Player 등 인터페이스 |

#### 페이지 컴포넌트 (src/pages/)
| 파일 | 경로 | 기능 |
|-----|------|------|
| **Home.tsx** | `/` | Google SSO 로그인 페이지 |
| **Lobby.tsx** | `/lobby` | 5명 매칭 대기실 (매칭 완료 시 GameRoom 생성) |
| **GameRoom.tsx** | `/game/:roomId` | **waiting**: 난이도 협의 + 채팅 + 준비 완료 대기실<br>**in-progress**: 메인 게임 (Canvas + Chat + AI 추론) |
| **Results.tsx** | `/results` | 게임 종료 후 결과 화면 (리더보드) |

#### 커스텀 훅 (src/hooks/)
| 훅 | 기능 | 반환값 |
|----|------|--------|
| **useAuth()** | Firebase Auth 상태 관리 | `{ user, loading, signIn, signOut }` + @neolab.net 검증 |
| **useGameRoom(roomId)** | 게임 룸 실시간 구독 + 상태 관리 | `{ gameRoom, handleCanvasChange, handlePlayerReady, handleDifficultyChange, handleStartGame, isMyTurn, getRemainingTime }` |
| **useCanvas()** | Fabric.js Canvas 제어 | `{ canvas, initCanvas, syncCanvas, exportImage }` |
| **useAIJudge()** | AI 추론 Cloud Function 호출 | `{ judge(roomId, imageBase64), loading, error }` |
| **useMatchmaking()** | Lobby 플레이어 매칭 | `{ players, joinLobby, leaveLobby, startGame }` |

#### 게임 컴포넌트 (src/components/game/)
| 컴포넌트 | 기능 |
|---------|------|
| **Canvas.tsx** | Fabric.js 캔버스 (현재 턴 플레이어만 수정 가능, 나머지는 읽기 전용) |
| **DrawingTools.tsx** | 브러시 색상/두께 선택, 지우기 버튼 |
| **TurnIndicator.tsx** | 현재 턴 플레이어, 턴 수, 경과 시간 표시 |
| **PlayerList.tsx** | 5명 팀원 목록 (프로필 사진, 이름, 부서) |
| **Chat.tsx** | 실시간 채팅 (XSS 방지: DOMPurify) |
| **AIGuessDisplay.tsx** | AI 추론 결과 및 히스토리 표시 |

#### Services (src/services/)
| 파일 | 역할 |
|-----|------|
| **auth.ts** | Firebase Auth 래퍼 (`signInWithPopup`, `signOut`) |
| **gameRoom.ts** | 게임 룸 CRUD (`subscribeToGameRoom`, `updateCanvasData`, `updatePlayerReady`, `updateDifficulty`, `startGame`, `endTurn`) |
| **matchmaking.ts** | Lobby 로직 (`joinLobby`, `createGameRoom(players, difficulty)`) |
| **ai.ts** | Cloud Function 호출 (`judgeDrawing` httpsCallable) |

#### 유틸리티 (src/utils/)
| 파일 | 역할 |
|-----|------|
| **difficulty.ts** | 난이도 설정 관리 (`DIFFICULTY_CONFIG`, `getDifficultyConfig`, `getDifficultyLabel`) |
| **timeFormatter.ts** | 시간 포맷팅 유틸리티 |
| **sanitizer.ts** | XSS 방지 (DOMPurify 래퍼) |

### Cloud Functions 주요 파일

| 파일 경로 | 역할 |
|----------|------|
| **functions/src/index.ts** | Function 진입점 (judgeDrawing, matchPlayers, finalizeGame export) |
| **functions/src/ai/prompts.ts** | 프롬프트 템플릿 (buildJudgePrompt, buildEnhancedPrompt, buildFewShotPrompt) |
| **functions/src/ai/judge.ts** | judgeDrawing Function (Gemini API 호출 + 게임 상태 업데이트) |
| **functions/src/game/matching.ts** | matchPlayers Function (참가자 → 5인 팀 자동 구성) |
| **functions/src/game/finalize.ts** | finalizeGame Trigger (게임 종료 시 로그 저장) |

---

## 🗂️ Firebase Realtime Database 구조

```json
{
  "users": {
    "{uid}": {
      "displayName": "김개발",
      "email": "kim@neolab.net",
      "department": "개발팀",
      "photoURL": "https://..."
    }
  },

  "lobby": {
    "waitingPlayers": {
      "{uid}": { "name": "...", "joinedAt": 1234567890 }
    }
  },

  "gameRooms": {
    "{roomId}": {
      "status": "in-progress",        // 'waiting' | 'in-progress' | 'finished'
      "theme": "동화",
      "targetWord": "백설공주",
      "currentTurn": "{uid}",
      "turnOrder": ["{uid1}", "{uid2}", "{uid3}", "{uid4}", "{uid5}"],
      "currentTurnIndex": 2,
      "maxTurns": 10,
      "turnCount": 3,
      "startTime": 1678886400000,
      "endTime": null,
      "players": {
        "{uid}": { "name": "김개발", "team": "A", "ready": true }
      },
      "aiGuesses": [
        { "turn": 1, "guess": "사과", "confidence": 0.72, "timestamp": 1678886401000 },
        { "turn": 2, "guess": "공주", "confidence": 0.65, "timestamp": 1678886462000 }
      ]
    }
  },

  "liveDrawings": {
    "{roomId}": {
      "canvasState": "{...Fabric.js JSON...}",  // Stringified JSON
      "lastUpdatedBy": "{uid}",
      "lastUpdatedAt": 1678886462000
    }
  },

  "chatMessages": {
    "{roomId}": {
      "{messageId}": {
        "uid": "{uid}",
        "displayName": "김개발",
        "text": "제가 사과 먼저 그릴게요",
        "timestamp": 1678886400500
      }
    }
  },

  "gameLogs": {
    "{logId}": {
      "roomId": "{roomId}",
      "theme": "동화",
      "targetWord": "백설공주",
      "difficulty": "normal",
      "finalTurnCount": 5,
      "finalTime": 180500,              // ms
      "result": "success",
      "winningTeam": "{roomId}",
      "aiGuessList": [
        {
          "turn": 1,
          "guess": "사과",
          "confidence": 0.72,
          "timestamp": 1678886401000,
          "imageUrl": "https://storage.googleapis.com/.../turns/{roomId}/turn_1.png"
        },
        {
          "turn": 2,
          "guess": "공주",
          "confidence": 0.65,
          "timestamp": 1678886462000,
          "imageUrl": "https://storage.googleapis.com/.../turns/{roomId}/turn_2.png"
        }
      ],
      "completedAt": 1678886580500,
      "finishedAt": "(Firestore Timestamp)"
    }
  }
}
```

### 보안 규칙 (database.rules.json)

**핵심 원칙:**
1. 인증된 사용자만 접근 (`auth != null`)
2. 자신이 속한 게임 룸만 읽기/쓰기
3. **현재 턴 플레이어만** 캔버스 수정 가능
4. 게임 로그는 Cloud Function만 작성

---

## 🧠 AI 프롬프트 전략

**⚠️ 중요: AI 관련 모든 로직은 `functions/src/ai/`에만 존재**

### AI Functions 목록

1. **judgeDrawing** (`judge.flow.ts`)
   - 역할: 플레이어 그림 판정
   - 모델: `gemini-2.5-flash-lite`
   - 입력: roomId, imageBase64
   - 출력: guess, confidence, isCorrect, gameStatus

2. **generateWords** (`wordGenerator.ts`)
   - 역할: 주제별 단어 자동 생성
   - 모델: `gemini-2.5-flash-lite` (judge.flow.ts와 동일)
   - 입력: theme, count
   - 출력: theme, words[], count

**⚠️ 신규 AI 기능 추가 시:**
- ✅ `functions/src/ai/` 디렉토리에 추가
- ✅ 기존 judge.flow.ts의 패턴 참조 (모델, 파싱 로직, 에러 처리)
- ✅ `gemini-2.5-flash-lite` 모델 사용 (일관성)
- ✅ Robust JSON 파싱 (여러 키 허용, fallback)
- ❌ Frontend에서 직접 구현 금지

### 난이도별 프롬프트 전략 (docs/AI.md 참조)

1. **buildFewShotPrompt(theme)** - Easy 난이도
   - 과거 게임 예시 3개 제공 (Few-shot learning)
   - 테마별 예시 단어 풍부하게 제공 (동화: 백설공주, 신데렐라...)
   - AI 정확도 목표: ~80%
   - 시간/턴: 45초/15턴

2. **buildEnhancedPrompt(theme)** - Normal 난이도
   - 테마별 힌트 제공
   - 카테고리 예시만 제공 (Few-shot 없음)
   - AI 정확도 목표: ~60%
   - 시간/턴: 30초/10턴

3. **buildHardPrompt(theme)** - Hard 난이도
   - 힌트 최소화, 엄격한 판단 기준
   - "Be very strict and literal in your interpretation"
   - 창의적 추론 금지, 명확한 형태만 인식
   - AI 정확도 목표: ~30-40%
   - 시간/턴: 20초/5턴

### Gemini API 설정

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    temperature: 0.7,        // 약간의 창의성 허용
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 100,    // JSON 응답은 짧음
  },
});
```

### JSON 응답 포맷 강제

```json
{
  "guess": "백설공주",
  "confidence": 0.85
}
```

**Fallback 파싱**: Gemini가 마크다운으로 감싸는 경우 정규식으로 추출

---

## 🧪 테스트 전략 (docs/TESTING.md 참조)

### 테스트 피라미드

```
      /\
     /E2E\     (10% - Playwright)
    /______\
   /통합테스트\  (30% - Vitest + Firebase Emulator)
  /__________\
 /  단위테스트 \ (60% - Vitest + Testing Library)
/____________\
```

### 커버리지 목표

| 모듈 | 목표 | 실행 시점 |
|-----|------|----------|
| **단위 테스트** | 80% | 매 커밋 (pre-commit hook via lint-staged) |
| **통합 테스트** | 60% | PR 생성 시 (CI/CD) |
| **E2E 테스트** | 주요 시나리오 10개 | 배포 전 (주 1회) |

### 주요 테스트 파일

```bash
frontend/src/
├── utils/
│   ├── timeFormatter.test.ts        # 시간 포맷팅 유틸
│   └── sanitizer.test.ts            # XSS 방지 sanitize
├── stores/
│   └── authStore.test.ts            # Zustand 스토어
├── hooks/
│   └── useAuth.test.ts              # Firebase Auth 훅
├── services/
│   └── matchmaking.test.ts          # Lobby 로직
└── components/
    └── game/
        └── Canvas.test.tsx          # Fabric.js 캔버스 컴포넌트

functions/test/
├── ai/
│   └── prompts.test.ts              # 프롬프트 생성 로직
└── game/
    └── matching.test.ts             # 팀 매칭 알고리즘
```

### pre-commit 자동 테스트 (lint-staged)

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "vitest related --run"     // 변경된 파일 관련 테스트만 실행
  ]
}
```

---

## 🎯 개발 워크플로우 & 컨벤션

### 코드 스타일

- **들여쓰기**: 2 spaces
- **세미콜론**: 사용 안 함 (Prettier 설정)
- **따옴표**: 싱글 쿼트 (`'`)
- **최대 줄 길이**: 100자
- **컴포넌트 파일명**: PascalCase (`CanvasBoard.tsx`)
- **훅/유틸 파일명**: camelCase (`useGameRoom.ts`)

### ESLint + Prettier 통합

```bash
npm run lint        # ESLint 검사
npm run lint:fix    # 자동 수정
npm run format      # Prettier 포맷팅
```

**우회 금지**: Husky/lint-staged를 bypass하지 말 것. 수정이 어려운 경우 주석으로 이유 명시:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = ...; // RTDB 응답 타입이 동적이므로 any 허용
```

---

## 🔐 보안 고려사항

### 1. API 키 보호 ⚠️ **최우선 보안 원칙**

**절대 규칙: Frontend에서 외부 API 직접 호출 금지**

❌ **절대 금지 - 클라이언트 노출:**
```typescript
// ❌ frontend/src/services/wordPools.ts (잘못된 예)
import { GoogleGenerativeAI } from '@google/generative-ai'
const key = import.meta.env.VITE_GEMINI_API_KEY  // 🚨 보안 위험!
const genAI = new GoogleGenerativeAI(key)        // 🚨 클라이언트 노출!
```

**문제점:**
- 브라우저 개발자 도구에서 API 키 확인 가능
- 빌드된 JS 번들에 키가 포함됨
- 악의적 사용자가 키를 추출하여 남용 가능

✅ **올바른 방법 - Cloud Functions 사용:**
```typescript
// ✅ functions/src/ai/wordGenerator.ts (올바른 예)
import { GoogleGenerativeAI } from '@google/generative-ai'
const apiKey = process.env.GEMINI_API_KEY  // ✅ 서버 사이드만 접근
const genAI = new GoogleGenerativeAI(apiKey)

// ✅ frontend/src/services/wordPools.ts (올바른 예)
import { httpsCallable } from 'firebase/functions'
const generateWords = httpsCallable(functions, 'generateWords')
const result = await generateWords({ theme, count })  // ✅ Functions를 통해 호출
```

**환경 변수 관리:**
```bash
# ✅ functions/.env (서버 사이드 - 절대 커밋하지 말 것)
GEMINI_API_KEY=AIzaSyC...

# ✅ functions/.env.example (템플릿만 커밋)
GEMINI_API_KEY=your-gemini-api-key-here

# ✅ 프로덕션 배포 (Firebase Functions Config)
firebase functions:config:set gemini.api_key="AIzaSyC..."
```

**검증 체크리스트:**
```
[ ] API 키가 frontend/ 디렉토리에 없는가?
[ ] .env 파일이 .gitignore에 포함되어 있는가?
[ ] 외부 API 호출이 모두 Cloud Functions를 통하는가?
[ ] 빌드된 JS 번들에 API 키가 포함되지 않는가?
```

### 2. Firebase 보안 규칙

**RTDB Rules:**
- 현재 턴 플레이어만 캔버스 수정 가능
- 자신이 속한 게임 룸만 접근
- 게임 로그는 Cloud Function만 쓰기

**Storage Rules:**
- 인증 사용자는 읽기만 가능
- 업로드는 Cloud Function(Admin SDK)만

### 3. XSS 방지

채팅 메시지는 **DOMPurify**로 sanitize:
```typescript
import DOMPurify from 'dompurify';

export function sanitizeMessage(message: string): string {
  return DOMPurify.sanitize(message, {
    ALLOWED_TAGS: [],  // HTML 태그 모두 제거
    ALLOWED_ATTR: [],
  });
}
```

### 4. 도메인 제한 (@neolab.net)

`useAuth` 훅에서 이메일 도메인 검증:
```typescript
if (!user.email?.endsWith('@neolab.net')) {
  throw new Error('네오랩컨버전스 계정만 접근 가능합니다.');
}
```

---

## 📊 성능 최적화 전략

### 1. 캔버스 동기화 최적화

```typescript
import { debounce } from 'lodash-es';

// 500ms마다 최대 1회만 RTDB에 저장
const syncCanvasDebounced = debounce((roomId, json) => {
  database.ref(`/liveDrawings/${roomId}/canvasState`).set(JSON.stringify(json));
}, 500);
```

### 2. 이미지 압축

```typescript
// AI 추론 전 이미지 품질 80%로 압축
const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
```

### 3. Code Splitting (React.lazy)

```typescript
import { lazy, Suspense } from 'react';

const GameRoom = lazy(() => import('@/pages/GameRoom'));

<Suspense fallback={<Loader />}>
  <GameRoom />
</Suspense>
```

### 4. Fabric.js JSON 크기 제한

```typescript
const json = canvas.toJSON();
const jsonSize = JSON.stringify(json).length;

if (jsonSize > 100000) {  // 100KB
  throw new Error('Canvas JSON exceeds 100KB. Too many objects!');
}
```

---

## 🚨 알려진 이슈 & 제약사항

1. **Fabric.js JSON 직렬화 지연**
   - 100개 이상 객체 시 성능 저하
   - 해결 방안: Debounce + 증분 업데이트 (향후 개선)

2. **Gemini API 응답 시간**
   - 평균 2-3초 (네트워크 상황에 따라 변동)
   - 사용자 경험: 로딩 애니메이션으로 대응

3. **RTDB 무료 플랜 한도**
   - Spark 플랜: 동시 접속 100명, 다운로드 10GB/월
   - 50명 규모에서는 문제없음, 100명 이상 시 Blaze 플랜 필요

4. **Gemini JSON 응답 불안정**
   - 가끔 마크다운(```json```)으로 감싸는 경우 있음
   - 정규식 fallback으로 대응 중

---

## 🛠️ 문제 해결 (Troubleshooting)

### Firebase Emulator 실행 실패
```bash
# 포트 충돌 시
firebase emulators:start --only functions,database

# 캐시 삭제
rm -rf .firebase
```

### Cloud Function 배포 실패
```bash
# functions/ 빌드 에러 확인
cd functions && npm run build

# TypeScript 컴파일 에러 해결 후 재배포
firebase deploy --only functions
```

### RTDB 보안 규칙 에러
```bash
# 로컬에서 테스트
firebase emulators:start

# 보안 규칙 시뮬레이터로 검증
# Emulator UI → Database → Rules
```

### Gemini API 할당량 초과
```bash
# Google Cloud Console에서 할당량 확인
# https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
```

---

## 📖 추가 참고 문서

### 프로젝트 문서
- **README.md**: 게임 룰 및 개요
- **docs/ARCHITECTURE.md**: 시스템 아키텍처 다이어그램
- **docs/FRONTEND.md**: 컴포넌트 상세 설계
- **docs/BACKEND.md**: Cloud Functions 구현 가이드
- **docs/AI.md**: Gemini API 프롬프트 엔지니어링
- **docs/TESTING.md**: 테스트 전략 (Vitest, Playwright)
- **docs/TODO.md**: 8주 개발 일정 및 체크리스트

### 외부 문서
- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Gemini API Guide](https://ai.google.dev/gemini-api/docs)
- [React 19 Docs](https://react.dev/)
- [Vite Guide](https://vite.dev/)

---

## 🎯 개발 시 주의사항

### DO ✅
- **문서 우선**: 로직 변경 전 해당 문서(ARCHITECTURE.md, FRONTEND.md 등) 참조
- **타입 안전성**: `any` 사용 최소화, 인터페이스 정의 (`types/game.types.ts`)
- **테스트 작성**: 새로운 훅/컴포넌트 추가 시 최소 1개 테스트 작성
- **보안 규칙 확인**: RTDB/Storage 경로 변경 시 보안 규칙 업데이트
- **커밋 전 lint**: `npm run lint:fix` + `npm run format` 실행
- **한국어 주석**: 복잡한 로직은 한국어로 주석 (AI 프롬프트는 영어)

### DON'T ❌
- **RTDB 직접 수정 금지**: Admin Console에서 수동 편집하지 말 것 (보안 규칙 우회 위험)
- **API 키 커밋 금지**: `.env`, `.runtimeconfig.json` 절대 커밋 안 함
- **Zustand에 게임 상태 저장 금지**: 게임 상태는 RTDB가 단일 진실 공급원
- **거대한 PR 지양**: 400줄 이하로 분할 (frontend/functions 분리)
- **테스트 건너뛰기 금지**: `--no-verify` 사용 금지 (특수한 경우만 예외)
- **프로덕션 직접 배포 금지**: Emulator 테스트 후 배포

---

**이 파일은 Claude Code가 Project Da Vinci에서 효율적으로 작업할 수 있도록 작성되었습니다. 문서가 실제 코드와 일치하지 않는 경우 코드가 우선입니다.**
