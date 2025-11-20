# Project Da Vinci - 프론트엔드 설계

> React + Fabric.js + Firebase를 활용한 실시간 협동 드로잉 UI

## 📐 프론트엔드 아키텍처 개요

### 기술 스택

| 항목 | 기술 | 버전 |
|-----|------|------|
| **빌드 도구** | Vite | 7.x |
| **프레임워크** | React | 19.x |
| **언어** | TypeScript | 5.9.x |
| **캔버스** | Fabric.js | 6.x |
| **상태 관리** | Zustand | 5.x |
| **라우팅** | React Router | 7.x |
| **스타일링** | Tailwind CSS | 4.x |
| **Firebase SDK** | Firebase JS SDK | 12.x |
| **UI 컴포넌트** | Headless UI, Heroicons | - |

---

## 📁 프로젝트 구조

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── main.tsx                        # 앱 진입점
│   ├── App.tsx                         # 라우팅 설정
│   ├── firebase.ts                     # Firebase 초기화
│   │
│   ├── components/                     # UI 컴포넌트
│   │   ├── layout/
│   │   │   ├── Header.tsx              # 공통 헤더
│   │   │   └── Layout.tsx              # 페이지 레이아웃
│   │   ├── game/
│   │   │   ├── Canvas.tsx              # Fabric.js 캔버스 래퍼 (드로잉 도구 포함)
│   │   │   └── Chat.tsx                # 실시간 채팅
│   │   └── common/
│   │       ├── Button.tsx              # 공통 버튼
│   │       ├── Modal.tsx               # 모달 다이얼로그
│   │       └── Loader.tsx              # 로딩 스피너
│   │
│   ├── pages/                          # 페이지 컴포넌트
│   │   ├── Home.tsx                    # 로그인 페이지
│   │   ├── Lobby.tsx                   # 대기실 (팀 확인)
│   │   ├── GameRoom.tsx                # 게임 룸 (메인 게임 화면 - UI 통합)
│   │   └── Results.tsx                 # 결과 및 리더보드
│   │
│   ├── hooks/                          # 커스텀 훅
│   │   ├── useAuth.ts                  # Firebase Auth 연동
│   │   ├── useGameRoom.ts              # 게임 룸 실시간 구독
│   │   ├── useChat.ts                  # 채팅 메시지 구독
│   │   └── useAIJudge.ts               # AI 추론 Cloud Function 호출
│   │
│   ├── store/                          # Zustand 스토어
│   │   ├── authStore.ts                # 인증 상태
│   │   └── gameStore.ts                # 게임 상태 (turnCount, status 등)
│   │
│   ├── services/                       # Firebase SDK 래퍼
│   │   ├── auth.service.ts             # 인증 관련
│   │   ├── database.service.ts         # RTDB 읽기/쓰기
│   │   ├── functions.service.ts        # Cloud Functions 호출
│   │   └── matchmaking.ts              # 게임 매칭 및 룸 생성 (클라이언트 사이드)
│   │
│   ├── utils/                          # 유틸리티 함수
│   │   ├── canvasSerializer.ts         # Fabric.js JSON 직렬화/역직렬화
│   │   ├── timeFormatter.ts            # 시간 포맷팅
│   │   └── sanitizer.ts                # XSS 방지 (채팅 메시지)
│   │
│   └── types/                          # TypeScript 타입 정의
│       ├── game.types.ts               # 게임 관련 타입
│       ├── canvas.types.ts             # 캔버스 관련 타입
│       └── firebase.types.ts           # Firebase 데이터 모델
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── .env.local                          # Firebase 설정 (로컬)
```

---

## 🎨 핵심 컴포넌트 설계

### 1. Canvas.tsx (Fabric.js 래퍼 + 도구 통합)

**역할:**
- HTML5 Canvas를 Fabric.js로 초기화
- 드로잉 도구(색상, 두께, 지우개) UI 포함
- 현재 턴 플레이어만 그리기 가능, 나머지는 읽기 전용
- Firebase RTDB와 실시간 동기화 (Debounce 적용)
- `forwardRef`를 통해 `getCanvasAsBase64`, `loadCanvasData` 등의 메서드 노출

**주요 기능:**
```typescript
// src/components/game/Canvas.tsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as fabric from 'fabric';

// ... (인터페이스 정의)

