import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitDrawingToAI } from './ai'

// Mock firebase functions
const mockJudgeDrawing = vi.fn()

vi.mock('firebase/functions', () => ({
  httpsCallable: () => mockJudgeDrawing,
}))

vi.mock('@/firebase', () => ({
  functions: {},
}))

describe('AI Service - Retry Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('✅ 성공 시 첫 시도에서 결과 반환', async () => {
    const mockResponse = {
      data: {
        guess: '백설공주',
        confidence: 0.85,
        isCorrect: true,
        turnCount: 5,
        gameStatus: 'finished' as const,
      },
    }

    mockJudgeDrawing.mockResolvedValueOnce(mockResponse)

    const result = await submitDrawingToAI('room-123', 'data:image/png;base64,abc')

    expect(result).toEqual(mockResponse.data)
    expect(mockJudgeDrawing).toHaveBeenCalledTimes(1)
  })

  it('🔄 실패 시 재시도 후 성공 (4회 시도)', async () => {
    mockJudgeDrawing
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockRejectedValueOnce(new Error('Server error'))
      .mockResolvedValueOnce({
        data: {
          guess: '신데렐라',
          confidence: 0.75,
          isCorrect: false,
          turnCount: 3,
          gameStatus: 'in-progress' as const,
        },
      })

    const promise = submitDrawingToAI('room-456', 'data:image/png;base64,xyz')

    // 첫 번째 실패 후 1초 대기
    await vi.advanceTimersByTimeAsync(1000)
    // 두 번째 실패 후 2초 대기
    await vi.advanceTimersByTimeAsync(2000)
    // 세 번째 실패 후 4초 대기
    await vi.advanceTimersByTimeAsync(4000)

    const result = await promise

    expect(result.guess).toBe('신데렐라')
    expect(mockJudgeDrawing).toHaveBeenCalledTimes(4)
  })

  it('❌ 모든 재시도 실패 시 에러 throw', async () => {
    mockJudgeDrawing.mockRejectedValue(new Error('Persistent error'))

    // expect().rejects를 먼저 설정한 후 타이머 진행
    const promise = expect(
      submitDrawingToAI('room-789', 'data:image/png;base64,def')
    ).rejects.toThrow('AI 판단에 실패했습니다')

    // 모든 재시도 대기 (0 + 1초 + 2초 + 4초)
    await vi.advanceTimersByTimeAsync(7000)

    await promise
    expect(mockJudgeDrawing).toHaveBeenCalledTimes(4)
  })
})
