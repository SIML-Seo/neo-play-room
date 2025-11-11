/**
 * 초 단위 시간을 "분:초" 형식으로 변환
 * @param seconds - 초 단위 시간
 * @returns "M:SS" 형식의 문자열
 */
export function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Unix timestamp를 한국 시간 문자열로 변환
 * @param timestamp - Unix timestamp (ms)
 * @returns "YYYY-MM-DD HH:MM:SS" 형식의 문자열
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/\. /g, '-').replace('.', '')
}
