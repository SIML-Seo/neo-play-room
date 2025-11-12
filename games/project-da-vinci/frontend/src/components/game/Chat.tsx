import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import type { User } from 'firebase/auth'

interface ChatProps {
  roomId: string
  user: User
}

export default function Chat({ roomId, user }: ChatProps) {
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
      await sendMessage(inputText)
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
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">팀 채팅</h3>
        <p className="text-xs text-gray-500">전략을 공유하세요 (AI는 볼 수 없습니다)</p>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
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
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!isMyMessage && (
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {message.displayName}
                    </div>
                  )}
                  <div className="text-sm break-words whitespace-pre-wrap">{message.text}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isMyMessage ? 'text-indigo-200' : 'text-gray-500'
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
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            maxLength={200}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isSending ? '전송 중...' : '전송'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Enter로 전송 · {inputText.length}/200
        </div>
      </form>
    </div>
  )
}
