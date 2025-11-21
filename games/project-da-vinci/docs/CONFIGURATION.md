# Project Da Vinci - 환경 설정 가이드

> 개발 환경과 상용 환경의 설정 차이 및 관리 방법

---

## 📋 목차

1. [환경 구분 개요](#환경-구분-개요)
2. [Frontend 환경 설정](#frontend-환경-설정)
3. [Backend (Functions) 환경 설정](#backend-functions-환경-설정)
4. [Firebase 보안 규칙](#firebase-보안-규칙)
5. [개발/상용 차이점 비교표](#개발상용-차이점-비교표)
6. [환경 전환 방법](#환경-전환-방법)

---

## 환경 구분 개요

Project Da Vinci는 **개발 환경(Development)**과 **상용 환경(Production)**을 명확히 분리하여 관리합니다.

### 환경 구분의 목적

| 목적 | 설명 |
|------|------|
| **테스트 용이성** | 개발 중에는 최소 인원(2명)으로 빠르게 테스트 가능 |
| **디버깅 효율성** | 개발 모드에서는 상세한 로그 출력 |
| **보안 강화** | 상용에서는 엄격한 보안 규칙 적용 |
| **비용 최적화** | 개발에서는 리소스 절감 설정 |

---

## Frontend 환경 설정

### 1. 환경 파일 구조

```
frontend/
├── .env.development    # 개발 환경 설정 (npm run dev 시 자동 로드)
├── .env.production     # 상용 환경 설정 (npm run build 시 자동 로드)
├── .env.example        # 템플릿 파일 (Git에 커밋됨)
└── .env.local          # 로컬 개발자 개인 설정 (Git에 커밋 안 됨)
```

### 2. 환경 변수 설정

#### .env.development (개발 환경)

```bash
# 환경 구분
VITE_ENV=DEV

# Firebase 설정
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# 게임 설정 (개발 환경 - 테스트 용이성)
VITE_MAX_PLAYERS=2              # 최소 게임 인원 (빠른 테스트)
VITE_MAX_TURNS=3                # 최대 턴 수 (빠른 게임 종료)
VITE_TURN_TIME_LIMIT=30         # 턴당 제한 시간 (초)

# 디버깅 설정
VITE_ENABLE_CONSOLE_LOG=true    # console.log 출력 활성화
```

#### .env.production (상용 환경)

```bash
# 환경 구분
VITE_ENV=PROD

# Firebase 설정 (동일)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# 게임 설정 (상용 환경 - 정식 룰)
VITE_MAX_PLAYERS=5              # 최소 게임 인원
VITE_MAX_TURNS=10               # 최대 턴 수
VITE_TURN_TIME_LIMIT=60         # 턴당 제한 시간 (초)

# 디버깅 설정
VITE_ENABLE_CONSOLE_LOG=false   # console.log 출력 비활성화 (성능 최적화)
```

### 3. 환경 변수 사용법

코드에서 환경 변수를 사용할 때는 `src/config/env.ts`를 통해 타입 안전하게 접근:

```typescript
import { ENV } from '@/config/env'

// 게임 설정 사용
const maxPlayers = ENV.game.maxPlayers        // 개발: 2, 상용: 5
const maxTurns = ENV.game.maxTurns            // 개발: 3, 상용: 10
const turnTimeLimit = ENV.game.turnTimeLimit  // 개발: 30, 상용: 60

// 환경 구분
if (ENV.isDevelopment) {
  console.log('개발 모드입니다')
}
```

### 4. web_pen_sdk 설정

`web_pen_sdk`는 `.nproj` 파일을 사용하며 Node.js 환경(`process.env`)을 참조합니다. Vite에서 이를 사용하기 위해 `vite.config.ts`에 다음과 같은 설정이 필요합니다:

```typescript
// vite.config.ts
export default defineConfig({
  // 1. .nproj 파일을 에셋으로 처리
  assetsInclude: ['**/*.nproj'],
  
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        // 2. 의존성 사전 번들링 시 .nproj 파일을 dataurl로 로드
        '.nproj': 'dataurl',
      },
    },
  },
  
  define: {
    // 3. 브라우저 환경에서 process.env 폴리필 (ReferenceError 방지)
    'process.env': {},
  },
})
```

| 설정 | 설명 |
|------|------|
| `assetsInclude` | `.nproj` 확장자를 가진 파일을 정적 에셋으로 처리하여 import 가능하게 함 |
| `esbuildOptions.loader` | 의존성 스캔 단계에서 `.nproj` 파일을 `dataurl`로 변환하여 로드 에러 방지 |
| `define['process.env']` | SDK 내부에서 참조하는 `process.env`를 빈 객체로 정의하여 런타임 에러 방지 |

---

## Backend (Functions) 환경 설정

### 1. 환경 파일 구조

```
functions/
├── .env            # 로컬 개발 환경 설정 (Git에 커밋 안 됨)
└── .env.example    # 템플릿 파일 (Git에 커밋됨)
```

### 2. 로컬 개발용 .env

```bash
# Gemini API 키
GEMINI_API_KEY=your-gemini-api-key

# Firebase 프로젝트 ID
PROJECT_ID=your-project-id
```

### 3. 상용 배포 시 설정

상용 환경에서는 `.env` 파일 대신 **Firebase Functions Config**를 사용합니다:

```bash
# Gemini API 키 설정
firebase functions:config:set gemini.api_key="your-gemini-api-key"

# 설정 확인
firebase functions:config:get

# 배포
firebase deploy --only functions
```

**중요**: 상용 배포 시 functions/src/index.ts에서 환경변수 대신 Functions Config를 사용하도록 코드 수정 필요

---

## Firebase 보안 규칙

### 1. Realtime Database 규칙

#### database.rules.dev.json (개발 환경 - Emulator 전용)

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

- **특징**: 인증된 사용자는 모든 데이터 읽기/쓰기 가능
- **용도**: 빠른 테스트 및 디버깅
- **보안**: 낮음 (로컬 Emulator에서만 사용)

#### database.rules.json (상용 환경 - 프로덕션)

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "lobby": {
      "waitingPlayers": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "gameRooms": {
      "$roomId": {
        ".read": "auth != null && (data.child('players').child(auth.uid).exists() || !data.exists())",
        ".write": "auth != null"
      }
    },
    "gameLogs": {
      ".read": "auth != null",
      "$logId": {
        ".write": false
      }
    }
  }
}
```

- **특징**: 경로별 세밀한 권한 제어
- **용도**: 프로덕션 배포 시 보안 강화
- **보안**: 높음

### 2. firebase.json 설정

```json
{
  "database": {
    "rules": "database.rules.json"  // 프로덕션 배포 시 사용
  },
  "emulators": {
    "database": {
      "port": 9000,
      "rules": "database.rules.dev.json"  // Emulator 실행 시 사용
    }
  }
}
```

---

## 개발/상용 차이점 비교표

### Frontend 설정

| 항목 | 개발 환경 | 상용 환경 | 설정 위치 |
|------|----------|----------|----------|
| **Firebase 연결** | Emulator (localhost) | 실제 Firebase 서비스 | firebase.ts |
| **최소 게임 인원** | 2명 | 5명 | VITE_MAX_PLAYERS |
| **최대 턴 수** | 3턴 | 10턴 | VITE_MAX_TURNS |
| **턴당 제한 시간** | 30초 | 60초 | VITE_TURN_TIME_LIMIT |
| **Console 로그** | 활성화 | 비활성화 | VITE_ENABLE_CONSOLE_LOG |
| **테스트 단어** | "집" | "고양이" (추후 랜덤) | matchmaking.ts |

### Backend 설정

| 항목 | 개발 환경 | 상용 환경 | 설정 위치 |
|------|----------|----------|----------|
| **Gemini API 키** | .env 파일 | Functions Config | .env / Firebase |
| **AI Temperature** | 0.9 (다양성) | 0.7 (안정성) | judge.flow.ts |
| **Function Timeout** | 60초 (디버깅) | 30초 | judge.flow.ts |
| **Function Memory** | 256MiB (비용 절감) | 512MiB | judge.flow.ts |
| **로깅 수준** | info (상세) | warn (필수만) | judge.flow.ts |

### Firebase 규칙

| 항목 | 개발 환경 | 상용 환경 | 파일 |
|------|----------|----------|------|
| **Database Rules** | 모든 인증 사용자 허용 | 경로별 세밀한 제어 | database.rules.dev.json / database.rules.json |
| **Storage Rules** | 인증 사용자 읽기/쓰기 | 동일 | storage.rules |

---

## 환경 전환 방법

### 1. 로컬 개발 환경 실행

```bash
# Frontend 개발 서버 (자동으로 .env.development 로드)
cd frontend
npm run dev

# Firebase Emulator (자동으로 database.rules.dev.json 로드)
firebase emulators:start
```

**자동 적용**:
- ✅ VITE_MAX_PLAYERS=2
- ✅ VITE_MAX_TURNS=3
- ✅ VITE_TURN_TIME_LIMIT=30
- ✅ Firebase Emulator 연결
- ✅ console.log 출력

### 2. 프로덕션 빌드 및 배포

```bash
# Frontend 빌드 (자동으로 .env.production 로드)
cd frontend
npm run build

# Firebase 배포
firebase deploy
```

**자동 적용**:
- ✅ VITE_MAX_PLAYERS=5
- ✅ VITE_MAX_TURNS=10
- ✅ VITE_TURN_TIME_LIMIT=60
- ✅ 실제 Firebase 서비스 연결
- ✅ console.log 제거

### 3. 환경별 테스트

#### 개발 환경 테스트

```bash
# 1. Emulator 실행
firebase emulators:start

# 2. 새 터미널에서 Frontend 개발 서버 실행
cd frontend && npm run dev

# 3. 브라우저에서 http://localhost:5173 접속
# 4. 2명만 모이면 게임 시작됨 (빠른 테스트)
```

#### 상용 환경 시뮬레이션

```bash
# 1. Frontend를 프로덕션 모드로 빌드
cd frontend
npm run build

# 2. 빌드된 파일을 로컬에서 미리보기
npm run preview

# 3. 브라우저에서 http://localhost:4173 접속
# 4. 5명 모여야 게임 시작됨 (상용 룰)
```

---

## 🔍 환경 설정 확인 방법

### Frontend 환경 확인

개발 서버 실행 시 콘솔에 출력되는 설정 확인:

```
🔧 Environment Config: {
  mode: 'DEV',
  maxPlayers: 2,
  maxTurns: 3,
  turnTimeLimit: 30,
  consoleLog: true
}
```

### Firebase Emulator 규칙 확인

Emulator UI에서 확인:

1. http://127.0.0.1:4000 접속
2. **Database** 탭 → **Rules** 클릭
3. 현재 로드된 규칙 파일 내용 확인

### Functions 환경 변수 확인

```bash
# 로컬 개발 환경
cat functions/.env

# 상용 환경 (배포된 설정)
firebase functions:config:get
```

---

## ⚠️ 주의사항

### 1. .env 파일 보안

- ❌ `.env.development`, `.env.production`에 **실제 API 키**를 커밋하지 마세요
- ✅ `.env.example` 파일만 Git에 커밋
- ✅ 실제 키는 `.env.local`에 저장 (`.gitignore`에 포함됨)

### 2. Firebase Emulator 사용 시

- 개발 중에는 **항상 Emulator를 실행**한 상태로 작업
- Emulator 없이 개발 서버만 실행하면 실제 Firebase에 연결됨 (위험!)

### 3. 상용 배포 전 체크리스트

- [ ] `.env.production`의 모든 Firebase 설정이 실제 프로젝트 정보인지 확인
- [ ] `firebase functions:config:set`으로 Gemini API 키 설정 완료
- [ ] `database.rules.json` 보안 규칙 테스트 완료
- [ ] `npm run build` 성공 확인
- [ ] `npm run preview`로 프로덕션 빌드 미리보기 확인

---

## 📞 문의

환경 설정 관련 문제 발생 시:

1. [SETUP.md](./SETUP.md) - 초기 설정 가이드 참고
2. [TODO.md](./TODO.md) - 개발 체크리스트 확인
3. GitHub Issues에 질문 등록

---

**마지막 업데이트**: 2025-11-12
