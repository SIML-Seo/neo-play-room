# Firebase vs Supabase 비교 분석

> Project Da Vinci를 Supabase로 구현할 경우의 타당성 검토

## 📊 Executive Summary

### 결론: **Firebase 유지 권장** (단, Supabase도 실행 가능)

**주요 이유:**
1. ❌ **실시간 동기화 성능**: Supabase Realtime이 Firebase RTDB보다 캔버스 동기화에 부적합
2. ✅ **개발 속도**: Firebase Genkit으로 AI 통합이 더 간단
3. ⚠️ **비용**: 비슷하지만 Firebase가 무료 티어에서 더 관대함
4. ❌ **한국 리전**: Supabase는 서울 리전 미지원 (도쿄 또는 싱가포르)

**Supabase의 장점:**
- PostgreSQL 기반 (복잡한 쿼리 가능)
- 오픈소스 (벤더 락인 회피)
- Row Level Security (세밀한 권한 제어)

**하지만 이 프로젝트에는 불필요:**
- 복잡한 SQL 쿼리 불필요 (단순 key-value 구조)
- 2개월 빠른 개발이 우선
- 실시간 캔버스 동기화가 핵심

---

## 🔍 상세 비교

### 1. 실시간 동기화 (가장 중요!)

| 항목 | Firebase Realtime Database | Supabase Realtime |
|-----|---------------------------|-------------------|
| **프로토콜** | WebSocket (자체 구현) | PostgreSQL LISTEN/NOTIFY + WebSocket |
| **동기화 속도** | ⚡ 매우 빠름 (~50-100ms) | 🐢 느림 (~200-500ms) |
| **구조** | NoSQL (JSON tree) | PostgreSQL (관계형 DB) |
| **적합성** | ✅ 완벽 (캔버스 동기화에 최적) | ⚠️ 부적합 (DB 변경 감지 방식) |

#### Firebase RTDB의 실시간 동기화 (현재 설계)

```typescript
// 쓰기: 즉시 RTDB에 저장
database.ref(`/liveDrawings/${roomId}/canvasState`).set(canvasJSON);

// 읽기: 실시간 구독
database.ref(`/liveDrawings/${roomId}/canvasState`).on('value', (snapshot) => {
  canvas.loadFromJSON(snapshot.val());
});
```

**특징:**
- WebSocket 기반 실시간 푸시
- JSON 데이터를 트리 구조로 저장
- 변경 즉시 모든 구독자에게 전파 (~50ms)

#### Supabase Realtime의 동기화 방식

```typescript
// Supabase는 PostgreSQL 테이블 변경을 감지
supabase
  .from('live_drawings')
  .on('UPDATE', payload => {
    canvas.loadFromJSON(JSON.parse(payload.new.canvas_state));
  })
  .subscribe();
```

**문제점:**
1. **PostgreSQL LISTEN/NOTIFY 기반**: DB 트랜잭션 완료 후 이벤트 발생
2. **지연 시간 증가**: 쓰기 → DB 커밋 → NOTIFY → WebSocket 푸시 (~200-500ms)
3. **JSON 직렬화 오버헤드**: PostgreSQL의 JSONB 타입 사용 시 파싱 비용

**실험 데이터 (Supabase 공식 문서 기준):**
- 소규모 업데이트: ~200ms 지연
- 대용량 JSON (>50KB): ~500ms 지연
- Firebase RTDB: ~50-100ms (5배 빠름)

**결론:** 5명이 실시간으로 캔버스를 공유하는 이 프로젝트에는 **Firebase RTDB가 압도적으로 유리**

---

### 2. 인증 (Authentication)

| 항목 | Firebase Auth | Supabase Auth |
|-----|---------------|---------------|
| **Google SSO** | ✅ 네이티브 지원 | ✅ 네이티브 지원 |
| **설정 복잡도** | 매우 쉬움 (콘솔 클릭 2번) | 쉬움 (환경 변수 설정) |
| **한국 사용자** | ✅ 문제없음 | ✅ 문제없음 |
| **토큰 관리** | 자동 (Firebase SDK) | 자동 (Supabase SDK) |

