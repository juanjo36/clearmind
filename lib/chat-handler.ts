import { AnalysisResult, ChatMessage, STORAGE_KEYS } from './types'
import { parseIntent } from './intent-parser'
import { parseGroqResponse } from './groq-parser'

// ─── Response Types ─────────────────────────────────────────────────────────

export interface ProcessedResponse {
  message: string
  type?: ChatMessage['type']
  metadata?: ChatMessage['metadata']
}

// ─── Main Message Processor ─────────────────────────────────────────────────

/**
 * Process a user message and return an appropriate response
 * Routes to correct handler based on detected intent
 */
export async function processUserMessage(input: string): Promise<ProcessedResponse> {
  const intent = parseIntent(input)

  switch (intent.type) {
    case 'analyze':
      return handleAnalyze(intent.params.content || input)

    case 'add_note':
      return handleAddNote(intent.params.title, intent.params.content)

    case 'show_notes':
      return handleShowNotes()

    case 'delete_note':
      return handleDeleteNote(intent.params.id || intent.params.title)

    case 'add_task':
      return handleAddTask(
        intent.params.description,
        intent.params.priority as 'low' | 'medium' | 'high'
      )

    case 'show_tasks':
      return handleShowTasks(intent.params.filter)

    case 'delete_task':
      return handleDeleteTask(intent.params.id || intent.params.description)

    case 'complete_task':
      return handleCompleteTask(intent.params.id || intent.params.description)

    case 'show_history':
      return handleShowHistory()

    case 'help':
      return handleHelp()

    case 'clear':
      return { message: 'Chat cleared.', type: 'system' }

    default:
      // For unknown intents with sufficient content, try analysis
      if (input.trim().length >= 20) {
        return handleAnalyze(input)
      }
      return handleUnknown(input)
  }
}

// ─── Intent Handlers ────────────────────────────────────────────────────────

async function handleAnalyze(content: string): Promise<ProcessedResponse> {
  // TODO: Replace with actual Groq API call
  // POST /api/analyze with { input: content }
  // For now, use mock analysis

  await simulateDelay(1500)

  const mockResult: AnalysisResult = {
    summary: `Based on your input, I've identified several key themes and actionable items. Your thoughts center around: ${content.slice(0, 50)}...`,
    problems: [
      'Need for better organization and prioritization',
      'Potential time management challenges',
      'Areas requiring focused attention',
    ],
    priorities: [
      { item: 'Address the most pressing concern first', urgency: 4 },
      { item: 'Plan for medium-term goals', urgency: 3 },
      { item: 'Consider long-term implications', urgency: 2 },
    ],
    actions: [
      'Break down the main issue into smaller, manageable tasks',
      'Set specific deadlines for each action item',
      'Review progress at the end of the day',
    ],
  }

  // Save to history
  saveAnalysisToHistory(content, mockResult)

  return {
    message: formatAnalysisResult(mockResult),
    type: 'analysis',
    metadata: { analysisId: Date.now().toString() },
  }
}

function handleAddNote(title?: string, content?: string): ProcessedResponse {
  if (!title && !content) {
    return {
      message: 'Please provide a title or content for your note. Try: "add note: [title] - [content]"',
      type: 'text',
    }
  }

  const noteTitle = title || 'Quick Note'
  const noteContent = content || title || ''

  // Save to localStorage
  const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]')
  const newNote = {
    id: Date.now().toString(),
    title: noteTitle,
    content: noteContent,
    createdAt: new Date().toISOString(),
  }
  notes.unshift(newNote)
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))

  return {
    message: `Note created: "${noteTitle}"`,
    type: 'note',
    metadata: { noteId: newNote.id },
  }
}

