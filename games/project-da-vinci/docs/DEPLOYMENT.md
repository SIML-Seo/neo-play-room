# Project Da Vinci - 배포 가이드

이 문서는 Project Da Vinci를 Firebase에 배포하는 전체 과정을 설명합니다.

---

## 📋 배포 전 체크리스트

### 1. 코드 품질 검증
```bash
# 프론트엔드
cd games/project-da-vinci/frontend
npm run lint              # ESLint 검사
npm run format            # Prettier 포맷팅
npm run test:run          # 테스트 실행 (CI 모드)

# Cloud Functions
cd ../functions
npm run build             # TypeScript 컴파일 확인
```

### 2. 환경 변수 확인
```bash
# functions/.env 파일이 설정되어 있는지 확인
GEMINI_API_KEY=your-actual-api-key
```

### 3. Git 상태 확인
```bash
# 모든 변경사항이 커밋되었는지 확인
git status

# 최신 main/develop 브랜치와 동기화
git pull origin main
```

---

## 🚀 배포 방법

### 방법 1: 전체 배포 (권장 - 처음 배포 시)

```bash
# 프로젝트 루트로 이동
cd games/project-da-vinci

# 전체 배포 (Hosting + Functions + Database Rules + Firestore Rules)
firebase deploy

# 배포 완료 후 URL 확인
# Hosting URL: https://project-da-vinci-cdbf8.web.app
# Functions URL: https://asia-northeast3-project-da-vinci-cdbf8.cloudfunctions.net
```

**배포되는 항목:**
- ✅ Frontend (React SPA) → Firebase Hosting
- ✅ Cloud Functions → asia-northeast3 리전
- ✅ Realtime Database 보안 규칙
- ✅ Firestore 보안 규칙
- ✅ Storage 보안 규칙

---

### 방법 2: 부분 배포 (빠른 배포)

#### Frontend만 배포 (UI 수정 시)
```bash
cd games/project-da-vinci

# 1. Frontend 빌드
cd frontend
npm run build             # dist/ 디렉토리에 빌드 결과 생성

# 2. Hosting 배포
cd ..
firebase deploy --only hosting

# 배포 완료 (약 1-2분 소요)
```

#### Cloud Functions만 배포 (Backend 로직 수정 시)
```bash
cd games/project-da-vinci

# 1. Functions 빌드
cd functions
npm run build             # TypeScript → JavaScript (lib/ 디렉토리)

# 2. Functions 배포
cd ..
firebase deploy --only functions

# 배포 완료 (약 3-5분 소요)
```

#### 특정 Function만 배포 (가장 빠름)
```bash
cd games/project-da-vinci

# 특정 Function만 배포
firebase deploy --only functions:judgeDrawing
firebase deploy --only functions:finalizeGame
firebase deploy --only functions:finalizeGameManual
firebase deploy --only functions:generateWords

# 여러 Function 동시 배포
firebase deploy --only functions:judgeDrawing,functions:finalizeGameManual
```

#### Database 규칙만 배포
```bash
cd games/project-da-vinci

# Realtime Database 규칙만 배포
firebase deploy --only database

# Firestore 규칙만 배포
firebase deploy --only firestore:rules

# Storage 규칙만 배포
firebase deploy --only storage
```

---

## 🔑 환경 변수 설정 (프로덕션)

### Cloud Functions 환경 변수 설정

**⚠️ 중요**: 프로덕션 환경에서는 `.env` 파일 대신 Firebase Functions Config를 사용합니다.

```bash
# Gemini API 키 설정
firebase functions:config:set gemini.api_key="AIzaSyC..."

# 설정 확인
firebase functions:config:get

# 출력 예시:
# {
#   "gemini": {
#     "api_key": "AIzaSyC..."
#   }
# }
```

**Functions 코드에서 사용:**
```typescript
// functions/src/ai/judge.flow.ts
import * as functions from 'firebase-functions'

// 로컬 개발 (.env)
const apiKey = process.env.GEMINI_API_KEY

// 프로덕션 (Functions Config)
const apiKeyProd = functions.config().gemini?.api_key

// 둘 다 지원
const finalApiKey = apiKeyProd || apiKey
```

### Frontend 환경 변수

Frontend의 환경 변수는 빌드 시점에 포함되므로 별도 설정 불필요합니다.

**중요**: Frontend `.env` 파일에는 **Public 데이터만** 포함해야 합니다.
```bash
# frontend/.env
VITE_FIREBASE_API_KEY=AIzaSyD...  # ✅ Public (괜찮음)
VITE_FIREBASE_PROJECT_ID=project-da-vinci-cdbf8  # ✅ Public
```

