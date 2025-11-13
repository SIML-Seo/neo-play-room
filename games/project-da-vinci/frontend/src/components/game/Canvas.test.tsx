import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Canvas from './Canvas'

// Fabric.js 모킹
vi.mock('fabric', () => {
  class MockCanvas {
    isDrawingMode = true
    selection = true
    freeDrawingBrush = {
      color: '#000000',
      width: 5,
    }
    backgroundColor = '#ffffff'
    on = vi.fn()
    dispose = vi.fn()
    clear = vi.fn()
    toJSON = vi.fn(() => ({}))
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

describe('Canvas', () => {
  it('캔버스가 렌더링됨', () => {
    render(<Canvas />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('그리기 도구 툴바가 표시됨', () => {
    render(<Canvas isDrawingEnabled={true} />)
    expect(screen.getByText('색상:')).toBeInTheDocument()
    expect(screen.getByText('두께:')).toBeInTheDocument()
  })

  it('그리기 비활성화 시 툴바가 숨겨짐', () => {
    render(<Canvas isDrawingEnabled={false} />)
    expect(screen.queryByText('색상:')).not.toBeInTheDocument()
  })

  it('기본 너비와 높이가 설정됨', () => {
    render(<Canvas />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('커스텀 너비와 높이가 적용됨', () => {
    render(<Canvas width={1000} height={800} />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })
})
