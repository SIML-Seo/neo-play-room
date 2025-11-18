# Project Turing - Development TODO

8주 개발 일정 및 체크리스트입니다.

---

## 📅 8주 개발 일정

### Week 1-2: 기반 구축 (Foundation) ✅ **완료**

#### Week 1: 프로젝트 세팅 & Firebase 설정 ✅
- [x] 프로젝트 초기화
  - [x] Frontend 프로젝트 생성 (Vite + React 19)
  - [x] Functions 프로젝트 생성 (Node 20)
  - [x] Firebase 프로젝트 생성
  - [x] .gitignore, ESLint, Prettier 설정

- [x] Firebase 설정
  - [x] Authentication (Google SSO)
  - [x] Realtime Database 초기 구조 생성
  - [x] Firestore 초기 컬렉션 생성
  - [ ] **질문 풀 생성 (Firestore)** ⚠️ **TODO**
    - [ ] 5개 카테고리별 질문 수집 (각 20개)
      - personal (개인 경험)
      - company (사내 문화)
      - creative (창의적 질문)
      - trend (트렌드)
      - values (가치관)
    - [ ] Firestore /questions 컬렉션에 저장
  - [ ] Security Rules 작성 ⚠️ **TODO**
  - [ ] Firebase Emulator 설정 ⚠️ **TODO**

- [x] 기본 컴포넌트
  - [x] Home 페이지 (로그인)
  - [x] useAuth 훅 (**@shared/hooks/useAuth로 통합**)
  - [x] 공통 컴포넌트 (Button, Loader) (**@shared/ui-components로 통합**)

#### Week 2: 매칭 시스템 ✅
- [x] Lobby 페이지
  - [x] 대기실 UI
  - [x] 실시간 플레이어 목록
  - [x] useMatchmaking 훅

- [x] Cloud Function: matchPlayers
  - [x] 5명 매칭 로직
  - [x] AI 플레이어 투입
  - [x] 익명 ID 할당
  - [x] GameRoom 생성

- [ ] 테스트
  - [ ] Lobby 단위 테스트 ⚠️ **TODO**
  - [ ] matchPlayers 통합 테스트 ⚠️ **TODO**

---

### Week 3-4: 게임 룸 기본 기능 (Game Room Core) ✅ **완료**

#### Week 3: 대기실 & 게임 시작 ✅
- [x] GameRoom 페이지 (waiting 상태)
  - [x] 난이도 선택 UI
  - [x] 플레이어 목록 표시
  - [ ] 채팅 기능 ⚠️ **선택 사항 (미구현)**
  - [x] "준비 완료" 시스템
  - [x] "게임 시작" 버튼

- [x] 게임 상태 관리
  - [x] useGameRoom 훅
  - [x] RTDB 실시간 구독
  - [x] 난이도 변경 로직
  - [x] 준비 완료 상태 동기화

#### Week 4: 답변 시스템 ✅
- [x] 답변 단계 UI
  - [x] TurnIndicator (GameRoom 내 통합)
  - [x] AnswerInput 컴포넌트
  - [x] Timer 컴포넌트 (**@shared/ui-components/Timer**)
  - [x] 답변 제출 완료 UI (AnswerInput 내)

- [x] 타이머 시스템
  - [x] useTimer 훅 (**@shared에 추가 예정**)
  - [x] 타이머 만료 처리 (자동 답변 제출)
  - [x] **추가 기능**: 타이머 색상 변화 (경고/위험)

- [x] 답변 제출
  - [x] sanitizer 유틸리티 (**@shared/utils/sanitizer**)
  - [x] RTDB에 답변 저장
  - [x] 제출 완료 UI

---

### Week 5-6: AI 시스템 & 투표 (AI & Voting) ✅ **완료**

#### Week 5: AI 답변 생성 ✅
- [x] AI Functions
  - [x] Gemini API 설정
  - [x] buildEasyPrompt
  - [x] buildNormalPrompt
  - [x] buildHardPrompt
  - [x] generateAIResponse Function

- [x] AI 답변 타이밍
  - [x] Easy: 모든 인간 플레이어 제출 후
  - [x] Normal: 모든 인간 플레이어 제출 후
  - [x] Hard: 4명 제출 후

