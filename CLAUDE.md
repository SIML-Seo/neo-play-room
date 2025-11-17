# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 프로젝트 개요

**Neo Play Room**은 네오랩컨버전스 사내 소통 활성화를 위한 2개월 주기 게임 개발 프로젝트입니다.

각 사이클마다 새로운 게임을 개발하여 팀원들 간 소통과 협업을 촉진합니다.

---

## 🏗️ 레포지토리 구조

```
neo-play-room/
├── README.md                    # 레포지토리 전체 개요
├── CLAUDE.md                    # 이 파일 - 공통 개발 가이드
├── AGENTS.md                    # 팀 협업 가이드라인
├── games/                       # 게임 프로젝트들
│   ├── project-da-vinci/        # Cycle 1: AI 협동 Pictionary
│   │   ├── CLAUDE.md            # ⚠️ project-da-vinci 특화 가이드
│   │   ├── README.md            # 게임 개요 및 룰
│   │   ├── docs/                # 상세 설계 문서
│   │   ├── frontend/            # React 프론트엔드
│   │   ├── functions/           # Cloud Functions
│   │   └── firebase.json        # Firebase 설정
│   └── [future-game-2]/         # Cycle 2 게임 (예정)
└── shared/                      # 공통 모듈 (향후 확장)
```

### 멀티 게임 프로젝트 구조 원칙

