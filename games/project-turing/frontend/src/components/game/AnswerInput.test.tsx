import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AnswerInput from './AnswerInput'

describe('AnswerInput', () => {
  const defaultProps = {
    question: '오늘 기분은 어떠신가요?',
    onSubmit: vi.fn(),
    disabled: false,
    submitted: false,
    maxLength: 200,
  }

  it('질문이 올바르게 렌더링됨', () => {
    render(<AnswerInput {...defaultProps} />)
    expect(screen.getByText('오늘 기분은 어떠신가요?')).toBeInTheDocument()
  })

  it('답변 입력 시 textarea에 값이 표시됨', () => {
    render(<AnswerInput {...defaultProps} />)
    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/)
    
    fireEvent.change(textarea, { target: { value: '좋아요!' } })
    expect(textarea).toHaveValue('좋아요!')
  })

  it('답변이 비어있으면 버튼이 비활성화됨', () => {
    render(<AnswerInput {...defaultProps} />)
    const submitButton = screen.getByText('답변 제출')

    // 버튼이 비활성화되어 있어야 함
    expect(submitButton).toBeDisabled()
  })

  it('maxLength를 초과하면 에러 메시지 표시', () => {
    render(<AnswerInput {...defaultProps} maxLength={10} />)
    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/)
    const submitButton = screen.getByText('답변 제출')
    
    fireEvent.change(textarea, { target: { value: '12345678901' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('답변은 최대 10자까지 입력 가능합니다.')).toBeInTheDocument()
  })

  it('올바른 답변 제출 시 onSubmit이 호출됨', () => {
    const onSubmit = vi.fn()
    render(<AnswerInput {...defaultProps} onSubmit={onSubmit} />)
    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/)
    const submitButton = screen.getByText('답변 제출')
    
    fireEvent.change(textarea, { target: { value: '좋아요!' } })
    fireEvent.click(submitButton)
    
    expect(onSubmit).toHaveBeenCalledWith('좋아요!')
  })

  it('submitted 상태일 때 완료 메시지 표시', () => {
    render(<AnswerInput {...defaultProps} submitted={true} />)
    expect(screen.getByText('답변 제출 완료!')).toBeInTheDocument()
  })

  it('disabled 상태일 때 입력 불가', () => {
    render(<AnswerInput {...defaultProps} disabled={true} />)
    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/)
    expect(textarea).toBeDisabled()
  })

  it('글자 수 카운터가 올바르게 표시됨', () => {
    render(<AnswerInput {...defaultProps} />)
    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/)
    
    expect(screen.getByText('0/200자')).toBeInTheDocument()
    
    fireEvent.change(textarea, { target: { value: '안녕하세요' } })
    expect(screen.getByText('5/200자')).toBeInTheDocument()
  })

  it('빈 공백만 입력하면 버튼이 비활성화됨', () => {
    render(<AnswerInput {...defaultProps} />)
    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/)
    const submitButton = screen.getByText('답변 제출')

    fireEvent.change(textarea, { target: { value: '   ' } })

    // 공백만 있으면 trim() 후 길이가 0이므로 버튼 비활성화
    expect(submitButton).toBeDisabled()
  })

  it('XSS 공격 방지 - HTML 태그 sanitize', () => {
    const onSubmit = vi.fn()
    render(<AnswerInput {...defaultProps} onSubmit={onSubmit} />)
    const textarea = screen.getByPlaceholderText(/답변을 입력하세요/)
    const submitButton = screen.getByText('답변 제출')
    
    fireEvent.change(textarea, { target: { value: '<script>alert("XSS")</script>안녕' } })
    fireEvent.click(submitButton)
    
    // sanitizeMessage가 호출되어 스크립트 태그가 제거됨
    expect(onSubmit).toHaveBeenCalledWith('안녕')
  })
})
