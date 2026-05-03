'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChatMessage, UseChatReturn, STORAGE_KEYS } from '@/lib/types'
import { processUserMessage } from '@/lib/chat-handler'

/**
 * Custom hook for managing chat messages with localStorage persistence
 * Handles message sending, streaming responses, and Groq integration
 */
export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastUserMessageRef = useRef<string>('')

  // Load messages from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES)
      if (stored) {
        const parsed = JSON.parse(stored, (k, v) => {
          if (k === 'timestamp') {
            return new Date(v)
          }
          return v
        })
        setMessages(parsed)
      } else {
        // Add welcome message if no messages exist
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          sender: 'agent',
          content:
            'Welcome to ClearMind! I can help you analyze your thoughts, manage notes and tasks, or just chat. Try saying "analyze" followed by what\'s on your mind, or type "help" for available commands.',
          timestamp: new Date(),
          type: 'system',
        }
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.warn('Error loading messages:', error)
    }
  }, [])

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || messages.length === 0) return
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  }, [messages])

  // Add a message to the chat
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }, [])

  // Send a user message and get agent response
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      setError(null)
      lastUserMessageRef.current = content

      // Add user message
      addMessage({
        sender: 'user',
        content: content.trim(),
        type: 'text',
      })

      setIsLoading(true)

      try {
        // TODO: Process message through intent parser and Groq API
        // For now, use the local processUserMessage function
        const response = await processUserMessage(content.trim())

        // Add agent response
        addMessage({
          sender: 'agent',
          content: response.message,
          type: response.type || 'text',
          metadata: response.metadata,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process message'
        setError(errorMessage)

        // Add error message to chat
        addMessage({
          sender: 'agent',
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          type: 'error',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, addMessage]
  )

  // Clear all messages
  const clearChat = useCallback(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      sender: 'agent',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date(),
      type: 'system',
    }
    setMessages([welcomeMessage])
    setError(null)
  }, [])

  // Retry the last failed message
  const retryLastMessage = useCallback(async () => {
    if (lastUserMessageRef.current) {
      // Remove the last error message if any
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.type === 'error') {
          return prev.slice(0, -1)
        }
        return prev
      })

      await sendMessage(lastUserMessageRef.current)
    }
  }, [sendMessage])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    retryLastMessage,
  }
}
