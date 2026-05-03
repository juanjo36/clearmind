'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Save, Check, Calendar, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  description: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  completed: boolean
}

interface TasksTabProps {
  tasks?: Task[]
  onTasksSaved?: (tasks: Task[]) => void
}

type FilterType = 'all' | 'active' | 'completed'

// ─────────────────────────────────────────────────────────────────────────────
// TasksTab Component
// ─────────────────────────────────────────────────────────────────────────────

export function TasksTab({ tasks: initialTasks, onTasksSaved }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks || [])
  const [filter, setFilter] = useState<FilterType>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formDescription, setFormDescription] = useState('')
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [formDueDate, setFormDueDate] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Load tasks from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('clearmind-tasks')
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        }))
        setTasks(parsed)
      } catch (error) {
        console.error('[v0] Failed to parse stored tasks:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('clearmind-tasks', JSON.stringify(tasks))
      onTasksSaved?.(tasks)
    }
  }, [tasks, isHydrated, onTasksSaved])

  // Filter tasks based on current filter
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const handleAddTask = () => {
    if (!formDescription.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      description: formDescription.trim(),
      priority: formPriority,
      dueDate: formDueDate ? new Date(formDueDate) : undefined,
      completed: false,
    }

    setTasks([...tasks, newTask])
    resetForm()
  }

  const handleToggleComplete = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const resetForm = () => {
    setFormDescription('')
    setFormPriority('medium')
    setFormDueDate('')
    setIsModalOpen(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'low':
        return 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const formatDueDate = (date?: Date) => {
    if (!date) return null
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (!isHydrated) return null

  const activeTasks = tasks.filter((t) => !t.completed).length
  const completedTasks = tasks.filter((t) => t.completed).length

  return (
    <div className="h-full bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tasks
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTasks} active · {completedTasks} completed
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="rounded-lg border border-border bg-card/50 p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                {filter === 'completed' && 'No completed tasks yet'}
                {filter === 'active' && 'No active tasks. Great work!'}
                {filter === 'all' && 'No tasks yet. Create one to get started'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-sm',
                  task.completed && 'opacity-60'
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(task.id)}
                  className={cn(
                    'mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors',
                    task.completed
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/50'
                  )}
                >
                  {task.completed && <Check className="h-3 w-3" />}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'break-words text-sm font-medium',
                      task.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    )}
                  >
                    {task.description}
                  </p>

                  {/* Priority and Due Date */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-block rounded px-2 py-0.5 text-xs font-medium',
                        getPriorityColor(task.priority)
                      )}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>

                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDueDate(task.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="flex-shrink-0 p-1.5 text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10 rounded"
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-card shadow-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Add New Task</h2>
              <button
                onClick={resetForm}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 px-6 py-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Task Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none"
                  rows={3}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formDescription.length}/500 characters
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFormPriority(p)}
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        formPriority === p
                          ? cn(
                              'text-white',
                              p === 'high'
                                ? 'bg-red-600'
                                : p === 'medium'
                                  ? 'bg-amber-600'
                                  : 'bg-green-600'
                            )
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 border-t border-border px-6 py-4">
              <button
                onClick={resetForm}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={!formDescription.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
