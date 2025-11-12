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
│   │   │   ├── Canvas.tsx              # Fabric.js 캔버스 래퍼
│   │   │   ├── DrawingTools.tsx        # 드로잉 도구 (색상, 두께)
│   │   │   ├── TurnIndicator.tsx       # 현재 턴 표시
│   │   │   ├── PlayerList.tsx          # 팀원 목록
│   │   │   ├── Chat.tsx                # 실시간 채팅
│   │   │   └── AIGuessDisplay.tsx      # AI 추론 결과 표시
│   │   └── common/
│   │       ├── Button.tsx              # 공통 버튼
│   │       ├── Modal.tsx               # 모달 다이얼로그
│   │       └── Loader.tsx              # 로딩 스피너
│   │
│   ├── pages/                          # 페이지 컴포넌트
│   │   ├── Home.tsx                    # 로그인 페이지
│   │   ├── Lobby.tsx                   # 대기실 (팀 확인)
│   │   ├── GameRoom.tsx                # 게임 룸 (메인 게임 화면)
│   │   └── Results.tsx                 # 결과 및 리더보드
│   │
│   ├── hooks/                          # 커스텀 훅
│   │   ├── useAuth.ts                  # Firebase Auth 연동
│   │   ├── useGameRoom.ts              # 게임 룸 실시간 구독
│   │   ├── useCanvas.ts                # Fabric.js 캔버스 제어
│   │   ├── useChat.ts                  # 채팅 메시지 구독
│   │   └── useAIJudge.ts               # AI 추론 Cloud Function 호출
│   │
│   ├── store/                          # Zustand 스토어
│   │   ├── authStore.ts                # 인증 상태
│   │   ├── gameStore.ts                # 게임 상태 (turnCount, status 등)
│   │   └── canvasStore.ts              # 캔버스 상태 (로컬 전용)
│   │
│   ├── services/                       # Firebase SDK 래퍼
│   │   ├── auth.service.ts             # 인증 관련
│   │   ├── database.service.ts         # RTDB 읽기/쓰기
│   │   └── functions.service.ts        # Cloud Functions 호출
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

### 1. Canvas.tsx (Fabric.js 래퍼)

**역할:**
- HTML5 Canvas를 Fabric.js로 초기화
- 현재 턴 플레이어만 그리기 가능, 나머지는 읽기 전용
- Firebase RTDB와 실시간 동기화

**주요 기능:**
```typescript
// src/components/game/Canvas.tsx
import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useCanvas } from '@/hooks/useCanvas';
import { useGameRoom } from '@/hooks/useGameRoom';

interface CanvasProps {
  roomId: string;
  isMyTurn: boolean;  // 현재 내 턴인지 여부
}

export default function Canvas({ roomId, isMyTurn }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { canvas, initCanvas, syncCanvas } = useCanvas();
  const { canvasState } = useGameRoom(roomId);

  // 1. Canvas 초기화
  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        isDrawingMode: isMyTurn,  // 내 턴일 때만 드로잉 모드
        backgroundColor: '#ffffff',
      });

      // 브러시 설정
      fabricCanvas.freeDrawingBrush.width = 5;
      fabricCanvas.freeDrawingBrush.color = '#000000';

      initCanvas(fabricCanvas);
    }
  }, []);

  // 2. 턴 변경 시 드로잉 모드 토글
  useEffect(() => {
    if (canvas) {
      canvas.isDrawingMode = isMyTurn;
      canvas.selection = isMyTurn;  // 객체 선택 가능 여부
    }
  }, [isMyTurn, canvas]);

  // 3. Firebase RTDB에서 캔버스 상태 동기화
  useEffect(() => {
    if (canvas && canvasState && !isMyTurn) {
      // 다른 플레이어가 그린 내용을 내 캔버스에 반영
      canvas.loadFromJSON(canvasState, () => {
        canvas.renderAll();
      });
    }
  }, [canvasState, canvas, isMyTurn]);

  // 4. 내가 그릴 때 Firebase에 업데이트
  useEffect(() => {
    if (canvas && isMyTurn) {
      const handleMouseUp = () => {
        const json = canvas.toJSON();
        syncCanvas(roomId, json);  // RTDB에 저장
      };

      canvas.on('mouse:up', handleMouseUp);
      return () => canvas.off('mouse:up', handleMouseUp);
    }
  }, [canvas, isMyTurn, roomId]);

  return (
    <div className="relative border-4 border-gray-800 rounded-lg shadow-lg">
      <canvas ref={canvasRef} />
      {!isMyTurn && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-10 pointer-events-none flex items-center justify-center">
          <p className="text-2xl font-bold text-gray-700">관전 중...</p>
        </div>
      )}
    </div>
  );
}
```

**최적화 포인트:**
- `isMyTurn === false`일 때는 `mouse:up` 리스너 등록 제거
- JSON 크기가 100KB 초과 시 경고 (성능 저하 방지)

---

### 2. DrawingTools.tsx (드로잉 도구)

**역할:**
- 브러시 색상, 두께 조절
- 지우개, 실행 취소 기능

