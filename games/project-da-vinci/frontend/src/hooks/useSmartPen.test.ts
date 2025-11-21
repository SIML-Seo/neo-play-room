import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { Dot } from '@/types/smartpen.types'

// Mock PenController 타입
interface MockPenController {
  device: { id: string }
  info: {
    MacAddress: string
    DeviceName: string
  }
}

// vi.hoisted를 사용하여 mock이 vi.mock보다 먼저 정의되도록 함
const { mockPenHelper, mockPens } = vi.hoisted(() => {
  const mockPens: MockPenController[] = []
  const mockPenHelper = {
    dotCallback: null as ((mac: string, dot: Dot) => void) | null,
    messageCallback: null as ((mac: string, type: number, args: unknown) => void) | null,
    pens: mockPens,
    scanPen: vi.fn(),
    disconnect: vi.fn(),
    ncodeToScreen: vi.fn(),
    InputPassword: vi.fn(), // 비밀번호 입력 메서드
  }
  return { mockPenHelper, mockPens }
})

vi.mock('web_pen_sdk', () => ({
  PenHelper: mockPenHelper,
}))

// import는 vi.mock 이후에 해야 함
import { useSmartPen } from './useSmartPen'

describe('useSmartPen', () => {
  const canvasSize = { width: 800, height: 600 }

  beforeEach(() => {
    vi.clearAllMocks()
    // pens 배열 초기화
    mockPenHelper.pens.length = 0
    mockPenHelper.dotCallback = null
    mockPenHelper.messageCallback = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('초기 상태가 올바르게 설정됨', () => {
    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    expect(result.current.state.isScanning).toBe(false)
    expect(result.current.state.isConnected).toBe(false)
    expect(result.current.state.connectedPenMac).toBe(null)
    expect(result.current.state.battery).toBe(100)
    expect(result.current.state.error).toBe(null)
  })

  it('connect 호출 시 스캔 및 연결 시작', async () => {
    // scanPen 호출 시 pens 배열에 펜 추가 (실제 SDK 동작 모방)
    mockPenHelper.scanPen.mockImplementation(async () => {
      const mockPenController: MockPenController = {
        device: { id: 'device-1' },
        info: {
          MacAddress: '00:11:22:33:44:55',
          DeviceName: 'Neo smartpen N2',
        },
      }
      mockPenHelper.pens.push(mockPenController)
    })

    const onConnect = vi.fn()

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
        onConnect,
      })
    )

    await act(async () => {
      await result.current.connect()
    })

    await waitFor(() => {
      expect(result.current.state.isScanning).toBe(false)
    })

    expect(mockPenHelper.scanPen).toHaveBeenCalled()
    expect(result.current.state.isConnected).toBe(true)
  })

  it('이미 연결된 펜이 있으면 scanPen을 호출하지 않음', async () => {
    // 이미 연결된 펜 시뮬레이션
    mockPenHelper.pens.push({
      device: { id: 'existing-device' },
      info: {
        MacAddress: 'AA:BB:CC:DD:EE:FF',
        DeviceName: 'Existing Pen',
      },
    })

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    await act(async () => {
      await result.current.connect()
    })

    expect(mockPenHelper.scanPen).not.toHaveBeenCalled()
    expect(result.current.state.isConnected).toBe(true)
  })

  it('스캔/연결 실패 시 에러 상태 설정', async () => {
    mockPenHelper.scanPen.mockRejectedValue(new Error('Bluetooth not available'))

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    await act(async () => {
      await result.current.connect()
    })

    await waitFor(() => {
      expect(result.current.state.error).toBe('Bluetooth not available')
    })

    expect(result.current.state.isConnected).toBe(false)
    expect(result.current.state.isScanning).toBe(false)
  })

  it('disconnect 호출 시 연결 해제', async () => {
    // 연결된 펜 시뮬레이션
    const mockPenController: MockPenController = {
      device: { id: 'device-1' },
      info: {
        MacAddress: '00:11:22:33:44:55',
        DeviceName: 'Neo smartpen N2',
      },
    }
    mockPenHelper.pens.push(mockPenController)

    const onDisconnect = vi.fn()

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
        onDisconnect,
      })
    )

    // 연결 상태 확인을 위해 약간의 대기
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // 연결 해제
    act(() => {
      result.current.disconnect()
    })

    expect(mockPenHelper.disconnect).toHaveBeenCalledWith(mockPenController)
    expect(result.current.state.isConnected).toBe(false)
    expect(result.current.state.connectedPenMac).toBe(null)
    expect(onDisconnect).toHaveBeenCalled()
  })

  it('연결된 펜이 없으면 disconnect가 아무것도 하지 않음', () => {
    const onDisconnect = vi.fn()

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
        onDisconnect,
      })
    )

    act(() => {
      result.current.disconnect()
    })

    expect(mockPenHelper.disconnect).not.toHaveBeenCalled()
    expect(onDisconnect).not.toHaveBeenCalled()
  })

  it('Dot 콜백이 올바르게 설정됨', () => {
    const onStrokeStart = vi.fn()
    const onStrokeMove = vi.fn()
    const onStrokeEnd = vi.fn()

    renderHook(() =>
      useSmartPen({
        canvasSize,
        onStrokeStart,
        onStrokeMove,
        onStrokeEnd,
      })
    )

    // Callback이 설정되었는지 확인
    expect(mockPenHelper.dotCallback).not.toBe(null)
    expect(mockPenHelper.messageCallback).not.toBe(null)
  })

  it('Dot 이벤트를 올바르게 처리함 (pen down - DotType 0)', () => {
    const onStrokeStart = vi.fn()
    mockPenHelper.ncodeToScreen.mockReturnValue({ x: 100, y: 200 })

    renderHook(() =>
      useSmartPen({
        canvasSize,
        onStrokeStart,
      })
    )

    const mockDot: Dot = {
      pageInfo: { section: 0, owner: 0, book: 0, page: 0 },
      x: 1000,
      y: 2000,
      f: 50,
      DotType: 0, // pen down (대문자!)
      timeStamp: Date.now(),
      timeDiff: 0,
      penTipType: 0,
      color: 0,
      angle: { tx: 0, ty: 0, twist: 0 },
    }

    // Dot callback 호출
    if (mockPenHelper.dotCallback) {
      mockPenHelper.dotCallback('00:11:22:33:44:55', mockDot)
    }

    expect(onStrokeStart).toHaveBeenCalled()
  })

  it('Dot 이벤트를 올바르게 처리함 (pen move - DotType 1)', () => {
    const onStrokeMove = vi.fn()
    mockPenHelper.ncodeToScreen.mockReturnValue({ x: 150, y: 250 })

    renderHook(() =>
      useSmartPen({
        canvasSize,
        onStrokeMove,
      })
    )

    const mockDot: Dot = {
      pageInfo: { section: 0, owner: 0, book: 0, page: 0 },
      x: 1500,
      y: 2500,
      f: 60,
      DotType: 1, // pen move
      timeStamp: Date.now(),
      timeDiff: 0,
      penTipType: 0,
      color: 0,
      angle: { tx: 0, ty: 0, twist: 0 },
    }

    if (mockPenHelper.dotCallback) {
      mockPenHelper.dotCallback('00:11:22:33:44:55', mockDot)
    }

    expect(onStrokeMove).toHaveBeenCalled()
  })

  it('Dot 이벤트를 올바르게 처리함 (pen up - DotType 2)', () => {
    const onStrokeEnd = vi.fn()
    mockPenHelper.ncodeToScreen.mockReturnValue({ x: 200, y: 300 })

    renderHook(() =>
      useSmartPen({
        canvasSize,
        onStrokeEnd,
      })
    )

    const mockDot: Dot = {
      pageInfo: { section: 0, owner: 0, book: 0, page: 0 },
      x: 2000,
      y: 3000,
      f: 0,
      DotType: 2, // pen up
      timeStamp: Date.now(),
      timeDiff: 0,
      penTipType: 0,
      color: 0,
      angle: { tx: 0, ty: 0, twist: 0 },
    }

    if (mockPenHelper.dotCallback) {
      mockPenHelper.dotCallback('00:11:22:33:44:55', mockDot)
    }

    expect(onStrokeEnd).toHaveBeenCalled()
  })

  it('Hover 이벤트 처리 (DotType 3)', () => {
    const onHover = vi.fn()
    mockPenHelper.ncodeToScreen.mockReturnValue({ x: 300, y: 400 })

    renderHook(() =>
      useSmartPen({
        canvasSize,
        onHover,
      })
    )

    const mockDot: Dot = {
      pageInfo: { section: 0, owner: 0, book: 0, page: 0 },
      x: 3000,
      y: 4000,
      f: 0,
      DotType: 3, // hover
      timeStamp: Date.now(),
      timeDiff: 0,
      penTipType: 0,
      color: 0,
      angle: { tx: 0, ty: 0, twist: 0 },
    }

    if (mockPenHelper.dotCallback) {
      mockPenHelper.dotCallback('00:11:22:33:44:55', mockDot)
    }

    expect(onHover).toHaveBeenCalled()
  })

  it('배터리 정보 메시지 처리 (type 0x11)', async () => {
    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    // 배터리 메시지 콜백 호출 (SETTING_INFO - type 0x11)
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback('00:11:22:33:44:55', 0x11, { Battery: 75 })
    }

    await waitFor(() => {
      expect(result.current.state.battery).toBe(75)
    })
  })

  it('PEN_CONNECTION_SUCCESS 메시지 처리 (type 0x06) - 연결 성공', async () => {
    const onConnect = vi.fn()

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
        onConnect,
      })
    )

    // PEN_CONNECTION_SUCCESS 메시지 콜백 호출
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback('00:11:22:33:44:55', 0x06, {})
    }

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(true)
    })

    expect(result.current.state.connectedPenMac).toBe('00:11:22:33:44:55')
    expect(onConnect).toHaveBeenCalled()
  })

  it('PEN_AUTHORIZED 메시지 처리 (type 0x01) - 펜 인증 성공', async () => {
    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    // PEN_AUTHORIZED 메시지 콜백 호출
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback('00:11:22:33:44:55', 0x01, {})
    }

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(true)
    })

    expect(result.current.state.connectedPenMac).toBe('00:11:22:33:44:55')
  })

  it('PEN_DISCONNECTED 메시지 처리 (type 0x04) - 연결 해제', async () => {
    const onDisconnect = vi.fn()

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
        onDisconnect,
      })
    )

    // 먼저 연결 상태로 만듦
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback('00:11:22:33:44:55', 0x06, {})
    }

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(true)
    })

    // PEN_DISCONNECTED 메시지 콜백 호출
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback('00:11:22:33:44:55', 0x04, {})
    }

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(false)
    })

    expect(result.current.state.connectedPenMac).toBe(null)
    expect(onDisconnect).toHaveBeenCalled()
  })

  it('PEN_PASSWORD_REQUEST 메시지 처리 (type 0x02) - 연결된 펜이 있으면 기본 비밀번호 입력 시도', async () => {
    // 연결된 펜 설정
    mockPenHelper.pens.push({
      device: { id: 'device-1' },
      info: { MacAddress: '00:11:22:33:44:55', DeviceName: 'NeoSmartpen' },
    })

    renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    // PEN_PASSWORD_REQUEST 메시지 콜백 호출
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback('00:11:22:33:44:55', 0x02, {})
    }

    // InputPassword가 기본 비밀번호 "0000"으로 호출되었는지 확인
    await waitFor(() => {
      expect(mockPenHelper.InputPassword).toHaveBeenCalledWith(
        expect.objectContaining({ info: { MacAddress: '00:11:22:33:44:55', DeviceName: 'NeoSmartpen' } }),
        '0000'
      )
    })
  })

  it('PEN_PASSWORD_REQUEST 메시지 처리 (type 0x02) - 연결된 펜이 없으면 에러 표시', async () => {
    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    // 연결된 펜 없이 PEN_PASSWORD_REQUEST 메시지 콜백 호출
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback('00:11:22:33:44:55', 0x02, {})
    }

    await waitFor(() => {
      expect(result.current.state.error).toContain('비밀번호')
    })
  })

  it('EVENT_LOW_BATTERY 메시지 처리 (type 0x63) - 배터리 부족 경고', async () => {
    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    // EVENT_LOW_BATTERY 메시지 콜백 호출
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback('00:11:22:33:44:55', 0x63, {})
    }

    await waitFor(() => {
      expect(result.current.state.error).toContain('배터리')
    })
  })

  it('배터리 충전 중 상태 처리 (Battery=128)', async () => {
    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    // PEN_SETTING_INFO with Battery=128 (충전 중)
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback('00:11:22:33:44:55', 0x11, { Battery: 128 })
    }

    await waitFor(() => {
      expect(result.current.state.battery).toBe(100) // 충전 중이면 100으로 표시
    })
  })

  it('좌표 변환 실패 시 수동 변환 사용', () => {
    const onStrokeStart = vi.fn()
    // ncodeToScreen이 에러를 던지도록 설정
    mockPenHelper.ncodeToScreen.mockImplementation(() => {
      throw new Error('Conversion failed')
    })

    renderHook(() =>
      useSmartPen({
        canvasSize,
        onStrokeStart,
      })
    )

    const mockDot: Dot = {
      pageInfo: { section: 0, owner: 0, book: 0, page: 0 },
      x: 7535, // 중간 좌표
      y: 10640,
      f: 50,
      DotType: 0,
      timeStamp: Date.now(),
      timeDiff: 0,
      penTipType: 0,
      color: 0,
      angle: { tx: 0, ty: 0, twist: 0 },
    }

    if (mockPenHelper.dotCallback) {
      mockPenHelper.dotCallback('00:11:22:33:44:55', mockDot)
    }

    // 콜백이 호출되었는지 확인 (수동 변환 사용)
    expect(onStrokeStart).toHaveBeenCalled()

    // 변환된 좌표 확인 (대략적인 중간 좌표)
    const callArg = onStrokeStart.mock.calls[0][0]
    expect(callArg.x).toBeGreaterThan(0)
    expect(callArg.x).toBeLessThan(canvasSize.width)
    expect(callArg.y).toBeGreaterThan(0)
    expect(callArg.y).toBeLessThan(canvasSize.height)
  })

  it('isConnected와 isScanning 헬퍼 속성이 올바르게 반환됨', () => {
    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    expect(result.current.isConnected).toBe(result.current.state.isConnected)
    expect(result.current.isScanning).toBe(result.current.state.isScanning)
  })
})