❌ **절대 Frontend에 추가하면 안 되는 것:**
```bash
VITE_GEMINI_API_KEY=...  # ❌ 절대 금지! (Backend에만)
```

---

## 📦 빌드 산출물 확인

### Frontend 빌드
```bash
cd games/project-da-vinci/frontend
npm run build

# 빌드 결과 확인
ls -lh dist/

# 산출물:
# dist/
# ├── index.html
# ├── assets/
# │   ├── index-[hash].js      # 번들된 JavaScript
# │   ├── index-[hash].css     # 번들된 CSS
# │   └── [images]             # 이미지 파일들
```

**빌드 최적화 확인:**
- Chunk 크기 확인 (main chunk < 500KB 권장)
- Gzip 압축 크기 확인
- Source map 생성 여부 (프로덕션: 비활성화 권장)

### Cloud Functions 빌드
```bash
cd games/project-da-vinci/functions
npm run build

# 빌드 결과 확인
ls -lh lib/

# 산출물:
# lib/
# ├── index.js
# ├── ai/
# │   ├── judge.flow.js
# │   ├── prompts.js
# │   └── wordGenerator.js
# └── game/
#     ├── finalize.js
#     └── matching.js
```

---

## ✅ 배포 후 검증

### 1. Frontend 확인
```bash
# 배포된 사이트 열기
firebase hosting:channel:open live

# 또는 브라우저에서 직접 접속
# https://project-da-vinci-cdbf8.web.app
```

**확인 사항:**
- [ ] 로그인 페이지 로드 확인
- [ ] Google 로그인 동작 확인
- [ ] Lobby 페이지 접근 확인
- [ ] 게임 생성 및 진행 확인
- [ ] 콘솔 에러 없는지 확인 (F12 → Console)

### 2. Cloud Functions 확인
```bash
# Functions 목록 확인
firebase functions:list

# Functions 로그 확인 (실시간)
firebase functions:log --only judgeDrawing
firebase functions:log --only finalizeGame

# 또는 Firebase Console에서 확인
# https://console.firebase.google.com/project/project-da-vinci-cdbf8/functions
```

**확인 사항:**
- [ ] judgeDrawing Function 호출 성공
- [ ] AI 추론 결과 정상 반환
- [ ] finalizeGame Trigger 동작 확인
- [ ] 에러 로그 없는지 확인

### 3. Database 확인
```bash
# Firebase Console에서 확인
# https://console.firebase.google.com/project/project-da-vinci-cdbf8/database

# 또는 CLI로 데이터 조회
firebase database:get /gameRooms
firebase database:get /lobby
```

**확인 사항:**
- [ ] gameRooms 생성 확인
- [ ] 보안 규칙 적용 확인 (권한 없는 접근 차단)
- [ ] Firestore gameLogs 저장 확인

### 4. 성능 확인
```bash
# Lighthouse 성능 측정
npx lighthouse https://project-da-vinci-cdbf8.web.app --view

# 목표 점수:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 90
```

---

## 🔄 롤백 (Rollback)

### Frontend 롤백
```bash
# Hosting 배포 히스토리 확인
firebase hosting:clone project-da-vinci-cdbf8:live project-da-vinci-cdbf8:previous

# 이전 버전으로 롤백
firebase hosting:channel:deploy previous
```

### Cloud Functions 롤백
```bash
# Firebase Console에서 수동 롤백:
# https://console.firebase.google.com/project/project-da-vinci-cdbf8/functions
# 1. 해당 Function 선택
# 2. "Rollback" 버튼 클릭
# 3. 이전 버전 선택

# 또는 이전 커밋으로 되돌린 후 재배포
git revert HEAD
git push
firebase deploy --only functions
```

---

## 🐛 트러블슈팅

### 문제 1: Frontend 빌드 실패
```bash
# 에러: "Cannot find module '@/components/...'"

# 해결 방법:
cd games/project-da-vinci/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 문제 2: Functions 배포 실패 (CORS 에러)
```bash
# 에러: "Deployment error: CORS policy"

# 해결 방법: functions/src/index.ts 확인
# onCall 함수에 cors: true 옵션 추가
export const myFunction = onCall({
  region: 'asia-northeast3',
  cors: true,  // 추가
}, async (request) => { ... })
```

### 문제 3: API 키 에러
```bash
# 에러: "API key not valid"

# 해결 방법:
# 1. .env 파일 확인
cat functions/.env

# 2. Firebase Functions Config 확인
firebase functions:config:get