- [ ] 테스트
  - [ ] 프롬프트 단위 테스트 ⚠️ **TODO**
  - [ ] AI 답변 통합 테스트 ⚠️ **TODO**
  - [ ] 난이도별 품질 검증 ⚠️ **TODO**

#### Week 6: 투표 & 결과 시스템 ✅
- [ ] 토론 시간 ⚠️ **선택 사항 (미구현)**
  - [ ] Discussion 컴포넌트
  - [ ] 30초 타이머
  - [ ] 채팅 기능

- [x] 투표 UI
  - [x] VotingBoard 컴포넌트
  - [x] 투표 제출 로직
  - [x] 투표 타이머 (60초)

- [x] Cloud Function: checkVoteResult
  - [x] 투표 집계
  - [x] 최다 득표자 확인
  - [x] AI 여부 확인
  - [x] 게임 상태 업데이트

- [x] 결과 표시
  - [x] 턴별 결과 표시 (GameRoom 내)
  - [x] 다음 턴 or 게임 종료

---

### Week 7: 게임 종료 & 결과 화면 (Finalization & Results) ✅ **완료**

#### Week 7-1: 게임 종료 처리 ✅
- [x] Cloud Function: finalizeGame (checkVoteResult 내 통합)
  - [x] 게임 데이터 수집
  - [x] 점수 계산
  - [x] Firestore에 로그 저장

- [x] Results 페이지
  - [x] 게임 결과 요약 (성공/실패)
  - [x] AI 플레이어 공개
  - [x] 턴별 히스토리 표시
  - [x] 점수 표시
  - [x] 통계 (난이도, 턴 수, 플레이 시간)

#### Week 7-2: 리더보드 ✅
- [x] Firestore 쿼리
  - [x] gameLogs 서비스 생성
  - [x] 점수 높은 순 정렬 (getTopGameLogs)
  - [x] 난이도별 필터 (getDifficultyStats)

- [x] 리더보드 UI
  - [x] 상위 20개 팀 표시
  - [x] 난이도, 턴 수, 시간, 점수
  - [x] 순위 표시 (메달 아이콘)
  - [x] 통계 카드 (총 게임 수, 성공률, 최고 점수)

- [x] "다시 하기" 버튼
  - [x] /lobby로 이동

---

### Week 8: 테스트 & 배포 (Testing & Deployment) ⚠️ **40% 완료**

#### Week 8-1: 통합 테스트
- [ ] E2E 테스트 (Playwright) ⚠️ **TODO**
  - [ ] 전체 게임 플로우
  - [ ] 5명 동시 접속 시뮬레이션
  - [ ] AI 답변 확인
  - [ ] 투표 → 결과 확인

- [ ] 성능 테스트 ⚠️ **TODO**
  - [ ] 10개 게임 룸 동시 실행
  - [ ] RTDB 읽기/쓰기 부하 테스트
  - [ ] Functions 응답 시간 측정

#### Week 8-2: 배포 & 버그 수정
- [ ] 프로덕션 배포 ⚠️ **TODO**
  - [ ] Firebase Hosting 배포
  - [ ] Cloud Functions 배포
  - [x] Security Rules 작성 완료 ✅
  - [ ] Security Rules 배포
  - [ ] 환경 변수 설정

- [ ] 모니터링 설정 ⚠️ **TODO**
  - [ ] Firebase Analytics
  - [ ] Cloud Functions 로그
  - [ ] 에러 알림 (Sentry?)

- [ ] 버그 수정 & 최적화 ⚠️ **진행 중**
  - [ ] QA 테스트
  - [ ] 버그 수정
  - [ ] UI/UX 개선

---

## ✅ 기능별 체크리스트

### 인증 (Authentication) ✅ **100%**
- [x] Google SSO 로그인
- [x] @neolab.net 도메인 제한
- [x] 로그아웃
- [x] 세션 유지
- [x] **@shared/hooks/useAuth로 통합**

### 매칭 (Matchmaking) ✅ **100%**
- [x] 대기실 입장
- [x] 실시간 플레이어 목록
- [x] 5명 자동 매칭
- [x] AI 플레이어 투입

