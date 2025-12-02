import { create } from 'zustand'
import { PenHelper } from 'web_pen_sdk'
import type { Dot } from 'web_pen_sdk/dist/Util/type'

// ncode 용지 그리기 영역 크기 (Ncode 단위)
// A4 용지의 대략적인 크기를 기준으로 설정
const DRAWING_AREA_SIZE = {
  width: 88.5, // A4 width in NU (약 210mm)
  height: 125.2, // A4 height in NU (약 297mm)
}

// 확장된 ScreenDot - 압력 정보 포함
export interface ExtendedScreenDot {
  x: number
  y: number
  f: number // 압력 (0-1024)
  dotType: number
  timeStamp: number
}

export interface SmartPenState {
  isScanning: boolean
  isConnected: boolean
  connectedPenMac: string | null
  battery: number
  error: string | null
  isPasswordRequired: boolean
}

interface SmartPenCallbacks {
  onStrokeStart?: (dot: ExtendedScreenDot) => void
  onStrokeMove?: (dot: ExtendedScreenDot) => void
  onStrokeEnd?: (dot: ExtendedScreenDot) => void
  onHover?: (dot: ExtendedScreenDot) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

interface SmartPenStore extends SmartPenState {
  // Canvas 크기
  canvasSize: { width: number; height: number }

  // Actions
  connect: () => Promise<void>
  disconnect: () => void
  submitPassword: (password: string) => void
  setCanvasSize: (size: { width: number; height: number }) => void
  registerCallbacks: (id: string, callbacks: SmartPenCallbacks) => void
  unregisterCallbacks: (id: string) => void

