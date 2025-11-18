import { useState } from 'react'
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
    <div className="space-y-6">
      {/* 답변 카드 그리드 (3x2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {answersList.map(({ anonymousId, text }) => {
          const isSelected = selectedPlayer === anonymousId
          const isMyVote = voted && myVote === anonymousId

          return (
            <div
              key={anonymousId}
              onClick={() => !voted && setSelectedPlayer(anonymousId)}
              className={`
                relative p-4 rounded-2xl transition-all duration-300 cursor-pointer
                ${voted && !isMyVote ? 'opacity-50' : ''}
                ${!voted ? 'hover:scale-105' : ''}
              `}
              style={{
                border: isSelected || isMyVote
                  ? '4px solid #FFA500'
                  : '4px solid #00D9FF',
                backgroundColor: '#1A1F3A',
              }}
            >
              {/* Check icon for selected */}
              {(isSelected || isMyVote) && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyber-gold rounded-full flex items-center justify-center border-2 border-terminal-bg shadow-glow-gold">
                  <svg className="w-5 h-5 text-terminal-bg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}

              {/* Avatar with gradient */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                     style={{
                       background: 'linear-gradient(135deg, #FF0080 0%, #A855F7 50%, #00D9FF 100%)'
                     }}>
                  {anonymousId.split('_')[1]}
                </div>
                <p className="font-mono font-bold text-cyber-blue">{anonymousId}</p>
              </div>

              {/* Answer text */}
              <div className="bg-terminal-bg/50 rounded-lg p-3 min-h-[80px]">
                <p className="text-sm text-white/90 font-mono leading-relaxed">
                  답변: <span className="text-white">{text}</span>
                </p>
              </div>

              {/* My vote badge */}
              {isMyVote && (
                <div className="mt-2 flex justify-center">
                  <span className="px-3 py-1 bg-cyber-gold/20 border border-cyber-gold text-cyber-gold text-xs font-mono font-bold rounded">
                    내 투표
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Vote button */}
      {!voted ? (
        <div className="flex justify-center">
          <button
            onClick={handleVote}
            disabled={!selectedPlayer}
            className="px-12 py-5 bg-terminal-surface border-4 border-cyber-gold text-cyber-gold font-mono font-bold text-xl
                       hover:bg-cyber-gold hover:text-terminal-bg transition-all duration-300
                       shadow-glow-gold hover:shadow-glow-gold hover:scale-105
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
                       rounded-xl min-w-[300px]"
          >
            투표 확정하기
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-gold/20 border-4 border-cyber-gold rounded-full mb-4 shadow-glow-gold">
            <svg
              className="w-10 h-10 text-cyber-gold"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-cyber-gold font-mono mb-2">투표 완료!</p>
          <p className="text-cyber-blue font-mono">다른 플레이어의 투표를 기다리는 중...</p>
        </div>
      )}
    </div>
  )
}
