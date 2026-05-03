'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Task, TaskFilter, TaskPriority, UseTasksReturn, STORAGE_KEYS } from '@/lib/types'

/**
 * Custom hook for managing tasks with localStorage persistence
 */
export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<TaskFilter>('all')

  // Load tasks from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS)
      if (stored) {
        const parsed = JSON.parse(stored, (k, v) => {
          if (k === 'createdAt' || k === 'dueDate') {
            return v ? new Date(v) : undefined
          }
          return v
        })
        setTasks(parsed)
      }
    } catch (error) {
      console.warn('Error loading tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  }, [tasks, isLoading])

  // Add a new task
  const addTask = useCallback(
    (description: string, priority: TaskPriority, dueDate?: Date): Task => {
      const newTask: Task = {
        id: Date.now().toString(),
        description: description.trim(),
        priority,
        dueDate,
        completed: false,
        createdAt: new Date(),
      }

      setTasks((prev) => [newTask, ...prev])
      return newTask
    },
    []
  )

  // Edit an existing task
  const editTask = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
      )
    },
    []
  )

  // Delete a task
  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

  // Toggle task completion
  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }, [])

  // Get filtered tasks based on current filter
  const getFilteredTasks = useCallback((): Task[] => {
    switch (filter) {
      case 'active':
        return tasks.filter((task) => !task.completed)
      case 'completed':
        return tasks.filter((task) => task.completed)
      default:
        return tasks
    }
  }, [tasks, filter])

  return {
    tasks,
    isLoading,
    filter,
    setFilter,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    getFilteredTasks,
  }
}
