import { useEffect, useRef, useId } from 'react'
import { useSmartPenStore } from '@/store/smartPenStore'
import type { ScreenDot } from 'web_pen_sdk/dist/Util/type'

interface UseSmartPenOptions {
  onStrokeStart?: (dot: ScreenDot) => void
  onStrokeMove?: (dot: ScreenDot) => void
  onStrokeEnd?: (dot: ScreenDot) => void
  onHover?: (dot: ScreenDot) => void
  onConnect?: () => void
  onDisconnect?: () => void
  canvasSize?: { width: number; height: number }
}

/**
 * 스마트펜 SDK 통합 훅 (Zustand 기반)
 *
 * - 전역 상태로 대기실 ↔ 게임룸 간 연결 상태 공유
 * - 컴포넌트별로 독립적인 콜백 등록 가능
 *
 * @example
 * const { state, connect, disconnect } = useSmartPen({
 *   onStrokeMove: (dot) => drawOnCanvas(dot),
 *   canvasSize: { width: 800, height: 600 }
 * })
 */
export function useSmartPen(options: UseSmartPenOptions = {}) {
  const {
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    onHover,
    onConnect,
    onDisconnect,
    canvasSize,
  } = options

  // Store에서 필요한 것들 가져오기 (각각 개별 구독으로 무한 루프 방지)
  const isScanning = useSmartPenStore((state) => state.isScanning)
  const isConnected = useSmartPenStore((state) => state.isConnected)
  const connectedPenMac = useSmartPenStore((state) => state.connectedPenMac)
  const battery = useSmartPenStore((state) => state.battery)
  const error = useSmartPenStore((state) => state.error)
  const isPasswordRequired = useSmartPenStore((state) => state.isPasswordRequired)

  const connect = useSmartPenStore((state) => state.connect)
  const disconnect = useSmartPenStore((state) => state.disconnect)
  const submitPassword = useSmartPenStore((state) => state.submitPassword)
  const registerCallbacks = useSmartPenStore((state) => state.registerCallbacks)
  const unregisterCallbacks = useSmartPenStore((state) => state.unregisterCallbacks)
  const setCanvasSize = useSmartPenStore((state) => state.setCanvasSize)

  // state 객체로 묶기
  const state = {
    isScanning,
    isConnected,
    connectedPenMac,
    battery,
    error,
    isPasswordRequired,
  }

  // 고유 ID로 콜백 등록
  const callbackId = useId()

  // 콜백 ref (최신 값 유지)
  const callbacksRef = useRef({
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    onHover,
    onConnect,
    onDisconnect,
  })

  useEffect(() => {
    callbacksRef.current = {
      onStrokeStart,
      onStrokeMove,
      onStrokeEnd,
      onHover,
      onConnect,
      onDisconnect,
    }
  }, [onStrokeStart, onStrokeMove, onStrokeEnd, onHover, onConnect, onDisconnect])

  // 캔버스 크기 업데이트
  useEffect(() => {
    if (canvasSize) {
      setCanvasSize(canvasSize)
    }
  }, [canvasSize, setCanvasSize])

  // 콜백 등록/해제
  useEffect(() => {
    registerCallbacks(callbackId, callbacksRef.current)

    return () => {
      unregisterCallbacks(callbackId)
    }
  }, [callbackId, registerCallbacks, unregisterCallbacks])

  return {
    state,
    connect,
    disconnect,
    submitPassword,
    isConnected,
    isScanning,
  }
}