```typescript
// src/components/game/DrawingTools.tsx
interface DrawingToolsProps {
  canvas: fabric.Canvas | null;
  disabled: boolean;  // 내 턴이 아닐 때 비활성화
}

export default function DrawingTools({ canvas, disabled }: DrawingToolsProps) {
  const colors = ['#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00'];
  const sizes = [2, 5, 10, 15];

  const changeColor = (color: string) => {
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
    }
  };

  const changeSize = (size: number) => {
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = size;
    }
  };

  const clearCanvas = () => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-gray-100 rounded-lg">
      {/* 색상 선택 */}
      <div className="flex gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => changeColor(color)}
            disabled={disabled}
            className="w-10 h-10 rounded-full border-2 border-gray-400"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* 브러시 크기 */}
      <div className="flex gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => changeSize(size)}
            disabled={disabled}
            className="px-3 py-1 bg-white rounded border"
          >
            {size}px
          </button>
        ))}
      </div>

      {/* 전체 지우기 (팀원 합의 필요) */}
      <button
        onClick={clearCanvas}
        disabled={disabled}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        전체 지우기
      </button>
    </div>
  );
}
```

---

### 3. TurnIndicator.tsx (턴 표시)

**역할:**
- 현재 턴 플레이어 강조 표시
- 남은 턴 수 및 타이머 표시

```typescript
// src/components/game/TurnIndicator.tsx
interface TurnIndicatorProps {
  currentPlayerName: string;
  turnCount: number;
  maxTurns: number;
  elapsedTime: number;  // 초 단위
}

export default function TurnIndicator({
  currentPlayerName,
  turnCount,
  maxTurns,
  elapsedTime
}: TurnIndicatorProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm opacity-80">현재 턴</p>
          <p className="text-3xl font-bold">{currentPlayerName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">턴 수</p>
          <p className="text-3xl font-bold">{turnCount} / {maxTurns}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">경과 시간</p>
          <p className="text-3xl font-bold">{formatTime(elapsedTime)}</p>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Chat.tsx (실시간 채팅)

**역할:**
- 팀원 간 전략 논의
- Firebase RTDB `chatMessages/{roomId}` 구독

```typescript
// src/components/game/Chat.tsx
import { useState } from 'react';
import { useChat } from '@/hooks/useChat';

interface ChatProps {
  roomId: string;
}

export default function Chat({ roomId }: ChatProps) {
  const [message, setMessage] = useState('');
  const { messages, sendMessage } = useChat(roomId);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-lg">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2">
            <span className="font-bold text-blue-600">{msg.displayName}:</span>
            <span className="text-gray-800">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* 입력창 */}
      <div className="flex gap-2 p-4 border-t">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="전략을 논의하세요..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          전송
        </button>
      </div>
    </div>
  );
}
```

---

### 5. AIGuessDisplay.tsx (AI 추론 결과)

**역할:**
- AI의 추론 결과를 실시간으로 표시
- 정답/오답 시 애니메이션

```typescript
// src/components/game/AIGuessDisplay.tsx
interface AIGuess {
  turn: number;
  guess: string;
  confidence: number;
  timestamp: number;
}

interface AIGuessDisplayProps {
  guesses: AIGuess[];
  targetWord: string;  // 정답 (게임 종료 후에만 표시)
  gameStatus: 'in-progress' | 'finished';
}

export default function AIGuessDisplay({
  guesses,
  targetWord,
  gameStatus
}: AIGuessDisplayProps) {
  const latestGuess = guesses[guesses.length - 1];

  return (
    <div className="space-y-4">
      {/* 최신 추론 */}
      {latestGuess && (
        <div className={`p-6 rounded-lg shadow-lg ${
          gameStatus === 'finished' && latestGuess.guess === targetWord
            ? 'bg-green-100 border-4 border-green-500'
            : 'bg-yellow-100 border-4 border-yellow-500'
        }`}>
          <p className="text-sm text-gray-600">AI의 추론</p>
          <p className="text-4xl font-bold text-gray-800">{latestGuess.guess}</p>
          <p className="text-sm text-gray-500">
            신뢰도: {(latestGuess.confidence * 100).toFixed(1)}%
          </p>
        </div>
      )}

      {/* 추론 히스토리 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="font-bold mb-2">추론 기록</p>
        <ul className="space-y-1">
          {guesses.map((guess) => (
            <li key={guess.turn} className="text-sm">
              <span className="font-bold">턴 {guess.turn}:</span> {guess.guess}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
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

```typescript
// src/hooks/useCanvas.ts
import { useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { ref, set } from 'firebase/database';
import { database } from '@/firebase';

export function useCanvas() {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  const initCanvas = useCallback((fabricCanvas: fabric.Canvas) => {
    setCanvas(fabricCanvas);
  }, []);

  const syncCanvas = useCallback(async (roomId: string, canvasJSON: any) => {
    const canvasRef = ref(database, `/liveDrawings/${roomId}/canvasState`);
    await set(canvasRef, JSON.stringify(canvasJSON));
  }, []);

  const exportImage = useCallback((): string | null => {
    if (!canvas) return null;
    return canvas.toDataURL({
      format: 'jpeg',
      quality: 0.8,
      multiplier: 1,
    });
  }, [canvas]);

  return { canvas, initCanvas, syncCanvas, exportImage };
}
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
