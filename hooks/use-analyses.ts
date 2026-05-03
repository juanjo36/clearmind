'use client'

import { useState, useEffect, useCallback } from 'react'
import { Analysis, AnalysisResult, UseAnalysesReturn, STORAGE_KEYS } from '@/lib/types'

/**
 * Custom hook for managing analysis history with localStorage persistence
 */
export function useAnalyses(): UseAnalysesReturn {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load analyses from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ANALYSES)
      if (stored) {
        const parsed = JSON.parse(stored, (k, v) => {
          if (k === 'createdAt') {
            return new Date(v)
          }
          return v
        })
        setAnalyses(parsed)
      }
    } catch (error) {
      console.warn('Error loading analyses:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Persist analyses to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(analyses))
  }, [analyses, isLoading])

  // Add a new analysis
  const addAnalysis = useCallback(
    (input: string, output: AnalysisResult): Analysis => {
      const newAnalysis: Analysis = {
        id: Date.now().toString(),
        input: input.trim(),
        output,
        createdAt: new Date(),
      }

      setAnalyses((prev) => [newAnalysis, ...prev])
      return newAnalysis
    },
    []
  )

  // Delete an analysis
  const deleteAnalysis = useCallback((id: string) => {
    setAnalyses((prev) => prev.filter((analysis) => analysis.id !== id))
  }, [])

  // Get analysis by ID
  const getAnalysisById = useCallback(
    (id: string): Analysis | undefined => {
      return analyses.find((analysis) => analysis.id === id)
    },
    [analyses]
  )

  return {
    analyses,
    isLoading,
    addAnalysis,
    deleteAnalysis,
    getAnalysisById,
  }
}
