# Project Da Vinci - CI/CD 및 Git Hooks 설정

> 코드 품질을 보장하는 자동화된 테스트 및 배포 파이프라인

## 🎯 핵심 원칙

**"테스트를 통과하지 못하면 커밋/푸시할 수 없다"**

```
개발 → 저장 → [Pre-commit Hook] → Commit → [Pre-push Hook] → Push → [CI/CD] → 배포
         ↓            ↓                        ↓                  ↓
      Lint      Unit Tests              All Tests          E2E Tests
```

---

## 📋 목차

1. [Git Hooks 설정 (Husky + lint-staged)](#git-hooks-설정)
2. [Pre-commit Hook (린트 + 포맷)](#pre-commit-hook)
3. [Pre-push Hook (테스트 실행)](#pre-push-hook)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [테스트 체크리스트 통합](#테스트-체크리스트-통합)

---

## 🪝 Git Hooks 설정

### 1. Husky 설치 (Git Hooks 관리 도구)

```bash
# 프론트엔드
cd frontend
npm install -D husky lint-staged

# Husky 초기화
npx husky init
```

### 2. lint-staged 설정

**파일:** `frontend/package.json`

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ],
    "*.{css,md,json}": [
      "prettier --write"
    ]
  }
}
```

**설명:**
- `*.{ts,tsx}`: TypeScript 파일
  1. ESLint로 코드 스타일 자동 수정
  2. Prettier로 포맷팅
  3. 변경된 파일과 관련된 테스트만 실행 (빠름!)
- `*.{css,md,json}`: 기타 파일은 Prettier만 실행

---

## ✅ Pre-commit Hook (코드 품질 검증)

### 설정 파일 생성

**파일:** `frontend/.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# 1. Lint-staged 실행 (변경된 파일만)
npx lint-staged

# 2. TypeScript 타입 체크
echo "🔎 Type checking..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ Type check failed. Please fix TypeScript errors."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
```

### 실행 흐름

```
1. git add .
2. git commit -m "feat: 캔버스 컴포넌트 추가"
   ↓
3. [Pre-commit Hook 실행]
   ├─ ESLint 검사 → 자동 수정
   ├─ Prettier 포맷팅
   ├─ 변경된 파일 관련 테스트 실행
   └─ TypeScript 타입 체크
   ↓
4. ✅ 통과 → 커밋 완료
   ❌ 실패 → 커밋 취소, 에러 메시지 출력
```

### 예시: 커밋 실패 케이스

```bash
$ git commit -m "feat: 캔버스 추가"

🔍 Running pre-commit checks...
✔ ESLint: All good
✔ Prettier: Formatted 2 files
⚠ Tests: 1 test failed

 FAIL  src/components/Canvas.test.tsx
  ● Canvas 렌더링 테스트
    Expected: "800"
    Received: "600"

🔎 Type checking...
src/components/Canvas.tsx:25:10 - error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.

❌ Type check failed. Please fix TypeScript errors.
```

**결과:** 커밋이 거부되고, 개발자는 테스트와 타입 에러를 수정해야 함.

---

## 🚀 Pre-push Hook (전체 테스트 실행)

### 설정 파일 생성

**파일:** `frontend/.husky/pre-push`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🧪 Running pre-push tests..."

# 1. 전체 단위 테스트 실행
echo "📦 Running unit tests..."
npm run test -- --run

if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed. Push aborted."
  exit 1
fi

# 2. 빌드 테스트
echo "🏗️ Testing build..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Push aborted."
  exit 1
fi

echo "✅ All pre-push checks passed! Pushing to remote..."
```

### 실행 흐름

```
1. git push origin feature/canvas
   ↓
2. [Pre-push Hook 실행]
   ├─ 전체 단위 테스트 실행 (약 10-30초)
   ├─ 프로덕션 빌드 테스트
   └─ 성공 시에만 push 진행
   ↓
3. ✅ 통과 → 원격 저장소에 푸시
   ❌ 실패 → 푸시 취소
```

### 예시: 푸시 실패 케이스

```bash
$ git push origin feature/canvas

🧪 Running pre-push tests...
📦 Running unit tests...

 FAIL  src/hooks/useCanvas.test.ts
  ● useCanvas › syncCanvas 함수 테스트
    Expected mock function to have been called with ["/liveDrawings/room-001/canvasState", "{...}"]
    But it was called with ["/liveDrawings/room-001", "{...}"]

Test Suites: 1 failed, 5 passed, 6 total
Tests:       1 failed, 23 passed, 24 total

❌ Unit tests failed. Push aborted.
error: failed to push some refs to 'origin'
```

**결과:** 푸시가 거부되고, 실패한 테스트를 수정해야 함.

---

## 🤖 GitHub Actions CI/CD

### 전체 워크플로우

```
Push → GitHub Actions CI → 테스트 → 빌드 → (main 브랜치 시) 자동 배포
```

### 워크플로우 파일

