import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VotingBoard from './VotingBoard'
import type { Answer } from '@/types/game.types'

describe('VotingBoard', () => {
  const mockAnswers: Record<string, Answer> = {
    player_1: {
      text: '매우 좋아요!',
      submittedAt: 1000,
    },
    player_2: {
      text: '그냥 그래요',
      submittedAt: 2000,
    },
    player_3: {
      text: '별로예요',
      submittedAt: 3000,
    },
  }

  const defaultProps = {
    answers: mockAnswers,
    onVote: vi.fn(),
    voted: false,
    myVote: null,
  }

  it('모든 답변이 올바르게 렌더링됨', () => {
    render(<VotingBoard {...defaultProps} />)
    expect(screen.getByText('매우 좋아요!')).toBeInTheDocument()
    expect(screen.getByText('그냥 그래요')).toBeInTheDocument()
    expect(screen.getByText('별로예요')).toBeInTheDocument()
  })

  it('익명 ID가 올바르게 표시됨', () => {
    render(<VotingBoard {...defaultProps} />)
    expect(screen.getByText('player_1')).toBeInTheDocument()
    expect(screen.getByText('player_2')).toBeInTheDocument()
    expect(screen.getByText('player_3')).toBeInTheDocument()
  })

  it('답변 클릭 시 선택됨', () => {
    const { container } = render(<VotingBoard {...defaultProps} />)

    // 답변 텍스트를 포함하는 요소를 찾아서 클릭 가능한 부모 요소까지 올라감
    const answerText = screen.getByText('매우 좋아요!')
    const clickableDiv = answerText.closest('[class*="border-2"]')

    if (clickableDiv) {
      fireEvent.click(clickableDiv)
      // 클릭 후 border-primary 클래스가 추가되어야 함
      expect(clickableDiv).toHaveClass('border-primary')
    }
  })

  it('투표 버튼 클릭 시 onVote 호출됨', () => {
    const onVote = vi.fn()
    render(<VotingBoard {...defaultProps} onVote={onVote} />)
    
    // player_1 선택
    const firstAnswer = screen.getByText('매우 좋아요!').closest('div')
    if (firstAnswer) {
      fireEvent.click(firstAnswer)
    }
    
    // 투표 버튼 클릭
    const voteButton = screen.getByText('투표하기')
    fireEvent.click(voteButton)
    
    expect(onVote).toHaveBeenCalledWith('player_1')
  })

  it('선택하지 않으면 투표 버튼 비활성화', () => {
    render(<VotingBoard {...defaultProps} />)
    const voteButton = screen.getByText('투표하기')
    expect(voteButton).toBeDisabled()
  })

  it('투표 완료 후 메시지 표시', () => {
    render(<VotingBoard {...defaultProps} voted={true} />)
    expect(screen.getByText('투표 완료!')).toBeInTheDocument()
    expect(screen.getByText('다른 플레이어의 투표를 기다리는 중...')).toBeInTheDocument()
  })

  it('투표 완료 후 답변 선택 불가', () => {
    render(<VotingBoard {...defaultProps} voted={true} />)
    const firstAnswer = screen.getByText('매우 좋아요!').closest('div')
    
    if (firstAnswer) {
      fireEvent.click(firstAnswer)
      // 투표 완료 상태에서는 선택되지 않아야 함
      expect(screen.queryByText('투표하기')).not.toBeInTheDocument()
    }
  })

  it('내 투표가 강조 표시됨', () => {
    render(<VotingBoard {...defaultProps} voted={true} myVote="player_2" />)
    expect(screen.getByText('내 투표')).toBeInTheDocument()
  })

  it('답변이 제출 시간 순으로 정렬됨', () => {
    render(<VotingBoard {...defaultProps} />)
    const allAnswers = screen.getAllByText(/매우 좋아요!|그냥 그래요|별로예요/)
    
    // 첫 번째가 가장 먼저 제출된 답변이어야 함
    expect(allAnswers[0]).toHaveTextContent('매우 좋아요!')
    expect(allAnswers[1]).toHaveTextContent('그냥 그래요')
    expect(allAnswers[2]).toHaveTextContent('별로예요')
  })

  it('익명 ID 약자가 올바르게 표시됨', () => {
    render(<VotingBoard {...defaultProps} />)
    // player_1 -> '1', player_2 -> '2', player_3 -> '3'
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
