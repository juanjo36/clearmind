// ─── ClearMind TypeScript Types ─────────────────────────────────────────────

// Chat Message Types
export interface ChatMessage {
  id: string
  sender: 'user' | 'agent'
  content: string
  timestamp: Date
  type?: 'text' | 'analysis' | 'note' | 'task' | 'error' | 'system'
  metadata?: ChatMessageMetadata
}

export interface ChatMessageMetadata {
  analysisId?: string
  noteId?: string
  taskId?: string
  isStreaming?: boolean
  error?: string
}

// Note Types
export interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt?: Date
}

// Task Types
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskFilter = 'all' | 'active' | 'completed'

export interface Task {
  id: string
  description: string
  priority: TaskPriority
  dueDate?: Date
  completed: boolean
  createdAt: Date
}

// Analysis Types
export interface AnalysisPriority {
  item: string
  urgency: 1 | 2 | 3 | 4 | 5 // 1=Low, 5=Critical
}

export interface AnalysisResult {
  summary: string
  problems: string[]
  priorities: AnalysisPriority[]
  actions: string[]
}

export interface Analysis {
  id: string
  input: string
  output: AnalysisResult
  createdAt: Date
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// App State Types
export interface AppState {
  messages: ChatMessage[]
  notes: Note[]
  tasks: Task[]
  analyses: Analysis[]
  theme: Theme
}

// Intent Parser Types
export type IntentType =
  | 'analyze'
  | 'add_note'
  | 'show_notes'
  | 'delete_note'
  | 'add_task'
  | 'show_tasks'
  | 'delete_task'
  | 'complete_task'
  | 'show_history'
  | 'help'
  | 'clear'
  | 'unknown'

export interface ParsedIntent {
  type: IntentType
  params: Record<string, string>
  originalMessage: string
}

// API Types
export interface AnalyzeRequest {
  input: string
}

export interface AnalyzeResponse {
  result: string
  parsed?: AnalysisResult
}

// Hook Return Types
export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
  retryLastMessage: () => Promise<void>
}

export interface UseNotesReturn {
  notes: Note[]
  isLoading: boolean
  addNote: (title: string, content: string) => Note
  editNote: (id: string, title: string, content: string) => void
  deleteNote: (id: string) => void
  searchNotes: (query: string) => Note[]
  getNoteById: (id: string) => Note | undefined
}

export interface UseTasksReturn {
  tasks: Task[]
  isLoading: boolean
  filter: TaskFilter
  setFilter: (filter: TaskFilter) => void
  addTask: (description: string, priority: TaskPriority, dueDate?: Date) => Task
  editTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  getFilteredTasks: () => Task[]
}

export interface UseAnalysesReturn {
  analyses: Analysis[]
  isLoading: boolean
  addAnalysis: (input: string, output: AnalysisResult) => Analysis
  deleteAnalysis: (id: string) => void
  getAnalysisById: (id: string) => Analysis | undefined
}

export interface UseThemeReturn {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

// Component Props Types
export interface ChatInterfaceProps {
  className?: string
}

export interface NotesViewProps {
  notes?: Note[]
  onAddNote?: (title: string, content: string) => void
  onEditNote?: (id: string, title: string, content: string) => void
  onDeleteNote?: (id: string) => void
  className?: string
}

export interface TasksViewProps {
  tasks?: Task[]
  onAddTask?: (description: string, priority: TaskPriority, dueDate?: Date) => void
  onEditTask?: (id: string, updates: Partial<Task>) => void
  onDeleteTask?: (id: string) => void
  onToggleTask?: (id: string) => void
  filter?: TaskFilter
  onFilterChange?: (filter: TaskFilter) => void
  className?: string
}

export interface HistoryViewProps {
  analyses?: Analysis[]
  onDeleteAnalysis?: (id: string) => void
  className?: string
}

export interface ThemeToggleProps {
  className?: string
}

// LocalStorage Keys
export const STORAGE_KEYS = {
  MESSAGES: 'clearmind-messages',
  NOTES: 'clearmind-notes',
  TASKS: 'clearmind-tasks',
  ANALYSES: 'clearmind-history',
  THEME: 'clearmind-theme',
} as const
