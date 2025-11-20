import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSmartPen } from './useSmartPen'
import type { PenDevice, Dot } from '@/types/smartpen.types'

// Mock web_pen_sdk
const mockPenHelper = {
  dotCallback: null as ((mac: string, dot: Dot) => void) | null,
  messageCallback: null as ((mac: string, type: number, args: unknown) => void) | null,
  scanPen: vi.fn(),
  connectDevice: vi.fn(),
  serviceBinding_16: vi.fn(),
  characteristicBinding: vi.fn(),
  disconnect: vi.fn(),
  ncodeToScreen: vi.fn(),
}

vi.mock('web_pen_sdk', () => ({
  PenHelper: mockPenHelper,
}))

describe('useSmartPen', () => {
  const mockDevice: PenDevice = {
    mac: '00:11:22:33:44:55',
    name: 'Neo smartpen N2',
    deviceType: 'smartpen',
  }

  const canvasSize = { width: 800, height: 600 }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('초기 상태가 올바르게 설정됨', () => {
    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    expect(result.current.state.isScanning).toBe(false)
    expect(result.current.state.isConnected).toBe(false)
    expect(result.current.state.devices).toEqual([])
    expect(result.current.state.connectedDevice).toBe(null)
    expect(result.current.state.battery).toBe(100)
    expect(result.current.state.error).toBe(null)
  })

  it('scanDevices 호출 시 펜 스캔 시작', async () => {
    mockPenHelper.scanPen.mockResolvedValue(mockDevice)

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    await act(async () => {
      await result.current.scanDevices()
    })

    await waitFor(() => {
      expect(result.current.state.isScanning).toBe(false)
    })

    expect(mockPenHelper.scanPen).toHaveBeenCalled()
    expect(result.current.state.devices).toEqual([mockDevice])
  })

  it('스캔 실패 시 에러 상태 설정', async () => {
    mockPenHelper.scanPen.mockRejectedValue(new Error('Bluetooth not available'))

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    await act(async () => {
      await result.current.scanDevices()
    })

    await waitFor(() => {
      expect(result.current.state.error).toBe('Bluetooth not available')
    })
  })

  it('connectDevice 호출 시 펜 연결', async () => {
    const mockConnectedDevice = {
      device: mockDevice,
      service: {
        read: 'read-characteristic',
        write: 'write-characteristic',
      },
    }

    mockPenHelper.connectDevice.mockResolvedValue(mockConnectedDevice)
    mockPenHelper.serviceBinding_16.mockResolvedValue(mockConnectedDevice.service)
    mockPenHelper.characteristicBinding.mockResolvedValue(undefined)

    const onConnect = vi.fn()

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
        onConnect,
      })
    )

    await act(async () => {
      await result.current.connectDevice(mockDevice)
    })

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(true)
    })

    expect(result.current.state.connectedDevice).toEqual(mockDevice)
    expect(onConnect).toHaveBeenCalled()
  })

  it('연결 실패 시 에러 상태 설정', async () => {
    mockPenHelper.connectDevice.mockRejectedValue(new Error('Connection failed'))

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    await act(async () => {
      await result.current.connectDevice(mockDevice)
    })

    await waitFor(() => {
      expect(result.current.state.error).toBe('Connection failed')
    })

    expect(result.current.state.isConnected).toBe(false)
  })

  it('disconnect 호출 시 연결 해제', async () => {
    const mockConnectedDevice = {
      device: mockDevice,
      service: {
        read: 'read-characteristic',
        write: 'write-characteristic',
      },
    }

    mockPenHelper.connectDevice.mockResolvedValue(mockConnectedDevice)
    mockPenHelper.serviceBinding_16.mockResolvedValue(mockConnectedDevice.service)
    mockPenHelper.characteristicBinding.mockResolvedValue(undefined)

    const onDisconnect = vi.fn()

    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
        onDisconnect,
      })
    )

    // 먼저 연결
    await act(async () => {
      await result.current.connectDevice(mockDevice)
    })

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(true)
    })

    // 연결 해제
    act(() => {
      result.current.disconnect()
    })

    expect(result.current.state.isConnected).toBe(false)
    expect(result.current.state.connectedDevice).toBe(null)
    expect(onDisconnect).toHaveBeenCalled()
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

  it('Dot 이벤트를 올바르게 처리함 (pen down)', () => {
    const onStrokeStart = vi.fn()
    mockPenHelper.ncodeToScreen.mockReturnValue({
      x: 100,
      y: 200,
      f: 50,
      timestamp: Date.now(),
      dotType: 0,
    })

    renderHook(() =>
      useSmartPen({
        canvasSize,
        onStrokeStart,
      })
    )

    const mockDot: Dot = {
      x: 1000,
      y: 2000,
      f: 50,
      timestamp: Date.now(),
      dotType: 0, // pen down
    }

    // Dot callback 호출
    if (mockPenHelper.dotCallback) {
      mockPenHelper.dotCallback(mockDevice.mac, mockDot)
    }

    expect(onStrokeStart).toHaveBeenCalled()
  })

  it('Dot 이벤트를 올바르게 처리함 (pen move)', () => {
    const onStrokeMove = vi.fn()
    mockPenHelper.ncodeToScreen.mockReturnValue({
      x: 150,
      y: 250,
      f: 60,
      timestamp: Date.now(),
      dotType: 1,
    })

    renderHook(() =>
      useSmartPen({
        canvasSize,
        onStrokeMove,
      })
    )

    const mockDot: Dot = {
      x: 1500,
      y: 2500,
      f: 60,
      timestamp: Date.now(),
      dotType: 1, // pen move
    }

    // Dot callback 호출
    if (mockPenHelper.dotCallback) {
      mockPenHelper.dotCallback(mockDevice.mac, mockDot)
    }

    expect(onStrokeMove).toHaveBeenCalled()
  })

  it('Dot 이벤트를 올바르게 처리함 (pen up)', () => {
    const onStrokeEnd = vi.fn()
    mockPenHelper.ncodeToScreen.mockReturnValue({
      x: 200,
      y: 300,
      f: 0,
      timestamp: Date.now(),
      dotType: 2,
    })

    renderHook(() =>
      useSmartPen({
        canvasSize,
        onStrokeEnd,
      })
    )

    const mockDot: Dot = {
      x: 2000,
      y: 3000,
      f: 0,
      timestamp: Date.now(),
      dotType: 2, // pen up
    }

    // Dot callback 호출
    if (mockPenHelper.dotCallback) {
      mockPenHelper.dotCallback(mockDevice.mac, mockDot)
    }

    expect(onStrokeEnd).toHaveBeenCalled()
  })

  it('배터리 정보 메시지 처리', () => {
    const { result } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    // 배터리 메시지 콜백 호출
    if (mockPenHelper.messageCallback) {
      mockPenHelper.messageCallback(mockDevice.mac, 0x11, { battery: 75 })
    }

    expect(result.current.state.battery).toBe(75)
  })

  it('컴포넌트 언마운트 시 연결 해제', async () => {
    const mockConnectedDevice = {
      device: mockDevice,
      service: {
        read: 'read-characteristic',
        write: 'write-characteristic',
      },
    }

    mockPenHelper.connectDevice.mockResolvedValue(mockConnectedDevice)
    mockPenHelper.serviceBinding_16.mockResolvedValue(mockConnectedDevice.service)
    mockPenHelper.characteristicBinding.mockResolvedValue(undefined)

    const { result, unmount } = renderHook(() =>
      useSmartPen({
        canvasSize,
      })
    )

    // 연결
    await act(async () => {
      await result.current.connectDevice(mockDevice)
    })

    await waitFor(() => {
      expect(result.current.state.isConnected).toBe(true)
    })

    // 언마운트
    unmount()

    // disconnect가 호출되었어야 함
    expect(mockPenHelper.disconnect).toHaveBeenCalled()
  })
})
