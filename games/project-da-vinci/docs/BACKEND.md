# Project Da Vinci - 백엔드 설계

> Firebase 서버리스 아키텍처 상세 설계 및 구현 가이드

## 🔧 백엔드 아키텍처 개요

Project Da Vinci는 **서버를 직접 운영하지 않는** 완전한 서버리스 아키텍처를 채택합니다. Firebase의 BaaS(Backend as a Service) 생태계를 활용하여 인프라 관리 없이 게임 로직에만 집중합니다.

### Firebase 서비스 구성

| 서비스 | 용도 | 플랜 | 비용 |
|--------|------|------|------|
| **Authentication** | Google SSO 로그인 | Spark (무료) | $0 |
| **Realtime Database** | 실시간 캔버스/채팅 동기화 | Spark → Blaze | $0-5/월 |
| **Cloud Functions** | AI 추론, 게임 로직 | Blaze (종량제) | $5-15/월 |
| **Cloud Storage** | 게임 로그 아카이빙 | Blaze (종량제) | $0-1/월 |
| **Hosting** | React 정적 파일 서빙 | Spark (무료) | $0 |

**총 예상 비용**: 월 $10-20

---

## 📁 백엔드 프로젝트 구조

```
functions/
├── src/
│   ├── index.ts                        # Cloud Functions 진입점
│   │
│   ├── config/
│   │   └── firebase.config.ts          # Firebase Admin SDK 초기화
│   │
│   ├── ai/
│   │   ├── genkit.config.ts            # Genkit 설정
│   │   ├── prompts.ts                  # AI 프롬프트 템플릿
│   │   └── judge.flow.ts               # AI 추론 Genkit Flow
│   │
│   ├── game/
│   │   ├── matching.function.ts        # 팀 매칭 로직
│   │   ├── turn.function.ts            # 턴 관리 로직
│   │   └── finalize.function.ts        # 게임 종료 처리
│   │
│   ├── types/
│   │   └── models.ts                   # TypeScript 타입 정의
│   │
│   └── utils/
│       ├── logger.ts                   # 로깅 유틸리티
│       └── validators.ts               # 입력 검증
│
├── package.json
├── tsconfig.json
└── .env.local                          # 환경 변수 (Gemini API 키)
```

---

## 🔐 Firebase 초기 설정

### 1. Firebase 프로젝트 생성

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init

# 선택 항목:
# - Functions (TypeScript)
# - Hosting
# - Realtime Database
# - Storage
```

### 2. firebase.json 설정

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18",
    "region": "asia-northeast3"  // 서울 리전
  },
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "database": {
    "rules": "database.rules.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### 3. 환경 변수 설정

```bash
# functions/.env.local
GEMINI_API_KEY=AIzaSyC...your-api-key
PROJECT_ID=project-da-vinci
```

```bash
# 프로덕션 환경 변수 설정
firebase functions:config:set gemini.api_key="AIzaSyC..."
```

---

## 🗄️ Realtime Database 설계

### 데이터 스키마 (상세)

```typescript
// functions/src/types/models.ts

export interface User {
  uid: string;
  displayName: string;
  email: string;
  department: string;
  photoURL?: string;
  createdAt: number;  // Unix timestamp
}

export interface GameRoom {
  roomId: string;
  status: 'waiting' | 'in-progress' | 'finished';
  theme: string;  // 예: "동화", "영화", "음식"
  targetWord: string;
  currentTurn: string;  // 현재 플레이어 UID
  turnOrder: string[];  // [uid1, uid2, uid3, uid4, uid5]
  currentTurnIndex: number;
  maxTurns: number;
  turnCount: number;
  startTime: number;
  endTime?: number;
  players: {
    [uid: string]: {
      name: string;
      team: string;
      ready: boolean;
      joinedAt: number;
    };
  };
  aiGuesses: AIGuess[];
}

export interface AIGuess {
  turn: number;
  guess: string;
  confidence: number;
  timestamp: number;
  imageUrl?: string;  // Storage Public URL (AI 학습 데이터용)
}

export interface LiveDrawing {
  roomId: string;
  canvasState: string;  // Fabric.js JSON (stringified)
  lastUpdatedBy: string;
  lastUpdatedAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  uid: string;
  displayName: string;
  text: string;
  timestamp: number;
}

