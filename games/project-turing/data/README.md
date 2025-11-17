# Project Turing - Question Pool Data

이 디렉토리는 게임에 사용될 질문 풀 데이터를 포함합니다.

## 파일 설명

- `questions.json`: 5개 카테고리별 질문 데이터 (각 20개씩, 총 100개)

## 질문 카테고리

1. **personal** (개인 경험): 개인적인 경험과 취향에 관한 질문
2. **company** (사내 문화): 회사 생활과 관련된 질문
3. **creative** (창의적 질문): 상상력을 요하는 창의적 질문
4. **trend** (트렌드): 최신 트렌드와 기술에 관한 질문
5. **values** (가치관): 가치관과 우선순위에 관한 질문

## Firestore 업로드 방법

### 방법 1: Firebase Console 사용

1. Firebase Console → Firestore Database
2. `questions` 컬렉션 생성
3. 각 질문을 문서로 추가:
   - 문서 ID: 자동 생성
   - 필드:
     - `category`: string (카테고리 이름)
     - `text`: string (질문 텍스트)
     - `createdAt`: timestamp

### 방법 2: 스크립트 사용 (권장)

```bash
# 프로젝트 루트에서
cd games/project-turing

# Firebase Emulator 시작 (개발 환경)
firebase emulators:start

# 또는 프로덕션 Firestore에 업로드
# TODO: 업로드 스크립트 작성 예정
```

## 질문 추가/수정 가이드

새로운 질문을 추가하거나 기존 질문을 수정할 때:

1. `questions.json` 파일 수정
2. 질문은 **1-2문장으로 답변 가능한** 수준으로 작성
3. **너무 개인적이거나 민감한 질문은 피하기**
4. **AI가 답변하기 어려운 질문 포함** (예: 사내 정보, 최근 경험 등)
5. 카테고리별 균형 유지 (각 카테고리 20개 유지)

## 질문 품질 체크리스트

- [ ] 1-2문장으로 답변 가능한가?
- [ ] 너무 개인적이거나 민감하지 않은가?
- [ ] AI가 답변하기 쉽지 않은가?
- [ ] 한국어로 자연스럽게 작성되었는가?
- [ ] 카테고리에 적합한 질문인가?
