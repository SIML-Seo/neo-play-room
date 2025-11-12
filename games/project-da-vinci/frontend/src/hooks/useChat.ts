import { useEffect, useState, useCallback } from 'react'
import { ref, push, onValue, serverTimestamp } from 'firebase/database'
import { database } from '@/firebase'
import type { User } from 'firebase/auth'

export interface ChatMessage {
  id: string
  uid: string
  displayName: string | null
  text: string
  timestamp: number
}

export function useChat(roomId: string | undefined, user: User | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)

  // 메시지 실시간 구독
  useEffect(() => {
    if (!roomId) return

    const messagesRef = ref(database, `gameRooms/${roomId}/messages`)

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData: ChatMessage[] = []

      snapshot.forEach((child) => {
        messagesData.push({
          id: child.key!,
          ...child.val(),
        })
      })

      // 시간순 정렬
      messagesData.sort((a, b) => a.timestamp - b.timestamp)
      setMessages(messagesData)
    })

    return () => {
      unsubscribe()
    }
  }, [roomId])

  // 메시지 전송
  const sendMessage = useCallback(
    async (text: string) => {
      if (!roomId || !user || !text.trim()) return

      try {
        setIsSending(true)

        const messagesRef = ref(database, `gameRooms/${roomId}/messages`)

        await push(messagesRef, {
          uid: user.uid,
          displayName: user.displayName || '익명',
          text: text.trim(),
          timestamp: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to send message:', err)
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [roomId, user]
  )

  return {
    messages,
    sendMessage,
    isSending,
  }
}
