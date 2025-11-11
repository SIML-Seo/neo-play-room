import { useEffect, useRef, useState } from 'react'
import { Canvas as FabricCanvas } from 'fabric'

interface CanvasProps {
  width?: number
  height?: number
  isDrawingEnabled?: boolean
  onCanvasChange?: (canvasData: string) => void
}

export default function Canvas({
  width = 800,
  height = 600,
  isDrawingEnabled = true,
  onCanvasChange,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<FabricCanvas | null>(null)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [brushWidth, setBrushWidth] = useState(5)
  const [isEraser, setIsEraser] = useState(false)

  // Fabric.js 캔버스 초기화
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      isDrawingMode: isDrawingEnabled,
    })

    fabricCanvasRef.current = canvas

    // 브러시 설정
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = currentColor
      canvas.freeDrawingBrush.width = brushWidth
    }

    // 캔버스 변경 이벤트
    canvas.on('path:created', () => {
      if (onCanvasChange) {
        const canvasData = JSON.stringify(canvas.toJSON())
        onCanvasChange(canvasData)
      }
    })

    return () => {
      canvas.dispose()
    }
  }, [width, height])

  // 그리기 모드 토글
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.isDrawingMode = isDrawingEnabled
    }
  }, [isDrawingEnabled])

  // 브러시 색상 변경
  useEffect(() => {
    if (fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = isEraser ? '#ffffff' : currentColor
    }
  }, [currentColor, isEraser])

  // 브러시 두께 변경
  useEffect(() => {
    if (fabricCanvasRef.current?.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.width = brushWidth
    }
  }, [brushWidth])

  // 캔버스 초기화
  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear()
      fabricCanvasRef.current.backgroundColor = '#ffffff'
      fabricCanvasRef.current.renderAll()

      if (onCanvasChange) {
        const canvasData = JSON.stringify(fabricCanvasRef.current.toJSON())
        onCanvasChange(canvasData)
      }
    }
  }

  // TODO: 외부에서 캔버스 데이터 로드 기능 추가 (useImperativeHandle 사용)
  /*
  const loadCanvasData = (canvasData: string) => {
    if (fabricCanvasRef.current) {
      try {
        const data = JSON.parse(canvasData)
        fabricCanvasRef.current.loadFromJSON(data, () => {
          fabricCanvasRef.current?.renderAll()
        })
      } catch (error) {
        console.error('Failed to load canvas data:', error)
      }
    }
  }
  */

  // 색상 팔레트
  const colors = [
    '#000000',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* 툴바 */}
      {isDrawingEnabled && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-6 flex-wrap">
            {/* 색상 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">색상:</span>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setCurrentColor(color)
                      setIsEraser(false)
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      currentColor === color && !isEraser
                        ? 'border-gray-900 scale-110'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* 브러시 두께 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">두께:</span>
              <input
                type="range"
                min="1"
                max="50"
                value={brushWidth}
                onChange={(e) => setBrushWidth(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-gray-600 w-8">{brushWidth}px</span>
            </div>

            {/* 지우개 */}
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEraser ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isEraser ? '✓ 지우개' : '지우개'}
            </button>

            {/* 초기화 */}
            <button
              onClick={clearCanvas}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              전체 지우기
            </button>
          </div>
        </div>
      )}

      {/* 캔버스 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