**평가:** 둘 다 동일하게 우수 ✅

#### Firebase 설정 예시

```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const provider = new GoogleAuthProvider();
await signInWithPopup(auth, provider);
```

#### Supabase 설정 예시

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

**차이점:** 거의 없음. 둘 다 간단함.

---

### 3. 서버리스 함수 (AI 추론 로직)

| 항목 | Firebase Cloud Functions | Supabase Edge Functions |
|-----|-------------------------|-------------------------|
| **런타임** | Node.js 18+ | Deno (TypeScript 네이티브) |
| **AI SDK 지원** | ✅ Genkit (Google 공식) | ⚠️ 수동 통합 필요 |
| **콜드 스타트** | ~1-2초 | ~500ms (더 빠름) |
| **배포** | `firebase deploy` | `supabase functions deploy` |
| **비용** | 종량제 ($0.40/100만 호출) | 종량제 ($2/100만 호출) - **5배 비쌈** |

#### Firebase Genkit의 강력함 (현재 설계)

```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
});

const judgeFlow = ai.defineFlow(async (imageBase64) => {
  const result = await ai.generate({
    model: 'gemini-1.5-flash',
    prompt: buildPrompt(theme),
    media: { url: imageBase64 },
  });
  return result.text();
});
```

**장점:**
- Gemini API 추상화
- 프롬프트 버전 관리
- 자동 재시도 및 에러 핸들링

#### Supabase Edge Functions (Deno 기반)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

serve(async (req) => {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // 수동으로 모든 로직 구현 필요
  const result = await model.generateContent([prompt, imagePart]);
  return new Response(JSON.stringify({ guess: result.text() }));
});
```

**단점:**
- Genkit 없음 → 수동으로 모든 로직 작성
- Deno 생태계가 Node.js보다 작음
- 비용이 5배 비쌈 ($0.40 → $2)

**결론:** **Firebase가 압도적 우위** (Genkit + 저렴한 비용)

---

### 4. 스토리지 (게임 로그 아카이빙)

| 항목 | Firebase Cloud Storage | Supabase Storage |
|-----|------------------------|------------------|
| **기본 기능** | ✅ 동일 | ✅ 동일 |
| **CDN** | Google CDN | Supabase CDN |
| **비용** | $0.026/GB | $0.021/GB (약간 저렴) |
| **업로드 API** | Firebase SDK | Supabase SDK |

**평가:** 둘 다 동일 ✅

---

### 5. 호스팅 (React 정적 파일)

| 항목 | Firebase Hosting | Supabase (없음, Vercel 사용) |
|-----|------------------|------------------------------|
| **CDN** | Google CDN (글로벌) | - |
| **커스텀 도메인** | ✅ 무료 | - |
| **배포** | `firebase deploy` | `vercel deploy` (별도) |
| **비용** | 무료 (10GB/월) | Vercel 무료 (100GB/월) |

**평가:** Firebase가 통합 관리 측면에서 유리, Vercel도 우수 ✅

---

### 6. 비용 비교 (50명, 월 1회 게임 기준)

#### Firebase (현재 설계)

| 항목 | 사용량 | 비용 |
|-----|--------|------|
| **RTDB 읽기** | ~50,000회 | $0 (Spark 무료) |
| **RTDB 쓰기** | ~5,000회 | $0 (Spark 무료) |
| **Cloud Functions** | ~300회 | $0.12 |
| **Gemini API** | ~300회 | $5-10 |
| **Storage** | ~50MB | $0.01 |
| **Hosting** | ~500MB | $0 |
| **총계** | - | **$5-11/월** |

#### Supabase

| 항목 | 사용량 | 비용 |
|-----|--------|------|
| **Database** | PostgreSQL (소규모) | $0 (Free 티어) |
| **Realtime** | ~50,000 메시지 | $0 (Free 티어 500K) |
| **Edge Functions** | ~300회 | $0.60 (5배 비쌈) |
| **Gemini API** | ~300회 | $5-10 (동일) |
| **Storage** | ~50MB | $0 |
| **Hosting (Vercel)** | ~500MB | $0 |
| **총계** | - | **$6-11/월** |

**결론:** 비용은 거의 동일, **Firebase가 약간 저렴**

---

### 7. 개발 경험 (DX)

| 항목 | Firebase | Supabase |
|-----|----------|----------|
| **학습 곡선** | 낮음 (문서 풍부) | 낮음 (PostgreSQL 지식 필요) |
| **Emulator** | ✅ 완벽 (Auth, DB, Functions, Storage) | ⚠️ 부분적 (DB만, Edge Functions는 원격 테스트) |
| **TypeScript 지원** | ✅ 우수 | ✅ 우수 (Deno 기반) |
| **생태계** | 거대함 (Google 지원) | 성장 중 (오픈소스 커뮤니티) |
| **한국어 자료** | 풍부 | 적음 |

**평가:** Firebase가 성숙도 측면에서 유리 ✅

---

### 8. 데이터 모델 변경 (Firebase → Supabase)

#### Firebase RTDB (현재)

```json
{
  "liveDrawings": {
    "room-abc123": {
      "canvasState": "{\"version\":\"5.3.0\",\"objects\":[...]}",
      "lastUpdatedBy": "uid-player-2"
    }
  }
}
```

#### Supabase PostgreSQL (변경 시)

```sql
CREATE TABLE live_drawings (
  room_id TEXT PRIMARY KEY,
  canvas_state JSONB NOT NULL,
  last_updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_room_id ON live_drawings(room_id);
```

**문제점:**
1. **JSON → JSONB 변환 오버헤드**: 매번 직렬화/역직렬화
2. **인덱스 불필요**: 단순 key-value 조회에 PostgreSQL 오버킬
3. **스키마 관리**: 마이그레이션 필요 (Firebase는 스키마리스)

**결론:** 이 프로젝트는 NoSQL이 더 적합 ✅

---

### 9. 보안 규칙

#### Firebase Security Rules (선언적)

```json
{
  "rules": {
    "liveDrawings": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('gameRooms').child($roomId).child('currentTurn').val() == auth.uid"
      }
    }
  }
}
```

#### Supabase Row Level Security (SQL)

```sql
ALTER TABLE live_drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "현재 턴 플레이어만 수정"
  ON live_drawings
  FOR UPDATE
  USING (
    auth.uid() = (
      SELECT current_turn
      FROM game_rooms
      WHERE room_id = live_drawings.room_id
    )
  );
