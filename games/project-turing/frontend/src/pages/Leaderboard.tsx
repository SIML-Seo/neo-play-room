import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllGameLogs, type GameLog } from '@/services/gameLogs'
import Button from '@shared/ui-components/Button'
import Loader from '@shared/ui-components/Loader'

export default function Leaderboard() {
  const navigate = useNavigate()
  const [gameLogs, setGameLogs] = useState<GameLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const logs = await getAllGameLogs(20) // 상위 20개
        setGameLogs(logs)
      } catch (err) {
        console.error('리더보드 조회 실패:', err)
        setError('리더보드를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" text="리더보드 로딩 중..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-xl text-danger mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
          </div>
        </div>
      </div>
    )
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const difficultyLabel = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
  }

  const difficultyColor = {
    easy: 'text-green-600 bg-green-50',
    normal: 'text-blue-600 bg-blue-50',
    hard: 'text-red-600 bg-red-50',
  }

  const getRankMedal = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4">🏆 리더보드</h1>
          <p className="text-xl text-gray-600">Project Turing - 역대 최고 기록</p>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">총 게임 수</p>
            <p className="text-4xl font-bold text-primary">{gameLogs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">성공률</p>
            <p className="text-4xl font-bold text-success">
              {gameLogs.length > 0
                ? Math.round((gameLogs.filter((log) => log.result === 'success').length / gameLogs.length) * 100)
                : 0}
              %
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">최고 점수</p>
            <p className="text-4xl font-bold text-warning">
              {gameLogs.length > 0 ? Math.round(gameLogs[0]?.score || 0) : 0}
            </p>
          </div>
        </div>

        {/* 리더보드 테이블 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {gameLogs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xl text-gray-500 mb-4">아직 완료된 게임이 없습니다</p>
              <Button onClick={() => navigate('/lobby')}>게임 시작하기</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">순위</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">점수</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">결과</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">난이도</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">턴 수</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">플레이 시간</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">완료 시각</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {gameLogs.map((log, index) => (
                    <tr
                      key={log.roomId}
                      className={`
                        hover:bg-gray-50 transition-colors
                        ${index < 3 ? 'bg-yellow-50/30' : ''}
                      `}
                    >
                      {/* 순위 */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getRankMedal(index)}</span>
                        </div>
                      </td>

                      {/* 점수 */}
                      <td className="px-6 py-4">
                        <span className="text-xl font-bold text-primary">{Math.round(log.score)}</span>
                      </td>

                      {/* 결과 */}
                      <td className="px-6 py-4">
                        {log.result === 'success' ? (
                          <span className="px-3 py-1 bg-success text-white text-sm font-semibold rounded-full">성공</span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-400 text-white text-sm font-semibold rounded-full">실패</span>
                        )}
                      </td>

                      {/* 난이도 */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${difficultyColor[log.difficulty]}`}>
                          {difficultyLabel[log.difficulty]}
                        </span>
                      </td>

                      {/* 턴 수 */}
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{log.finalTurnCount} 턴</span>
                      </td>

                      {/* 플레이 시간 */}
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{formatTime(log.finalTime)}</span>
                      </td>

                      {/* 완료 시각 */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatDate(log.completedAt)}</span>
                      </td>

                      {/* 액션 */}
                      <td className="px-6 py-4 text-center">
                        <Button size="sm" onClick={() => navigate(`/results/${log.roomId}`)}>
                          상세보기
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => navigate('/lobby')} size="lg" className="px-8">
            게임 시작하기
          </Button>
          <Button onClick={() => navigate('/')} variant="secondary" size="lg" className="px-8">
            홈으로
          </Button>
        </div>
      </div>
    </div>
  )
}
