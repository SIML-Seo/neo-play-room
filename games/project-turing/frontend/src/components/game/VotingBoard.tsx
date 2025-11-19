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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {answersList.map(({ anonymousId, text }) => {
          const isSelected = selectedPlayer === anonymousId
          const isMyVote = voted && myVote === anonymousId

          return (
            <div
              key={anonymousId}
              onClick={() => !voted && setSelectedPlayer(anonymousId)}
              className={`
                relative rounded-xl transition-all duration-300
                ${voted ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
                ${voted && !isMyVote ? 'opacity-50' : ''}
              `}
              style={{
                border: isSelected || isMyVote
                  ? '3px solid #FFA500'
                  : '3px solid #A855F7',
                backgroundColor: '#1A1F3A',
                boxShadow: isSelected || isMyVote
                  ? '0 0 15px rgba(255, 165, 0, 0.5), 0 0 30px rgba(255, 165, 0, 0.3)'
                  : '0 0 10px rgba(168, 85, 247, 0.3)',
              }}
            >
              {/* Check icon for selected */}
              {(isSelected || isMyVote) && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyber-gold rounded-full flex items-center justify-center border-2 border-terminal-bg shadow-glow-gold animate-scaleGlow">
                  <svg className="w-5 h-5 text-terminal-bg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}

              <div className="p-5">
                {/* Avatar with gradient */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                       style={{
                         background: 'linear-gradient(135deg, #FF0080 0%, #A855F7 50%, #00D9FF 100%)'
                       }}>
                    {anonymousId.split('_')[1]}
                  </div>
                  <p className="font-mono font-bold text-base" style={{ color: '#00D9FF' }}>
                    {anonymousId}
                  </p>
                </div>

                {/* Answer text */}
                <div className="bg-terminal-bg/70 rounded-lg p-4 min-h-[100px] border border-cyber-blue/20">
                  <p className="text-xs text-white/60 font-mono mb-2">답변:</p>
                  <p className="text-sm text-white font-mono leading-relaxed">
                    {text}
                  </p>
                </div>

                {/* My vote badge */}
                {isMyVote && (
                  <div className="mt-3 flex justify-center">
                    <span className="px-3 py-1 bg-cyber-gold/20 border border-cyber-gold text-cyber-gold text-xs font-mono font-bold rounded">
                      내 투표
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Vote button */}
      {!voted ? (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleVote}
            disabled={!selectedPlayer}
            className="px-16 py-6 bg-terminal-surface border-4 border-cyber-gold text-cyber-gold font-terminal font-bold text-2xl
                       hover:bg-cyber-gold hover:text-terminal-bg transition-all duration-300
                       shadow-glow-gold hover:shadow-glow-gold hover:scale-105
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
                       rounded-2xl min-w-[320px] tracking-wider
                       animate-pulse"
            style={{
              boxShadow: selectedPlayer
                ? '0 0 20px rgba(255, 165, 0, 0.6), 0 0 40px rgba(255, 165, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.2)'
                : 'none',
            }}
          >
            투표 확정하기
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-gold/20 border-4 border-cyber-gold rounded-full mb-4 shadow-glow-gold animate-scaleGlow">
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
          <p className="text-2xl font-bold text-cyber-gold font-terminal mb-2">투표 완료!</p>
          <p className="text-cyber-blue font-mono">다른 플레이어의 투표를 기다리는 중...</p>
        </div>
      )}
    </div>
  )
}
