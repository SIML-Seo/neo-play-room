import { create } from 'zustand'
import { PenHelper } from 'web_pen_sdk'
import type { Dot, ScreenDot, PaperSize } from 'web_pen_sdk/dist/Util/type'

// ncode 용지 사이즈 상수 (N-code A4)
const NCODE_A4_PAPER_SIZE: PaperSize = {
  Xmin: 0,
  Ymin: 0,
  Xmax: 15070,
  Ymax: 21280,
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
  onStrokeStart?: (dot: ScreenDot) => void
  onStrokeMove?: (dot: ScreenDot) => void
  onStrokeEnd?: (dot: ScreenDot) => void
  onHover?: (dot: ScreenDot) => void
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

// SDK 좌표 변환 함수
function convertToScreenCoordinates(
  dot: Dot,
  canvasSize: { width: number; height: number }
): ScreenDot {
  const view = {
    width: canvasSize.width || 800,
    height: canvasSize.height || 600,
  }

  return PenHelper.ncodeToScreen(dot, view, NCODE_A4_PAPER_SIZE)
}

// SDK 초기화 (한 번만 실행)
let sdkInitialized = false

function initializeSDK(store: SmartPenStore) {
  if (sdkInitialized || typeof PenHelper === 'undefined') return
  sdkInitialized = true

  // Dot 콜백 설정
  PenHelper.dotCallback = (_mac: string, dot: Dot) => {
    const screenDot = convertToScreenCoordinates(dot, store.canvasSize)
    const dotType = dot.dotType ?? 0

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
