import { useState, useEffect, useRef, useCallback } from 'react'
import { PenHelper } from 'web_pen_sdk'
import type {
  Dot,
  ScreenDot,
  PageInfo,
  PaperSize,
  View,
  PenDevice,
  PenController,
  SmartPenState,
} from '@/types/smartpen.types'

interface UseSmartPenOptions {
  onStrokeStart?: (dot: ScreenDot) => void
  onStrokeMove?: (dot: ScreenDot) => void
  onStrokeEnd?: (dot: ScreenDot) => void
  onConnect?: () => void
  onDisconnect?: () => void
  canvasSize: { width: number; height: number }
}

/**
 * 네오랩 스마트펜 SDK 통합 훅
 *
 * @example
 * const { state, scanDevices, connectDevice, disconnect } = useSmartPen({
 *   onStrokeMove: (dot) => drawOnCanvas(dot),
 *   canvasSize: { width: 800, height: 600 }
 * })
 */
export function useSmartPen(options: UseSmartPenOptions) {
  const {
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    onConnect,
    onDisconnect,
    canvasSize,
  } = options

  const [state, setState] = useState<SmartPenState>({
    isScanning: false,
    isConnected: false,
    devices: [],
    connectedDevice: null,
    battery: 100,
    error: null,
  })

  const penControllerRef = useRef<PenController | null>(null)

  // A4 용지 기본 크기 (ncode 좌표계)
  const paperSize: PaperSize = {
    Xmin: 0,
    Ymin: 0,
    Xmax: 15070, // A4 width in ncode units
    Ymax: 21280, // A4 height in ncode units
  }

  // Canvas view 설정
  const view: View = {
    width: canvasSize.width,
    height: canvasSize.height,
    margin: {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
  }

  // ncode 좌표를 Canvas 좌표로 변환
  const convertToScreenCoordinates = useCallback(
    (dot: Dot): ScreenDot => {
      try {
        // PenHelper의 좌표 변환 함수 사용
        const screenDot = PenHelper.ncodeToScreen(dot, view, paperSize)
        return screenDot
      } catch (error) {
        console.error('[SmartPen] 좌표 변환 실패:', error)
        // Fallback: 수동 변환
        const scaleX = canvasSize.width / (paperSize.Xmax - paperSize.Xmin)
        const scaleY = canvasSize.height / (paperSize.Ymax - paperSize.Ymin)
        return {
          x: (dot.x - paperSize.Xmin) * scaleX,
          y: (dot.y - paperSize.Ymin) * scaleY,
          f: dot.f,
          timestamp: dot.timestamp,
          dotType: dot.dotType,
        }
      }
    },
    [canvasSize, paperSize, view]
  )

  // Dot 콜백 설정
  useEffect(() => {
    if (typeof PenHelper === 'undefined') {
      setState((prev) => ({
        ...prev,
        error: 'PenHelper SDK가 로드되지 않았습니다. web_pen_sdk를 확인하세요.',
      }))
      return
    }

    PenHelper.dotCallback = (mac: string, dot: Dot) => {
      console.log('[SmartPen] Dot received:', { mac, dot })

      // 연결된 펜의 MAC 주소와 일치하는지 확인
      if (penControllerRef.current && penControllerRef.current.mac !== mac) {
        return
      }

      // 좌표 변환
      const screenDot = convertToScreenCoordinates(dot)

      // dotType에 따라 이벤트 발생
      switch (dot.dotType) {
        case 0: // pen down
          onStrokeStart?.(screenDot)
          break
        case 1: // pen move
          onStrokeMove?.(screenDot)
          break
        case 2: // pen up
          onStrokeEnd?.(screenDot)
          break
      }
    }

    // Message 콜백 설정 (연결 상태, 배터리 등)
    PenHelper.messageCallback = (mac: string, type: number, args: unknown) => {
      console.log('[SmartPen] Message:', { mac, type, args })

      switch (type) {
        case 0x06: // 연결 상태
          console.log('[SmartPen] 연결 상태 변경')
          break
        case 0x11: // 배터리 정보
          if (typeof args === 'object' && args !== null && 'battery' in args) {
            setState((prev) => ({
              ...prev,
              battery: (args as { battery: number }).battery,
            }))
          }
          break
      }
    }

    return () => {
      // 클린업
      PenHelper.dotCallback = null
      PenHelper.messageCallback = null
    }
  }, [convertToScreenCoordinates, onStrokeStart, onStrokeMove, onStrokeEnd])

  // 펜 스캔
  const scanDevices = useCallback(async () => {
    if (typeof PenHelper === 'undefined') {
      setState((prev) => ({
        ...prev,
        error: 'PenHelper SDK가 로드되지 않았습니다.',
      }))
      return
    }

    setState((prev) => ({ ...prev, isScanning: true, error: null }))

    try {
      console.log('[SmartPen] 스캔 시작...')
      const device = await PenHelper.scanPen()

      if (device) {
        setState((prev) => ({
          ...prev,
          devices: [device],
          isScanning: false,
        }))
        console.log('[SmartPen] 장치 발견:', device)
      } else {
        setState((prev) => ({
          ...prev,
          isScanning: false,
          error: '스마트펜을 찾을 수 없습니다.',
        }))
      }
    } catch (error) {
      console.error('[SmartPen] 스캔 실패:', error)
      setState((prev) => ({
        ...prev,
        isScanning: false,
        error: error instanceof Error ? error.message : '스캔 실패',
      }))
    }
  }, [])

  // 펜 연결
  const connectDevice = useCallback(
    async (device: PenDevice) => {
      if (typeof PenHelper === 'undefined') {
        setState((prev) => ({
          ...prev,
          error: 'PenHelper SDK가 로드되지 않았습니다.',
        }))
        return
      }

      try {
        console.log('[SmartPen] 연결 시작:', device)

        // 장치 연결
        const connectedDevice = await PenHelper.connectDevice(device)

        // 서비스 바인딩
        const service = await PenHelper.serviceBinding_16(connectedDevice.service, device)

        // Characteristic 바인딩
        await PenHelper.characteristicBinding(
          service.read,
          service.write,
          connectedDevice.device
        )

        // PenController 저장
        penControllerRef.current = {
          mac: device.mac,
          device: device,
          disconnect: () => {
            if (penControllerRef.current) {
              PenHelper.disconnect(penControllerRef.current)
            }
          },
        }

        setState((prev) => ({
          ...prev,
          isConnected: true,
          connectedDevice: device,
          error: null,
        }))

        console.log('[SmartPen] 연결 완료')
        onConnect?.()
      } catch (error) {
        console.error('[SmartPen] 연결 실패:', error)
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : '연결 실패',
        }))
      }
    },
    [onConnect]
  )

  // 펜 연결 해제
  const disconnect = useCallback(() => {
    if (penControllerRef.current) {
      console.log('[SmartPen] 연결 해제')
      penControllerRef.current.disconnect()
      penControllerRef.current = null

      setState((prev) => ({
        ...prev,
        isConnected: false,
        connectedDevice: null,
      }))

      onDisconnect?.()
    }
  }, [onDisconnect])

  // 컴포넌트 언마운트 시 연결 해제
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    state,
    scanDevices,
    connectDevice,
    disconnect,
  }
}
