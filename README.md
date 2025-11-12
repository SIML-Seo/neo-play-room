# Neo Play Room 🎮

> 네오랩컨버전스 소통위원회 운영 - 2개월 주기 게임 개발 프로젝트

## 📌 프로젝트 개요

**Neo Play Room**은 네오랩컨버전스의 조용한 사내 문화를 개선하고, 임직원 간 자연스러운 소통을 촉진하기 위해 기획된 **2개월 주기 게임 개발 프로젝트**입니다.

### 핵심 목표

1. **조직 문화 개선**: "침묵의 현장"을 "활기찬 협업"으로 전환
2. **자연스러운 친목 도모**: 게임을 통한 부서 간 교류 활성화
3. **개발자 역량 강화**: AI 기반 웹 게임 개발을 통한 기술 성장
4. **지속 가능한 운영**: 저비용, 고효율 웹 서비스 프레임워크 구축

---

## 🏗️ 레포지토리 구조 (모노레포)

이 레포지토리는 **여러 게임 프로젝트**를 포함하는 모노레포 형식으로 운영됩니다.

```
neo-play-room/
├── README.md                    # 본 문서 (레포지토리 전체 개요)
├── games/                       # 게임 프로젝트 디렉토리
│   ├── project-da-vinci/        # Cycle 1: AI 협동 Pictionary
│   ├── project-beethoven/       # Cycle 2: (예정)
│   └── project-curie/           # Cycle 3: (예정)
└── shared/                      # 공통 모듈 (향후 확장)
    ├── auth/                    # 공통 인증 로직
    ├── ui-components/           # 재사용 가능한 UI 컴포넌트
    └── utils/                   # 공통 유틸리티 함수
```

---

## 🎯 운영 방식

### 개발 사이클

- **주기**: 2개월마다 새로운 게임 출시
- **참여 규모**: 50명 규모의 임직원 (5인 1팀, 최대 10개 팀 동시 진행)
- **기술 스택**: 서버리스/BaaS 기반 (Firebase, Vercel 등)
- **비용 목표**: 월 $20 이하 (회사 복지 예산 활용)

### 게임 기획 원칙

1. **협동 메커니즘**: 팀원 간 전략적 소통을 강제하는 게임 룰
2. **익명성 제거**: 실명 기반 참여로 게임 후 관계 형성 촉진
3. **AI 활용**: AI를 "도구"가 아닌 "플레이어"로 활용
4. **네오랩 시그니처**: 스마트펜 연동 등 회사 기술 통합 (선택적)

### 리워드 체계

- **1등 팀**: 점심 회식비 지원 (팀 친목 강화)
- **2-3등 팀**: 소규모 리워드 (커피 쿠폰 등)
- **참가자 전원**: 게임 데이터 아카이브 (추억 공유)

---

## 🚀 현재 진행 중인 프로젝트

### [Project Da Vinci](./games/project-da-vinci/README.md) (Cycle 1)
**AI 협동 Pictionary 게임**

> "5명의 팀원이 협력하여 AI에게 그림으로 단어를 추론시키는 실시간 웹 게임"

- **상태**: 기획 완료, 개발 준비 중
- **기술**: React + Firebase + Gemini API
- **예상 출시**: 2개월 이내
- **상세 문서**: [games/project-da-vinci/docs/](./games/project-da-vinci/docs/)

---

## 🛠️ 기술 철학

### RAGD (Rapid AI-Game Development)

> "인프라가 아닌 로직에 집중한다. AI를 '도구'가 아닌 '플레이어'로 활용하여, 2개월마다 새로운 협업의 즐거움을 신속하게 배포한다."

#### 핵심 원칙

1. **서버리스 우선**: 백엔드 서버 관리 최소화
2. **BaaS 활용**: Firebase, Supabase 등 관리형 서비스 적극 사용
3. **AI 중심 설계**: 게임 메커니즘에 AI를 핵심 플레이어로 통합
4. **MVP 빠른 검증**: 첫 사이클은 필수 기능만, 이후 점진적 개선

---

## 📊 프로젝트 로드맵

| Cycle | 프로젝트명 | 게임 장르 | 주요 기술 | 상태 |
|-------|-----------|----------|----------|------|
| 1 | **Project Da Vinci** | AI 협동 Pictionary | React, Firebase, Gemini Vision | 🔨 개발 준비 중 |
| 2 | Project Beethoven | (미정) 음악/리듬 게임 | Web Audio API, AI 작곡 | 📋 기획 예정 |
| 3 | Project Curie | (미정) 과학 퀴즈 게임 | RAG, AI 퀴즈 생성 | 📋 기획 예정 |

---

## 👥 팀 구성

- **기획/개발**: 소통위원회 (4년차 웹 개발자)
- **참가자**: 네오랩컨버전스 전 임직원 (희망자)
- **협력**: 임원진 (예산 지원 및 리워드 승인)

---

## 📝 문서 가이드

팀 공통 규칙과 빌드/테스트 플로우는 [`AGENTS.md`](./AGENTS.md)에서 확인해 주세요. 새 게임 사이클을 시작하거나 공용 모듈을 추가할 때는 해당 문서를 먼저 갱신한 뒤 아래 세부 문서를 업데이트합니다.

### 각 게임 프로젝트 문서 구조

```
games/{project-name}/
├── README.md              # 프로젝트 개요 및 게임 룰
├── docs/
│   ├── ARCHITECTURE.md    # 전체 시스템 아키텍처
│   ├── FRONTEND.md        # 프론트엔드 상세 설계
│   ├── BACKEND.md         # 백엔드/서버리스 상세 설계
│   ├── AI.md              # AI 모델 및 프롬프트 설계
│   └── TODO.md            # 개발 체크리스트 및 마일스톤
├── frontend/              # React 애플리케이션 소스
├── functions/             # Cloud Functions (Firebase/Vercel)
└── firebase.json          # Firebase 설정 (해당 시)
```

---

## 🔗 관련 링크

- [소통위원회 회의록](https://internal-notion-link) (회사 내부 링크)
- [Firebase Console](https://console.firebase.google.com)
- [Gemini API 문서](https://ai.google.dev/gemini-api/docs)

---

## 📄 라이선스

이 프로젝트는 네오랩컨버전스 사내 용도로 제작되었습니다.

---

## 📞 문의

- **담당자**: 소통위원회 2기
- **이슈 등록**: [GitHub Issues](https://github.com/neo-lab/neo-play-room/issues)
- **사내 채널**: #소통위원회 (Slack/Teams)

---

**Let's break the silence, together! 🎉**
