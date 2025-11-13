/**
 * 리더보드 페이지 (마스터 계정 전용)
 * 특정 기간의 게임 결과를 회차별, 순위별로 표시
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import {
  getGameLogsByDateRange,
  getRecentGameLogs,
  groupGameLogsBySession,
  sortGameLogsByRanking,
} from '@/services/gameLog'
import type { GameLog } from '@/types/game.types'

export default function Leaderboard() {
  const navigate = useNavigate()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 기간 필터
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [useRecent, setUseRecent] = useState(true) // 최근 게임 보기 모드

  // 게임 로그 데이터
  const [gameLogs, setGameLogs] = useState<GameLog[]>([])
  const [groupedLogs, setGroupedLogs] = useState<Map<string, GameLog[]>>(new Map())

  // 마스터 계정 확인
  const isMaster = user?.email === 'swh1182@neolab.net'

  // 로그인하지 않았거나 마스터가 아닌 경우 리다이렉트
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isMaster)) {
      alert('마스터 계정만 접근 가능합니다.')
      navigate('/lobby')
    }
  }, [isAuthenticated, isMaster, authLoading, navigate])

  // 초기 로드: 최근 20개 게임
  useEffect(() => {
    if (!isMaster) return

    const fetchRecentLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        const logs = await getRecentGameLogs(20)
        setGameLogs(logs)
        setGroupedLogs(groupGameLogsBySession(logs))
        setLoading(false)
      } catch (err) {
        console.error('[Leaderboard] 게임 로그 조회 실패:', err)
        setError('게임 로그를 불러오는데 실패했습니다.')
        setLoading(false)
      }
    }

    fetchRecentLogs()
  }, [isMaster])

  // 기간 필터 적용
  const handleFilterByDate = async () => {
    if (!startDate || !endDate) {
      alert('시작 날짜와 종료 날짜를 모두 입력해주세요.')
      return
    }

    if (startDate > endDate) {
      alert('시작 날짜는 종료 날짜보다 이전이어야 합니다.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setUseRecent(false)
      const logs = await getGameLogsByDateRange(startDate, endDate)
      setGameLogs(logs)
      setGroupedLogs(groupGameLogsBySession(logs))
      setLoading(false)
    } catch (err) {
      console.error('[Leaderboard] 기간별 조회 실패:', err)
      setError('게임 로그를 불러오는데 실패했습니다.')
      setLoading(false)
    }
  }

  // 최근 게임 보기 모드로 전환
  const handleShowRecent = async () => {
    try {
      setLoading(true)
      setError(null)
      setUseRecent(true)
      setStartDate('')
      setEndDate('')
      const logs = await getRecentGameLogs(20)
      setGameLogs(logs)
      setGroupedLogs(groupGameLogsBySession(logs))
      setLoading(false)
    } catch (err) {
      console.error('[Leaderboard] 최근 게임 조회 실패:', err)
      setError('게임 로그를 불러오는데 실패했습니다.')
      setLoading(false)
    }
  }

  // 난이도 라벨
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움'
      case 'normal':
        return '보통'
      case 'hard':
        return '어려움'
      default:
        return difficulty
    }
  }

  // 로딩 중
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">로딩 중...</div>
      </div>
    )
  }

  // 에러
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">오류 발생</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            관리자 페이지로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // 회차별 데이터 배열로 변환 (최신순)
  const sessions = Array.from(groupedLogs.entries()).sort(
    ([dateA], [dateB]) => dateB.localeCompare(dateA)
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">게임 리더보드</h1>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              관리자 페이지로
            </button>
          </div>

          {/* 필터 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 날짜
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 날짜
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleFilterByDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                기간 조회
              </button>

              <button
                onClick={handleShowRecent}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                최근 20개 보기
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              {useRecent ? (
                <p>최근 20개의 게임을 표시하고 있습니다.</p>
              ) : (
                <p>
                  {startDate} ~ {endDate} 기간의 게임을 표시하고 있습니다.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 게임 데이터가 없는 경우 */}
        {gameLogs.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600">해당 기간에 완료된 게임이 없습니다.</p>
          </div>
        )}

        {/* 회차별 게임 표시 */}
        {sessions.map(([dateKey, sessionLogs], sessionIndex) => {
          const rankedLogs = sortGameLogsByRanking(sessionLogs)

          return (
            <div key={dateKey} className="mb-12">
              {/* 회차 헤더 */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {sessionIndex + 1}회차 - {dateKey}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  총 {sessionLogs.length}개 게임 (성공: {rankedLogs.length}개)
                </p>
              </div>

              {/* 순위별 게임 카드 */}
              <div className="space-y-4">
                {rankedLogs.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-600">이 회차에는 성공한 게임이 없습니다.</p>
                  </div>
                ) : (
                  rankedLogs.map((log, rankIndex) => (
                    <div
                      key={log.logId}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-6">
                        {/* 순위 */}
                        <div className="flex-shrink-0">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                              rankIndex === 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : rankIndex === 1
                                  ? 'bg-gray-100 text-gray-700'
                                  : rankIndex === 2
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {rankIndex + 1}
                          </div>
                        </div>

                        {/* 게임 정보 */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                팀 {log.roomId.slice(0, 8)}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>테마: {log.theme}</span>
                                <span>•</span>
                                <span>정답: {log.targetWord}</span>
                                <span>•</span>
                                <span>난이도: {getDifficultyLabel(log.difficulty)}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {log.finalTurnCount}턴
                              </div>
                              <div className="text-sm text-gray-600">
                                {(log.finalTime / 1000).toFixed(1)}초
                              </div>
                            </div>
                          </div>

                          {/* 최종 그림 */}
                          {log.finalImageUri && (
                            <div className="mb-4">
                              <img
                                src={log.finalImageUri}
                                alt="최종 그림"
                                className="w-full max-w-md h-auto rounded-lg border border-gray-200"
                              />
                            </div>
                          )}

                          {/* AI 추론 히스토리 */}
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              AI 추론 히스토리 (턴별 그림 + 판정)
                            </h4>
                            <div className="space-y-4">
                              {log.aiGuessList.map((guess, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                >
                                  <div className="flex items-start gap-4">
                                    {/* 턴별 이미지 */}
                                    {guess.imageUrl ? (
                                      <div className="flex-shrink-0">
                                        <img
                                          src={guess.imageUrl}
                                          alt={`${guess.turn}턴 그림`}
                                          className="w-32 h-32 object-contain rounded-lg border border-gray-300 bg-white"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex-shrink-0 w-32 h-32 flex items-center justify-center bg-gray-200 rounded-lg border border-gray-300">
                                        <span className="text-xs text-gray-500">이미지 없음</span>
                                      </div>
                                    )}

                                    {/* AI 판정 정보 */}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                          {guess.turn}턴
                                        </span>
                                        <span
                                          className={`px-2 py-1 rounded text-xs font-medium ${
                                            guess.confidence >= 0.8
                                              ? 'bg-green-100 text-green-700'
                                              : guess.confidence >= 0.5
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                          }`}
                                        >
                                          신뢰도: {(guess.confidence * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                      <div className="text-sm">
                                        <span className="text-gray-600">AI 추측: </span>
                                        <span className="font-semibold text-gray-900">
                                          {guess.guess}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {new Date(guess.timestamp).toLocaleString('ko-KR')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
