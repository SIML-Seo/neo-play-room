# Project Turing - Development TODO

8주 개발 일정 및 체크리스트입니다.

---

## 📅 8주 개발 일정

### Week 1-2: 기반 구축 (Foundation)

#### Week 1: 프로젝트 세팅 & Firebase 설정
- [ ] 프로젝트 초기화
  - [ ] Frontend 프로젝트 생성 (Vite + React 19)
  - [ ] Functions 프로젝트 생성 (Node 20)
  - [ ] Firebase 프로젝트 생성
  - [ ] .gitignore, ESLint, Prettier 설정

- [ ] Firebase 설정
  - [ ] Authentication (Google SSO)
  - [ ] Realtime Database 초기 구조 생성
  - [ ] Firestore 초기 컬렉션 생성
  - [ ] Security Rules 작성
  - [ ] Firebase Emulator 설정

- [ ] 기본 컴포넌트
  - [ ] Home 페이지 (로그인)
  - [ ] useAuth 훅
  - [ ] 공통 컴포넌트 (Button, Loader, Modal)

#### Week 2: 매칭 시스템
- [ ] Lobby 페이지
  - [ ] 대기실 UI
  - [ ] 실시간 플레이어 목록
  - [ ] useMatchmaking 훅

- [ ] Cloud Function: matchPlayers
  - [ ] 5명 매칭 로직
  - [ ] AI 플레이어 투입
  - [ ] 익명 ID 할당
  - [ ] GameRoom 생성

- [ ] 테스트
  - [ ] Lobby 단위 테스트
  - [ ] matchPlayers 통합 테스트

---

### Week 3-4: 게임 룸 기본 기능 (Game Room Core)

#### Week 3: 대기실 & 게임 시작
- [ ] GameRoom 페이지 (waiting 상태)
  - [ ] 난이도 선택 UI
  - [ ] 플레이어 목록 표시
  - [ ] 채팅 기능
  - [ ] "준비 완료" 시스템
  - [ ] "게임 시작" 버튼

- [ ] 게임 상태 관리
  - [ ] useGameRoom 훅
  - [ ] RTDB 실시간 구독
  - [ ] 난이도 변경 로직
  - [ ] 준비 완료 상태 동기화

#### Week 4: 답변 시스템
- [ ] 답변 단계 UI
  - [ ] TurnIndicator 컴포넌트
  - [ ] AnswerInput 컴포넌트
  - [ ] Timer 컴포넌트
  - [ ] AnswerList 컴포넌트

- [ ] 타이머 시스템
  - [ ] useTimer 훅
  - [ ] 서버 시간 동기화
  - [ ] 타이머 만료 처리

- [ ] 답변 제출
  - [ ] sanitizer 유틸리티
  - [ ] RTDB에 답변 저장
  - [ ] 제출 완료 UI

---

### Week 5-6: AI 시스템 & 투표 (AI & Voting)

#### Week 5: AI 답변 생성
- [ ] AI Functions
  - [ ] Gemini API 설정
  - [ ] buildEasyPrompt
  - [ ] buildNormalPrompt
  - [ ] buildHardPrompt
  - [ ] generateAIResponse Function

- [ ] AI 답변 타이밍
  - [ ] Easy: 즉시
  - [ ] Normal: 30초 후
  - [ ] Hard: 대부분 제출 후

- [ ] 테스트
  - [ ] 프롬프트 단위 테스트
  - [ ] AI 답변 통합 테스트
  - [ ] 난이도별 품질 검증

#### Week 6: 투표 & 결과 시스템
- [ ] 토론 시간
  - [ ] Discussion 컴포넌트
  - [ ] 30초 타이머
  - [ ] 채팅 기능

- [ ] 투표 UI
  - [ ] VotingBoard 컴포넌트
  - [ ] 투표 제출 로직
  - [ ] useVoting 훅

- [ ] Cloud Function: checkVoteResult
  - [ ] 투표 집계
  - [ ] 최다 득표자 확인
  - [ ] AI 여부 확인
  - [ ] 게임 상태 업데이트

- [ ] 결과 표시
  - [ ] ResultDisplay 컴포넌트
  - [ ] 다음 턴 or 게임 종료

---

### Week 7: 게임 종료 & 결과 화면 (Finalization & Results)

#### Week 7-1: 게임 종료 처리
- [ ] Cloud Function: finalizeGame
  - [ ] 게임 데이터 수집
  - [ ] 점수 계산
  - [ ] Firestore에 로그 저장

- [ ] Results 페이지
  - [ ] 게임 결과 요약
  - [ ] AI 플레이어 공개
  - [ ] 턴별 히스토리 표시
  - [ ] 점수 표시

#### Week 7-2: 리더보드
- [ ] Firestore 쿼리
  - [ ] 점수 낮은 순 정렬
  - [ ] 난이도별 필터

- [ ] 리더보드 UI
  - [ ] 상위 10개 팀 표시
  - [ ] 난이도, 턴 수, 시간, 점수
  - [ ] 내 팀 하이라이트

- [ ] "다시 하기" 버튼
  - [ ] /lobby로 이동

---

### Week 8: 테스트 & 배포 (Testing & Deployment)