```

**평가:**
- Firebase: 간단, 직관적
- Supabase: 강력하지만 SQL 지식 필요

**복잡도:** Firebase가 더 쉬움 ✅

---

### 10. 한국 리전 지원

| 항목 | Firebase | Supabase |
|-----|----------|----------|
| **서울 리전** | ✅ asia-northeast3 | ❌ 없음 |
| **가장 가까운 리전** | 서울 | 도쿄 또는 싱가포르 |
| **지연 시간 (서울 사용자)** | ~5-10ms | ~30-50ms (도쿄) |

**중요도:** 실시간 게임에서 지연 시간은 치명적
**결론:** Firebase가 압도적 우위 ✅

---

## 🎯 최종 판단

### Supabase로 전환 시 얻는 것

✅ **PostgreSQL 강력함**: 복잡한 쿼리, 조인, 집계 가능
✅ **오픈소스**: 벤더 락인 회피, 셀프 호스팅 가능
✅ **Row Level Security**: 세밀한 권한 제어
✅ **Deno**: 최신 런타임, TypeScript 네이티브

### Supabase로 전환 시 잃는 것

❌ **실시간 성능**: 캔버스 동기화 지연 (50ms → 200-500ms)
❌ **Firebase Genkit**: AI 통합 간소화 도구
❌ **서울 리전**: 한국 사용자 지연 시간 증가
❌ **개발 속도**: Emulator 부족, 수동 설정 증가
❌ **비용**: Edge Functions 5배 비쌈

---

## 📋 권장 사항

### 🟢 **Firebase 유지 (강력 추천)**

**이유:**
1. **실시간 캔버스 동기화가 핵심**: Firebase RTDB가 최적
2. **2개월 빠른 개발**: Genkit으로 AI 통합 간소화
3. **서울 리전**: 한국 사용자 경험 최우선
4. **학습 곡선**: 4년차 웹 개발자가 빠르게 습득 가능

**이 프로젝트에 딱 맞는 이유:**
- NoSQL 구조 (복잡한 SQL 불필요)
- 실시간 우선 (게임의 본질)
- 빠른 MVP 출시 (2개월 제약)

---

### 🟡 Supabase 고려 가능한 경우 (향후 Cycle 2-3)

**만약 다음 요구사항이 생긴다면:**

1. **복잡한 통계 대시보드 필요**
   - 예: "어떤 테마가 가장 어려운가?" (SQL 집계)
   - 예: "사용자별 승률 통계" (조인 쿼리)

2. **셀프 호스팅 필요**
   - 회사 내부 서버에서 운영
   - 데이터 주권 문제

3. **벤더 락인 우려**
   - Firebase 가격 인상 시 대응
   - 오픈소스 선호

**하지만 Cycle 1에서는 불필요:**
- 통계는 간단한 집계면 충분 (Firebase에서도 가능)
- 클라우드 운영이 목표 (셀프 호스팅 불필요)
- Google은 Firebase를 계속 지원 중 (락인 걱정 적음)

---

## 💡 하이브리드 접근 (선택 사항)

**Firebase (실시간) + Supabase (분석)**

```
┌─────────────────────────────────────┐
│  게임 실시간 데이터 (Firebase RTDB)  │
│  - 캔버스 동기화                     │
│  - 채팅 메시지                       │
│  - 턴 관리                          │
└─────────────────────────────────────┘
            ↓ (게임 종료 시)