### 게임 설정 (Game Setup) ⚠️ **75%**
- [x] 난이도 선택 (Easy/Normal/Hard)
- [ ] 채팅 기능 (선택 사항)
- [x] "준비 완료" 시스템
- [x] 모두 준비 시 게임 시작

### 게임 플레이 (Gameplay) ✅ **90%**
- [x] 턴 표시 (현재 턴 / 최대 턴)
- [x] 질문 표시
- [x] 타이머 (답변 90초, 투표 60초)
- [x] **타이머 자동 시작/정지**
- [x] **타이머 색상 변화** (경고/위험)
- [x] 답변 입력
- [x] 답변 제출
- [x] **답변 시간 초과 시 자동 제출**
- [x] AI 답변 자동 생성
- [x] 답변 목록 표시 (익명, 랜덤 순서)
- [ ] 토론 시간 (30초) - 선택 사항
- [x] 투표 UI
- [x] 투표 제출
- [x] 투표 결과 표시
- [x] AI 여부 공개
- [x] 다음 턴 or 게임 종료

### AI 시스템 (AI System) ✅ **100%**
- [x] Easy 모드 답변 (로봇같이)
- [x] Normal 모드 답변 (자연스럽게)
- [x] Hard 모드 답변 (타인 모방)
- [x] Gemini API 연동
- [x] 프롬프트 엔지니어링
- [ ] 답변 품질 검증 (테스트 필요)

### 게임 종료 (Game Finalization) ✅ **100%**
- [x] 점수 계산
- [x] 게임 로그 저장 (Firestore)
- [x] Results 페이지 이동

### 결과 화면 (Results) ✅ **100%**
- [x] 게임 결과 요약
- [x] AI 플레이어 공개
- [x] 턴별 히스토리
- [x] 점수 표시
- [x] **통계 표시** (난이도, 턴 수, 시간)
- [x] 리더보드
- [x] "다시 하기" 버튼

### 보안 (Security) ✅ **100%**
- [x] RTDB Security Rules 강화 완료
- [x] aiPlayerId 읽기/쓰기 차단 ✅
- [x] 답변의 isAI 필드 읽기/쓰기 차단 ✅
- [x] 투표 결과 쓰기 차단 (Functions만) ✅
- [x] 게임 상태 변경 차단 (status, currentTurn, endTime - Functions만) ✅
- [x] 투표 권한 제한 (자기 uid만 투표 가능, 중복 투표 방지) ✅
- [x] 답변 수정 방지 (한 번만 쓰기 가능) ✅
- [x] 난이도 변경 제한 (waiting 상태일 때만) ✅
- [x] 채팅 메시지 수정 방지 ✅
- [x] 사용자 프로필 보호 (읽기 전용) ✅
- [x] XSS 방지 (DOMPurify - **@shared/utils/sanitizer**)
- [x] API 키 보호 (Functions만)
- [x] Firestore Rules (gameLogs, leaderboard, questions - 읽기 전용)

### 테스트 (Testing) ⚠️ **20%**
- [x] 컴포넌트 단위 테스트 (일부)
  - [x] AnswerInput.test.tsx
  - [x] VotingBoard.test.tsx
- [ ] 통합 테스트 ⚠️ **TODO**
- [ ] E2E 테스트 ⚠️ **TODO**

### 배포 (Deployment) ⚠️ **0%**
- [ ] Firebase Hosting ⚠️ **TODO**
- [ ] Cloud Functions ⚠️ **TODO**
- [ ] Security Rules ⚠️ **TODO**
- [ ] 환경 변수 ⚠️ **TODO**
- [ ] 모니터링 ⚠️ **TODO**

---

## 🚨 중요 마일스톤

- **Week 2 끝**: ✅ 매칭 시스템 완성 (5명 매칭 → 게임 룸 생성)
- **Week 4 끝**: ✅ 답변 시스템 완성 (질문 → 답변 → 타이머)
- **Week 6 끝**: ✅ 투표 시스템 완성 (투표 → 결과)
- **Week 7 끝**: ✅ 게임 종료 & 결과 화면 완성
- **Week 8 끝**: ⚠️ 배포 진행 중

