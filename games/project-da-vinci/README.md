# Project Da Vinci 🎨

> AI 협동 Pictionary 게임 - Neo Play Room Cycle 1

## 🎮 게임 개요

**Project Da Vinci**는 5명의 팀원이 협력하여 AI에게 그림으로 단어를 추론시키는 실시간 웹 기반 협동 게임입니다. 네오랩컨버전스의 조용한 사내 문화를 깨고, 임직원 간 자연스러운 소통을 촉진하기 위해 기획되었습니다.

### 핵심 메커니즘

전통적인 Pictionary와 달리, **5명이 순차적으로 한 캔버스에 협력하여 그림을 완성**합니다. AI는 정답을 모르는 상태에서 그림을 보고 단어를 추론하며, 팀은 최소 턴과 최단 시간 안에 AI가 정답을 맞히도록 전략을 세워야 합니다.

---

## 📋 게임 룰

### 참가 및 팀 구성

1. **참가자 모집** (게임 시작 1주일 전)
   - 전 사원 대상 참가 신청 접수
   - 희망자 전원 참여 보장 (참가 실패 없음)

2. **팀 편성** (게임 시작 1일 전)
   - 참가자를 무작위로 **5인 1팀**으로 구성
   - 5명이 되지 않는 경우 4-6인 팀 허용 (페널티/보너스 적용)
   - 팀원 정보 (이름, 부서, 프로필) 공개 (익명성 제거)

3. **동시 진행**
   - 최대 10개 팀이 동시에 게임 진행
   - 각 팀은 독립적으로 게임 진행 후 결과 비교

### 게임 진행 흐름

```
[게임 시작]
    ↓
[주제 발표] (예: "동화")
    ↓
[단어 할당] (예: "백설공주")
    ↓
┌─────────────────────────────────┐
│  턴 1: Player A 그림 그리기      │
│  ↓                              │
│  AI 추론 (정답 모름)             │
│  → "사과" (오답) → 턴 2로        │
│                                 │
│  턴 2: Player B 그림 추가        │
│  ↓                              │
│  AI 추론                         │
│  → "공주" (오답) → 턴 3으로       │
│                                 │
│  ...                            │
│                                 │
│  턴 5: Player E 그림 추가        │
│  ↓                              │
│  AI 추론                         │
│  → "백설공주" (정답!) ✓          │
└─────────────────────────────────┘
    ↓
[결과 집계]
- 소요 시간: 3분 20초
- 소요 턴: 5턴
    ↓
[최종 순위 발표 및 리워드 지급]
```

### 상세 규칙

#### 턴 진행

- **턴 순서**: 5명의 플레이어가 순차적으로 돌아가며 그림 추가
- **턴당 제한 시간**: 60초 (선택 사항)
- **최대 턴 수**: 10턴 (5명이 최대 2바퀴)
- **그리기 권한**: 현재 턴 플레이어만 캔버스에 그릴 수 있음
- **관전**: 나머지 4명은 실시간으로 캔버스 동기화하여 관전

#### 채팅 및 전략

- 팀원들은 실시간 채팅으로 전략 논의 가능
- 예시: "제가 사과 먼저 그릴게요", "저는 난쟁이 추가할게요"
- **AI는 채팅 내용을 볼 수 없음** (그림만 판단)

#### AI 추론

- **추론 시점**: 각 플레이어가 턴을 종료할 때마다
- **추론 방식**: AI가 현재 캔버스 이미지를 보고 단어 추측 (정답 모름)
- **판정**: AI의 추론이 정답 단어와 일치하면 게임 종료

#### 승리 조건

다음 기준으로 팀 순위 결정:

1. **1순위**: 최소 턴 수
2. **2순위**: 최단 소요 시간

예시:
- A팀: 5턴, 3분 20초
- B팀: 5턴, 2분 50초 → **B팀 우승**
- C팀: 6턴, 2분 10초 → B팀보다 낮음

---

## 🏆 리워드 체계

| 순위 | 리워드 | 목적 |
|-----|--------|------|
| 🥇 1등 | 팀 점심 회식비 지원 (5만원) | 팀 친목 강화 |
| 🥈 2등 | 커피 쿠폰 (1인당 1만원) | 참여 독려 |
| 🥉 3등 | 간식 쿠폰 (1인당 5천원) | 참여 독려 |
| 🎖️ 전원 | 게임 리플레이 영상 + 추억 공유 | 사내 문화 자산 |

---

## 🛠️ 기술 스택

### 프론트엔드
- **프레임워크**: React (Vite)
- **캔버스 라이브러리**: Fabric.js
- **스타일링**: Tailwind CSS
- **상태 관리**: Zustand (경량 상태 관리)

### 백엔드 (서버리스)
- **플랫폼**: Firebase
  - Authentication (Google SSO)
  - Realtime Database (실시간 동기화)
  - Cloud Functions (AI 로직)
  - Cloud Storage (게임 로그 아카이빙)
- **호스팅**: Firebase Hosting 또는 Vercel

### AI
- **모델**: Google Gemini 1.5 Flash (Vision API)
- **오케스트레이션**: Firebase Genkit
- **프롬프트 전략**: Zero-shot 추론 (정답 미제공)

