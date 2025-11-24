import { useState, useEffect, useCallback, useRef } from 'react'
import { PenHelper } from 'web_pen_sdk'
import type { Dot, ScreenDot, PaperSize, View, SmartPenState } from '@/types/smartpen.types'

interface UseSmartPenOptions {
  onStrokeStart?: (dot: ScreenDot) => void
  onStrokeMove?: (dot: ScreenDot) => void
  onStrokeEnd?: (dot: ScreenDot) => void
  onHover?: (dot: ScreenDot) => void
  onConnect?: () => void
  onDisconnect?: () => void
  canvasSize: { width: number; height: number }
}

// ncode 용지 사이즈 상수 (N-code A4)
const NCODE_A4_PAPER_SIZE: PaperSize = {
  Xmin: 0,
  Ymin: 0,
  Xmax: 15070,
  Ymax: 21280,
}

/**
 * 네오랩 스마트펜 SDK 통합 훅
 *
 * SDK 동작 방식:
 * - scanPen()은 블루투스 장치 선택 + 자동 연결을 모두 수행
 * - 연결된 펜은 PenHelper.pens 배열에 저장됨
 * - dotCallback(mac, dot)으로 필기 데이터 수신
 * - messageCallback(mac, type, args)로 상태 메시지 수신
 *
 * @example
 * const { state, connect, disconnect } = useSmartPen({
 *   onStrokeMove: (dot) => drawOnCanvas(dot),
 *   canvasSize: { width: 800, height: 600 }
 * })
 */
