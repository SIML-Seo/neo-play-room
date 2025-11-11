import { describe, it, expect } from 'vitest'
import { formatElapsedTime, formatTimestamp } from './timeFormatter'

describe('timeFormatter', () => {
  describe('formatElapsedTime', () => {
    it('0초를 0:00으로 변환', () => {
      expect(formatElapsedTime(0)).toBe('0:00')
    })

    it('59초를 0:59로 변환', () => {
      expect(formatElapsedTime(59)).toBe('0:59')
    })

    it('60초를 1:00으로 변환', () => {
      expect(formatElapsedTime(60)).toBe('1:00')
    })

    it('125초를 2:05로 변환', () => {
      expect(formatElapsedTime(125)).toBe('2:05')
    })

    it('3661초를 61:01로 변환', () => {
      expect(formatElapsedTime(3661)).toBe('61:01')
    })
  })

  describe('formatTimestamp', () => {
    it('Unix timestamp를 한국 시간으로 변환', () => {
      const timestamp = new Date('2023-03-15T18:00:00+09:00').getTime()
      const formatted = formatTimestamp(timestamp)
      expect(formatted).toContain('2023')
      expect(formatted).toContain('03')
      expect(formatted).toContain('15')
    })
  })
})