---

## 📁 프로젝트 구조

```
project-da-vinci/
├── README.md                          # 본 문서
├── docs/                              # 상세 설계 문서
│   ├── ARCHITECTURE.md                # 전체 시스템 아키텍처
│   ├── FRONTEND.md                    # 프론트엔드 상세 설계
│   ├── BACKEND.md                     # 백엔드/Firebase 상세 설계
│   ├── AI.md                          # AI 추론 로직 상세 설계
│   └── TODO.md                        # 개발 체크리스트 및 마일스톤
├── frontend/                          # React 애플리케이션
│   ├── src/
│   │   ├── components/                # UI 컴포넌트
│   │   ├── hooks/                     # 커스텀 훅 (Firebase 연동)
│   │   ├── store/                     # Zustand 스토어
│   │   ├── services/                  # Firebase SDK 래퍼
│   │   └── utils/                     # 유틸리티 함수
│   ├── package.json
│   └── vite.config.js
├── functions/                         # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts                   # 함수 진입점
│   │   ├── ai/                        # AI 추론 로직 (Genkit)
│   │   └── game/                      # 게임 로직 (매칭, 턴 관리)
│   ├── package.json
│   └── tsconfig.json
├── firebase.json                      # Firebase 설정
└── .firebaserc                        # Firebase 프로젝트 정보
```

---

## 📖 상세 문서

각 영역별 상세 설계 문서는 `docs/` 디렉토리에서 확인하세요:

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)**: 전체 시스템 아키텍처 및 데이터 흐름
- **[FRONTEND.md](./docs/FRONTEND.md)**: React 컴포넌트 설계 및 실시간 동기화 로직
- **[BACKEND.md](./docs/BACKEND.md)**: Firebase 설정, 데이터 모델, Cloud Functions
- **[AI.md](./docs/AI.md)**: Gemini API 연동 및 프롬프트 엔지니어링
- **[TODO.md](./docs/TODO.md)**: 개발 일정 및 체크리스트

---

## 🚀 빠른 시작 (개발 환경 설정)

### 사전 요구사항

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase 프로젝트 생성 (https://console.firebase.google.com)
- Google Cloud API 키 (Gemini API)

### 설치 및 실행

```bash
# 1. 의존성 설치
cd frontend && npm install
cd ../functions && npm install

# 2. Firebase 로그인 및 프로젝트 선택
firebase login
firebase use --add

# 3. 환경 변수 설정
# functions/.env 파일 생성
echo "GEMINI_API_KEY=your-api-key" > functions/.env

# 4. 로컬 개발 서버 실행
cd frontend && npm run dev         # http://localhost:5173
cd functions && npm run serve      # Firebase Emulator

# 5. 배포 (프로덕션)
firebase deploy
```

---

## 🧪 테스트 계획

### 알파 테스트 (1주차)
- **참가자**: 개발자 본인 + 소통위원회 (5명)
- **목표**: 기본 게임 흐름 검증 및 버그 수정

### 베타 테스트 (2주차)
- **참가자**: 부서별 자원자 (10명, 2팀)
- **목표**: 실시간 동기화 성능 및 AI 정확도 검증

### 정식 출시 (3주차)
- **참가자**: 전 사원 (50명, 10팀)
- **목표**: 첫 공식 게임 진행 및 리워드 지급

---

## 📊 예상 일정

| 주차 | 마일스톤 | 세부 작업 |
|-----|---------|----------|
| 1주 | 환경 설정 | Firebase 프로젝트 생성, React 보일러플레이트 |
| 2주 | 실시간 동기화 | Fabric.js 캔버스 + Firebase RTDB 연동 |
| 3주 | AI 추론 | Gemini API 연동 + 프롬프트 최적화 |
| 4주 | 게임 로직 | 턴 관리, 타이머, 결과 집계 |
| 5주 | UI/UX | 디자인 적용, 반응형 레이아웃 |
| 6주 | 테스트 | 알파 테스트 (5명) |
| 7주 | 최적화 | 버그 수정, 성능 개선 |
| 8주 | 출시 | 베타 테스트 (10명) → 정식 출시 (50명) |

---

## 🔮 향후 확장 계획 (Cycle 2-3)

### Cycle 2 개선 사항
- 4-6인 유연한 팀 구성 자동화
- 실시간 리더보드 UI
- 게임 리플레이 기능 (캔버스 애니메이션)

### Cycle 3 스마트펜 연동
- Neo smartpen Web SDK 통합
- "스마트펜 전용 라운드" 추가
- NCode 좌표 → 캔버스 좌표 변환 로직

---

## 🤝 기여 가이드

이 프로젝트는 소통위원회 주도로 개발되지만, 사내 개발자의 자발적 기여를 환영합니다.

### 기여 방법
1. 이슈 등록 (버그 리포트, 기능 제안)
2. Pull Request (코드 개선, 문서 수정)
3. 알파/베타 테스트 참여

---

## 📞 문의

- **담당자**: 소통위원회 2기 (4년차 웹 개발자)
- **이슈**: [GitHub Issues](../../issues)
- **사내 채널**: #소통위원회 (Slack)

---

**"Let's teach AI the art of communication!" 🎨🤖**
