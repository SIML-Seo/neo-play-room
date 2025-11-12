import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import Canvas from './Canvas'

// Mock Fabric.js with spy
const mockToJSON = vi.fn(() => ({ objects: [] }))
const mockOn = vi.fn()

vi.mock('fabric', () => {
  class MockCanvas {
    isDrawingMode = true
    selection = true
    freeDrawingBrush = {
      color: '#000000',
      width: 5,
    }
    backgroundColor = '#ffffff'
    on = mockOn
    dispose = vi.fn()
    clear = vi.fn()
    toJSON = mockToJSON
    loadFromJSON = vi.fn()
    renderAll = vi.fn()
    getObjects = vi.fn(() => [])
  }

  class MockPencilBrush {
    color = '#000000'
    width = 5
  }

  return {
    Canvas: MockCanvas,
    PencilBrush: MockPencilBrush,
  }
})

describe('Canvas Debounce 동작', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('500ms 디바운스: 빠르게 그려도 500ms마다 최대 1회만 호출', async () => {
    const onCanvasChange = vi.fn()

    render(<Canvas isDrawingEnabled={true} onCanvasChange={onCanvasChange} />)

    // path:created 이벤트 핸들러 가져오기
    const pathCreatedHandler = mockOn.mock.calls.find(
      (call) => call[0] === 'path:created'
    )?.[1]

    expect(pathCreatedHandler).toBeDefined()

    // 빠르게 5번 그리기 시뮬레이션 (50ms 간격)
    for (let i = 0; i < 5; i++) {
      pathCreatedHandler()
      await vi.advanceTimersByTimeAsync(50)
    }

    // 아직 호출 안됨 (250ms < 500ms from last call)
    expect(onCanvasChange).toHaveBeenCalledTimes(0)

    // 마지막 이벤트로부터 500ms 경과 (이미 250ms 경과, 250ms 더 필요)
    await vi.advanceTimersByTimeAsync(500)

    // 1회만 호출됨
    expect(onCanvasChange).toHaveBeenCalledTimes(1)
  })

  it('디바운스 동안 추가 이벤트는 타이머 리셋', async () => {
    const onCanvasChange = vi.fn()

    render(<Canvas isDrawingEnabled={true} onCanvasChange={onCanvasChange} />)

    const pathCreatedHandler = mockOn.mock.calls.find(
      (call) => call[0] === 'path:created'
    )?.[1]

    // 첫 이벤트
    pathCreatedHandler()
    await vi.advanceTimersByTimeAsync(400) // 400ms 대기

    // 아직 호출 안됨
    expect(onCanvasChange).toHaveBeenCalledTimes(0)

    // 추가 이벤트 (타이머 리셋)
    pathCreatedHandler()
    await vi.advanceTimersByTimeAsync(400) // 추가 400ms

    // 여전히 호출 안됨 (타이머가 리셋됨)
    expect(onCanvasChange).toHaveBeenCalledTimes(0)

    // 마지막 100ms 대기
    await vi.advanceTimersByTimeAsync(100)

    // 이제 호출됨
    expect(onCanvasChange).toHaveBeenCalledTimes(1)
  })

  it('디바운스 후 올바른 canvasData 전달', async () => {
    const onCanvasChange = vi.fn()
    const mockCanvasData = { objects: [{ type: 'rect', width: 100 }] }
    mockToJSON.mockReturnValue(mockCanvasData)

    render(<Canvas isDrawingEnabled={true} onCanvasChange={onCanvasChange} />)

    const pathCreatedHandler = mockOn.mock.calls.find(
      (call) => call[0] === 'path:created'
    )?.[1]

    pathCreatedHandler()
    await vi.advanceTimersByTimeAsync(500)

    expect(onCanvasChange).toHaveBeenCalledWith(JSON.stringify(mockCanvasData))
  })

  it('여러 번 그린 후 마지막 상태만 전달', async () => {
    const onCanvasChange = vi.fn()

    render(<Canvas isDrawingEnabled={true} onCanvasChange={onCanvasChange} />)

    const pathCreatedHandler = mockOn.mock.calls.find(
      (call) => call[0] === 'path:created'
    )?.[1]

    // 3번 그리기
    mockToJSON.mockReturnValueOnce({ objects: [{ id: 1 }] })
    pathCreatedHandler()
    await vi.advanceTimersByTimeAsync(100)

    mockToJSON.mockReturnValueOnce({ objects: [{ id: 1 }, { id: 2 }] })
    pathCreatedHandler()
    await vi.advanceTimersByTimeAsync(100)

    mockToJSON.mockReturnValueOnce({ objects: [{ id: 1 }, { id: 2 }, { id: 3 }] })
    pathCreatedHandler()

    // 500ms 대기
    await vi.advanceTimersByTimeAsync(500)

    // 1회만 호출되고, 마지막 상태(3개 객체)만 전달
    expect(onCanvasChange).toHaveBeenCalledTimes(1)
    expect(onCanvasChange).toHaveBeenCalledWith(
      expect.stringContaining('id')
    )
  })
})
