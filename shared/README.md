# @neo-play-room/shared

Neo Play Room 프로젝트의 공통 모듈 모음입니다.

## 📦 포함된 모듈

### UI 컴포넌트 (`ui-components/`)

- **Button**: 공통 버튼 컴포넌트
  - variants: `primary`, `secondary`, `danger`, `success`
  - sizes: `sm`, `md`, `lg`
- **Loader**: 로딩 스피너 컴포넌트
  - 크기 및 텍스트 커스터마이징 지원
- **Timer**: 카운트다운 타이머 표시 컴포넌트
  - 경고/위험 시간대 자동 색상 변경

### 유틸리티 (`utils/`)

- **sanitizer**: XSS 방지 및 텍스트 처리
  - `sanitizeMessage()`: DOMPurify를 사용한 안전한 메시지 처리
  - `truncateText()`: 텍스트 자르기
- **shuffle**: Fisher-Yates 알고리즘 기반 배열 셔플
  - 균일한 랜덤 분포 보장 (편향 없음)

### 인증 (`hooks/`, `store/`)

- **hooks/useAuth**: Firebase Auth 훅 (Factory Pattern)
  - `createUseAuth(auth, useAuthStore)`: Auth 인스턴스를 주입받는 factory 함수
  - @neolab.net 도메인 제한
  - Google OAuth 로그인/로그아웃
- **store/authStore**: Zustand 기반 Auth 상태 관리
  - `createAuthStore()`: 프로젝트별 독립적인 auth 스토어 생성

## 🚀 사용 방법

### 1. 프로젝트 설정

각 게임 프로젝트에서 `tsconfig.app.json`과 `vite.config.ts`에 경로 설정:

**tsconfig.app.json**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../../../shared/*"]
    }
  }
}
```

**vite.config.ts**
```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../../shared'),
    },
  },
})
```

### 2. UI 컴포넌트 사용

```typescript
import Button from '@shared/ui-components/Button'
import Loader from '@shared/ui-components/Loader'
import Timer from '@shared/ui-components/Timer'

function MyComponent() {
  return (
    <>
      <Button variant="primary" size="lg" onClick={handleClick}>
        클릭
      </Button>
      <Loader size="md" text="로딩 중..." />
      <Timer timeLeft={60} />
    </>
  )
}
```

### 3. 유틸리티 사용

```typescript
import { sanitizeMessage, truncateText } from '@shared/utils/sanitizer'
import { shuffle } from '@shared/utils/shuffle'

const safe = sanitizeMessage(userInput)
const short = truncateText(longText, 100)
const shuffled = shuffle([1, 2, 3, 4, 5])
```

### 4. 인증 사용 (Factory Pattern)

**Step 1**: 각 프로젝트의 `store/authStore.ts` 생성
```typescript
import { createAuthStore } from '@shared/store/authStore'

export const useAuthStore = createAuthStore()
```

**Step 2**: 각 프로젝트의 `hooks/useAuth.ts` 생성
```typescript
import { auth } from '@/firebase'
import { useAuthStore } from '@/store/authStore'
import { createUseAuth } from '@shared/hooks/useAuth'

export const useAuth = createUseAuth(auth, useAuthStore)
```

**Step 3**: 컴포넌트에서 사용
```typescript
import { useAuth } from '@/hooks/useAuth'

function LoginPage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()

  if (loading) return <Loader />
  if (user) return <button onClick={signOut}>로그아웃</button>
  return <button onClick={signInWithGoogle}>Google 로그인</button>
}
```

## 🏗️ 아키텍처 원칙

### Factory Pattern (Auth)

각 게임 프로젝트가 **서로 다른 Firebase 프로젝트**를 사용할 수 있도록 Factory Pattern을 적용했습니다:

- ✅ **독립성**: 각 프로젝트가 자체 Firebase 설정 사용 가능
- ✅ **유연성**: 프로젝트별 환경변수 관리
- ✅ **코드 재사용**: Auth 로직은 한 곳에서 관리
- ✅ **타입 안전성**: TypeScript 타입 공유

### 의존성 관리

`shared/package.json`은 `peerDependencies`만 선언합니다:

```json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "dompurify": "^3.0.0",
    "zustand": "^5.0.0",
    "firebase": "^11.0.0"
  }
}
```

실제 패키지 설치는 각 게임 프로젝트의 `package.json`에서 수행됩니다.

## 📝 새로운 모듈 추가 시

1. `shared/` 디렉토리에 모듈 생성
2. `shared/package.json`의 `exports` 필드에 경로 추가
3. `shared/README.md` 업데이트 (이 문서)
4. 루트 `CLAUDE.md`에 사용 가이드라인 추가

## 🔗 관련 문서

- [루트 README.md](../README.md) - 프로젝트 전체 개요
- [루트 CLAUDE.md](../CLAUDE.md) - 공통 개발 가이드라인
- [project-da-vinci](../games/project-da-vinci/) - 게임 프로젝트 예시
- [project-turing](../games/project-turing/) - 게임 프로젝트 예시
