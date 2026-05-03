import { IntentType, ParsedIntent } from './types'

// ─── Intent Patterns ────────────────────────────────────────────────────────

const INTENT_PATTERNS: Array<{
  pattern: RegExp
  type: IntentType
  extractParams?: (match: RegExpMatchArray) => Record<string, string>
}> = [
  // Analysis
  {
    pattern: /^(analyze|brain\s*dump|think\s*about|help\s*me\s*(understand|think|process))\s*[:\-]?\s*(.+)/i,
    type: 'analyze',
    extractParams: (match) => ({ content: match[3] }),
  },

  // Notes
  {
    pattern: /^add\s*note\s*[:\-]?\s*(.+?)\s*[-–]\s*(.+)/i,
    type: 'add_note',
    extractParams: (match) => ({ title: match[1], content: match[2] }),
  },
  {
    pattern: /^add\s*note\s*[:\-]?\s*(.+)/i,
    type: 'add_note',
    extractParams: (match) => ({ title: match[1], content: '' }),
  },
  {
    pattern: /^(show|list|view|get|my)\s*(all\s*)?(notes?)/i,
    type: 'show_notes',
  },
  {
    pattern: /^delete\s*note\s*[:\-]?\s*(.+)/i,
    type: 'delete_note',
    extractParams: (match) => ({ title: match[1] }),
  },
  {
    pattern: /^remove\s*note\s*[:\-]?\s*(.+)/i,
    type: 'delete_note',
    extractParams: (match) => ({ title: match[1] }),
  },

  // Tasks
  {
    pattern: /^add\s*task\s*[:\-]?\s*(.+?)\s*priority\s*(low|medium|high)/i,
    type: 'add_task',
    extractParams: (match) => ({ description: match[1], priority: match[2].toLowerCase() }),
  },
  {
    pattern: /^add\s*task\s*[:\-]?\s*(.+)/i,
    type: 'add_task',
    extractParams: (match) => ({ description: match[1], priority: 'medium' }),
  },
  {
    pattern: /^(show|list|view|get|my)\s*(all|active|completed)?\s*(tasks?)/i,
    type: 'show_tasks',
    extractParams: (match) => ({ filter: match[2]?.toLowerCase() || 'all' }),
  },
  {
    pattern: /^delete\s*task\s*[:\-]?\s*(.+)/i,
    type: 'delete_task',
    extractParams: (match) => ({ description: match[1] }),
  },
  {
    pattern: /^remove\s*task\s*[:\-]?\s*(.+)/i,
    type: 'delete_task',
    extractParams: (match) => ({ description: match[1] }),
  },
  {
    pattern: /^(complete|done|finish|check)\s*(task)?\s*[:\-]?\s*(.+)/i,
    type: 'complete_task',
    extractParams: (match) => ({ description: match[3] }),
  },
  {
    pattern: /^(uncomplete|reopen|uncheck)\s*(task)?\s*[:\-]?\s*(.+)/i,
    type: 'complete_task',
    extractParams: (match) => ({ description: match[3] }),
  },

  // History
  {
    pattern: /^(show|list|view|get|my)\s*(analysis\s*)?(history|analyses|past)/i,
    type: 'show_history',
  },

  // System
  {
    pattern: /^(help|\?|commands|what\s*can\s*you\s*do)/i,
    type: 'help',
  },
  {
    pattern: /^(clear|reset|start\s*over|new\s*chat)/i,
    type: 'clear',
  },
]

// ─── Intent Parser ──────────────────────────────────────────────────────────

/**
 * Parse user input to detect intent and extract parameters
 */
export function parseIntent(input: string): ParsedIntent {
  const trimmedInput = input.trim()

  // Check each pattern
  for (const { pattern, type, extractParams } of INTENT_PATTERNS) {
    const match = trimmedInput.match(pattern)
    if (match) {
      return {
        type,
        params: extractParams ? extractParams(match) : {},
        originalMessage: trimmedInput,
      }
    }
  }

  // If input is long enough, treat as potential analysis
  if (trimmedInput.length >= 20) {
    return {
      type: 'analyze',
      params: { content: trimmedInput },
      originalMessage: trimmedInput,
    }
  }

  // Unknown intent
  return {
    type: 'unknown',
    params: {},
    originalMessage: trimmedInput,
  }
}

/**
 * Get human-readable description of an intent
 */
export function getIntentDescription(intent: IntentType): string {
  const descriptions: Record<IntentType, string> = {
    analyze: 'Analyze thoughts and provide insights',
    add_note: 'Create a new note',
    show_notes: 'Display saved notes',
    delete_note: 'Remove a note',
    add_task: 'Create a new task',
    show_tasks: 'Display tasks',
    delete_task: 'Remove a task',
    complete_task: 'Mark task as complete/incomplete',
    show_history: 'View past analyses',
    help: 'Show available commands',
    clear: 'Clear chat history',
    unknown: 'Unknown command',
  }

  return descriptions[intent]
}

/**
 * Check if input looks like it needs analysis
 */
export function shouldAnalyze(input: string): boolean {
  const trimmed = input.trim()

  // Too short for meaningful analysis
  if (trimmed.length < 20) return false

  // Check if it's explicitly a command
  const isCommand = INTENT_PATTERNS.some(({ pattern, type }) => {
    if (type === 'analyze') return false // Skip analyze patterns
    return pattern.test(trimmed)
  })

  return !isCommand
}