  // Internal
  setState: (partial: Partial<SmartPenState>) => void
}

// 등록된 콜백들 (store 외부에서 관리)
const callbacksMap = new Map<string, SmartPenCallbacks>()

// 세션 상태 관리
// strokeOrigin: 첫 터치 좌표 (이 좌표가 캔버스 중앙이 됨)
let strokeOrigin: { x: number; y: number } | null = null
// 세션 시작 여부
let sessionInitialized = false

/**
 * 수동 좌표 변환 함수 (동적 기준점 기반)
 *
 * 핵심 원리:
 * 1. 첫 터치 좌표를 기준점(origin)으로 설정
 * 2. 이후 모든 좌표는 기준점으로부터의 상대 좌표로 계산
 * 3. 상대 좌표를 캔버스 중앙 기준으로 매핑
 *
 * 장점:
 * - 어떤 Ncode 노트든 상관없이 동작
 * - SOB(Section-Owner-Book)와 무관하게 첫 터치 기준으로 그리기 영역 설정
 */
function convertToScreenCoordinates(
  dot: Dot,
  canvasSize: { width: number; height: number }
): ExtendedScreenDot {
  const canvasWidth = canvasSize.width || 800
  const canvasHeight = canvasSize.height || 600

  // 첫 세션: 첫 터치 좌표를 기준점으로 설정
  if (!sessionInitialized) {
    strokeOrigin = { x: dot.x, y: dot.y }
    sessionInitialized = true
    console.log('[SmartPenStore] 세션 시작 - 기준점 설정:', {
      originX: strokeOrigin.x.toFixed(2),
      originY: strokeOrigin.y.toFixed(2),
    })
  }

  // 기준점이 없으면 현재 좌표를 기준점으로 (안전장치)
  if (!strokeOrigin) {
    strokeOrigin = { x: dot.x, y: dot.y }
  }

  // 상대 좌표 계산 (기준점으로부터의 오프셋)
  const relativeX = dot.x - strokeOrigin.x
  const relativeY = dot.y - strokeOrigin.y

  // Ncode → Screen 좌표 변환
  // DRAWING_AREA_SIZE를 캔버스 크기에 맞게 스케일링
  const scaleX = canvasWidth / DRAWING_AREA_SIZE.width
  const scaleY = canvasHeight / DRAWING_AREA_SIZE.height

  // 캔버스 중앙을 첫 터치 위치로 사용
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  // 캔버스 좌표로 변환
  const screenX = centerX + relativeX * scaleX
  const screenY = centerY + relativeY * scaleY

  // 캔버스 경계 내로 클램핑
  const clampedX = Math.max(0, Math.min(canvasWidth, screenX))
  const clampedY = Math.max(0, Math.min(canvasHeight, screenY))

  return {
    x: clampedX,
    y: clampedY,
    f: dot.f ?? 512, // 압력 데이터 전달 (없으면 기본값 512)
    dotType: dot.dotType ?? (dot as unknown as { DotType?: number }).DotType ?? 0,
    timeStamp: dot.timeStamp ?? Date.now(),
  }
}

/**
 * 펜 세션 초기화
 * 새 게임 시작, 캔버스 클리어, 펜 재연결 시 호출
 * 다음 터치가 새로운 기준점이 됨
 */
export function resetPenSession() {
  strokeOrigin = null
  sessionInitialized = false
  console.log('[SmartPenStore] 펜 세션 초기화됨')
}

// SDK 초기화 (한 번만 실행)
let sdkInitialized = false

function initializeSDK(store: SmartPenStore) {
  if (sdkInitialized || typeof PenHelper === 'undefined') return
  sdkInitialized = true

  // Dot 콜백 설정
  PenHelper.dotCallback = (_mac: string, dot: Dot) => {
    // dotType 추출 (SDK에서 DotType 또는 dotType으로 전달될 수 있음)
    const dotType = dot.dotType ?? (dot as unknown as { DotType?: number }).DotType ?? 0

    // 좌표 변환 (압력 데이터 포함)
    const screenDot = convertToScreenCoordinates(dot, store.canvasSize)

    console.log('[SmartPenStore] Dot 수신:', {
      rawX: dot.x,
      rawY: dot.y,
      rawF: dot.f,
      dotType,
      screenX: screenDot.x.toFixed(2),
      screenY: screenDot.y.toFixed(2),
      screenF: screenDot.f,
    })

    // 모든 등록된 콜백에 전파
    callbacksMap.forEach((callbacks) => {
      switch (dotType) {
        case 0:
          callbacks.onStrokeStart?.(screenDot)
          break
        case 1:
          callbacks.onStrokeMove?.(screenDot)
          break
        case 2:
          callbacks.onStrokeEnd?.(screenDot)
          break
        case 3:
          callbacks.onHover?.(screenDot)
          break
      }
    })
  }

  // Message 콜백 설정
  PenHelper.messageCallback = (mac: string, type: number, args: unknown) => {
    console.log('[SmartPenStore] Message:', { mac, type, args })

    switch (type) {
      case 0x06: // PEN_CONNECTION_SUCCESS
        console.log('[SmartPenStore] 펜 연결 성공 (0x06)')
        store.setState({
          isScanning: false,
          connectedPenMac: mac,
          error: null,
        })
        break

      case 0x01: // PEN_AUTHORIZED
        console.log('[SmartPenStore] 펜 인증 성공 (0x01)')
        store.setState({
          isConnected: true,
          isScanning: false,
          connectedPenMac: mac,
          error: null,
          isPasswordRequired: false,
        })
        // onConnect 콜백 호출
        callbacksMap.forEach((callbacks) => callbacks.onConnect?.())
        break

      case 0x11: // PEN_SETTING_INFO
        console.log('[SmartPenStore] 펜 설정 정보 (0x11):', args)
        if (typeof args === 'object' && args !== null && 'Battery' in args) {
          const settingInfo = args as { Battery: number }
          const batteryValue = settingInfo.Battery === 128 ? 100 : settingInfo.Battery
          store.setState({
            isConnected: true,
            connectedPenMac: mac,
            battery: batteryValue,
          })
        }
        break

      case 0x04: // PEN_DISCONNECTED
        console.log('[SmartPenStore] 펜 연결 해제 (0x04)')
        store.setState({
          isConnected: false,
          connectedPenMac: null,
          battery: 100,
        })
        // onDisconnect 콜백 호출
        callbacksMap.forEach((callbacks) => callbacks.onDisconnect?.())
        break

      case 0x02: // PEN_PASSWORD_REQUEST
        console.log('[SmartPenStore] 비밀번호 요청 (0x02)')
        store.setState({
          isPasswordRequired: true,
          connectedPenMac: mac,
          error: null,
        })
        break

      case 0x63: // EVENT_LOW_BATTERY
        console.log('[SmartPenStore] 배터리 부족 (0x63)')
        store.setState({
          error: '스마트펜 배터리가 부족합니다.',
        })
        break

      case 0x64: // EVENT_POWER_OFF
        console.log('[SmartPenStore] 펜 전원 OFF (0x64)')
        store.setState({
          isConnected: false,
          connectedPenMac: null,
        })
        callbacksMap.forEach((callbacks) => callbacks.onDisconnect?.())
        break
    }
  }
}

export const useSmartPenStore = create<SmartPenStore>((set, get) => {
  const store: SmartPenStore = {
    // Initial state
    isScanning: false,
    isConnected: false,
    connectedPenMac: null,
    battery: 100,
    error: null,
    isPasswordRequired: false,
    canvasSize: { width: 800, height: 600 },

    // Actions
    setState: (partial) => set(partial),

    connect: async () => {
      if (typeof PenHelper === 'undefined') {
        set({ error: 'PenHelper SDK가 로드되지 않았습니다.' })
        return
      }

      // 이미 연결된 경우
      if (PenHelper.pens.length > 0) {
        console.log('[SmartPenStore] 이미 연결된 펜이 있습니다.')
        set({ isConnected: true, error: null })
        return
      }

      set({ isScanning: true, error: null })

      try {
        console.log('[SmartPenStore] 스캔 및 연결 시작...')
        await PenHelper.scanPen()

        if (PenHelper.pens.length > 0) {
          console.log('[SmartPenStore] 연결 성공')
          set({
            isScanning: false,
            connectedPenMac: PenHelper.pens[0]?.info?.MacAddress ?? null,
            error: null,
          })
        } else {
          set({ isScanning: false })
        }
      } catch (error) {
        console.error('[SmartPenStore] 연결 실패:', error)
        set({
          isScanning: false,
          error: error instanceof Error ? error.message : '스마트펜 연결에 실패했습니다.',
        })
      }
    },

    disconnect: () => {
      if (PenHelper.pens.length === 0) {
        console.log('[SmartPenStore] 연결된 펜이 없습니다.')
        return
      }

      try {
        console.log('[SmartPenStore] 연결 해제 중...')
        PenHelper.pens.forEach((penController) => {
          PenHelper.disconnect(penController)
        })

        set({
          isConnected: false,
          connectedPenMac: null,
          isPasswordRequired: false,
        })

        console.log('[SmartPenStore] 연결 해제 완료')
        callbacksMap.forEach((callbacks) => callbacks.onDisconnect?.())
      } catch (error) {
        console.error('[SmartPenStore] 연결 해제 실패:', error)
      }
    },

    submitPassword: (password: string) => {
      const state = get()
      if (!state.connectedPenMac) {
        console.error('[SmartPenStore] 비밀번호를 입력할 펜이 선택되지 않았습니다.')
        return
      }

      const pen = PenHelper.pens.find((p) => p.info?.MacAddress === state.connectedPenMac)
      if (!pen) {
        console.error('[SmartPenStore] 해당 MAC 주소의 펜을 찾을 수 없습니다:', state.connectedPenMac)
        set({
          error: '연결된 펜을 찾을 수 없습니다. 다시 시도해주세요.',
          isPasswordRequired: false,
        })
        return
      }

      try {
        console.log('[SmartPenStore] 비밀번호 제출:', password)
        pen.InputPassword(password)
      } catch (error) {
        console.error('[SmartPenStore] 비밀번호 제출 실패:', error)
        set({
          error: '비밀번호 제출 중 오류가 발생했습니다.',
        })
      }
    },

    setCanvasSize: (size) => {
      set({ canvasSize: size })
    },

    registerCallbacks: (id, callbacks) => {
      callbacksMap.set(id, callbacks)
    },

    unregisterCallbacks: (id) => {
      callbacksMap.delete(id)
    },
  }

  // SDK 초기화
  initializeSDK(store)

  return store
})