---

## 📊 진행 상황 추적

### 전체 진행률
- [x] Week 1: **100%** ✅
- [x] Week 2: **100%** ✅
- [x] Week 3: **100%** ✅
- [x] Week 4: **100%** ✅
- [x] Week 5: **100%** ✅
- [x] Week 6: **100%** ✅
- [x] Week 7: **100%** ✅
- [ ] Week 8: **40%** ⚠️ (테스트 & 배포 진행 중)

### 기능별 진행률
- [x] 인증: **100%** ✅ (@shared 통합 완료)
- [x] 매칭: **100%** ✅
- [x] 게임 플레이: **90%** ✅ (채팅/토론 제외)
- [x] AI 시스템: **100%** ✅
- [x] 결과 화면: **100%** ✅
- [ ] 테스트: **20%** ⚠️
- [ ] 배포: **0%** ⚠️

---

## 🔄 업데이트 로그

### 2025-11-17: 설계 단계
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

### 2025-11-18: Week 1-7 구현 완료 (진행 상황 반영)
- ✅ Week 1-2: 기반 구축 완료
  - Frontend & Functions 프로젝트 생성
  - Firebase 설정 (Auth, RTDB, Firestore)
  - Home, Lobby 페이지
  - matchPlayers Function

- ✅ Week 3-4: 게임 룸 & 답변 시스템 완료
  - GameRoom 페이지 (waiting, in-progress)
  - AnswerInput 컴포넌트
  - useTimer 훅 (타이머 자동 처리)
  - 답변 시간 초과 자동 제출

- ✅ Week 5-6: AI & 투표 시스템 완료
  - generateAIResponse Function (난이도별 프롬프트)
  - VotingBoard 컴포넌트
  - checkVoteResult Function

- ✅ Week 7: 결과 화면 완료
  - Results 페이지 (턴별 히스토리, AI 공개)
  - Leaderboard 페이지 (순위, 통계)
  - gameLogs 서비스

- ✅ **@shared 모듈 통합**
  - useAuth 훅 (Factory Pattern)
  - authStore (Zustand)
  - UI 컴포넌트 (Button, Loader, Timer)
  - Utils (sanitizer, shuffle)

- ✅ **Security Rules 강화** (2025-11-18 오후)
  - RTDB Security Rules 전면 개선 (database.rules.json)
  - aiPlayerId 및 isAI 필드 읽기/쓰기 차단
  - 투표 결과 쓰기 차단 (Functions만 허용)
  - 게임 상태 변경 차단 (status, currentTurn, endTime)
  - 투표 권한 제한 (자기 uid만, 중복 방지)
  - 답변 수정 방지 (한 번만 쓰기)
  - 난이도 변경 제한 (waiting 상태일 때만)
  - 채팅 메시지 수정 방지
  - 사용자 프로필 보호 (읽기 전용)

### 다음 작업 (Week 8)
- [x] Security Rules 작성 완료 ✅ (2025-11-18)
- [ ] Security Rules 배포
- [ ] 질문 풀 데이터 생성 (Firestore)
- [ ] E2E 테스트 작성
- [ ] 프로덕션 배포
- [ ] 모니터링 설정

---

## 📝 참고사항

### Shared 모듈 통합 내역
다음 모듈들이 `@neo-play-room/shared`로 통합되었습니다:

- **hooks/useAuth**: Firebase Auth 훅 (Factory Pattern)
- **store/authStore**: Zustand Auth Store (Factory Pattern)
- **ui-components/Button**: 공통 버튼 컴포넌트
- **ui-components/Loader**: 로딩 스피너
- **ui-components/Timer**: 카운트다운 타이머
- **utils/sanitizer**: XSS 방지 (DOMPurify)
- **utils/shuffle**: Fisher-Yates 셔플

자세한 사용법은 `/shared/README.md` 참조.

### 선택 사항 기능 (미구현)
- 채팅 기능 (Lobby, GameRoom)
- 토론 시간 (30초 Discussion)

---

**이 문서는 개발 진행에 따라 계속 업데이트됩니다.**
