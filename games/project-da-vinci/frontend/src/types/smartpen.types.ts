/**
 * 네오랩 스마트펜 SDK 타입 정의
 * Web SDK 2.0: https://github.com/NeoSmartpen/WEB-SDK2.0
 */

export interface Dot {
  x: number
  y: number
  f: number // force (압력)
  timestamp: number
  dotType: number // 0: down, 1: move, 2: up
}

export interface ScreenDot {
  x: number
  y: number
  f: number
  timestamp: number
  dotType: number
}

export interface PageInfo {
  section: number
  owner: number
  book: number
  page: number
}

export interface PaperSize {
  Xmin: number
  Ymin: number
  Xmax: number
  Ymax: number
}

export interface View {
  width: number
  height: number
  margin: {
    left: number
    top: number
    right: number
    bottom: number
  }
}

export interface PenDevice {
  id: string
  name: string
  mac: string
}

export interface PenController {
  mac: string
  device: PenDevice
  disconnect: () => void
}

export interface SmartPenState {
  isScanning: boolean
  isConnected: boolean
  devices: PenDevice[]
  connectedDevice: PenDevice | null
  battery: number
  error: string | null
}