1. **각 게임은 독립적인 디렉토리**: `games/[game-name]/`
2. **각 게임은 자체 CLAUDE.md 보유**: 게임별 특화 가이드
3. **공통 모듈은 shared/**: 여러 게임이 공유하는 코드
4. **루트 CLAUDE.md**: 레포지토리 전체 공통 원칙

---

## 📂 게임 프로젝트 목록

### 현재 활성 프로젝트

#### 1. **project-da-vinci** (Cycle 1)
- **게임**: 5인 협동 AI Pictionary
- **기술 스택**: React 19 + Firebase + Gemini AI
- **상태**: 🟢 개발 중
- **문서**: `games/project-da-vinci/CLAUDE.md`
- **특징**:
  - AI를 플레이어로 설계 (정답을 모르고 그림 추론)
  - 실시간 협동 게임 (Firebase Realtime Database)
  - 난이도별 점수 보정 시스템

#### 2. **project-turing** (Cycle 2)
- **게임**: 5인 협동 AI 찾기 (튜링 테스트)
- **기술 스택**: React 19 + Firebase + Gemini AI
- **상태**: 📋 설계 완료 (구현 대기)
- **문서**: `games/project-turing/CLAUDE.md`
- **특징**:
  - AI가 사람처럼 답변, 참가자들이 AI 찾기
  - 난이도별 AI 답변 전략 (Easy/Normal/Hard)
  - 질문 → 답변 → 토론 → 투표 시스템

### 향후 프로젝트

- **Cycle 3**: TBD (4개월 후)
- **Cycle 4**: TBD (6개월 후)

---

## 🚀 개발 시 주요 원칙

### 0. ⚠️ **최우선 규칙: 기존 구현 패턴 준수** ⚠️

**새로운 기능 구현 시 반드시 다음을 확인:**

1. **현재 작업 중인 게임 프로젝트의 CLAUDE.md를 먼저 확인**
   - 예: `project-da-vinci` 작업 시 → `games/project-da-vinci/CLAUDE.md` 필독
   - 각 게임은 고유한 아키텍처와 패턴을 가질 수 있음

2. **기존 유사 기능이 있는지 먼저 확인**
   - 같은 게임 내에서 유사 기능 검색
   - shared/ 디렉토리에 공통 모듈이 있는지 확인
   - 다른 게임 프로젝트의 구현 참조 (필요시)

3. **기존 패턴을 반드시 따를 것**
   - ❌ **절대 금지**: 무분별한 새로운 라이브러리 추가
   - ✅ **올바른 방법**: 기존 구현과 동일한 도구/버전 사용
   - ❌ **절대 금지**: 다른 아키텍처 패턴 도입
   - ✅ **올바른 방법**: 해당 게임의 CLAUDE.md 패턴 준수

4. **기존 코드 참조 체크리스트**
   ```
   [ ] 해당 게임의 CLAUDE.md를 읽었는가?
   [ ] 유사 기능이 이미 구현되어 있는지 확인했는가?
   [ ] 기존 구현의 라이브러리 버전을 확인했는가?
   [ ] 기존 구현의 보안 패턴을 확인했는가?
   [ ] 기존 구현의 에러 처리 방식을 확인했는가?
   ```

### 1. 보안 우선 원칙 (Security First)

**모든 게임 프로젝트에 공통 적용되는 보안 원칙:**

#### API 키 보호 ⚠️ **최우선 보안 원칙**

**절대 규칙: Frontend에서 외부 API 직접 호출 금지**

❌ **절대 금지 - 클라이언트 노출:**
```typescript
// ❌ frontend에서 외부 API 키 직접 사용
const apiKey = import.meta.env.VITE_API_KEY  // 🚨 보안 위험!
```

**문제점:**
- 브라우저 개발자 도구에서 API 키 확인 가능
- 빌드된 JS 번들에 키가 포함됨
- 악의적 사용자가 키를 추출하여 남용 가능

✅ **올바른 방법 - Backend/Cloud Functions 사용:**
```typescript
// ✅ Backend (예: Cloud Functions)
const apiKey = process.env.API_KEY  // ✅ 서버 사이드만 접근

// ✅ Frontend
import { httpsCallable } from 'firebase/functions'
const callFunction = httpsCallable(functions, 'functionName')
const result = await callFunction({ data })  // ✅ Backend를 통해 호출
```

**환경 변수 관리:**
```bash
# ✅ Backend .env (서버 사이드 - 절대 커밋하지 말 것)
API_KEY=secret-key-here

# ✅ .env.example (템플릿만 커밋)
API_KEY=your-api-key-here

# ✅ .gitignore 필수
.env
.env.local
```

**검증 체크리스트:**
```
[ ] API 키가 frontend/ 디렉토리에 없는가?
[ ] .env 파일이 .gitignore에 포함되어 있는가?
[ ] 외부 API 호출이 모두 Backend를 통하는가?
[ ] 빌드된 JS 번들에 API 키가 포함되지 않는가?
```

#### 기타 공통 보안 원칙

- **XSS 방지**: 사용자 입력은 항상 sanitize
- **도메인 제한**: @neolab.net 계정만 접근 허용
- **인증 확인**: 모든 API 요청은 인증된 사용자만
- **권한 관리**: 최소 권한 원칙 적용

### 2. 코드 품질 유지

- **타입 안전성**: TypeScript strict mode 사용
- **테스트 작성**: 새로운 기능 추가 시 테스트 필수
- **코드 리뷰**: PR을 통한 코드 리뷰 필수
- **문서화**: 복잡한 로직은 주석 추가

---

## 🎯 개발 워크플로우

### Git 브랜치 전략

```
main (프로덕션)
  ├── develop (개발 통합)
  │   ├── feature/project-da-vinci/canvas-sync
  │   ├── feature/project-da-vinci/ai-judge
  │   └── feature/future-game/new-feature
  └── hotfix/critical-bug
```

### 커밋 메시지 컨벤션 (Conventional Commits)

```bash
feat: 새로운 기능 추가
fix: 버그 수정
chore: 빌드/설정 변경
docs: 문서 수정
style: 코드 스타일 변경 (세미콜론 등)
refactor: 리팩토링
test: 테스트 추가/수정
perf: 성능 개선
```

**게임 프로젝트별 prefix 권장:**
```bash
git commit -m "feat(da-vinci): Canvas 컴포넌트 실시간 동기화 구현"
git commit -m "fix(da-vinci): AI 추론 JSON 파싱 에러 수정"
git commit -m "chore(shared): 공통 유틸리티 패키지 추가"
```

### PR 가이드라인

1. **PR 제목**: `[게임명] 타입: 제목` 형식
   - 예: `[da-vinci] feat: AI 난이도 시스템 추가`

2. **설명 포함 사항**:
   - 변경 사항 요약
   - 게임플레이 영향 (있는 경우)
   - 테스트 방법 명시
   - UI 변경 시 스크린샷 첨부

3. **크기 제한**: ~400줄 이하 권장

4. **리뷰어 지정**: 최소 1명 이상

### 코드 스타일

- **들여쓰기**: 2 spaces
- **세미콜론**: 프로젝트별 설정 따름 (일관성 유지)
- **따옴표**: 싱글 쿼트 (`'`) 권장
- **최대 줄 길이**: 100자
- **파일명**:
  - 컴포넌트: PascalCase (`GameRoom.tsx`)
  - 훅/유틸: camelCase (`useGameRoom.ts`)
  - 상수: UPPER_CASE (`GAME_CONFIG.ts`)

---

## 📖 문서 구조

### 레포지토리 레벨 문서 (루트)

- **README.md**: 레포지토리 전체 개요
- **CLAUDE.md**: 이 파일 - 공통 개발 가이드
- **AGENTS.md**: 팀 협업 가이드라인

### 게임 프로젝트 레벨 문서

각 게임 디렉토리 내:
- **CLAUDE.md**: 해당 게임 특화 개발 가이드 (필수)
- **README.md**: 게임 개요 및 룰
- **docs/**: 상세 설계 문서
  - ARCHITECTURE.md
  - FRONTEND.md
  - BACKEND.md
  - AI.md (AI 사용 시)
  - TESTING.md
  - TODO.md

---

## 🔍 특정 게임 작업 시 워크플로우

### 작업 시작 전 체크리스트

```
[ ] 1. 루트 CLAUDE.md (이 파일) 읽기 - 공통 원칙 이해
[ ] 2. 해당 게임의 CLAUDE.md 읽기 - 게임 특화 가이드
[ ] 3. 해당 게임의 README.md 읽기 - 게임 룰 이해
[ ] 4. 해당 게임의 docs/ 읽기 - 상세 설계 이해
[ ] 5. 기존 코드 패턴 확인 - 유사 기능 검색
```

### 예시: project-da-vinci 작업 시

1. **루트 CLAUDE.md** (이 파일) 읽기 ✅
2. **games/project-da-vinci/CLAUDE.md** 읽기 ← **필수!**
3. 작업 시작

---

## 🚨 공통 주의사항

### DO ✅

- **문서 우선**: 코드 작성 전 관련 문서 확인
- **타입 안전성**: `any` 사용 최소화
- **테스트 작성**: 새로운 기능은 테스트와 함께
- **보안 확인**: API 키 노출 방지
- **커밋 전 검증**: lint + test 실행
- **한국어 주석**: 복잡한 로직은 한국어 주석 추가

### DON'T ❌

- **API 키 커밋 금지**: `.env`, `.runtimeconfig.json` 절대 커밋 안 함
- **무분별한 라이브러리 추가 금지**: 필요성 검토 후 추가
- **거대한 PR 지양**: 400줄 이하로 분할
- **테스트 건너뛰기 금지**: `--no-verify` 사용 자제
- **프로덕션 직접 수정 금지**: 항상 PR을 통한 배포

---

## 🔗 참고 문서

### 레포지토리 공통
- **README.md**: 레포지토리 전체 개요
- **AGENTS.md**: AI 에이전트 협업 가이드

### 게임 프로젝트
- **games/project-da-vinci/**: `games/project-da-vinci/CLAUDE.md` 참조

### 외부 문서
- [Git Conventional Commits](https://www.conventionalcommits.org/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 🎓 신규 게임 프로젝트 추가 가이드

새로운 게임 프로젝트를 추가할 때:

1. **디렉토리 생성**: `games/[game-name]/`
2. **필수 파일 생성**:
   - `CLAUDE.md`: 해당 게임 특화 개발 가이드
   - `README.md`: 게임 개요 및 룰
   - `docs/`: 상세 설계 문서 디렉토리
3. **기술 스택 결정**: 프로젝트 특성에 맞게 선택
4. **보안 원칙 준수**: 루트 CLAUDE.md의 보안 원칙 따르기
5. **루트 CLAUDE.md 업데이트**: 게임 프로젝트 목록에 추가

---

**이 파일은 Claude Code가 Neo Play Room 레포지토리 전체에서 효율적으로 작업할 수 있도록 작성되었습니다. 각 게임 프로젝트 작업 시에는 해당 게임의 CLAUDE.md를 반드시 참조하세요.**
