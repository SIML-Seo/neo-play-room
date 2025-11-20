import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import type { User } from 'firebase/auth'
import type { GameRoom } from '@/types/game.types'

interface ChatProps {
  roomId: string
  user: User
  gameRoom?: GameRoom
}

export default function Chat({ roomId, user, gameRoom }: ChatProps) {
  const { messages, sendMessage, isSending } = useChat(roomId, user)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 새 메시지가 오면 스크롤을 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submitMessage = async () => {
    if (!inputText.trim() || isSending) return

    try {
      // 현재 사용자의 artistName 가져오기
      const myArtistName = gameRoom?.players?.[user.uid]?.artistName
      await sendMessage(inputText, myArtistName)
      setInputText('')
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitMessage()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submitMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gallery-cream rounded-lg border-2 border-gold-dark/30">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gold-dark/30 bg-wood-dark/50">
        <h3 className="font-semibold text-gallery-ivory font-crimson">팀 채팅</h3>
        <p className="text-xs text-gallery-cream/70">전략을 공유하세요 (AI는 볼 수 없습니다)</p>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-wood-medium text-sm py-8 font-crimson">
            아직 메시지가 없습니다.
            <br />
            팀원들과 대화를 시작하세요!
          </div>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.uid === user.uid

            return (
              <div
                key={message.id}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isMyMessage
                      ? 'bg-gold-frame text-gallery-floor'
                      : 'bg-wood-light text-gallery-ivory'
                  }`}
                >
                  {!isMyMessage && (
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {message.artistName || '익명'}
                    </div>
                  )}
                  <div className="text-sm break-words whitespace-pre-wrap">{message.text}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isMyMessage ? 'text-gallery-floor/70' : 'text-gallery-cream/80'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 창 */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gold-dark/30 bg-wood-dark/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 border-2 border-gold-dark/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-frame focus:border-transparent text-sm text-gallery-floor bg-gallery-ivory text-gray-900"
            maxLength={200}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="px-4 py-2 bg-gold-frame text-gallery-floor rounded-lg hover:bg-gold-light disabled:bg-wood-medium disabled:cursor-not-allowed transition-colors text-sm font-medium font-crimson"
          >
            {isSending ? '전송 중...' : '전송'}
          </button>
        </div>
        <div className="text-xs text-gallery-cream/70 mt-1 font-crimson">
          Enter로 전송 · {inputText.length}/200
        </div>
      </form>
    </div>
  )
}