**파일:** `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'

jobs:
  # Job 1: 린트 및 타입 체크
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Run ESLint
        run: cd frontend && npm run lint

      - name: Run TypeScript type check
        run: cd frontend && npx tsc --noEmit

  # Job 2: 프론트엔드 단위 테스트
  test-frontend:
    name: Frontend Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Run tests with coverage
        run: cd frontend && npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./frontend/coverage/coverage-final.json
          flags: frontend

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat frontend/coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage ($COVERAGE%) is below 80% threshold"
            exit 1
          fi
          echo "✅ Coverage: $COVERAGE%"

  # Job 3: 백엔드 (Cloud Functions) 테스트
  test-backend:
    name: Backend (Functions) Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: functions/package-lock.json

      - name: Install dependencies
        run: cd functions && npm ci

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Run unit tests
        run: cd functions && npm test

      - name: Run integration tests with emulator
        run: |
          cd functions
          firebase emulators:exec --only database,functions 'npm run test:integration'

  # Job 4: E2E 테스트
  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend]  # 단위 테스트 통과 후 실행
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Install Playwright browsers
        run: cd frontend && npx playwright install --with-deps chromium

      - name: Start Firebase emulators
        run: firebase emulators:start &
        env:
          FIREBASE_EMULATOR_HUB: true

      - name: Wait for emulators
        run: npx wait-on http://127.0.0.1:4000

      - name: Run E2E tests
        run: cd frontend && npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30

  # Job 5: 빌드 테스트
  build:
    name: Build Test
    runs-on: ubuntu-latest
    needs: [lint, test-frontend, test-backend]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Build frontend
        run: cd frontend && npm run build

      - name: Check build size
        run: |
          SIZE=$(du -sb frontend/dist | cut -f1)
          MAX_SIZE=5242880  # 5MB
          if [ $SIZE -gt $MAX_SIZE ]; then
            echo "❌ Build size ($SIZE bytes) exceeds 5MB"
            exit 1
          fi
          echo "✅ Build size: $(($SIZE / 1024))KB"

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist

  # Job 6: 자동 배포 (main 브랜치만)
  deploy:
    name: Deploy to Firebase
    runs-on: ubuntu-latest
    needs: [build, test-e2e]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://project-da-vinci.web.app
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: project-da-vinci-prod

      - name: Deploy Cloud Functions
        run: |
          npm install -g firebase-tools
          cd functions && npm ci
          firebase deploy --only functions --token ${{ secrets.FIREBASE_TOKEN }}
```

### 워크플로우 설명

#### 1. **Lint & Type Check** (가장 빠름, ~30초)
- ESLint 검사
- TypeScript 타입 체크
- **실패 시**: 다른 Job 실행 안 함 (빠른 피드백)

#### 2. **Frontend Unit Tests** (~1-2분)
- Vitest 단위 테스트 실행
- 커버리지 측정 (80% 미만 시 실패)
- Codecov에 업로드

#### 3. **Backend Tests** (~1-2분)
- Cloud Functions 단위 테스트
- Firebase Emulator를 이용한 통합 테스트

#### 4. **E2E Tests** (~3-5분)
- Playwright로 전체 게임 플로우 테스트
- 단위 테스트 통과 후에만 실행 (비용 절감)

#### 5. **Build Test** (~1분)
- 프로덕션 빌드 테스트
- 빌드 크기 체크 (5MB 초과 시 경고)

#### 6. **Deploy** (main 브랜치만)
- Firebase Hosting에 프론트엔드 배포
- Cloud Functions 배포

---

## 🚨 PR 보호 규칙 설정

### GitHub Repository Settings

**Settings → Branches → Branch protection rules → main**

```yaml
Require status checks to pass before merging: ✅
  - lint
  - test-frontend
  - test-backend
  - test-e2e
  - build

Require branches to be up to date before merging: ✅
Require linear history: ✅
Require signed commits: ✅ (선택 사항)
```

**효과:**
- main 브랜치에 직접 푸시 불가
- PR 생성 시 모든 테스트 통과 필수
- 테스트 실패 시 Merge 버튼 비활성화

---

## 📊 테스트 체크리스트 통합 (TODO.md)

### Week 1: 테스트 환경 설정

**TODO.md에 추가:**

```markdown
#### 1.6 Git Hooks 및 CI/CD 설정
- [ ] Husky 설치 및 초기화
  ```bash
  cd frontend
  npm install -D husky lint-staged
  npx husky init
  ```
- [ ] Pre-commit hook 설정
  - [ ] ESLint + Prettier
  - [ ] TypeScript 타입 체크
  - [ ] 변경 파일 관련 테스트
- [ ] Pre-push hook 설정
  - [ ] 전체 단위 테스트
  - [ ] 빌드 테스트
- [ ] GitHub Actions 워크플로우 생성
  - [ ] `.github/workflows/ci.yml` 작성
  - [ ] Secrets 설정 (FIREBASE_TOKEN 등)
- [ ] PR 보호 규칙 설정
- [ ] 첫 커밋 테스트 (의도적으로 실패시켜보기)
```

