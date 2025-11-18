# Project Turing - 현재 구현 문제점 분석

## 🚨 Critical Issues (즉시 수정 필요)

### 1. **게임 룸 생성 로직 중복 및 보안 문제**
**위치**: `frontend/src/services/matchmaking.ts` vs `functions/src/game/matching.ts`

**문제**:
- 클라이언트에서 직접 게임 룸 생성 (`createGameRoom`)
- Functions에도 `matchPlayers` trigger가 있지만 실제로 작동하지 않음
- 클라이언트에서 `aiPlayerId`를 설정하는 것은 보안상 위험

**영향**:
- AI 플레이어 ID가 클라이언트 코드에 노출될 수 있음
- 악의적인 사용자가 직접 게임 룸을 조작 가능

**해결 방법**:
- Functions `matchPlayers` trigger를 제대로 작동하도록 수정
- 클라이언트의 `createGameRoom` 제거
- 5명 모였을 때 자동으로 Functions trigger가 게임 룸 생성하도록 변경

---

### 2. **투표 집계 로직 누락**
**위치**: `frontend/src/pages/GameRoom.tsx`

**문제**:
- `checkVoteResult` Cloud Function이 구현되어 있지만 호출되지 않음
- 투표가 모두 완료되어도 자동으로 집계되지 않음
- 클라이언트에서 수동으로 "다음 턴" 버튼을 눌러야 함

**영향**:
- 투표 결과가 자동으로 집계되지 않음
- 게임 플로우가 끊김

**해결 방법**:
- 5명 모두 투표 완료 시 자동으로 `checkVoteResult` 호출
- Functions에서 투표 결과를 RTDB에 저장

---

### 3. **AI 답변 생성 중복 호출 위험**
**위치**: `frontend/src/pages/GameRoom.tsx:40-64`

**문제**:
- 여러 클라이언트에서 동시에 `generateAIAnswer` 호출 가능
- useEffect가 각 클라이언트에서 실행되므로 중복 호출 위험

**영향**:
- AI 답변이 여러 번 생성될 수 있음
- Cloud Functions 비용 증가

**해결 방법**:
- Functions에서 이미 AI 답변이 있는지 확인하고 중복 생성 방지
- 또는 RTDB trigger로 변경 (답변 개수 체크)

---

## ⚠️ Warning Issues (개선 필요)

### 4. **질문 중복 방지 로직 부재**
**위치**: `frontend/src/services/gameRoom.ts:selectQuestion`

**문제**:
- 같은 게임에서 같은 질문이 여러 번 나올 수 있음
- 이전 턴에 나온 질문을 필터링하지 않음

**해결 방법**:
- 게임 룸에 `usedQuestionIds` 배열 추가
- 질문 선택 시 이미 사용된 질문 제외

---

### 5. **Firestore 질문이 없을 때 처리 부족**
**위치**: `frontend/src/services/gameRoom.ts:76-82`

**문제**:
- 질문이 없으면 기본 질문만 반환
- 카테고리별로 최소 20개씩 있어야 하는데 검증하지 않음

**해결 방법**:
- 게임 시작 전 질문 풀 검증
- 부족한 카테고리가 있으면 경고

---

### 6. **타이머 기능 부재**
**위치**: 모든 페이지

**문제**:
- 답변/투표 제한 시간이 없음
- 무한정 대기 가능

**해결 방법**:
- Timer 컴포넌트 활용
- 제한 시간 초과 시 자동 제출 or 기권 처리

---

### 7. **에러 처리 부족**
**위치**: `frontend/src/services/gameRoom.ts`

**문제**:
- Firestore 읽기 실패 시 에러가 사용자에게 전달되지 않음
- AI 답변 생성 실패 시 게임이 멈춤

**해결 방법**:
- try-catch 블록 추가
- 에러 발생 시 사용자에게 알림 및 재시도 옵션 제공

---

### 8. **게임 상태 동기화 문제**
**위치**: `frontend/src/pages/GameRoom.tsx`

**문제**:
- 로컬 state (`submittedAnswer`, `submittedVote`)와 RTDB 데이터가 불일치할 수 있음
- 새로고침 시 상태가 초기화됨

**해결 방법**:
- 로컬 state 제거하고 RTDB 데이터만 사용
- `myAnswer`, `myVote`를 직접 체크

---

## 📝 Minor Issues (추후 개선)

### 9. **테스트 코드 부재**
**위치**: 모든 파일

**문제**:
- 단위 테스트 없음
- 통합 테스트 없음
- E2E 테스트 없음

**해결 방법**:
- Vitest로 단위 테스트 작성
- React Testing Library로 컴포넌트 테스트
- Playwright/Cypress로 E2E 테스트

---

### 10. **코드 중복**
**위치**: 여러 파일

**문제**:
- `sanitizeMessage` 호출이 여러 곳에서 중복
- 익명 ID 파싱 로직 중복 (`anonymousId.split('_')[1]`)

**해결 방법**:
- 공통 유틸리티 함수로 추출

---

## 📊 우선순위

1. **즉시 수정** (Critical):
   - Issue #1: 게임 룸 생성 보안 문제
   - Issue #2: 투표 집계 로직
   - Issue #3: AI 답변 중복 호출

2. **다음 스프린트** (Warning):
   - Issue #4-8: 질문 중복, 에러 처리, 타이머 등

3. **추후 개선** (Minor):
   - Issue #9-10: 테스트, 코드 리팩토링
