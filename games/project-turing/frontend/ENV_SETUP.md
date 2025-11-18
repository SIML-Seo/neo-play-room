# Environment Configuration Guide

Project Turing 프론트엔드는 **개발 환경**과 **상용 환경**에서 서로 다른 설정을 사용합니다.

---

## 📋 환경 변수 파일 종류

### 1. `.env.example`
- **용도**: 환경 변수 템플릿 (git에 커밋됨)
- **사용**: 실제 값의 예시 제공

### 2. `.env.development.example`
- **용도**: 개발 환경 전용 템플릿 (git에 커밋됨)
- **특징**: 빠른 테스트를 위한 설정 (2인 매칭, 짧은 턴, 짧은 타이머)

### 3. `.env.production.example`
- **용도**: 상용 환경 전용 템플릿 (git에 커밋됨)
- **특징**: 정식 게임 룰 (5인 매칭, 5턴, 정식 타이머)

### 4. `.env`, `.env.development`, `.env.production`
- **용도**: 실제 환경 변수 값 (git에 커밋 안 됨, `.gitignore`에 포함)
- **생성**: `.example` 파일을 복사하여 생성

---

## 🚀 초기 설정 방법

### Step 1: 환경 변수 파일 생성

**개발 환경 (.env.development)**
```bash
cp .env.development.example .env.development
```

**상용 환경 (.env.production)**
```bash
cp .env.production.example .env.production
```

### Step 2: Firebase 설정 값 입력

Firebase Console (https://console.firebase.google.com) 에서:
1. Project Settings > General 이동
2. "Your apps" 섹션에서 Web app 선택
3. SDK setup and configuration 확인

다음 값들을 `.env.development` 및 `.env.production` 파일에 입력:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_URL`

---

## 🎮 환경별 게임 설정 차이

### 개발 환경 (Development)
```env
VITE_ENV=DEV
VITE_MAX_PLAYERS=2                # 2명만 모이면 게임 시작
VITE_MAX_TURNS=3                  # 최대 3턴
VITE_ANSWER_TIME_LIMIT=30         # 답변 시간 30초
VITE_VOTE_TIME_LIMIT=20           # 투표 시간 20초
VITE_ENABLE_CONSOLE_LOG=true      # 콘솔 로그 활성화
```

**목적**: 빠른 개발 및 테스트
- 매칭 시간 단축 (2명만 필요)
- 게임 시간 단축 (3턴, 짧은 타이머)
- 디버깅 용이 (콘솔 로그 출력)

### 상용 환경 (Production)
```env
VITE_ENV=PROD
VITE_MAX_PLAYERS=5                # 5명이 모여야 게임 시작
VITE_MAX_TURNS=5                  # 최대 5턴
VITE_ANSWER_TIME_LIMIT=90         # 답변 시간 90초
VITE_VOTE_TIME_LIMIT=60           # 투표 시간 60초
VITE_ENABLE_CONSOLE_LOG=false     # 콘솔 로그 비활성화
```

**목적**: 정식 게임 룰 적용
- 정식 인원 (5인 + AI 1인)
- 충분한 사고 시간
- 성능 최적화 (로그 제거)

---

## 🔧 사용 방법

### 개발 모드 실행
```bash
npm run dev
```
- 자동으로 `.env.development` 파일 로드
- 개발 환경 설정 적용
- http://localhost:5173 에서 확인

### 프로덕션 빌드
```bash
npm run build
```
- 자동으로 `.env.production` 파일 로드
- 상용 환경 설정으로 빌드
- `dist/` 폴더에 결과물 생성

### 빌드 결과 미리보기
```bash
npm run preview
```
- 프로덕션 빌드 결과를 로컬에서 확인

---

## ⚠️ 보안 주의사항

### 절대 커밋하지 말 것
```
.env
.env.local
.env.development
.env.production
```

위 파일들은 `.gitignore`에 포함되어 있으며, **실제 API 키가 포함**되어 있습니다.

### 커밋해도 되는 파일
```
.env.example
.env.development.example
.env.production.example
```

이 파일들은 **예시 값만** 포함하므로 git에 커밋됩니다.

---

## 🐛 문제 해결

### Q: 환경 변수가 적용되지 않아요
**A**: Vite 개발 서버를 재시작하세요. 환경 변수 변경 시 HMR이 작동하지 않습니다.
```bash
# Ctrl+C로 서버 종료 후
npm run dev
```

### Q: 개발 환경인데 5명이 모여야 게임이 시작돼요
**A**: `.env.development` 파일을 확인하세요. 파일이 없다면:
```bash
cp .env.development.example .env.development
```

### Q: Firebase 연결이 안 돼요
**A**: `.env.development` 또는 `.env.production` 파일에 올바른 Firebase 설정이 입력되었는지 확인하세요.

---

## 📚 참고 문서

- [Vite 환경 변수 가이드](https://vite.dev/guide/env-and-mode.html)
- [Firebase Console](https://console.firebase.google.com)
- [Project Turing CLAUDE.md](../CLAUDE.md)
