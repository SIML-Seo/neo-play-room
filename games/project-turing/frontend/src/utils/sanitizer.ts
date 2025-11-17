import DOMPurify from 'dompurify'

/**
 * XSS 공격 방지를 위한 메시지 sanitize
 */
export function sanitizeMessage(message: string): string {
  return DOMPurify.sanitize(message, {
    ALLOWED_TAGS: [], // 모든 HTML 태그 제거
    ALLOWED_ATTR: [],
  })
}

/**
 * 텍스트 길이 제한
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