function handleShowNotes(): ProcessedResponse {
  const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]')

  if (notes.length === 0) {
    return {
      message: 'You have no notes yet. Create one with: "add note: [title] - [content]"',
      type: 'text',
    }
  }

  const notesList = notes
    .slice(0, 5)
    .map((note: { title: string; content: string }, i: number) => 
      `${i + 1}. **${note.title}**: ${note.content.slice(0, 50)}${note.content.length > 50 ? '...' : ''}`
    )
    .join('\n')

  return {
    message: `Your recent notes (${notes.length} total):\n\n${notesList}\n\nUse the Notes tab to see all notes.`,
    type: 'text',
  }
}

function handleDeleteNote(identifier: string): ProcessedResponse {
  const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]')
  const noteIndex = notes.findIndex(
    (n: { id: string; title: string }) =>
      n.id === identifier || n.title.toLowerCase().includes(identifier.toLowerCase())
  )

  if (noteIndex === -1) {
    return { message: `Note "${identifier}" not found.`, type: 'text' }
  }

  const deletedNote = notes[noteIndex]
  notes.splice(noteIndex, 1)
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))

  return {
    message: `Deleted note: "${deletedNote.title}"`,
    type: 'text',
  }
}

function handleAddTask(
  description?: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
): ProcessedResponse {
  if (!description) {
    return {
      message: 'Please provide a task description. Try: "add task: [description]" or "add task: [description] priority high"',
      type: 'text',
    }
  }

  const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]')
  const newTask = {
    id: Date.now().toString(),
    description,
    priority,
    completed: false,
    createdAt: new Date().toISOString(),
  }
  tasks.unshift(newTask)
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))

  return {
    message: `Task added: "${description}" (${priority} priority)`,
    type: 'task',
    metadata: { taskId: newTask.id },
  }
}

function handleShowTasks(filter?: string): ProcessedResponse {
  const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]')

  let filteredTasks = tasks
  if (filter === 'active') {
    filteredTasks = tasks.filter((t: { completed: boolean }) => !t.completed)
  } else if (filter === 'completed') {
    filteredTasks = tasks.filter((t: { completed: boolean }) => t.completed)
  }

  if (filteredTasks.length === 0) {
    return {
      message: filter
        ? `No ${filter} tasks found.`
        : 'You have no tasks yet. Add one with: "add task: [description]"',
      type: 'text',
    }
  }

  const tasksList = filteredTasks
    .slice(0, 5)
    .map(
      (task: { description: string; priority: string; completed: boolean }, i: number) =>
        `${i + 1}. ${task.completed ? '~~' : ''}${task.description}${task.completed ? '~~' : ''} [${task.priority}]`
    )
    .join('\n')

  const activeCount = tasks.filter((t: { completed: boolean }) => !t.completed).length
  const completedCount = tasks.filter((t: { completed: boolean }) => t.completed).length

  return {
    message: `Your tasks (${activeCount} active, ${completedCount} completed):\n\n${tasksList}\n\nUse the Tasks tab to manage all tasks.`,
    type: 'text',
  }
}

function handleDeleteTask(identifier: string): ProcessedResponse {
  const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]')
  const taskIndex = tasks.findIndex(
    (t: { id: string; description: string }) =>
      t.id === identifier || t.description.toLowerCase().includes(identifier.toLowerCase())
  )

  if (taskIndex === -1) {
    return { message: `Task "${identifier}" not found.`, type: 'text' }
  }

  const deletedTask = tasks[taskIndex]
  tasks.splice(taskIndex, 1)
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))

  return {
    message: `Deleted task: "${deletedTask.description}"`,
    type: 'text',
  }
}

function handleCompleteTask(identifier: string): ProcessedResponse {
  const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]')
  const taskIndex = tasks.findIndex(
    (t: { id: string; description: string }) =>
      t.id === identifier || t.description.toLowerCase().includes(identifier.toLowerCase())
  )

  if (taskIndex === -1) {
    return { message: `Task "${identifier}" not found.`, type: 'text' }
  }

  tasks[taskIndex].completed = !tasks[taskIndex].completed
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))

  const status = tasks[taskIndex].completed ? 'completed' : 'reopened'
  return {
    message: `Task ${status}: "${tasks[taskIndex].description}"`,
    type: 'text',
  }
}

