'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Note, UseNotesReturn, STORAGE_KEYS } from '@/lib/types'

/**
 * Custom hook for managing notes with localStorage persistence
 */
export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load notes from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTES)
      if (stored) {
        const parsed = JSON.parse(stored, (k, v) => {
          if (k === 'createdAt' || k === 'updatedAt') {
            return new Date(v)
          }
          return v
        })
        setNotes(parsed)
      }
    } catch (error) {
      console.warn('Error loading notes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Persist notes to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
  }, [notes, isLoading])

  // Add a new note
  const addNote = useCallback((title: string, content: string): Note => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date(),
    }

    setNotes((prev) => [newNote, ...prev])
    return newNote
  }, [])

  // Edit an existing note
  const editNote = useCallback((id: string, title: string, content: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              title: title.trim(),
              content: content.trim(),
              updatedAt: new Date(),
            }
          : note
      )
    )
  }, [])

  // Delete a note
  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
  }, [])

  // Search notes by title or content
  const searchNotes = useCallback(
    (query: string): Note[] => {
      if (!query.trim()) return notes

      const lowerQuery = query.toLowerCase()
      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerQuery) ||
          note.content.toLowerCase().includes(lowerQuery)
      )
    },
    [notes]
  )

  // Get note by ID
  const getNoteById = useCallback(
    (id: string): Note | undefined => {
      return notes.find((note) => note.id === id)
    },
    [notes]
  )

  return {
    notes,
    isLoading,
    addNote,
    editNote,
    deleteNote,
    searchNotes,
    getNoteById,
  }
}
