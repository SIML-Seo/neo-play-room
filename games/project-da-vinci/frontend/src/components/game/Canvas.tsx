import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import * as fabric from 'fabric'

interface CanvasProps {
  width?: number
  height?: number
  isDrawingEnabled?: boolean
  onCanvasChange?: (canvasData: string) => void
}

export interface CanvasHandle {
  getCanvasAsBase64: () => string | null
  loadCanvasData: (canvasData: string) => void
  clearCanvas: () => void
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({ width = 800, height = 600, isDrawingEnabled = true, onCanvasChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const [currentColor, setCurrentColor] = useState('#000000')
    const [brushWidth, setBrushWidth] = useState(5)
    const [isEraser, setIsEraser] = useState(false)

    // Fabric.js 캔버스 초기화
    useEffect(() => {
      if (!canvasRef.current) return

      console.log('[Canvas] 초기화 중...', { width, height, isDrawingEnabled })

      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: '#ffffff',
      })

      fabricCanvasRef.current = canvas

      // 드로잉 모드를 항상 활성화 (렌더링 문제 방지)
      canvas.isDrawingMode = true

      // 브러시 명시적 생성 및 설정
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = currentColor
        canvas.freeDrawingBrush.width = brushWidth
        console.log('[Canvas] 브러시 설정 완료', { color: currentColor, width: brushWidth })
      } else {
        // 브러시가 없으면 PencilBrush 직접 생성
        console.warn('[Canvas] freeDrawingBrush가 없어서 PencilBrush 생성')
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
        canvas.freeDrawingBrush.color = currentColor
        canvas.freeDrawingBrush.width = brushWidth
        console.log('[Canvas] PencilBrush 생성 및 설정 완료')
      }

      // 실제 드로잉 모드 설정
      canvas.isDrawingMode = isDrawingEnabled
      console.log('[Canvas] 최종 드로잉 모드:', isDrawingEnabled)

      // 캔버스 변경 이벤트
      canvas.on('path:created', () => {
        console.log('[Canvas] path:created 이벤트 발생')
        if (onCanvasChange) {
          const canvasData = JSON.stringify(canvas.toJSON())
          onCanvasChange(canvasData)
        }
      })

      return () => {
        canvas.dispose()
      }
      // width/height 변경시에만 재생성하고 싶으므로 다른 의존성은 제외
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width, height])

    // 그리기 모드 토글 (항상 true로 유지하되, selection을 비활성화)
    useEffect(() => {
      if (fabricCanvasRef.current) {
        console.log('[Canvas] 드로잉 활성화 상태 변경:', isDrawingEnabled)

        if (isDrawingEnabled) {
          // 그리기 가능
          fabricCanvasRef.current.isDrawingMode = true
          fabricCanvasRef.current.selection = false
        } else {
          // 그리기 불가능 (보기만 가능)
          fabricCanvasRef.current.isDrawingMode = false
          fabricCanvasRef.current.selection = false
          // 모든 objects를 선택 불가능하게 설정
          fabricCanvasRef.current.getObjects().forEach((obj) => {
            obj.selectable = false
            obj.evented = false
          })
          fabricCanvasRef.current.renderAll()
        }
      }
    }, [isDrawingEnabled])

    // 브러시 색상 변경
    useEffect(() => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
      }
      canvas.freeDrawingBrush.color = isEraser ? '#ffffff' : currentColor
    }, [currentColor, isEraser])

    // 브러시 두께 변경
    useEffect(() => {
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
      }
      canvas.freeDrawingBrush.width = brushWidth
    }, [brushWidth])

    // 부모 컴포넌트에서 접근 가능한 메서드 노출
    useImperativeHandle(ref, () => ({
      // 캔버스를 Base64 이미지로 내보내기
      getCanvasAsBase64: () => {
        if (fabricCanvasRef.current) {
          return fabricCanvasRef.current.toDataURL({
            format: 'png',
            quality: 0.8,
            multiplier: 1,
          })
        }
        return null
      },
      // 캔버스 데이터 로드
      loadCanvasData: (canvasData: string) => {
        console.log('[Canvas] loadCanvasData 호출됨', {
          hasCanvas: !!fabricCanvasRef.current,
          dataLength: canvasData?.length || 0
        })

        if (!fabricCanvasRef.current) {
          console.warn('[Canvas] fabricCanvasRef가 없습니다!')
          return
        }

        const canvas = fabricCanvasRef.current

        try {
          if (!canvasData) {
            // 빈 문자열이면 캔버스 초기화
            console.log('[Canvas] 빈 데이터, 캔버스 초기화')
            clearCanvas()
            return
          }

          const data = JSON.parse(canvasData)
          console.log('[Canvas] JSON 파싱 성공, objects 개수:', data.objects?.length || 0)

          // 기존 objects 모두 제거
          canvas.clear()
          canvas.backgroundColor = '#ffffff'

          // 새로운 objects 추가
          if (data.objects && data.objects.length > 0) {
            canvas.loadFromJSON(data, () => {
              console.log('[Canvas] loadFromJSON 완료, renderAll 호출')
              canvas.renderAll()

              // 한 번 더 렌더링 (드로잉 모드가 false일 때 렌더링 문제 해결)
              setTimeout(() => {
                canvas.renderAll()
                console.log('[Canvas] 재렌더링 완료, objects 개수:', canvas.getObjects().length)
              }, 0)
            })
          } else {
            console.log('[Canvas] objects가 없어서 빈 캔버스')
            canvas.renderAll()
          }
        } catch (error) {
          console.error('[Canvas] loadCanvasData 실패:', error)
        }
      },
      // 캔버스 초기화
      clearCanvas: () => {
        clearCanvas()
      },
    }))

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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <canvas ref={canvasRef} />
        </div>
      </div>
    )
  }
)

Canvas.displayName = 'Canvas'

export default Canvas
