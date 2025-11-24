/**
 * 네오랩 스마트펜 SDK 타입 정의
 * Web SDK 2.0: https://github.com/NeoSmartpen/WEB-SDK2.0
 *
 * 실제 SDK 소스 코드 기반으로 정의
 */

/**
 * PageInfo - 페이지 정보
 */
export interface PageInfo {
  section: number
  owner: number
  book: number
  page: number
}

/**
 * Dot - SDK에서 전달하는 원본 Dot 데이터
 * 주의: dotType 대신 DotType(대문자)으로 접근해야 함 (런타임)
 */
export interface Dot {
  pageInfo: PageInfo
  x: number
  y: number
  f: number // force (압력, 0-1024)
  DotType: number // 0: PEN_DOWN, 1: PEN_MOVE, 2: PEN_UP, 3: PEN_HOVER
  dotType?: number // 타입 정의에서는 소문자로도 접근 가능하도록
  timeStamp: number
  timeDiff: number
  penTipType: number
  color: number
  angle: {
    tx: number
    ty: number
    twist: number
  }
  isPlate?: boolean
}

/**
 * ScreenDot - 화면 좌표로 변환된 Dot
 */
export interface ScreenDot {
  x: number
  y: number
  f: number // 압력 (원본 Dot에서 복사)
  dotType: number // 0: down, 1: move, 2: up
  timeStamp: number
}

/**
 * PaperSize - ncode 용지 크기
 */
export interface PaperSize {
  Xmin: number
  Ymin: number
  Xmax: number
  Ymax: number
}

/**
 * View - Canvas 뷰 설정 (SDK에서는 width, height만 사용)
 */
export interface View {
  width: number
  height: number
}

/**
 * SmartPenState - 스마트펜 연결 상태
 */
export interface SmartPenState {
  isScanning: boolean
  isConnected: boolean
  connectedPenMac: string | null
  battery: number
  error: string | null
  isPasswordRequired: boolean
}
