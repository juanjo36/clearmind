'use client'

import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExportButton } from './export-button'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  summary: string
  problems: string[]
  priorities: { item: string; urgency: 1 | 2 | 3 | 4 | 5 }[]
  actions: string[]
}

interface AnalysisTabProps {
  onAnalysisComplete?: (result: AnalysisResult) => void
}

// ─── Mock analysis function (replace with real AI integration later) ────────

async function analyzeInput(input: string): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary:
          'You have a clear set of priorities but need better time management. The main blocker is team coordination, which is preventing progress on the project roadmap.',
        problems: [
          'Team communication gaps causing delays',
          'Unclear project priorities across departments',
          'Time management issues with competing deadlines',
          'Lack of documentation for onboarding',
        ],
        priorities: [
          { item: 'Schedule team sync to align on goals', urgency: 5 },
          { item: 'Create project roadmap document', urgency: 4 },
          { item: 'Set up weekly check-ins', urgency: 3 },
          { item: 'Document current processes', urgency: 3 },
          { item: 'Plan team building activity', urgency: 1 },
        ],
        actions: [
          'Send calendar invites for team meeting tomorrow at 10 AM',
          'Create shared document for project roadmap with team input',
          'Set weekly recurring check-in for Mondays at 2 PM',
        ],
      })
    }, 2000)
  })
}

// ─── Helper: Format result as text ──────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

export function AnalysisTab({ onAnalysisComplete }: AnalysisTabProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    setError(null)

    if (!input.trim()) {
      setError('Please enter some text to analyze')
      return
    }

    if (input.trim().length < 10) {
      setError('Please provide at least 10 characters for meaningful analysis')
      return
    }

    setLoading(true)

    try {
      const analysisResult = await analyzeInput(input)
      setResult(analysisResult)

      // Save to history
      const historyItem = {
        id: Date.now().toString(),
        input: input,
        output: analysisResult,
        createdAt: new Date().toISOString(),
      }

      const existingHistory = localStorage.getItem('clearmind-history') || '[]'
      const historyArray = JSON.parse(existingHistory)
      historyArray.unshift(historyItem) // Add to beginning (newest first)
      localStorage.setItem('clearmind-history', JSON.stringify(historyArray))

      onAnalysisComplete?.(analysisResult)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to analyze input. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-8">
      {/* Input section */}
      <div className="space-y-3">
        <label
          htmlFor="analysis-input"
          className="block text-sm font-semibold text-foreground"
        >
          What&apos;s on your mind?
        </label>
        <textarea
          id="analysis-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Dump everything – concerns, ideas, blockers, thoughts. Share raw details and we'll help organize and prioritize."
          className="min-h-40 w-full resize-none rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          {input.length} characters • Minimum 10 characters required
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleAnalyze}
          disabled={loading || input.trim().length < 10}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed',
            loading || input.trim().length < 10
              ? 'bg-muted text-muted-foreground opacity-60'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Analyze and Prioritize
            </>
          )}
        </button>

        {result && (
          <ExportButton
            content={formatResultAsText(result)}
            filename="clearmind-analysis"
          />
        )}
      </div>

      {/* Results section */}
      {result && (
        <div className="space-y-6 pt-6">
          {/* Summary box */}
          <div className="rounded-lg bg-muted p-5 sm:p-6">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Summary
            </h3>
            <p className="text-base leading-relaxed text-foreground">
              {result.summary}
            </p>
          </div>

          {/* Problems box */}
          <div className="rounded-lg border-l-4 border-l-orange-500 bg-orange-50 p-5 dark:bg-orange-950/30">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-orange-900 dark:text-orange-100">
              <AlertCircle className="h-4 w-4" />
              Problems Identified
            </h3>
            <ul className="space-y-2">
              {result.problems.map((problem, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-sm text-orange-900 dark:text-orange-100"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500 dark:bg-orange-400" />
                  <span>{problem}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Priorities box */}
          <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 p-5 dark:bg-amber-950/30">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
              <Zap className="h-4 w-4" />
              Priority Queue
            </h3>
            <ul className="space-y-3">
              {result.priorities.map((priority, idx) => {
                const urgencyColors = [
                  'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
                  'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
                  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
                  'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
                  'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
                ]
                const urgencyLabels = ['Low', 'Medium', 'High', 'Very High', 'Critical']

                return (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-4 rounded-md bg-white dark:bg-amber-900/20 px-3 py-2"
                  >
                    <span className="text-sm text-foreground">
                      {priority.item}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        urgencyColors[priority.urgency - 1]
                      )}
                    >
                      {urgencyLabels[priority.urgency - 1]}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Actions box */}
          <div className="rounded-lg border-l-4 border-l-green-500 bg-green-50 p-5 dark:bg-green-950/30">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-green-900 dark:text-green-100">
              <CheckCircle2 className="h-4 w-4" />
              Next 3 Actions
            </h3>
            <ol className="space-y-3">
              {result.actions.map((action, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-900 dark:bg-green-500/30 dark:text-green-100">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5 text-sm leading-relaxed text-green-900 dark:text-green-100">
                    {action}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Additional info */}
          <div className="flex items-center justify-between rounded-lg bg-card border border-border p-4">
            <span className="text-sm text-muted-foreground">
              Analysis generated {new Date().toLocaleTimeString()}
            </span>
            <button
              onClick={() => {
                setResult(null)
                setInput('')
              }}
              className="text-sm font-medium text-primary hover:underline"
            >
              New analysis
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Zap className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-foreground">
              Ready for analysis
            </p>
            <p className="text-xs text-muted-foreground">
              Share your thoughts above and we&apos;ll help you organize and prioritize
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