export interface GameLog {
  logId: string;
  roomId: string;
  theme: string;
  targetWord: string;
  finalTurnCount: number;
  finalTime: number;  // ms
  winningTeam: string;
  finalImageUri: string;  // GCS URI
  finalImageHash?: string;
  aiGuessList: AIGuess[];
  completedAt: number;
}
```

### 보안 규칙 (database.rules.json)

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "gameRooms": {
      "$roomId": {
        ".read": "auth != null && data.child('players').child(auth.uid).exists()",
        ".write": "auth != null && data.child('players').child(auth.uid).exists()"
      }
    },
    "liveDrawings": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('gameRooms').child($roomId).child('currentTurn').val() == auth.uid"
      }
    },
    "chatMessages": {
      "$roomId": {
        ".read": "auth != null && root.child('gameRooms').child($roomId).child('players').child(auth.uid).exists()",
        "$messageId": {
          ".write": "auth != null && newData.child('uid').val() == auth.uid"
        }
      }
    },
    "gameLogs": {
      ".read": "auth != null",
      ".write": false  // Cloud Function만 쓰기 가능
    }
  }
}
```

**핵심 보안 원칙:**
1. 인증된 사용자만 접근 (`auth != null`)
2. 자신이 속한 게임 룸만 읽기/쓰기
3. 현재 턴 플레이어만 캔버스 수정
4. 게임 로그는 Cloud Function만 작성

---

## ⚡ Cloud Functions 구현

### 1. 팀 매칭 함수 (Scheduled Function)

**트리거:** 매주 월요일 09:00 (또는 수동 호출)

```typescript
// functions/src/game/matching.function.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getDatabase } from 'firebase-admin/database';
import { logger } from 'firebase-functions';

interface Participant {
  uid: string;
  displayName: string;
  email: string;
  department: string;
}

export const matchPlayers = onSchedule({
  schedule: '0 9 * * 1',  // 매주 월요일 09:00 (KST)
  timeZone: 'Asia/Seoul',
  region: 'asia-northeast3',
}, async (event) => {
  const db = getDatabase();

  // 1. 참가자 목록 가져오기
  const participantsSnapshot = await db.ref('/participants').once('value');
  const participants: Participant[] = Object.values(participantsSnapshot.val() || {});

  if (participants.length < 5) {
    logger.warn('참가자가 5명 미만입니다. 매칭을 건너뜁니다.');
    return;
  }

  // 2. 참가자 무작위 섞기
  const shuffled = participants.sort(() => Math.random() - 0.5);

  // 3. 5명씩 팀 구성
  const teams: Participant[][] = [];
  for (let i = 0; i < shuffled.length; i += 5) {
    teams.push(shuffled.slice(i, i + 5));
  }

  // 4. 게임 룸 생성
  const themes = ['동화', '영화', '음식', '동물', '스포츠'];
  const words = {
    '동화': ['백설공주', '신데렐라', '피노키오', '인어공주'],
    '영화': ['기생충', '어벤져스', '타이타닉', '겨울왕국'],
    // ...
  };

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    if (team.length !== 5) continue;  // 5명이 아닌 팀은 건너뛰기 (또는 4-6명 허용)

    const roomId = `room-${Date.now()}-${i}`;
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const targetWord = words[theme][Math.floor(Math.random() * words[theme].length)];

    const gameRoom: GameRoom = {
      roomId,
      status: 'waiting',
      theme,
      targetWord,
      currentTurn: team[0].uid,
      turnOrder: team.map(p => p.uid),
      currentTurnIndex: 0,
      maxTurns: 10,
      turnCount: 0,
      startTime: Date.now(),
      players: team.reduce((acc, p) => {
        acc[p.uid] = {
          name: p.displayName,
          team: roomId,
          ready: false,
          joinedAt: Date.now(),
        };
        return acc;
      }, {} as any),
      aiGuesses: [],
    };

    await db.ref(`/gameRooms/${roomId}`).set(gameRoom);
    logger.info(`게임 룸 생성: ${roomId}, 팀원: ${team.map(p => p.displayName).join(', ')}`);
  }

  // 5. 참가자 목록 초기화
  await db.ref('/participants').remove();
  logger.info('팀 매칭 완료');
});
```

