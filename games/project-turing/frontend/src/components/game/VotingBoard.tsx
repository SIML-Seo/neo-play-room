import { useState } from 'react'
import Button from '@/components/common/Button'
import type { Answer } from '@/types/game.types'

interface VotingBoardProps {
  answers: Record<string, Answer> // anonymousId -> Answer
  onVote: (votedFor: string) => void
  voted?: boolean
  myVote?: string | null
}

export default function VotingBoard({ answers, onVote, voted = false, myVote = null }: VotingBoardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  const handleVote = () => {
    if (!selectedPlayer) return
    onVote(selectedPlayer)
  }

  const answersList = Object.entries(answers).map(([anonymousId, answer]) => ({
    anonymousId,
    text: answer.text,
    submittedAt: answer.submittedAt,
  }))

  // 제출 시간 순으로 정렬 (랜덤 순서 유지)
  answersList.sort((a, b) => a.submittedAt - b.submittedAt)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-6">
        {voted ? '투표 완료' : 'AI를 찾아주세요!'}
      </h3>

      {/* 답변 목록 */}
      <div className="space-y-4 mb-6">
        {answersList.map(({ anonymousId, text }) => (
          <div
            key={anonymousId}
            onClick={() => !voted && setSelectedPlayer(anonymousId)}
            className={`
              p-4 border-2 rounded-lg cursor-pointer transition-all
              ${
                selectedPlayer === anonymousId
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }
              ${voted && myVote === anonymousId ? 'border-success bg-green-50' : ''}
              ${voted && myVote !== anonymousId ? 'opacity-50' : ''}
            `}
          >
            <div className="flex items-start gap-4">
              {/* 익명 ID */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                  {anonymousId.split('_')[1]}
                </div>
              </div>

              {/* 답변 */}
              <div className="flex-1">
                <p className="font-semibold text-gray-700 mb-1">{anonymousId}</p>
                <p className="text-gray-900">{text}</p>
              </div>

              {/* 선택 표시 */}
              {selectedPlayer === anonymousId && !voted && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* 내 투표 표시 */}
              {voted && myVote === anonymousId && (
                <div className="flex-shrink-0">
                  <span className="px-3 py-1 bg-success text-white text-sm font-semibold rounded-full">
                    내 투표
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 투표 버튼 */}
      {!voted ? (
        <Button
          onClick={handleVote}
          disabled={!selectedPlayer}
          size="lg"
          className="w-full"
          variant="primary"
        >
          투표하기
        </Button>
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-900">투표 완료!</p>
          <p className="text-gray-600 mt-2">다른 플레이어의 투표를 기다리는 중...</p>
        </div>
      )}
    </div>
  )
}