### Week 2-7: 개발 중 테스트 작성

**각 주차 TODO에 추가:**

```markdown
#### X.X 테스트 케이스 작성
- [ ] 새로운 기능에 대한 단위 테스트 작성
- [ ] 커버리지 80% 이상 유지
- [ ] CI/CD 통과 확인
```

### Week 8: 배포 전 최종 체크

```markdown
#### 8.X 배포 전 최종 테스트
- [ ] 전체 테스트 suite 로컬 실행
  ```bash
  npm run test:all
  ```
- [ ] E2E 테스트 전체 실행
  ```bash
  npm run test:e2e
  ```
- [ ] 커버리지 리포트 확인
- [ ] CI/CD 파이프라인 전체 통과 확인
- [ ] 프로덕션 빌드 크기 체크
```

---

## 🎯 개발 워크플로우 예시

### 시나리오: 캔버스 컴포넌트 개발

```bash
# 1. 기능 브랜치 생성
git checkout -b feature/canvas-component

# 2. TDD로 테스트 먼저 작성
# frontend/src/components/Canvas.test.tsx 작성

# 3. 구현
# frontend/src/components/Canvas.tsx 작성

# 4. 저장 및 커밋 시도
git add .
git commit -m "feat: Canvas 컴포넌트 추가"

# → [Pre-commit Hook 실행]
#   ✅ ESLint: 자동 수정
#   ✅ Prettier: 포맷팅
#   ✅ Tests: Canvas.test.tsx 통과
#   ✅ TypeScript: 타입 체크 통과
# → 커밋 성공 ✅

# 5. 푸시 시도
git push origin feature/canvas-component

# → [Pre-push Hook 실행]
#   ✅ 전체 단위 테스트 (24/24 passed)
#   ✅ 빌드 테스트
# → 푸시 성공 ✅

# 6. PR 생성
# → [GitHub Actions CI 실행]
#   ✅ Lint & Type Check (30s)
#   ✅ Frontend Tests (1m 20s)
#   ✅ Backend Tests (1m 10s)
#   ✅ E2E Tests (3m 40s)
#   ✅ Build (1m 5s)
# → 모든 체크 통과 ✅

# 7. Merge to main
# → [자동 배포]
#   ✅ Firebase Hosting 배포
#   ✅ Cloud Functions 배포
# → 배포 완료 🚀
```

---

## 🚨 실패 케이스 대응

### Case 1: Pre-commit 실패 (린트 에러)

```bash
$ git commit -m "feat: 캔버스 추가"

❌ ESLint error:
  src/components/Canvas.tsx:15:7
  'fabricCanvas' is assigned a value but never used  @typescript-eslint/no-unused-vars

# 해결 방법
1. 에러 수정
2. git add .
3. git commit 재시도
```

### Case 2: Pre-push 실패 (테스트 실패)

```bash
$ git push origin feature/canvas

❌ Unit tests failed: 1 test failed

# 해결 방법
1. npm test 실행하여 로컬에서 재현
2. 테스트 수정 (또는 구현 수정)
3. git commit --amend (또는 새 커밋)
4. git push 재시도
```

### Case 3: CI 실패 (커버리지 부족)

```bash
GitHub Actions 실패:
❌ Coverage (78%) is below 80% threshold

# 해결 방법
1. 누락된 테스트 케이스 추가
2. git commit -m "test: 커버리지 80% 이상으로 개선"
3. git push
```

---

## 📈 성공 지표

| 지표 | 목표 | 측정 방법 |
|-----|------|----------|
| **테스트 커버리지** | 80% 이상 | Codecov |
| **CI 통과율** | 95% 이상 | GitHub Actions |
| **평균 CI 시간** | 10분 이내 | GitHub Actions Dashboard |
| **배포 실패율** | 5% 이하 | Firebase Console |
| **핫픽스 빈도** | 월 2회 이하 | Git 커밋 히스토리 |

---

## 🔧 로컬 개발 팁

### 빠른 테스트 (변경 파일만)

```bash
# 변경된 파일 관련 테스트만 실행
npm test -- --related

# Watch 모드 (파일 변경 시 자동 실행)
npm test -- --watch
```

### Pre-commit Hook 일시적으로 건너뛰기 (비상시만!)

```bash
# ⚠️ 비추천! 정말 급할 때만 사용
git commit -m "feat: WIP" --no-verify

# 대신 이렇게:
git commit -m "WIP: 작업 중" --no-verify
git push --no-verify

# 나중에 꼭 수정하고 force push
git commit --amend -m "feat: 완성된 기능"
git push --force
```

---

## 📚 참고 자료

- [Husky 공식 문서](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/okonet/lint-staged)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Firebase CI/CD](https://firebase.google.com/docs/hosting/github-integration)

---

**"테스트는 개발 속도를 늦추는 것이 아니라, 빠르고 안전한 개발을 가능하게 합니다!" ⚡**
