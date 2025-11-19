import { useState } from 'react'
import { sanitizeMessage } from '@/utils/sanitizer'

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
    if (error) setError(null) // 입력 시 에러 제거
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

  const characterCount = answer.length
  const isNearLimit = characterCount >= maxLength * 0.8
  const isOverLimit = characterCount > maxLength

  return (
    <div className="bg-terminal-surface border-4 border-cyber-blue rounded-2xl p-6 md:p-8 shadow-glow-blue">
      {/* 질문 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-8 h-8 text-cyber-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
          <h3 className="text-lg font-mono font-bold text-cyber-blue">질문</h3>
        </div>
        <div className="bg-terminal-bg border-2 border-cyber-blue/50 rounded-xl p-5 md:p-6">
          <p className="text-xl md:text-2xl font-terminal font-bold text-white leading-relaxed">{question}</p>
        </div>
      </div>

      {/* 답변 입력 */}
      {!submitted ? (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="answer" className="flex items-center gap-2 text-lg font-mono font-bold text-cyber-pink">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/>
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"/>
                </svg>
                답변 작성
              </label>
              <span className={`text-sm font-mono font-bold transition-colors ${
                isOverLimit ? 'text-cyber-red animate-pulse' :
                isNearLimit ? 'text-cyber-gold' :
                'text-white/50'
              }`}>
                {characterCount}/{maxLength}자
              </span>
            </div>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              maxLength={maxLength}
              placeholder="답변을 입력하세요... (1-2문장 권장)"
              className={`w-full px-5 md:px-6 py-4 md:py-5 bg-terminal-bg rounded-xl
                         text-white font-mono text-base md:text-lg leading-relaxed
                         focus:ring-4 focus:outline-none
                         placeholder:text-white/30
                         resize-none transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         ${error ? 'border-2 border-cyber-red focus:ring-cyber-red/30' :
                           'border-2 border-cyber-pink/50 focus:border-cyber-pink focus:ring-cyber-pink/30'}`}
              rows={4}
            />
            {error && (
              <div className="flex items-center gap-2 mt-3 text-cyber-red font-mono text-sm font-bold animate-slideInTerminal">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={disabled || answer.trim().length === 0}
            className="w-full px-8 py-5 md:py-6 bg-terminal-surface border-4 border-cyber-pink text-cyber-pink font-terminal font-bold text-xl md:text-2xl
                       hover:bg-cyber-pink hover:text-terminal-bg transition-all duration-300
                       shadow-glow-pink hover:shadow-glow-pink hover:scale-105
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
                       rounded-xl tracking-wider"
          >
            답변 제출
          </button>
        </>
      ) : (
        <div className="text-center py-10 md:py-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-phosphor-green/20 border-4 border-phosphor-green rounded-full mb-6 shadow-glow-green animate-scaleGlow">
            <svg
              className="w-12 h-12 text-phosphor-green"
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
          <p className="text-3xl font-bold text-phosphor-green font-terminal mb-3 glow-text">답변 제출 완료!</p>
          <p className="text-cyber-blue font-mono">다른 플레이어의 답변을 기다리는 중...</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}