export function useSmartPen(options: UseSmartPenOptions) {
  const { onStrokeStart, onStrokeMove, onStrokeEnd, onHover, onConnect, onDisconnect, canvasSize } =
    options

  const [state, setState] = useState<SmartPenState>({
    isScanning: false,
    isConnected: false,
    connectedPenMac: null,
    battery: 100,
    error: null,
    isPasswordRequired: false,
  })

  // 콜백 함수들을 ref로 저장 (의존성 문제 해결)
  const callbacksRef = useRef({
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    onHover,
    onConnect,
    onDisconnect,
  })

  // 콜백 ref 업데이트
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

  // Canvas View 설정
  const view: View = {
    width: canvasSize.width,
    height: canvasSize.height,
  }

  /**
   * ncode 좌표를 Canvas 좌표로 변환
   */
  const convertToScreenCoordinates = useCallback(
    (dot: Dot): ScreenDot => {
      // SDK의 ncodeToScreen 사용 시도
      try {
        const screenPos = PenHelper.ncodeToScreen(dot, view, NCODE_A4_PAPER_SIZE)
        return {
          x: screenPos.x,
          y: screenPos.y,
          f: dot.f,
          dotType: dot.DotType ?? dot.dotType ?? 0, // DotType(대문자) 우선
          timeStamp: dot.timeStamp,
        }
      } catch {
        // Fallback: 수동 좌표 변환
        const paperWidth = NCODE_A4_PAPER_SIZE.Xmax - NCODE_A4_PAPER_SIZE.Xmin
        const paperHeight = NCODE_A4_PAPER_SIZE.Ymax - NCODE_A4_PAPER_SIZE.Ymin
        const widthRatio = canvasSize.width / paperWidth
        const heightRatio = canvasSize.height / paperHeight

        return {
          x: (dot.x - NCODE_A4_PAPER_SIZE.Xmin) * widthRatio,
          y: (dot.y - NCODE_A4_PAPER_SIZE.Ymin) * heightRatio,
          f: dot.f,
          dotType: dot.DotType ?? dot.dotType ?? 0,
          timeStamp: dot.timeStamp,
        }
      }
    },
    [canvasSize.width, canvasSize.height, view]
  )

  /**
   * Dot 콜백 설정 - SDK에서 필기 데이터 수신 시 호출됨
   */
  useEffect(() => {
    // SDK 로드 확인
    if (typeof PenHelper === 'undefined') {
      console.error('[SmartPen] PenHelper SDK가 로드되지 않았습니다.')
      setState((prev) => ({
        ...prev,
        error: 'PenHelper SDK가 로드되지 않았습니다.',
      }))
      return
    }

    // Dot 콜백 설정 (필기 데이터 수신)
    PenHelper.dotCallback = (mac: string, dot: Dot) => {
      // 좌표 변환
      const screenDot = convertToScreenCoordinates(dot)

      // DotType에 따라 이벤트 발생
      // 0: PEN_DOWN, 1: PEN_MOVE, 2: PEN_UP, 3: PEN_HOVER
      const dotType = dot.DotType ?? dot.dotType ?? 0

      switch (dotType) {
        case 0: // PEN_DOWN
          console.log('[SmartPen] Pen Down:', { mac, screenDot })
          callbacksRef.current.onStrokeStart?.(screenDot)
          break
        case 1: // PEN_MOVE
          callbacksRef.current.onStrokeMove?.(screenDot)
          break
        case 2: // PEN_UP
          console.log('[SmartPen] Pen Up:', { mac, screenDot })
          callbacksRef.current.onStrokeEnd?.(screenDot)
          break
        case 3: // PEN_HOVER
          callbacksRef.current.onHover?.(screenDot)
          break
      }
    }

    // Message 콜백 설정 (연결 상태, 배터리 등)
    // README 참조: https://github.com/NeoSmartpen/WEB-SDK-Sample
    PenHelper.messageCallback = (mac: string, type: number, args: unknown) => {
      console.log('[SmartPen] Message:', { mac, type, args })

      // PenMessageType 상수 (README 기준)
      // 0x01: PEN_AUTHORIZED - 펜 인증 성공
      // 0x02: PEN_PASSWORD_REQUEST - 비밀번호 요청
      // 0x04: PEN_DISCONNECTED - 펜 연결 해제
      // 0x06: PEN_CONNECTION_SUCCESS - 펜 연결 성공
      // 0x11: PEN_SETTING_INFO - 펜 상태정보 (배터리, 메모리 등)

      switch (type) {
        case 0x06: // PEN_CONNECTION_SUCCESS - 펜 연결 성공
          console.log('[SmartPen] 펜 연결 성공 (0x06) - 인증 대기 중')
          // 연결은 되었으나 인증(비밀번호 등)이 완료되지 않았으므로 isConnected는 아직 false
          setState((prev) => ({
            ...prev,
            isScanning: false,
            connectedPenMac: mac,
            error: null,
          }))
          // onConnect는 인증 후 호출
          break

        case 0x01: // PEN_AUTHORIZED - 펜 인증 성공
          console.log('[SmartPen] 펜 인증 성공 (0x01)')
          // 인증 성공 시 연결 상태 업데이트
          setState((prev) => ({
            ...prev,
            isConnected: true,
            isScanning: false,
            connectedPenMac: mac,
            error: null,
            isPasswordRequired: false,
          }))
          callbacksRef.current.onConnect?.()
          break

        case 0x11: // PEN_SETTING_INFO - 배터리 정보 포함
          console.log('[SmartPen] 펜 설정 정보 (0x11):', args)
          // README 패턴: 이 이벤트에서 controller 확인 및 배터리 정보 저장
          if (typeof args === 'object' && args !== null && 'Battery' in args) {
            const settingInfo = args as { Battery: number }
            // 배터리 값이 128이면 충전 중
            const batteryValue = settingInfo.Battery === 128 ? 100 : settingInfo.Battery
            setState((prev) => ({
              ...prev,
              isConnected: true,
              connectedPenMac: mac,
              battery: batteryValue,
            }))
          }
          break

        case 0x04: // PEN_DISCONNECTED - 펜 연결 해제
          console.log('[SmartPen] 펜 연결 해제 (0x04)')
          setState((prev) => ({
            ...prev,
            isConnected: false,
            connectedPenMac: null,
            battery: 100,
          }))
          callbacksRef.current.onDisconnect?.()
          break

        case 0x02: // PEN_PASSWORD_REQUEST - 비밀번호 요청
          console.log('[SmartPen] 비밀번호 요청 (0x02)')
          // 사용자에게 비밀번호 입력 요청
          setState((prev) => ({
            ...prev,
            isPasswordRequired: true,
            connectedPenMac: mac, // 비밀번호 요청한 펜 MAC 저장
            error: null,
          }))
          break

        case 0x63: // EVENT_LOW_BATTERY - 배터리 부족
          console.log('[SmartPen] 배터리 부족 경고 (0x63)')
          setState((prev) => ({
            ...prev,
            error: '스마트펜 배터리가 부족합니다.',
          }))
          break

        case 0x64: // EVENT_POWER_OFF - 전원 OFF
          console.log('[SmartPen] 펜 전원 OFF (0x64)')
          setState((prev) => ({
            ...prev,
            isConnected: false,
            connectedPenMac: null,
          }))
          callbacksRef.current.onDisconnect?.()
          break
      }
    }

    return () => {
      // 클린업 - 콜백 해제
      PenHelper.dotCallback = null
      PenHelper.messageCallback = null
    }
  }, [convertToScreenCoordinates])

  /**
   * 연결 상태 동기화 (PenHelper.pens 기반)
   */
  useEffect(() => {
    const checkConnection = () => {
      const isConnected = PenHelper.pens && PenHelper.pens.length > 0
      const connectedPen = isConnected ? PenHelper.pens[0] : null

      setState((prev) => {
        // 연결이 끊어진 경우에만 처리 (연결 확인은 이벤트로 처리)
        if (prev.isConnected && !isConnected) {
          callbacksRef.current.onDisconnect?.()
          return {
            ...prev,
            isConnected: false,
            connectedPenMac: null,
          }
        }
        // 이미 연결된 상태라면 MAC 주소 업데이트 (혹시 변경되었을 경우)
        if (prev.isConnected && isConnected && connectedPen?.info?.MacAddress) {
           return {
             ...prev,
             connectedPenMac: connectedPen.info.MacAddress
           }
        }
        return prev
      })
    }

    // 주기적으로 연결 상태 확인
    const interval = setInterval(checkConnection, 1000)
    return () => clearInterval(interval)
  }, [])

  /**
   * 스마트펜 스캔 및 연결
   * SDK의 scanPen()은 블루투스 장치 선택 다이얼로그를 열고 자동으로 연결까지 수행
   */
  const connect = useCallback(async () => {
    if (typeof PenHelper === 'undefined') {
      setState((prev) => ({
        ...prev,
        error: 'PenHelper SDK가 로드되지 않았습니다.',
      }))
      return
    }

    // 이미 연결된 경우
    if (PenHelper.pens.length > 0) {
      console.log('[SmartPen] 이미 연결된 펜이 있습니다.')
      setState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
      }))
      return
    }

    setState((prev) => ({ ...prev, isScanning: true, error: null }))

    try {
      console.log('[SmartPen] 스캔 및 연결 시작...')
      // scanPen()은 Promise<void>를 반환하며 내부적으로:
      // 1. navigator.bluetooth.requestDevice()로 장치 선택 다이얼로그 표시
      // 2. 사용자가 장치 선택 시 자동으로 connectDevice() 호출
      // 3. 연결 완료 시 PenHelper.pens에 추가
      await PenHelper.scanPen()

      // 연결 성공 여부는 messageCallback에서 PEN_AUTHORIZED 이벤트로 확인
      // 또는 PenHelper.pens.length로 확인
      if (PenHelper.pens.length > 0) {
        console.log('[SmartPen] 연결 성공')
        setState((prev) => ({
          ...prev,
          // isConnected: true, // 여기서 true로 설정하지 않음 (인증 대기)
          isScanning: false,
          connectedPenMac: PenHelper.pens[0]?.info?.MacAddress ?? null,
          error: null,
        }))
        // callbacksRef.current.onConnect?.() // 인증 후 호출
      } else {
        // 사용자가 취소했거나 연결 실패
        setState((prev) => ({
          ...prev,
          isScanning: false,
        }))
      }
    } catch (error) {
      console.error('[SmartPen] 연결 실패:', error)
      setState((prev) => ({
        ...prev,
        isScanning: false,
        error: error instanceof Error ? error.message : '스마트펜 연결에 실패했습니다.',
      }))
    }
  }, [])

  /**
   * 스마트펜 연결 해제
   */
  const disconnect = useCallback(() => {
    if (PenHelper.pens.length === 0) {
      console.log('[SmartPen] 연결된 펜이 없습니다.')
      return
    }

    try {
      console.log('[SmartPen] 연결 해제 중...')
      // 모든 연결된 펜 해제
      PenHelper.pens.forEach((penController) => {
        PenHelper.disconnect(penController)
      })

      setState((prev) => ({
        ...prev,
        isConnected: false,
        connectedPenMac: null,
        isPasswordRequired: false,
      }))

      console.log('[SmartPen] 연결 해제 완료')
      callbacksRef.current.onDisconnect?.()
    } catch (error) {
      console.error('[SmartPen] 연결 해제 실패:', error)
    }
  }, [])

  /**
   * 비밀번호 제출
   */
  const submitPassword = useCallback(
    (password: string) => {
      if (!state.connectedPenMac) {
        console.error('[SmartPen] 비밀번호를 입력할 펜이 선택되지 않았습니다.')
        return
      }

      const pen = PenHelper.pens.find((p) => p.info?.MacAddress === state.connectedPenMac)
      if (!pen) {
        console.error('[SmartPen] 해당 MAC 주소의 펜을 찾을 수 없습니다:', state.connectedPenMac)
        setState((prev) => ({
          ...prev,
          error: '연결된 펜을 찾을 수 없습니다. 다시 시도해주세요.',
          isPasswordRequired: false,
        }))
        return
      }

      try {
        console.log('[SmartPen] 비밀번호 제출:', password)
        // PenHelper.InputPassword(pen, password) -> pen.InputPassword(password) 로 변경
        // @ts-ignore - SDK 타입 정의가 불완전할 수 있음
        pen.InputPassword(password)
        
        // 성공 여부는 PEN_AUTHORIZED (0x01) 또는 다시 PEN_PASSWORD_REQUEST (0x02)로 확인
      } catch (error) {
        console.error('[SmartPen] 비밀번호 제출 실패:', error)
        setState((prev) => ({
          ...prev,
          error: '비밀번호 제출 중 오류가 발생했습니다.',
        }))
      }
    },
    [state.connectedPenMac]
  )

  /**
   * 컴포넌트 언마운트 시 연결 해제
   */
  useEffect(() => {
    return () => {
      // 언마운트 시 연결 해제하지 않음 (다른 컴포넌트에서 계속 사용 가능)
      // 필요한 경우 명시적으로 disconnect() 호출
    }
  }, [])

  return {
    state,
    connect,
    disconnect,
    submitPassword,
    // 연결 상태 확인 헬퍼
    isConnected: state.isConnected,
    isScanning: state.isScanning,
  }
}
