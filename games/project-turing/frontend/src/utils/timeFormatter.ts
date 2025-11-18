/**
 * 초를 MM:SS 형식으로 변환
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 밀리초를 사람이 읽을 수 있는 형식으로 변환
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`
  }
  if (minutes > 0) {
    return `${minutes}분 ${seconds % 60}초`
  }
  return `${seconds}초`
}