const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({ width, height, isDrawingEnabled = true, onCanvasChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    
    // 상태 관리: 색상, 두께, 지우개 모드
    const [currentColor, setCurrentColor] = useState('#000000');
    const [brushWidth, setBrushWidth] = useState(5);
    const [isEraser, setIsEraser] = useState(false);

    // ... (초기화 및 이벤트 리스너 로직)

    // 부모 컴포넌트에서 접근 가능한 메서드
    useImperativeHandle(ref, () => ({
      getCanvasAsBase64: () => { /* ... */ },
      loadCanvasData: (data) => { /* ... */ },
      clearCanvas: () => { /* ... */ }
    }));

    return (
      <div className="flex flex-col gap-4">
        {/* 툴바 (그리기 모드일 때만 표시) */}
        {isDrawingEnabled && (
          <div className="bg-gallery-cream ...">
            {/* 색상 선택, 두께 조절, 지우개 버튼 */}
          </div>
        )}
        
        {/* 캔버스 영역 */}
        <div className="bg-gallery-ivory ...">
          <canvas ref={canvasRef} />
        </div>
      </div>
    );
  }
);
```

**최적화 포인트:**
- `debounce`를 사용하여 RTDB 업데이트 빈도 제한 (500ms)
- `resizeObserver`를 통한 반응형 캔버스 크기 조정
- `loadFromJSON` 시 불필요한 리렌더링 방지

---

### 2. GameRoom.tsx (메인 게임 화면 및 UI 통합)

**역할:**
- 게임의 메인 레이아웃 및 상태 관리 오케스트레이터
- 하위 컴포넌트들을 직접 렌더링하거나 통합하여 관리
- `useGameRoom` 훅을 통해 데이터 구독 및 로직 처리

**통합된 UI 요소:**
- **TurnIndicator**: 현재 턴, 남은 시간, 턴 수를 표시하는 상단/중앙 UI
- **PlayerList**: 참가자 목록 및 현재 상태(준비, 창작 중 등) 표시
- **AIGuessDisplay**: AI의 추론 결과 히스토리 및 최신 결과 표시
- **DrawingTools**: `Canvas.tsx` 내부에 통합됨

**구조:**
```typescript
// src/pages/GameRoom.tsx