#### Week 8-1: 통합 테스트
- [ ] E2E 테스트 (Playwright)
  - [ ] 전체 게임 플로우
  - [ ] 5명 동시 접속 시뮬레이션
  - [ ] AI 답변 확인
  - [ ] 투표 → 결과 확인

- [ ] 성능 테스트
  - [ ] 10개 게임 룸 동시 실행
  - [ ] RTDB 읽기/쓰기 부하 테스트
  - [ ] Functions 응답 시간 측정

#### Week 8-2: 배포 & 버그 수정
- [ ] 프로덕션 배포
  - [ ] Firebase Hosting 배포
  - [ ] Cloud Functions 배포
  - [ ] Security Rules 배포
  - [ ] 환경 변수 설정

- [ ] 모니터링 설정
  - [ ] Firebase Analytics
  - [ ] Cloud Functions 로그
  - [ ] 에러 알림 (Sentry?)

- [ ] 버그 수정 & 최적화
  - [ ] QA 테스트
  - [ ] 버그 수정
  - [ ] UI/UX 개선

---

## ✅ 기능별 체크리스트

### 인증 (Authentication)
- [ ] Google SSO 로그인
- [ ] @neolab.net 도메인 제한
- [ ] 로그아웃
- [ ] 세션 유지

### 매칭 (Matchmaking)
- [ ] 대기실 입장
- [ ] 실시간 플레이어 목록
- [ ] 5명 자동 매칭
- [ ] AI 플레이어 투입

### 게임 설정 (Game Setup)
- [ ] 난이도 선택 (Easy/Normal/Hard)
- [ ] 채팅 기능
- [ ] "준비 완료" 시스템
- [ ] 모두 준비 시 게임 시작

### 게임 플레이 (Gameplay)
- [ ] 턴 표시 (현재 턴 / 최대 턴)
- [ ] 질문 표시
- [ ] 타이머 (난이도별 차등)
- [ ] 답변 입력
- [ ] 답변 제출
- [ ] AI 답변 자동 생성
- [ ] 답변 목록 표시 (익명, 랜덤 순서)
- [ ] 토론 시간 (30초)
- [ ] 투표 UI
- [ ] 투표 제출
- [ ] 투표 결과 표시
- [ ] AI 여부 공개
- [ ] 다음 턴 or 게임 종료

### AI 시스템 (AI System)
- [ ] Easy 모드 답변 (로봇같이)
- [ ] Normal 모드 답변 (자연스럽게)
- [ ] Hard 모드 답변 (타인 모방)
- [ ] Gemini API 연동
- [ ] 프롬프트 엔지니어링
- [ ] 답변 품질 검증

### 게임 종료 (Game Finalization)
- [ ] 점수 계산
- [ ] 게임 로그 저장 (Firestore)
- [ ] Results 페이지 이동

### 결과 화면 (Results)
- [ ] 게임 결과 요약
- [ ] AI 플레이어 공개
- [ ] 턴별 히스토리
- [ ] 점수 표시
- [ ] 리더보드
- [ ] "다시 하기" 버튼

### 보안 (Security)
- [ ] RTDB Security Rules
- [ ] aiPlayerId 읽기 차단
- [ ] 투표 결과 쓰기 차단 (Functions만)
- [ ] XSS 방지 (DOMPurify)
- [ ] API 키 보호 (Functions만)

### 테스트 (Testing)
- [ ] 단위 테스트 (80% 커버리지)
- [ ] 통합 테스트 (60% 커버리지)
- [ ] E2E 테스트 (10개 시나리오)

### 배포 (Deployment)
- [ ] Firebase Hosting
- [ ] Cloud Functions
- [ ] Security Rules
- [ ] 환경 변수
- [ ] 모니터링

---

## 🚨 중요 마일스톤

- **Week 2 끝**: 매칭 시스템 완성 (5명 매칭 → 게임 룸 생성)
- **Week 4 끝**: 답변 시스템 완성 (질문 → 답변 → 타이머)
- **Week 6 끝**: 투표 시스템 완성 (토론 → 투표 → 결과)
- **Week 7 끝**: 게임 종료 & 결과 화면 완성
- **Week 8 끝**: 배포 완료

---

## 📊 진행 상황 추적

### 전체 진행률
- [ ] Week 1: 0%
- [ ] Week 2: 0%
- [ ] Week 3: 0%
- [ ] Week 4: 0%
- [ ] Week 5: 0%
- [ ] Week 6: 0%
- [ ] Week 7: 0%
- [ ] Week 8: 0%

### 기능별 진행률
- [ ] 인증: 0%
- [ ] 매칭: 0%
- [ ] 게임 플레이: 0%
- [ ] AI 시스템: 0%
- [ ] 결과 화면: 0%
- [ ] 테스트: 0%
- [ ] 배포: 0%

---

## 🔄 업데이트 로그

### 설계 단계 (2025-11-17)
- ✅ 프로젝트 구조 설계
- ✅ 문서 작성 완료
  - README.md
  - CLAUDE.md
  - ARCHITECTURE.md
  - FRONTEND.md
  - BACKEND.md
  - AI.md
  - TESTING.md
  - TODO.md (이 파일)

### 다음 작업
- [ ] Week 1 시작: 프로젝트 초기화 및 Firebase 설정

---

**이 문서는 개발 진행에 따라 계속 업데이트됩니다.**