function handleShowHistory(): ProcessedResponse {
  const analyses = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYSES) || '[]')

  if (analyses.length === 0) {
    return {
      message: 'No analysis history yet. Share your thoughts and I\'ll analyze them for you!',
      type: 'text',
    }
  }

  const historyList = analyses
    .slice(0, 3)
    .map((a: { input: string; createdAt: string }, i: number) => {
      const date = new Date(a.createdAt).toLocaleDateString()
      return `${i + 1}. ${date}: "${a.input.slice(0, 40)}..."`
    })
    .join('\n')

  return {
    message: `Recent analyses (${analyses.length} total):\n\n${historyList}\n\nUse the History tab to view full analyses.`,
    type: 'text',
  }
}

function handleHelp(): ProcessedResponse {
  return {
    message: `**ClearMind Commands:**

**Analysis:**
- Just type your thoughts (20+ chars) to get an analysis
- "analyze [your thoughts]" - explicit analysis request

**Notes:**
- "add note: [title] - [content]" - create a note
- "show notes" - list recent notes
- "delete note [title]" - remove a note

**Tasks:**
- "add task: [description]" - create a task
- "add task: [description] priority high" - with priority
- "show tasks" / "show active tasks" - list tasks
- "complete [task]" - toggle task completion
- "delete task [description]" - remove a task

**Other:**
- "show history" - view past analyses
- "clear" - clear chat history
- "help" - show this message

You can also use the navigation tabs for full-featured views!`,
    type: 'system',
  }
}

function handleUnknown(input: string): ProcessedResponse {
  return {
    message: `I'm not sure what you'd like me to do with "${input}". Try typing "help" to see available commands, or share more context for an analysis.`,
    type: 'text',
  }
}

// ─── Utility Functions ──────────────────────────────────────────────────────

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function saveAnalysisToHistory(input: string, result: AnalysisResult): void {
  const analyses = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYSES) || '[]')
  const newAnalysis = {
    id: Date.now().toString(),
    input,
    output: result,
    createdAt: new Date().toISOString(),
  }
  analyses.unshift(newAnalysis)
  localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(analyses))
}

function formatAnalysisResult(result: AnalysisResult): string {
  let formatted = '**Analysis Complete**\n\n'

  formatted += '**Summary:**\n' + result.summary + '\n\n'

  formatted += '**Problems Identified:**\n'
  result.problems.forEach((p) => (formatted += `- ${p}\n`))
  formatted += '\n'

  formatted += '**Priorities:**\n'
  result.priorities.forEach((p) => {
    const urgencyLabel = ['Low', 'Medium', 'High', 'Very High', 'Critical'][p.urgency - 1]
    formatted += `- [${urgencyLabel}] ${p.item}\n`
  })
  formatted += '\n'

  formatted += '**Recommended Actions:**\n'
  result.actions.forEach((a, i) => (formatted += `${i + 1}. ${a}\n`))

  return formatted
}

// ─── Groq API Integration ───────────────────────────────────────────────────

/**
 * TODO: Send message to Groq API via /api/analyze endpoint
 * This function will be called when analysis is needed
 */
export async function analyzeWithGroq(input: string): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (data?.parsed) {
      return data.parsed
    }

    if (typeof data?.result === 'string') {
      return parseGroqResponse(data.result)
    }

    throw new Error('Invalid API response')
  } catch (error) {
    console.error('Error calling Groq API:', error)
    throw error
  }
}

/**
 * TODO: Handle streaming response from Groq
 * For real-time typing effect
 */
export async function* streamAnalyzeWithGroq(
  input: string
): AsyncGenerator<string, AnalysisResult, unknown> {
  // TODO: Implement streaming
  // This would yield partial text as it comes in
  // and return the final parsed result

  yield 'Analyzing your thoughts...'

  throw new Error('Streaming not implemented yet')
}