# 3. 올바른 키로 재설정
firebase functions:config:set gemini.api_key="새로운-키"
firebase deploy --only functions
```

### 문제 4: Database 규칙 에러
```bash
# 에러: "Permission denied"

# 해결 방법:
# 1. database.rules.json 확인
cat database.rules.json

# 2. 규칙 재배포
firebase deploy --only database

# 3. Firebase Console에서 규칙 확인
# https://console.firebase.google.com/project/project-da-vinci-cdbf8/database/rules
```

### 문제 5: Functions 타임아웃
```bash
# 에러: "Function execution took too long"

# 해결 방법: functions/src/index.ts에서 타임아웃 설정 증가
export const judgeDrawing = onCall({
  region: 'asia-northeast3',
  timeoutSeconds: 60,  // 기본 60초 → 300초까지 가능
  memory: '512MiB',    // 메모리도 증가 가능
}, async (request) => { ... })
```

---

## 📊 배포 스크립트 (자동화)

### package.json에 배포 스크립트 추가

**frontend/package.json:**
```json
{
  "scripts": {
    "deploy": "npm run build && firebase deploy --only hosting",
    "deploy:preview": "npm run build && firebase hosting:channel:deploy preview"
  }
}
```

**functions/package.json:**
```json
{
  "scripts": {
    "deploy": "npm run build && firebase deploy --only functions",
    "deploy:judge": "npm run build && firebase deploy --only functions:judgeDrawing"
  }
}
```

### 전체 배포 스크립트 (루트)

**games/project-da-vinci/deploy.sh:**
```bash
#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Project Da Vinci 배포 시작...${NC}\n"

# 1. Frontend 빌드
echo -e "${YELLOW}📦 Frontend 빌드 중...${NC}"
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend 빌드 실패${NC}"
    exit 1
fi
cd ..

# 2. Functions 빌드
echo -e "${YELLOW}📦 Functions 빌드 중...${NC}"
cd functions
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Functions 빌드 실패${NC}"
    exit 1
fi
cd ..

# 3. 전체 배포
echo -e "${YELLOW}🚀 Firebase 배포 중...${NC}"
firebase deploy

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ 배포 완료!${NC}"
    echo -e "${GREEN}📱 Frontend: https://project-da-vinci-cdbf8.web.app${NC}"
    echo -e "${GREEN}⚡ Functions: https://asia-northeast3-project-da-vinci-cdbf8.cloudfunctions.net${NC}"
else
    echo -e "\n${RED}❌ 배포 실패${NC}"
    exit 1
fi
```

**사용 방법:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔐 보안 체크리스트

배포 전 반드시 확인:

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는가?
- [ ] Git 히스토리에 API 키가 노출되지 않았는가?
- [ ] Frontend에서 Gemini API를 직접 호출하지 않는가?
- [ ] Database 보안 규칙이 올바르게 설정되어 있는가?
- [ ] @neolab.net 도메인 제한이 적용되어 있는가?

---

## 📅 배포 체크리스트 (요약)

**배포 전:**
```
[ ] 코드 lint + test 통과
[ ] 환경 변수 설정 확인
[ ] Git 커밋 완료
[ ] 브랜치 동기화 (main/develop)
```

**배포 중:**
```
[ ] Frontend 빌드 성공
[ ] Functions 빌드 성공
[ ] Firebase 배포 완료
```

**배포 후:**
```
[ ] Frontend 로드 확인
[ ] 로그인 동작 확인
[ ] 게임 진행 테스트
[ ] Functions 로그 확인
[ ] 에러 없는지 확인
[ ] 성능 측정 (Lighthouse)
```

---

## 🎯 빠른 참조

| 작업 | 명령어 |
|-----|--------|
| 전체 배포 | `firebase deploy` |
| Frontend만 | `firebase deploy --only hosting` |
| Functions만 | `firebase deploy --only functions` |
| 특정 Function | `firebase deploy --only functions:judgeDrawing` |
| Database 규칙 | `firebase deploy --only database` |
| 배포 미리보기 | `firebase hosting:channel:deploy preview` |
| 로그 확인 | `firebase functions:log` |
| 환경 변수 설정 | `firebase functions:config:set key="value"` |

---

## 📞 문제 해결 도움말

**Firebase Console:**
- https://console.firebase.google.com/project/project-da-vinci-cdbf8

**Firebase CLI 문서:**
- https://firebase.google.com/docs/cli

**배포 관련 문의:**
- 프로젝트 관리자에게 문의
- GitHub Issues 등록

---

**이 문서는 Project Da Vinci 배포의 모든 과정을 다룹니다. 배포 전 반드시 체크리스트를 확인하세요.**