┌─────────────────────────────────────┐
│  게임 로그 저장 (Supabase Postgres)  │
│  - 통계 분석 (SQL 쿼리)              │
│  - 리더보드                         │
│  - 사용자 프로필                     │
└─────────────────────────────────────┘
```

**장점:**
- 실시간 성능 + SQL 강력함 모두 확보
- 각 도구를 최적의 용도로 사용

**단점:**
- 복잡도 증가 (2개 백엔드 관리)
- 비용 증가
- 2개월 개발에는 과도함

**결론:** Cycle 3 이후 고려 (현재는 불필요)

---

## 📝 결론 요약

| 평가 항목 | Firebase | Supabase | 승자 |
|----------|----------|----------|------|
| 실시간 동기화 | ⚡ 50ms | 🐢 200-500ms | **Firebase** |
| AI 통합 | ✅ Genkit | ⚠️ 수동 | **Firebase** |
| 서울 리전 | ✅ 있음 | ❌ 없음 | **Firebase** |
| 비용 | $5-11/월 | $6-11/월 | **Firebase** |
| 개발 속도 | ✅ 빠름 | ⚠️ 보통 | **Firebase** |
| PostgreSQL | ❌ 없음 | ✅ 있음 | Supabase |
| 오픈소스 | ❌ 독점 | ✅ MIT | Supabase |
| **총점** | **5승** | **2승** | **Firebase** |

---

## 🚀 최종 권장 사항

**Project Da Vinci Cycle 1: Firebase 유지**

**이유:**
1. 실시간 캔버스 동기화 성능 (핵심 기능)
2. Firebase Genkit으로 빠른 AI 통합
3. 서울 리전 지원
4. 2개월 개발 일정 준수

**향후 고려:**
- Cycle 2-3에서 복잡한 통계 필요 시 Supabase 추가 검토
- 또는 Firebase + BigQuery 조합 고려

**지금 Supabase로 전환하면:**
- 실시간 성능 저하로 사용자 경험 악화
- 개발 기간 2주 이상 증가 (학습 + 재설계)
- 한국 사용자에게 지연 시간 증가

**"올바른 도구를 올바른 용도로"**
- Firebase: 실시간 협업 게임 ✅
- Supabase: 복잡한 데이터 분석 앱 ✅

---

**문의사항이 있으시면 언제든 질문해주세요!**
