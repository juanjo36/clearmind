'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Trash2, Search, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExportButton } from './export-button'

interface AnalysisResult {
  summary: string
  problems: string[]
  priorities: Array<{
    item: string
    urgency: 1 | 2 | 3 | 4 | 5
  }>
  actions: string[]
}

interface Analysis {
  id: string
  input: string
  output: AnalysisResult
  createdAt: Date
}

interface HistoryTabProps {
  history?: Analysis[]
  onDelete?: (id: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// HistoryTab Component
// ─────────────────────────────────────────────────────────────────────────────

export function HistoryTab({ history: initialHistory, onDelete }: HistoryTabProps) {
  const [history, setHistory] = useState<Analysis[]>(initialHistory || [])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('clearmind-history')
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }))
        setHistory(parsed)
      } catch (error) {
        console.error('[v0] Failed to parse stored history:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('clearmind-history', JSON.stringify(history))
    }
  }, [history, isHydrated])

  // Format date for display
  const formatDate = (date: Date): string => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
  }

  // Get urgency color
  const getUrgencyColor = (urgency: number): string => {
    switch (urgency) {
      case 5:
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200'
      case 4:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200'
      case 3:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-200'
      case 2:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200'
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200'
    }
  }

  // Filter history by search query
  const filteredHistory = history.filter(
    (item) =>
      item.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatDate(item.createdAt).toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.output.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Delete analysis
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this analysis? This action cannot be undone.')) {
      const updated = history.filter((item) => item.id !== id)
      setHistory(updated)
      onDelete?.(id)
      if (expandedId === id) {
        setExpandedId(null)
      }
    }
  }

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Analysis History</h2>
        <p className="text-sm text-muted-foreground">View and search your past analyses</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by text, date, or summary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full rounded-lg border border-border bg-card px-3 py-2 pl-10 text-sm',
            'placeholder-muted-foreground text-foreground',
            'transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50'
          )}
        />
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/30" strokeWidth={1.5} />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {history.length === 0 ? 'No analyses yet' : 'No results found'}
            </p>
            <p className="text-xs text-muted-foreground">
              {history.length === 0
                ? 'Run an analysis to see it here'
                : 'Try adjusting your search query'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className={cn(
                'rounded-lg border border-border transition-all',
                expandedId === item.id
                  ? 'bg-card shadow-sm ring-1 ring-primary/20'
                  : 'bg-card hover:bg-secondary/50 cursor-pointer'
              )}
            >
              {/* Summary Row */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpand(item.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleExpand(item.id)
                  }
                }}
                className={cn(
                  'w-full px-4 py-3 text-left transition-colors md:py-4',
                  'hover:bg-secondary/50 active:bg-secondary'
                )}
              >
                <div className="flex items-start gap-3 md:items-center md:gap-4">
                  {/* Expand Icon */}
                  <div className="mt-1 flex-shrink-0 md:mt-0">
                    {expandedId === item.id ? (
                      <ChevronUp className="h-5 w-5 text-primary" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-2">
                      <time className="text-xs font-medium text-muted-foreground md:text-sm">
                        {formatDate(item.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-foreground md:text-base">
                      {item.input.substring(0, 50)}
                      {item.input.length > 50 ? '...' : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground md:text-sm">
                      {item.output.summary}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id)
                    }}
                    className={cn(
                      'flex-shrink-0 rounded-md p-2 transition-colors',
                      'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                    )}
                    title="Delete analysis"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === item.id && (
                <div className="border-t border-border px-4 py-4 md:px-6">
                  <div className="space-y-4">
                    {/* Full Input */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Original Input
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground">
                        {item.input}
                      </p>
                    </div>

                    {/* Summary */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Summary
                      </h3>
                      <div className="rounded-md bg-muted/50 px-3 py-2">
                        <p className="text-sm leading-relaxed text-foreground">
                          {item.output.summary}
                        </p>
                      </div>
                    </div>

                    {/* Problems */}
                    {item.output.problems.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Problems Identified
                        </h3>
                        <div className="space-y-2">
                          {item.output.problems.map((problem, idx) => (
                            <div
                              key={idx}
                              className="flex gap-2 rounded-md bg-orange-100/30 dark:bg-orange-950/30 px-3 py-2 text-sm text-foreground"
                            >
                              <span className="flex-shrink-0">•</span>
                              <span>{problem}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Priorities */}
                    {item.output.priorities.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Priorities & Urgency
                        </h3>
                        <div className="space-y-2">
                          {item.output.priorities.map((priority, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                            >
                              <span className="text-sm font-medium text-foreground flex-1">
                                {priority.item}
                              </span>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-1 text-xs font-semibold',
                                  getUrgencyColor(priority.urgency)
                                )}
                              >
                                Urgency {priority.urgency}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {item.output.actions.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Recommended Actions
                        </h3>
                        <div className="space-y-2">
                          {item.output.actions.map((action, idx) => (
                            <div
                              key={idx}
                              className="flex gap-2 rounded-md bg-green-100/30 dark:bg-green-950/30 px-3 py-2 text-sm text-foreground"
                            >
                              <span className="flex-shrink-0 font-semibold">{idx + 1}.</span>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Export Button */}
                    <div className="flex justify-end border-t border-border pt-4">
                      <ExportButton
                        content={formatResultAsText(item.output)}
                        filename={`analysis-${item.id}`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {history.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {filteredHistory.length} of {history.length} analyses
        </p>
      )}
    </div>
  )
}

function formatResultAsText(result: AnalysisResult): string {
  let text = ''

  text += 'SUMMARY\n'
  text += '─'.repeat(50) + '\n'
  text += result.summary + '\n\n'

  text += 'PROBLEMS IDENTIFIED\n'
  text += '─'.repeat(50) + '\n'
  result.problems.forEach((p) => (text += `• ${p}\n`))
  text += '\n'

  text += 'PRIORITIES\n'
  text += '─'.repeat(50) + '\n'
  result.priorities.forEach((p) => {
    const urgencyLabel = ['Low', 'Medium', 'High', 'Very High', 'Critical'][
      p.urgency - 1
    ]
    text += `[${urgencyLabel}] ${p.item}\n`
  })
  text += '\n'

  text += 'RECOMMENDED ACTIONS\n'
  text += '─'.repeat(50) + '\n'
  result.actions.forEach((a, i) => (text += `${i + 1}. ${a}\n`))

  return text
}
