import { describe, it, expect } from 'vitest'
import { sanitizeMessage, truncateText } from './sanitizer'

describe('sanitizer', () => {
  describe('sanitizeMessage', () => {
    it('일반 텍스트는 그대로 반환', () => {
      const input = '안녕하세요'
      const result = sanitizeMessage(input)
      expect(result).toBe(input)
    })

    it('HTML 태그를 제거', () => {
      const input = '<script>alert("XSS")</script>안녕하세요'
      const result = sanitizeMessage(input)
      expect(result).toBe('안녕하세요')
    })

    it('이벤트 핸들러를 제거', () => {
      const input = '<img src="x" onerror="alert(1)">'
      const result = sanitizeMessage(input)
      expect(result).toBe('')
    })

    it('여러 줄 텍스트 처리', () => {
      const input = '첫 번째 줄\n두 번째 줄'
      const result = sanitizeMessage(input)
      expect(result).toBe('첫 번째 줄\n두 번째 줄')
    })

    it('특수문자 유지 (HTML entity 인코딩)', () => {
      const input = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`'
      const result = sanitizeMessage(input)
      // DOMPurify는 &, <, >를 HTML entity로 인코딩하고 다른 특수문자는 유지
      expect(result).toBe('!@#$%^&amp;*()_+-=[]{}|;:\'",.&lt;&gt;?/~`')
      // HTML entity가 올바르게 인코딩되었는지 확인
      expect(result).toContain('&amp;')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })
  })

  describe('truncateText', () => {
    it('길이가 maxLength보다 짧으면 그대로 반환', () => {
      const input = '짧은 텍스트'
      const result = truncateText(input, 20)
      expect(result).toBe(input)
    })

    it('길이가 maxLength와 같으면 그대로 반환', () => {
      const input = '정확한길이'
      const result = truncateText(input, 5)
      expect(result).toBe(input)
    })

    it('길이가 maxLength보다 길면 자르고 ... 추가', () => {
      const input = '매우 긴 텍스트입니다'
      const result = truncateText(input, 5)
      expect(result).toBe('매우 긴 ...')
    })

    it('빈 문자열 처리', () => {
      const input = ''
      const result = truncateText(input, 10)
      expect(result).toBe('')
    })
  })
})
