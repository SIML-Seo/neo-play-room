import { useState } from 'react'
import Button from '@shared/ui-components/Button'
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 질문 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">질문</h3>
        <p className="text-2xl font-bold text-gray-900">{question}</p>
      </div>

      {/* 답변 입력 */}
      {!submitted ? (
        <>
          <div className="mb-4">
            <label htmlFor="answer" className="block text-sm font-semibold text-gray-700 mb-2">
              답변
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              maxLength={maxLength}
              placeholder="답변을 입력하세요... (1-2문장 권장)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={4}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {answer.length}/{maxLength}자
              </span>
              {error && <span className="text-sm text-danger">{error}</span>}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={disabled || answer.trim().length === 0} size="lg" className="w-full">
            답변 제출
          </Button>
        </>
      ) : (
        <div className="text-center py-8">
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
          <p className="text-xl font-semibold text-gray-900">답변 제출 완료!</p>
          <p className="text-gray-600 mt-2">다른 플레이어의 답변을 기다리는 중...</p>
        </div>
      )}
    </div>
  )
}