### 2. AI 추론 함수 (Callable Function)

**트리거:** 클라이언트에서 `httpsCallable('judgeDrawing')` 호출

```typescript
// functions/src/ai/judge.flow.ts
import { onCall } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createHash } from 'crypto';

interface JudgeRequest {
  roomId: string;
  imageBase64: string;  // "data:image/jpeg;base64,..."
}

interface JudgeResponse {
  guess: string;
  confidence: number;
  isCorrect: boolean;
}

export const judgeDrawing = onCall<JudgeRequest, Promise<JudgeResponse>>({
  region: 'asia-northeast3',
  cors: true,
}, async (request) => {
  const { roomId, imageBase64 } = request.data;
  const db = getDatabase();
  const storage = getStorage().bucket();

  // 1. 게임 룸 정보 가져오기
  const roomSnapshot = await db.ref(`/gameRooms/${roomId}`).once('value');
  const gameRoom: GameRoom = roomSnapshot.val();

  if (!gameRoom) {
    throw new Error('게임 룸을 찾을 수 없습니다.');
  }

  if (gameRoom.status !== 'in-progress') {
    throw new Error('게임이 진행 중이 아닙니다.');
  }

  // 2. Gemini API 호출
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are playing a Pictionary game. Look at this drawing and guess what it represents.

Category: ${gameRoom.theme}

Respond ONLY with a JSON object in this format:
{
  "guess": "your guess in Korean",
  "confidence": 0.85
}

Examples:
- If you see an apple drawing: {"guess": "사과", "confidence": 0.9}
- If you see a princess: {"guess": "공주", "confidence": 0.75}

DO NOT explain your reasoning. ONLY return the JSON.`;

  try {
    const base64Payload = imageBase64.split(',')[1]; // "data:image/jpeg;base64," 제거
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Payload, mimeType: 'image/jpeg' } },
    ]);

    const responseText = result.response.text();
    logger.info('Gemini 응답:', responseText);

    // JSON 파싱
    const parsed = JSON.parse(responseText);
    const guess = parsed.guess;
    const confidence = parsed.confidence || 0.5;

    // 3. Storage 업로드 (AI 학습 데이터용)
    // 각 턴의 이미지와 AI 판정을 함께 저장하여 차후 AI 학습 데이터로 활용
    const buffer = Buffer.from(base64Payload, 'base64');
    const turnNumber = gameRoom.turnCount + 1;
    const fileName = `turns/${roomId}/turn_${turnNumber}.png`;
    const file = storage.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          roomId,
          turn: turnNumber.toString(),
          guess,
          confidence: confidence.toString(),
          timestamp: Date.now().toString(),
        },
      },
    });

    // Public URL 생성 (리더보드에서 접근 가능)
    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${storage.name}/${fileName}`;

    logger.info(`✅ 이미지 저장 완료: ${imageUrl}`);

    // 4. 정답 확인
    const isCorrect = guess === gameRoom.targetWord;

    // 5. 게임 룸 업데이트
    const newTurnCount = gameRoom.turnCount + 1;
    const aiGuess: AIGuess = {
      turn: newTurnCount,
      guess,
      confidence,
      timestamp: Date.now(),
      imageUrl,  // Storage Public URL
    };

    if (isCorrect) {
      // 정답! 게임 종료
      await db.ref(`/gameRooms/${roomId}`).update({
        status: 'finished',
        endTime: Date.now(),
        turnCount: newTurnCount,
        aiGuesses: [...gameRoom.aiGuesses, aiGuess],
      });

      logger.info(`🎉 정답! ${roomId} 게임 종료`);
    } else {
      // 오답, 다음 턴으로
      const nextTurnIndex = (gameRoom.currentTurnIndex + 1) % gameRoom.turnOrder.length;

      if (newTurnCount >= gameRoom.maxTurns) {
        // 최대 턴 수 초과, 게임 실패
        await db.ref(`/gameRooms/${roomId}`).update({
          status: 'finished',
          endTime: Date.now(),
          turnCount: newTurnCount,
          aiGuesses: [...gameRoom.aiGuesses, aiGuess],
        });

        logger.warn(`❌ 최대 턴 초과! ${roomId} 게임 종료 (실패)`);
      } else {
        await db.ref(`/gameRooms/${roomId}`).update({
          currentTurnIndex: nextTurnIndex,
          currentTurn: gameRoom.turnOrder[nextTurnIndex],
          turnCount: newTurnCount,
          aiGuesses: [...gameRoom.aiGuesses, aiGuess],
        });
      }
    }

    return {
      guess,
      confidence,
      isCorrect,
    };

  } catch (error: any) {
    logger.error('AI 추론 실패:', error);
    throw new Error(`AI 추론 중 오류 발생: ${error.message}`);
  }
});
```

