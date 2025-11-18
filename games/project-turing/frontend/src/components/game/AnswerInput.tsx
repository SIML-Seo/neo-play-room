import { useState } from 'react'
import { sanitizeMessage } from '@shared/utils/sanitizer'

interface AnswerInputProps {
  question: string
  onSubmit: (answer: string) => void
  onChange?: (answer: string) => void
  disabled?: boolean
  submitted?: boolean
  maxLength?: number
}

export default function AnswerInput({
  question,
  onSubmit,
  onChange,
  disabled = false,
  submitted = false,
  maxLength = 200,
}: AnswerInputProps) {
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleChange = (value: string) => {
    setAnswer(value)
    onChange?.(value)
  }

  const handleSubmit = () => {
    // 검증
    if (answer.trim().length === 0) {
      setError('답변을 입력해주세요.')
      return
    }

    if (answer.length > maxLength) {
      setError(`답변은 최대 ${maxLength}자까지 입력 가능합니다.`)
      return
    }

    // XSS 방지
    const sanitized = sanitizeMessage(answer.trim())

    onSubmit(sanitized)
    setError(null)
  }

  return (
    <div className="bg-terminal-surface border-4 border-cyber-blue rounded-2xl p-8 shadow-glow-blue">
      {/* 질문 */}
      <div className="mb-6">
        <h3 className="text-sm font-mono font-semibold text-cyber-blue mb-3">질문</h3>
        <div className="bg-terminal-bg border-2 border-cyber-blue/50 rounded-xl p-6">
          <p className="text-2xl font-terminal font-bold text-white leading-relaxed">{question}</p>
        </div>
      </div>

      {/* 답변 입력 */}
      {!submitted ? (
        <>
          <div className="mb-6">
            <label htmlFor="answer" className="block text-sm font-mono font-semibold text-cyber-blue mb-3">
              답변
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              maxLength={maxLength}
              placeholder="답변을 입력하세요... (1-2문장 권장)"
              className="w-full px-6 py-4 bg-terminal-bg border-2 border-cyber-blue/50 rounded-xl
                         text-white font-mono text-lg leading-relaxed
                         focus:ring-4 focus:ring-cyber-blue/30 focus:border-cyber-blue
                         placeholder:text-white/30
                         resize-none transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
              rows={4}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm font-mono text-white/50">
                {answer.length}/{maxLength}자
              </span>
              {error && (
                <span className="text-sm font-mono font-bold text-cyber-red animate-glitch">
                  {error}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={disabled || answer.trim().length === 0}
            className="w-full px-8 py-5 bg-terminal-surface border-4 border-cyber-pink text-cyber-pink font-mono font-bold text-xl
                       hover:bg-cyber-pink hover:text-terminal-bg transition-all duration-300
                       shadow-glow-pink hover:shadow-glow-pink hover:scale-105
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
                       rounded-xl"
          >
            답변 제출
          </button>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-phosphor-green/20 border-4 border-phosphor-green rounded-full mb-4 shadow-glow-green">
            <svg
              className="w-10 h-10 text-phosphor-green"
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
          <p className="text-2xl font-bold text-phosphor-green font-mono mb-2">답변 제출 완료!</p>
          <p className="text-cyber-blue font-mono">다른 플레이어의 답변을 기다리는 중...</p>
        </div>
      )}
    </div>
  )
}
