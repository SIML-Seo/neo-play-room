# @neo-play-room/shared

Neo Play Room 프로젝트의 공통 모듈 모음입니다.

## 📦 포함된 모듈

### UI 컴포넌트 (`ui-components/`)

- **Button**: 공통 버튼 컴포넌트 (variant, size 지원)
- **Loader**: 로딩 스피너 컴포넌트
- **Timer**: 카운트다운 타이머 표시 컴포넌트

### 유틸리티 (`utils/`)

- **sanitizer**: XSS 방지를 위한 메시지 sanitize 및 텍스트 처리
- **shuffle**: 배열 셔플 유틸리티 (Fisher-Yates algorithm)

## 사용 방법

각 게임 프로젝트의 `tsconfig.json`에서 paths를 설정하여 사용합니다:

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../../../shared/*"]
    }
  }
}
```

import 예시:

```typescript
import Button from '@shared/ui-components/Button'
import { sanitizeMessage } from '@shared/utils/sanitizer'
```
