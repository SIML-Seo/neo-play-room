# Project Da Vinci - 초기 설정 가이드

> 처음 프로젝트를 시작하는 개발자를 위한 단계별 설정 가이드

---

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [Firebase 프로젝트 설정](#firebase-프로젝트-설정)
3. [Gemini API 키 발급](#gemini-api-키-발급)
4. [로컬 환경 설정](#로컬-환경-설정)
5. [Firebase Emulator 실행](#firebase-emulator-실행)
6. [개발 서버 실행](#개발-서버-실행)
7. [문제 해결](#문제-해결)

---

## 1. 사전 요구사항

시작하기 전에 다음 도구들이 설치되어 있어야 합니다:

### 필수 도구

| 도구 | 최소 버전 | 설치 확인 명령어 | 설치 방법 |
|-----|---------|----------------|----------|
| **Node.js** | 20.x | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | 10.x | `npm --version` | Node.js와 함께 설치됨 |
| **Git** | 2.x | `git --version` | [git-scm.com](https://git-scm.com/) |
| **Firebase CLI** | 13.x | `firebase --version` | `npm install -g firebase-tools` |

### 설치 확인

```bash
# 모든 도구가 설치되었는지 확인
node --version    # v20.x.x 이상
npm --version     # 10.x.x 이상
git --version     # 2.x.x 이상
firebase --version # 13.x.x 이상
```

---

## 2. Firebase 프로젝트 설정

### 2.1 Firebase 프로젝트 생성

1. **Firebase Console 접속**
   - https://console.firebase.google.com/ 접속
   - Google 계정으로 로그인

2. **새 프로젝트 생성**
   - "프로젝트 추가" 클릭
   - **프로젝트 이름**: `project-da-vinci` (또는 원하는 이름)
   - Google Analytics 사용 여부: 선택 (권장: 비활성화)
   - "프로젝트 만들기" 클릭

3. **프로젝트 ID 확인**
   - 프로젝트 생성 후 **프로젝트 ID** 메모 (예: `project-da-vinci-abc123`)
   - 이후 설정에 사용됨

### 2.2 Firebase 서비스 활성화

#### Authentication 설정
1. 좌측 메뉴 > **Authentication** 클릭
2. "시작하기" 클릭
3. **Sign-in method** 탭 선택
4. "Google" 클릭 → 사용 설정 → 저장
5. **(중요) 승인된 도메인 설정** (선택사항):
   - 공개 지원 이메일 설정
   - 로컬 테스트: `localhost` 자동 추가됨

#### Realtime Database 설정
1. 좌측 메뉴 > **Realtime Database** 클릭
2. "데이터베이스 만들기" 클릭
3. **위치 선택**: `asia-southeast1` (싱가포르 - 서울에서 가장 가까움)
4. **보안 규칙**: "테스트 모드에서 시작" 선택 (나중에 변경)
5. "사용 설정" 클릭
6. **Database URL 메모** (예: `https://project-da-vinci-abc123-default-rtdb.asia-southeast1.firebasedatabase.app`)

#### Cloud Storage 설정
1. 좌측 메뉴 > **Storage** 클릭
2. "시작하기" 클릭
3. 보안 규칙: "테스트 모드에서 시작" 선택
4. 위치: `asia-northeast3` (서울)
5. "완료" 클릭

#### Cloud Functions 활성화
1. 좌측 메뉴 > **Functions** 클릭
2. "시작하기" 클릭 (처음 배포 시 자동 활성화)

**중요: Blaze 플랜 업그레이드 필요**
- Functions를 사용하려면 **Blaze 요금제**(종량제)로 업그레이드 필요
- 좌측 하단 톱니바퀴 > "사용량 및 결제" > "플랜 수정" > "Blaze 플랜 선택"
- 무료 할당량 초과 시에만 과금 (월 $20 이하 예상)

### 2.3 Firebase 웹 앱 등록

1. 프로젝트 홈 > "웹 앱에 Firebase 추가" 클릭 (</> 아이콘)
2. **앱 닉네임**: `project-da-vinci-web`
3. Firebase Hosting 설정: 체크 (나중에 사용)
4. "앱 등록" 클릭
5. **Firebase 설정 객체 복사** (나중에 `.env` 파일에 사용):
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "project-da-vinci-abc123.firebaseapp.com",
     databaseURL: "https://project-da-vinci-abc123-default-rtdb.asia-southeast1.firebasedatabase.app",
     projectId: "project-da-vinci-abc123",
     storageBucket: "project-da-vinci-abc123.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```
6. "콘솔로 이동" 클릭

---

## 3. Gemini API 키 발급

### 3.1 Google AI Studio 접속

1. https://ai.google.dev/ 접속
2. "Get API key in Google AI Studio" 클릭
3. Google 계정으로 로그인

### 3.2 API 키 생성

1. "Get API key" 버튼 클릭
2. "Create API key in new project" 선택 (또는 기존 프로젝트 선택)
3. **API 키 복사** (나중에 `.env` 파일에 사용)
   - 형식: `AIzaSyC...` (39자)
   - **중요**: 이 키는 다시 볼 수 없으므로 안전하게 보관!

### 3.3 API 키 테스트 (선택사항)

```bash
# curl로 API 키 테스트
curl \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY"
```

---

## 4. 로컬 환경 설정

### 4.1 레포지토리 클론

```bash
# Git 클론 (이미 클론했다면 생략)
git clone <repository-url>
cd neo-play-room/games/project-da-vinci
```

### 4.2 의존성 설치

```bash
# 프론트엔드 패키지 설치
cd frontend
npm install

# Cloud Functions 패키지 설치
cd ../functions
npm install

# 루트로 돌아오기
cd ..
```

### 4.3 환경 변수 설정

#### Frontend 환경 변수

```bash
# frontend 디렉토리에서
cd frontend

# .env.example 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일 편집 (VSCode, vim, nano 등)
code .env  # 또는 vim .env
```

**frontend/.env 파일 내용**:
```bash
# Firebase 설정 (위 2.3에서 복사한 값 사용)
VITE_FIREBASE_API_KEY=AIzaSyC...실제값
VITE_FIREBASE_AUTH_DOMAIN=project-da-vinci-abc123.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://project-da-vinci-abc123-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=project-da-vinci-abc123
VITE_FIREBASE_STORAGE_BUCKET=project-da-vinci-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# 개발 환경
VITE_ENV=DEV
```

#### Functions 환경 변수

```bash
# functions 디렉토리에서
cd ../functions

# .env.example 복사
cp .env.example .env

# .env 파일 편집
code .env
```

**functions/.env 파일 내용**:
```bash
# Gemini API 키 (위 3.2에서 복사한 값)
GEMINI_API_KEY=AIzaSyC...실제값

# Firebase 프로젝트 ID
PROJECT_ID=project-da-vinci-abc123
```

### 4.4 Firebase 프로젝트 연결

```bash
# 레포지토리 루트에서
cd ../../  # neo-play-room/ 루트

# Firebase 로그인
firebase login

# 프로젝트 선택 (이미 .firebaserc가 있다면 생략)
firebase use --add
# 프로젝트 목록에서 위에서 생성한 프로젝트 선택
# alias: default
```

**확인**:
```bash
# .firebaserc 파일이 생성되었는지 확인
cat .firebaserc
# 내용:
# {
#   "projects": {
#     "default": "project-da-vinci-abc123"
#   }
# }
```

---

## 5. Firebase Emulator 실행

로컬 개발 시 Firebase Emulator를 사용하면 실제 Firebase 서비스를 사용하지 않고 테스트할 수 있습니다.

### 5.1 Emulator 설정 확인

```bash
# 레포지토리 루트에서
cat firebase.json

# 다음 섹션이 있는지 확인:
# "emulators": {
#   "auth": { "port": 9099 },
#   "database": { "port": 9000 },
#   "functions": { "port": 5001 },
#   "storage": { "port": 9199 },
#   "ui": { "enabled": true, "port": 4000 }
# }
```

### 5.2 Emulator 실행

```bash
# 레포지토리 루트에서
firebase emulators:start

# 또는 특정 서비스만 실행
firebase emulators:start --only auth,database,functions
```

**실행 확인**:
- **Emulator UI**: http://localhost:4000
- **Authentication**: http://localhost:9099
- **Realtime Database**: http://localhost:9000
- **Functions**: http://localhost:5001
- **Storage**: http://localhost:9199

---

## 6. 개발 서버 실행

Emulator와 별개로 프론트엔드 개발 서버를 실행합니다.

### 6.1 프론트엔드 개발 서버

**새 터미널 창에서**:
```bash
cd games/project-da-vinci/frontend
npm run dev

# 실행 확인
# → http://localhost:5173
```

**브라우저 접속**:
- http://localhost:5173 접속
- 로그인 페이지가 표시되어야 함
- "Google로 로그인" 클릭 → Firebase Emulator 자동 로그인

### 6.2 개발 환경 구성 요약

**동시에 실행되어야 하는 프로세스**:

| 터미널 | 명령어 | 포트 | 용도 |
|-------|--------|------|------|
| 터미널 1 | `firebase emulators:start` | 4000, 9000, 9099, 5001, 9199 | Firebase Emulator |
| 터미널 2 | `cd frontend && npm run dev` | 5173 | React 개발 서버 |

---

## 7. 문제 해결

### 문제 1: Firebase Emulator 포트 충돌

**증상**:
```
Error: Port 9000 is already in use.
```

**해결**:
```bash
# 포트 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :9000

# 프로세스 종료 (Windows, 관리자 권한 필요)
taskkill /PID <PID> /F

# 또는 다른 포트로 실행
firebase emulators:start --only functions,database
```

### 문제 2: npm install 실패

**증상**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**해결**:
```bash
# npm 캐시 삭제
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 문제 3: Vite 개발 서버 연결 실패

**증상**:
- 브라우저에서 http://localhost:5173 접속 안 됨

**해결**:
```bash
# .env 파일이 제대로 설정되었는지 확인
cat frontend/.env

# Vite 캐시 삭제 후 재시작
rm -rf frontend/.vite
cd frontend && npm run dev
```

### 문제 4: Gemini API 할당량 초과

**증상**:
```
Error: 429 Resource has been exhausted (e.g. quota)
```

**해결**:
- Google Cloud Console > API > Gemini API > Quotas 확인
- 무료 할당량: 15 requests/minute
- 필요 시 유료 플랜 업그레이드

### 문제 5: Firebase Auth 도메인 오류

**증상**:
```
auth/unauthorized-domain: This domain is not authorized
```

**해결**:
1. Firebase Console > Authentication > Settings > Authorized domains
2. `localhost` 추가 (자동 추가되어야 함)
3. 배포 후 실제 도메인도 추가 필요

---

## ✅ 설정 완료 체크리스트

모든 설정이 완료되었는지 확인하세요:

- [ ] Node.js 20.x 이상 설치
- [ ] Firebase CLI 설치 및 로그인
- [ ] Firebase 프로젝트 생성 (Authentication, Realtime Database, Storage 활성화)
- [ ] Blaze 플랜 업그레이드
- [ ] Gemini API 키 발급
- [ ] `frontend/.env` 파일 설정
- [ ] `functions/.env` 파일 설정
- [ ] `firebase use --add`로 프로젝트 연결
- [ ] `firebase emulators:start` 정상 실행
- [ ] `npm run dev` 프론트엔드 서버 정상 실행
- [ ] http://localhost:5173 접속하여 로그인 페이지 확인

---

## 🚀 다음 단계

설정이 완료되었다면:

1. **[FRONTEND.md](./FRONTEND.md)** - 프론트엔드 개발 가이드
2. **[BACKEND.md](./BACKEND.md)** - Cloud Functions 개발 가이드
3. **[TODO.md](./TODO.md)** - 남은 작업 확인

---

## 📞 도움이 필요하신가요?

- **Firebase 문서**: https://firebase.google.com/docs
- **Gemini API 문서**: https://ai.google.dev/gemini-api/docs
- **프로젝트 이슈**: GitHub Issues에 질문 등록
- **사내 채널**: #네오톡톡