### 3. 게임 종료 함수 (Database Trigger)

**트리거:** `/gameRooms/{roomId}/status`가 `finished`로 변경될 때

```typescript
// functions/src/game/finalize.function.ts
import { onValueUpdated } from 'firebase-functions/v2/database';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';

export const finalizeGame = onValueUpdated({
  ref: '/gameRooms/{roomId}/status',
  region: 'asia-northeast3',
}, async (event) => {
  const newStatus = event.data.after.val();
  const roomId = event.params.roomId;

  if (newStatus !== 'finished') {
    return;  // 게임이 종료되지 않았으면 무시
  }

  const db = getDatabase();
  const bucket = getStorage().bucket();

  // 1. 게임 룸 데이터 가져오기
  const roomSnapshot = await db.ref(`/gameRooms/${roomId}`).once('value');
  const gameRoom: GameRoom = roomSnapshot.val();

  // 2. judgeDrawing이 남긴 마지막 이미지 메타데이터 사용
  const latestGuess = gameRoom.aiGuesses?.[gameRoom.aiGuesses.length - 1];
  if (!latestGuess) {
    logger.error(`최종 이미지 메타데이터 누락: ${roomId}`);
    return;
  }

  // 3. finals/ 경로로 복사 (장기 보관)
  const finalPath = `drawings/finals/${roomId}.jpg`;
  await bucket.file(latestGuess.storagePath).copy(bucket.file(finalPath));

  // 4. 게임 로그 생성
  const gameLog: GameLog = {
    logId: `log-${roomId}`,
    roomId,
    theme: gameRoom.theme,
    targetWord: gameRoom.targetWord,
    finalTurnCount: gameRoom.turnCount,
    finalTime: (gameRoom.endTime || Date.now()) - gameRoom.startTime,
    winningTeam: roomId,  // 추후 리더보드 구현 시 순위 계산
    finalImageUri: finalPath,
    finalImageHash: latestGuess.sha256,
    aiGuessList: gameRoom.aiGuesses,
    completedAt: Date.now(),
  };

  await db.ref(`/gameLogs/${gameLog.logId}`).set(gameLog);
  logger.info(`게임 로그 저장: ${gameLog.logId}`);

  // 5. (선택 사항) rooms/ 이미지는 30일 후 스케줄러가 정리
});
```

---

## 🔥 Firebase Admin SDK 초기화

```typescript
// functions/src/config/firebase.config.ts
import * as admin from 'firebase-admin';

admin.initializeApp();

export const db = admin.database();
export const storage = admin.storage();
export const auth = admin.auth();
```

---

## 📦 Storage 설정 (이미지 아카이빙)

