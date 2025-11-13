/**
 * 마스터 계정 대시보드 페이지
 * 게임 통계 분석 및 스케줄 관리
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import {
  getOverallStats,
  getDailyAnalytics,
  getHardestWords,
  getRecentGameLogs,
} from '@/services/analytics'
import { getGameSchedule, updateGameSchedule } from '@/services/schedule'
import type {
  DailyAnalytics,
  WordAnalytics,
  GameLog,
  GameScheduleConfig,
} from '@/types/game.types'

// 마스터 계정 이메일 목록 (TODO: 환경변수로 이동)
const MASTER_EMAILS = ['swh1182@neolab.net']

export default function Admin() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const [overallStats, setOverallStats] = useState({
    totalGames: 0,
    successRate: 0,
    avgTurns: 0,
    avgTime: 0,
  })
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([])
  const [hardestWords, setHardestWords] = useState<WordAnalytics[]>([])
  const [recentGames, setRecentGames] = useState<GameLog[]>([])
  const [schedule, setSchedule] = useState<GameScheduleConfig | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)

  // 새 스케줄 입력 상태
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('12:00')
  const [newEndTime, setNewEndTime] = useState('13:00')
  const [newDescription, setNewDescription] = useState('')

  // 마스터 권한 확인
  const isMaster = user?.email && MASTER_EMAILS.includes(user.email)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
    } else if (!loading && user && !isMaster) {
      // 마스터가 아니면 홈으로 리다이렉트
      alert('마스터 계정만 접근 가능합니다.')
      navigate('/')
    }
  }, [user, loading, isMaster, navigate])

  // 데이터 로드
  useEffect(() => {
    if (!isMaster) return

    const loadData = async () => {
      setDataLoading(true)
      try {
        const [stats, daily, words, games, scheduleData] = await Promise.all([
          getOverallStats(),
          getDailyAnalytics(30),
          getHardestWords(10),
          getRecentGameLogs(20),
          getGameSchedule(),
        ])

        setOverallStats(stats)
        setDailyAnalytics(daily)
        setHardestWords(words)
        setRecentGames(games)
        setSchedule(scheduleData)
        setScheduleEnabled(scheduleData !== null && scheduleData.dateRanges.length > 0)
      } catch (error) {
        console.error('[Admin] 데이터 로드 실패:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadData()
  }, [isMaster])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleAddSchedule = async () => {
    if (!newDate) {
      alert('날짜를 선택해주세요.')
      return
    }

    if (newStartTime >= newEndTime) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.')
      return
    }

    try {
      const currentRanges = schedule?.dateRanges || []
      const newRange = {
        date: newDate,
        start: newStartTime,
        end: newEndTime,
        description: newDescription || undefined,
      }

      const updatedRanges = [...currentRanges, newRange].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.start.localeCompare(b.start)
      })

      await updateGameSchedule(updatedRanges, user?.email || 'admin')

      setSchedule({
        dateRanges: updatedRanges,
        updatedBy: user?.email || 'admin',
        updatedAt: new Date(),
      })
      setScheduleEnabled(true)

      // 입력 초기화
      setNewDate('')
      setNewStartTime('12:00')
      setNewEndTime('13:00')
      setNewDescription('')

      alert('게임 시간이 추가되었습니다.')
    } catch (error) {
      console.error('[handleAddSchedule] 실패:', error)
      alert('스케줄 추가에 실패했습니다.')
    }
  }

  const handleDeleteSchedule = async (index: number) => {
    if (!confirm('이 게임 시간을 삭제하시겠습니까?')) {
      return
    }

    try {
      const currentRanges = schedule?.dateRanges || []
      const updatedRanges = currentRanges.filter((_, idx) => idx !== index)

      await updateGameSchedule(updatedRanges, user?.email || 'admin')

      setSchedule({
        dateRanges: updatedRanges,
        updatedBy: user?.email || 'admin',
        updatedAt: new Date(),
      })
      setScheduleEnabled(updatedRanges.length > 0)

      alert('게임 시간이 삭제되었습니다.')
    } catch (error) {
      console.error('[handleDeleteSchedule] 실패:', error)
      alert('스케줄 삭제에 실패했습니다.')
    }
  }

  const handleClearAllSchedules = async () => {
    if (!confirm('모든 게임 시간을 삭제하고 항상 허용하시겠습니까?')) {
      return
    }

    try {
      await updateGameSchedule([], user?.email || 'admin')
      setSchedule(null)
      setScheduleEnabled(false)
      alert('모든 게임 시간이 삭제되었습니다. 이제 항상 게임을 할 수 있습니다.')
    } catch (error) {
      console.error('[handleClearAllSchedules] 실패:', error)
      alert('스케줄 삭제에 실패했습니다.')
    }
  }

  if (loading || !user || !isMaster) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Project Da Vinci</h1>
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                ADMIN
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />
                )}
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.displayName}</div>
                  <div className="text-gray-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/lobby')}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                로비로
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {dataLoading ? (
          <div className="text-center py-12 text-gray-500">데이터 로딩 중...</div>
        ) : (
          <div className="space-y-8">
            {/* 전체 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">전체 게임 수</div>
                <div className="text-3xl font-bold text-gray-900">{overallStats.totalGames}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">성공률</div>
                <div className="text-3xl font-bold text-green-600">
                  {overallStats.successRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">평균 턴 수</div>
                <div className="text-3xl font-bold text-indigo-600">
                  {overallStats.avgTurns.toFixed(1)}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">평균 소요 시간</div>
                <div className="text-3xl font-bold text-blue-600">
                  {(overallStats.avgTime / 1000 / 60).toFixed(1)}분
                </div>
              </div>
            </div>

            {/* 가장 어려운 단어 TOP 10 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">가장 어려운 단어 TOP 10</h2>
              <div className="space-y-3">
                {hardestWords.length === 0 ? (
                  <p className="text-gray-500 text-sm">데이터가 없습니다.</p>
                ) : (
                  hardestWords.map((word, idx) => (
                    <div key={word.word} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{word.word}</div>
                        <div className="text-xs text-gray-500">
                          시도: {word.attempts}회 / 평균 턴: {word.avgTurns.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">{word.successRate.toFixed(0)}%</div>
                        <div className="text-xs text-gray-500">성공률</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 일별 통계 (최근 7일) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">일별 통계 (최근 7일)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">날짜</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">게임 수</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">성공</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">실패</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">평균 턴</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyAnalytics.slice(0, 7).map((day) => (
                      <tr key={day.date} className="border-b border-gray-100">
                        <td className="py-3 px-4">{day.date}</td>
                        <td className="text-right py-3 px-4">{day.totalGames}</td>
                        <td className="text-right py-3 px-4 text-green-600">{day.successCount}</td>
                        <td className="text-right py-3 px-4 text-red-600">{day.failureCount}</td>
                        <td className="text-right py-3 px-4">{day.avgTurns.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 최근 게임 로그 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 게임 (20개)</h2>
              <div className="space-y-2">
                {recentGames.length === 0 ? (
                  <p className="text-gray-500 text-sm">데이터가 없습니다.</p>
                ) : (
                  recentGames.map((game) => (
                    <div key={game.logId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          game.result === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {game.result === 'success' ? '성공' : '실패'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{game.targetWord}</div>
                        <div className="text-xs text-gray-500">
                          테마: {game.theme} / 난이도: {game.difficulty}
                        </div>
                      </div>
                      <div className="text-right text-gray-600">
                        {game.finalTurnCount}턴 /{' '}
                        {(game.finalTime / 1000 / 60).toFixed(1)}분
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 게임 스케줄 관리 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">게임 스케줄 관리</h2>
                {scheduleEnabled && (
                  <button
                    onClick={handleClearAllSchedules}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    전체 삭제 (항상 허용)
                  </button>
                )}
              </div>

              {/* 새 스케줄 추가 폼 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-sm font-medium text-blue-900 mb-3">새 게임 시간 추가</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-blue-800 mb-1">날짜</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-800 mb-1">시작 시간</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-800 mb-1">종료 시간</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-800 mb-1">설명 (선택)</label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="예: 팀 빌딩"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddSchedule}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
              </div>

              {/* 등록된 스케줄 목록 */}
              {scheduleEnabled && schedule && schedule.dateRanges.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 mb-3">
                    <strong>등록된 게임 시간:</strong> 아래 날짜/시간대에만 게임이 가능합니다.
                  </div>
                  {schedule.dateRanges.map((range, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {range.date} ({new Date(range.date).toLocaleDateString('ko-KR', { weekday: 'short' })})
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {range.start} ~ {range.end}
                          {range.description && <span className="ml-2 text-blue-600">({range.description})</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSchedule(idx)}
                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <div className="mt-4 text-xs text-gray-500">
                    마지막 업데이트: {schedule.updatedBy}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm text-yellow-800">
                    <strong>현재 상태:</strong> 등록된 게임 시간이 없습니다. 모든 시간에 게임이 가능합니다.
                  </div>
                  <div className="text-xs text-yellow-700 mt-2">
                    위 폼에서 날짜와 시간을 선택하여 게임 가능 시간을 추가하세요.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