export default function GameRoom() {
  // 훅을 통해 게임 상태 및 로직 가져오기
  const { gameRoom, remainingTime, ... } = useGameRoom(roomId);
  
  // ...

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* 대기 상태 UI */}
        {gameRoom.status === 'waiting' && (
           // 난이도 선택, 플레이어 목록, 준비 버튼 등
        )}

        {/* 게임 진행 상태 UI */}
        {gameRoom.status === 'in-progress' && (
          <div className="grid ...">
            {/* 좌측: 캔버스 및 컨트롤 */}
            <div>
              <Canvas ref={canvasRef} ... />
              <button onClick={handleSubmitToAI}>AI에게 제출</button>
            </div>

            {/* 중앙: 턴 정보 및 플레이어 */}
            <div>
              <TurnIndicator ... /> 
              <PlayerList ... />
            </div>

            {/* 우측: AI 기록 및 채팅 */}
            <div>
              <AIGuessDisplay ... />
              <Chat ... />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

### 3. Chat.tsx (실시간 채팅)

**역할:**
- 팀원 간 전략 논의
- Firebase RTDB `chatMessages/{roomId}` 구독
- XSS 방지 (DOMPurify) 적용

```typescript
// src/components/game/Chat.tsx
// ... (기존 설계와 유사하게 유지됨)
```

---

## 🪝 핵심 커스텀 훅

### 1. useGameRoom.ts (게임 룸 실시간 구독)

```typescript
// src/hooks/useGameRoom.ts
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/firebase';
import type { GameRoom } from '@/types/game.types';

export function useGameRoom(roomId: string) {
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [canvasState, setCanvasState] = useState<string | null>(null);

  useEffect(() => {
    // 게임 룸 데이터 구독
    const gameRoomRef = ref(database, `/gameRooms/${roomId}`);
    const unsubscribeRoom = onValue(gameRoomRef, (snapshot) => {
      setGameRoom(snapshot.val());
    });

    // 캔버스 상태 구독
    const canvasRef = ref(database, `/liveDrawings/${roomId}/canvasState`);
    const unsubscribeCanvas = onValue(canvasRef, (snapshot) => {
      setCanvasState(snapshot.val());
    });

    return () => {
      unsubscribeRoom();
      unsubscribeCanvas();
    };
  }, [roomId]);

  return { gameRoom, canvasState };
}
```

### 2. useCanvas.ts (Fabric.js 캔버스 제어)

> **Note**: 현재 구현에서는 `useCanvas` 훅 대신 `Canvas.tsx` 내부의 `forwardRef` 패턴을 사용하여 캔버스를 제어합니다. 이는 Fabric.js 인스턴스와 React 컴포넌트 생명주기를 더 긴밀하게 연결하기 위함입니다.

```typescript
// Canvas.tsx 내부 구현 (개념적)
useImperativeHandle(ref, () => ({
  getCanvasAsBase64: () => { ... },
  loadCanvasData: (data) => { ... },
  clearCanvas: () => { ... }
}));
```

### 3. useAIJudge.ts (AI 추론 호출)

```typescript
// src/hooks/useAIJudge.ts
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

interface JudgeResult {
  guess: string;
  confidence: number;
  isCorrect: boolean;
}

export function useAIJudge() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const judge = async (roomId: string, imageBase64: string): Promise<JudgeResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const judgeDrawing = httpsCallable<{ roomId: string; imageBase64: string }, JudgeResult>(
        functions,
        'judgeDrawing'
      );

      const result = await judgeDrawing({ roomId, imageBase64 });
      return result.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { judge, loading, error };
}
```

---

## 🎯 페이지 흐름

### 1. Home.tsx (로그인)

```
[Google SSO 버튼]
    ↓ 클릭
Firebase Auth 로그인
    ↓ 성공
/lobby로 리다이렉트
```

### 2. Lobby.tsx (대기실)

```
[팀원 정보 표시]
- 김개발 (개발팀)
- 이소통 (기획팀)
- ...

[게임 시작 대기]
- 모든 팀원 준비 완료 시 "게임 시작" 버튼 활성화

    ↓ 클릭
/game/{roomId}로 이동
```

### 3. GameRoom.tsx (메인 게임 화면)

GameRoom은 게임 상태에 따라 다른 UI를 렌더링합니다.

#### 3-1. Waiting 상태 (대기실)

**목적**: 팀원들이 난이도를 협의하고 모두 준비 완료 후 게임 시작

**레이아웃:**
```
┌───────────────────────────────────────────────────────┐
│                    Header                             │
│  (Project Da Vinci | 🔵 보통 | 동물 테마)             │
├─────────────────────────────────┬─────────────────────┤
│  난이도 선택 (모두 수정 가능)      │                     │
│  ┌───────────────────────┐      │                     │
│  │ 🟢 쉬움  (90초, 15턴)  │      │                     │
│  ├───────────────────────┤      │                     │
│  │ 🔵 보통  (60초, 10턴) ✓│      │                     │
│  ├───────────────────────┤      │      Chat           │
│  │ 🔴 어려움 (30초, 7턴)  │      │   (실시간 채팅)       │
│  └───────────────────────┘      │                     │
│                                 │                     │
│  참가자 목록 (5명)                │                     │
│  ┌───────────────────────┐      │                     │
│  │ 김개발      ✓ 준비완료  │      │                     │
│  │ 이디자인    대기중      │      │                     │
│  │ 박기획      ✓ 준비완료  │      │                     │
│  │ 최마케팅    대기중      │      │                     │
│  │ 정개발      ✓ 준비완료  │      │                     │
│  └───────────────────────┘      │                     │
│                                 │                     │
│  [      준비 완료       ]       │                     │
│  (모두 준비 시 게임 시작 버튼)    │                     │
└─────────────────────────────────┴─────────────────────┘
```

**주요 기능:**
1. **난이도 선택** - 모든 참가자가 실시간으로 수정 가능
2. **채팅** - 대기실에서도 채팅 활성화
3. **준비 완료 시스템** - 각자 준비 버튼 클릭
4. **게임 시작** - 모두 준비 완료 시에만 버튼 표시

**코드 예시:**
```typescript
{gameRoom.status === 'waiting' && (
  <div className="grid grid-cols-3 gap-8">
    <div className="col-span-2">
      {/* 난이도 선택 */}
      {Object.keys(DIFFICULTY_CONFIG).map((difficulty) => (
        <button onClick={() => handleDifficultyChange(difficulty)}>
          {DIFFICULTY_CONFIG[difficulty].icon} {DIFFICULTY_CONFIG[difficulty].label}
        </button>
      ))}

      {/* 참가자 목록 + 준비 상태 */}
      {allPlayers.map((player) => (
        <div key={player.uid}>
          {player.displayName}
          {player.ready ? '✓ 준비완료' : '대기중'}
        </div>
      ))}

      {/* 준비 버튼 */}
      <button onClick={() => handlePlayerReady(user.uid, !myReady)}>
        {myReady ? '준비 취소' : '준비 완료'}
      </button>

      {/* 모두 준비 시 게임 시작 */}
      {allPlayers.every((p) => p.ready) && (
        <button onClick={handleStartGame}>🚀 게임 시작하기</button>
      )}
    </div>

    <div className="col-span-1">
      <Chat roomId={roomId} />
    </div>
  </div>
)}
```

#### 3-2. In-Progress 상태 (게임 진행)

**레이아웃:**
```
┌─────────────────────────────────────────┐
│         TurnIndicator                    │
│  (현재 턴: 김개발 / 2/10턴 / 1:23)         │
├──────────────────────┬──────────────────┤
│                      │                  │
│      Canvas          │   PlayerList     │
│   (800x600)          │   (팀원 5명)      │
│                      │                  │
│                      ├──────────────────┤
│                      │                  │
│                      │   Chat           │
│                      │   (실시간 채팅)    │
│                      │                  │
├──────────────────────┼──────────────────┤
│  DrawingTools        │  AIGuessDisplay  │
│  (색상, 두께)         │  (AI 추론 결과)    │
└──────────────────────┴──────────────────┘
```

**턴 종료 버튼:**
```typescript
<button
  onClick={handleEndTurn}
  disabled={!isMyTurn || loading}
  className="px-6 py-3 bg-purple-600 text-white rounded-lg"
>
  {loading ? '⏳ AI 판단 중...' : '✅ 턴 종료 (AI에게 보여주기)'}
</button>
```

### 4. Results.tsx (결과 화면)

```
┌─────────────────────────────────────────┐
│         🎉 게임 종료! 🎉                  │
│                                         │
│  정답: "백설공주"                         │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  🥇 1등: A팀 (5턴, 3분 20초)      │  │
│  │  🥈 2등: B팀 (6턴, 2분 50초)      │  │
│  │  🥉 3등: C팀 (7턴, 4분 10초)      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [최종 그림 보기] [다시 플레이]          │
└─────────────────────────────────────────┘
```

---

## 🚀 성능 최적화

### 1. 캔버스 동기화 최적화

**문제점:**
- 매 `mouse:up` 이벤트마다 전체 JSON 전송 → 네트워크 부담

**해결 방안:**
```typescript
// Debounce로 업데이트 빈도 제한
import { debounce } from 'lodash-es';

const syncCanvasDebounced = debounce((roomId, json) => {
  syncCanvas(roomId, json);
}, 500);  // 0.5초마다 최대 1회
```

### 2. 메모이제이션

```typescript
import { memo } from 'react';

export default memo(function PlayerList({ players }: PlayerListProps) {
  // players 배열이 변경될 때만 리렌더링
  return (
    <ul>
      {players.map(p => <li key={p.uid}>{p.name}</li>)}
    </ul>
  );
});
```

### 3. 코드 스플리팅

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

const GameRoom = lazy(() => import('@/pages/GameRoom'));

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/game/:roomId" element={<GameRoom />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 📱 반응형 디자인

### Tailwind 브레이크포인트

```typescript
<div className="
  grid
  grid-cols-1        /* 모바일: 세로 레이아웃 */
  lg:grid-cols-2     /* 데스크톱: 캔버스 | 사이드바 */
  gap-4
">
  <Canvas />
  <Sidebar />
</div>
```

**모바일 고려사항:**
- 캔버스 크기: 800x600 → 100vw x 60vh (반응형)
- 터치 이벤트 지원: Fabric.js는 기본 지원

---

## 🔒 보안 (XSS 방지)

```typescript
// src/utils/sanitizer.ts
import DOMPurify from 'dompurify';

export function sanitizeMessage(message: string): string {
  return DOMPurify.sanitize(message, {
    ALLOWED_TAGS: [],  // HTML 태그 모두 제거
    ALLOWED_ATTR: [],
  });
}

// 사용
const handleSend = () => {
  const clean = sanitizeMessage(message);
  sendMessage(clean);
};
```

---

## 📚 참고 자료

- [Fabric.js Demos](http://fabricjs.com/demos/)
- [Firebase Realtime Database 웹 가이드](https://firebase.google.com/docs/database/web/start)
- [Zustand 공식 문서](https://zustand-demo.pmnd.rs/)

---

**다음 문서**: [BACKEND.md](./BACKEND.md) - 백엔드 상세 설계