### Storage 보안 규칙 (storage.rules)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // turns/* 은 Cloud Functions(Admin)만 쓰기, Public 읽기 허용
    match /turns/{roomId}/{fileName} {
      allow read: if true;  // Public URL로 리더보드 접근 허용
      allow write: if false;  // Cloud Functions만 쓰기 가능
    }
  }
}
```

### Cloud Function 업로드 흐름 (AI 학습 데이터 수집)

**설계 목적**: 각 턴의 그림과 AI 판정을 함께 저장하여 차후 회사의 AI 학습 데이터 자원으로 활용

**저장 프로세스**:
1. `judgeDrawing` 함수가 Base64 이미지를 받아 AI 판정 수행
2. AI 응답 직후, 이미지를 Storage에 업로드: `turns/{roomId}/turn_{턴번호}.png`
3. 메타데이터에 게임 정보 기록:
   - `roomId`: 게임 룸 식별자
   - `turn`: 턴 번호
   - `guess`: AI가 추측한 단어
   - `confidence`: 신뢰도 점수
   - `timestamp`: 판정 시각
4. Public URL 생성하여 `aiGuesses[].imageUrl`에 저장
5. Firestore `gameLogs`에 모든 턴별 이미지 URL 보관

**데이터 활용 가치**:
- **학습 데이터셋**: 그림 + 정답(targetWord) + AI 추측 쌍
- **프롬프트 최적화**: 난이도별/테마별 AI 정확도 분석
- **게임 밸런스 조정**: 어려운 단어/쉬운 단어 패턴 발견
- **사용자 행동 분석**: 그림 스타일 시각화

**비용 관리**:
- 현재: 모든 턴별 이미지 영구 보관 (학습 데이터 우선)
- 향후: 필요시 일정 기간 후 아카이브 스토리지로 이동 가능

---

## 🚀 배포 및 운영

### 로컬 개발 (Emulator)

```bash
# Emulator 시작
firebase emulators:start

# 실행되는 서비스:
# - Authentication: http://localhost:9099
# - Realtime Database: http://localhost:9000
# - Functions: http://localhost:5001
# - Storage: http://localhost:9199
```

### 프로덕션 배포

```bash
# Functions만 배포
firebase deploy --only functions

# Hosting + Functions 동시 배포
firebase deploy --only hosting,functions

# 특정 Function만 배포
firebase deploy --only functions:judgeDrawing
```

### 환경 변수 관리

```bash
# 환경 변수 확인
firebase functions:config:get

# 환경 변수 설정
firebase functions:config:set gemini.api_key="YOUR_API_KEY"

# 로컬 환경 변수 가져오기
firebase functions:config:get > functions/.runtimeconfig.json
```

---

## 📊 모니터링 및 로깅

### Cloud Functions 로그 확인

```bash
# 실시간 로그 스트리밍
firebase functions:log

# 특정 Function 로그
firebase functions:log --only judgeDrawing
```

### Firebase Console에서 모니터링

- [Firebase Console](https://console.firebase.google.com)
  - Functions → 사용량 탭: 호출 횟수, 오류율, 실행 시간
  - Database → 사용량 탭: 읽기/쓰기 횟수, 저장 용량
  - Storage → 사용량 탭: 다운로드/업로드 트래픽

---

## 💰 비용 최적화

### 1. Realtime Database 최적화

```typescript
// ❌ 비효율: 전체 게임 룸 구독
database.ref('/gameRooms').on('value', ...)

// ✅ 효율: 필요한 경로만 구독
database.ref(`/gameRooms/${roomId}/status`).on('value', ...)
```

### 2. Cloud Functions 최적화

```typescript
// 최소 인스턴스 수 설정 (콜드 스타트 방지, 비용 증가 주의)
export const judgeDrawing = onCall({
  minInstances: 0,  // 0으로 설정하여 비용 절감
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: '512MiB',
}, async (request) => {
  // ...
});
```

### 3. Gemini API 호출 최적화

```typescript
// 이미지 품질 조정 (80% 품질로 압축)
const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

// 또는 이미지 크기 축소
const smallerImage = resizeImage(canvas, 640, 480);  // 800x600 → 640x480
```

---

## 🔒 보안 체크리스트

- [ ] API 키는 절대 클라이언트에 노출하지 않음 (Cloud Function에서만 사용)
- [ ] Realtime Database 보안 규칙 설정 완료
- [ ] Storage 보안 규칙 설정 완료
- [ ] Cloud Functions에 CORS 설정 (`cors: true`)
- [ ] 사용자 입력 검증 (XSS, SQL Injection 방지)
- [ ] Rate limiting 설정 (과도한 호출 방지)

---

## 📚 참고 자료

- [Firebase Cloud Functions 문서](https://firebase.google.com/docs/functions)
- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)
- [Gemini API 문서](https://ai.google.dev/gemini-api/docs)
- [Firebase 가격 정책](https://firebase.google.com/pricing)

---

**다음 문서**: [AI.md](./AI.md) - AI 추론 로직 상세 설계
