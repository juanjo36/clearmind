'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { ChatMessage, Message } from './chat-message'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import {
  parseIntent,
  formatAnalysisResult,
  STORAGE_KEYS,
  Note,
  Task,
  AnalysisResult,
} from '@/lib/chat-intent'
import { analyzeWithGroq } from '@/lib/chat-handler'

// ─── Helper Functions ───────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<
    { id: string; input: string; output: AnalysisResult; createdAt: string }[]
  >([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages and history from storage
  useEffect(() => {
    const savedMessages = getFromStorage<Message[]>(STORAGE_KEYS.chatHistory, [])
    if (savedMessages.length === 0) {
      // Add welcome message
      const welcome: Message = {
        id: generateId(),
        role: 'assistant',
        content:
          'Hello! I\'m ClearMind, your productivity assistant. I can help you:\n\n' +
          '- Analyze your thoughts and prioritize tasks\n' +
          '- Manage notes (add note: ..., show notes)\n' +
          '- Track tasks (add task: ..., show tasks)\n' +
          '- View analysis history\n\n' +
          'Just type what\'s on your mind, or try "help" for more commands.',
        timestamp: new Date(),
      }
      setMessages([welcome])
    } else {
      setMessages(
        savedMessages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
      )
    }

    setAnalysisHistory(getFromStorage(STORAGE_KEYS.history, []))
  }, [])

  // Save messages to storage
  useEffect(() => {
    if (messages.length > 0) {
      setToStorage(STORAGE_KEYS.chatHistory, messages)
    }
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Add assistant response
  const addAssistantMessage = useCallback((content: string) => {
    const msg: Message = {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, msg])
  }, [])

  // Process user message
  const handleSend = useCallback(
    async (text: string) => {
      // Add user message
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])

      const intent = parseIntent(text)
      setIsTyping(true)

      // Small delay for UX
      await new Promise((r) => setTimeout(r, 500))

      try {
        switch (intent.type) {
          case 'greeting':
            addAssistantMessage(
              'Hey there! What can I help you with today? You can share what\'s on your mind, and I\'ll help you organize and prioritize.'
            )
            break

          case 'help':
            addAssistantMessage(
              'Here\'s what I can do:\n\n' +
                '**Analysis**\n' +
                '- Just type your thoughts and I\'ll analyze them\n' +
                '- "analyze: [your thoughts]"\n\n' +
                '**Notes**\n' +
                '- "add note: [content]" - Create a note\n' +
                '- "show notes" - List all notes\n' +
                '- "delete note [number]" - Remove a note\n\n' +
                '**Tasks**\n' +
                '- "add task: [description]" - Create a task\n' +
                '- "add task: [desc] priority: high" - With priority\n' +
                '- "show tasks" - List all tasks\n' +
                '- "complete task [number]" - Mark done\n' +
                '- "delete task [number]" - Remove a task\n\n' +
                '**History**\n' +
                '- "show history" - View past analyses\n\n' +
                '*Tip: Use the navigation tabs above to manage notes, tasks, and history directly!*'
            )
            break

          case 'analyze':
            if (!intent.payload || intent.payload.length < 10) {
              addAssistantMessage(
                'Please share more details so I can provide a meaningful analysis. What\'s on your mind?'
              )
            } else {
              const response = await analyzeWithGroq(intent.payload || text)

              // Save to history
              const historyItem = {
                id: generateId(),
                input: intent.payload,
                output: response,
                createdAt: new Date().toISOString(),
              }
              const newHistory = [historyItem, ...analysisHistory]
              setAnalysisHistory(newHistory)
              setToStorage(STORAGE_KEYS.history, newHistory)

              addAssistantMessage(formatAnalysisResult(response))
            }
            break

          case 'add_note': {
            if (!intent.payload) {
              addAssistantMessage('Please provide content for the note. Example: "add note: Meeting notes from today"')
              break
            }
            const notes = getFromStorage<Note[]>(STORAGE_KEYS.notes, [])
            const newNote: Note = {
              id: generateId(),
              title: intent.payload.substring(0, 50) + (intent.payload.length > 50 ? '...' : ''),
              content: intent.payload,
              createdAt: new Date().toISOString(),
            }
            notes.push(newNote)
            setToStorage(STORAGE_KEYS.notes, notes)
            addAssistantMessage(`Note saved! You now have ${notes.length} note${notes.length === 1 ? '' : 's'}. View all in the Notes tab.`)
            break
          }

          case 'show_notes': {
            const notes = getFromStorage<Note[]>(STORAGE_KEYS.notes, [])
            if (notes.length === 0) {
              addAssistantMessage('You don\'t have any notes yet. Try "add note: [your content]" to create one, or use the Notes tab.')
            } else {
              let response = `**Your Notes (${notes.length})**\n\n`
              notes.forEach((note, i) => {
                const preview = note.content.substring(0, 80) + (note.content.length > 80 ? '...' : '')
                response += `${i + 1}. ${preview}\n`
              })
              response += '\n*View and edit all notes in the Notes tab.*'
              addAssistantMessage(response)
            }
            break
          }

          case 'delete_note': {
            const notes = getFromStorage<Note[]>(STORAGE_KEYS.notes, [])
            const index = parseInt(intent.payload || '') - 1
            if (isNaN(index) || index < 0 || index >= notes.length) {
              addAssistantMessage(`Invalid note number. You have ${notes.length} notes. Try "delete note 1".`)
            } else {
              const deleted = notes.splice(index, 1)[0]
              setToStorage(STORAGE_KEYS.notes, notes)
              addAssistantMessage(`Deleted note: "${deleted.title}"`)
            }
            break
          }

          case 'add_task': {
            if (!intent.payload) {
              addAssistantMessage('Please provide a task description. Example: "add task: Review project proposal"')
              break
            }
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, [])
            const newTask: Task = {
              id: generateId(),
              description: intent.payload,
              priority: intent.priority || 'medium',
              dueDate: intent.dueDate,
              completed: false,
              createdAt: new Date().toISOString(),
            }
            tasks.push(newTask)
            setToStorage(STORAGE_KEYS.tasks, tasks)
            addAssistantMessage(
              `Task added with ${newTask.priority} priority. You now have ${tasks.length} task${tasks.length === 1 ? '' : 's'}. Manage all in the Tasks tab.`
            )
            break
          }

          case 'show_tasks': {
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, [])
            if (tasks.length === 0) {
              addAssistantMessage('You don\'t have any tasks yet. Try "add task: [description]" to create one, or use the Tasks tab.')
            } else {
              const active = tasks.filter((t) => !t.completed)
              const completed = tasks.filter((t) => t.completed)
              let response = `**Your Tasks (${active.length} active, ${completed.length} completed)**\n\n`

              if (active.length > 0) {
                response += '**Active**\n'
                active.forEach((task, i) => {
                  const priorityBadge = { low: 'L', medium: 'M', high: 'H' }[task.priority]
                  response += `${i + 1}. [${priorityBadge}] ${task.description}\n`
                })
              }

              if (completed.length > 0) {
                response += '\n**Completed**\n'
                completed.forEach((task) => {
                  response += `- ~~${task.description}~~\n`
                })
              }

              response += '\n*Manage all tasks in the Tasks tab.*'
              addAssistantMessage(response)
            }
            break
          }

          case 'complete_task': {
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, [])
            const activeTasks = tasks.filter((t) => !t.completed)
            const index = parseInt(intent.payload || '') - 1
            if (isNaN(index) || index < 0 || index >= activeTasks.length) {
              addAssistantMessage(`Invalid task number. You have ${activeTasks.length} active tasks.`)
            } else {
              const taskId = activeTasks[index].id
              const taskIndex = tasks.findIndex((t) => t.id === taskId)
              tasks[taskIndex].completed = true
              setToStorage(STORAGE_KEYS.tasks, tasks)
              addAssistantMessage(`Great job! Task completed: "${activeTasks[index].description}"`)
            }
            break
          }

          case 'delete_task': {
            const tasks = getFromStorage<Task[]>(STORAGE_KEYS.tasks, [])
            const index = parseInt(intent.payload || '') - 1
            if (isNaN(index) || index < 0 || index >= tasks.length) {
              addAssistantMessage(`Invalid task number. You have ${tasks.length} tasks.`)
            } else {
              const deleted = tasks.splice(index, 1)[0]
              setToStorage(STORAGE_KEYS.tasks, tasks)
              addAssistantMessage(`Deleted task: "${deleted.description}"`)
            }
            break
          }

          case 'show_history': {
            const history = getFromStorage<{ id: string; input: string; createdAt: string }[]>(
              STORAGE_KEYS.history,
              []
            )
            if (history.length === 0) {
              addAssistantMessage(
                'No analysis history yet. Share your thoughts and I\'ll analyze them for you!'
              )
            } else {
              let response = `**Analysis History (${history.length})**\n\n`
              history.slice(0, 5).forEach((item, i) => {
                const date = new Date(item.createdAt).toLocaleDateString()
                const preview = item.input.substring(0, 50) + (item.input.length > 50 ? '...' : '')
                response += `${i + 1}. [${date}] ${preview}\n`
              })
              if (history.length > 5) {
                response += `\n...and ${history.length - 5} more`
              }
              response += '\n\n*View full history in the History tab.*'
              addAssistantMessage(response)
            }
            break
          }

          case 'unknown':
          default:
            addAssistantMessage(
              'I\'m not sure what you mean. Try "help" to see what I can do, or just share your thoughts for an analysis.'
            )
        }
      } catch (error) {
        addAssistantMessage('Sorry, something went wrong. Please try again.')
        console.error('[v0] Chat error:', error)
      } finally {
        setIsTyping(false)
      }
    },
    [addAssistantMessage, analysisHistory]
  )

  // Clear chat
  const handleClearChat = () => {
    const welcome: Message = {
      id: generateId(),
      role: 'assistant',
      content: 'Chat cleared. How can I help you today?',
      timestamp: new Date(),
    }
    setMessages([welcome])
    setToStorage(STORAGE_KEYS.chatHistory, [welcome])
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            onSend={handleSend}
            disabled={isTyping}
            placeholder="Type your message..."
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Type "help" for available commands</span>
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" />
              Clear chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
