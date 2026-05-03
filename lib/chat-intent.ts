// ─── Intent Types ───────────────────────────────────────────────────────────

export type IntentType =
  | 'analyze'
  | 'add_note'
  | 'show_notes'
  | 'delete_note'
  | 'add_task'
  | 'show_tasks'
  | 'complete_task'
  | 'delete_task'
  | 'show_history'
  | 'help'
  | 'greeting'
  | 'unknown'

export interface ParsedIntent {
  type: IntentType
  payload?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

// ─── Intent Patterns ────────────────────────────────────────────────────────

const patterns: { type: IntentType; regex: RegExp; extract?: (match: RegExpMatchArray) => Partial<ParsedIntent> }[] = [
  // Greetings
  { type: 'greeting', regex: /^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening))[\s!?.]*$/i },
  
  // Help
  { type: 'help', regex: /^(help|what can you do|commands|how do i|what do you do)[\s?]*$/i },
  
  // Notes
  {
    type: 'add_note',
    regex: /^(?:add|create|new|save|write)\s+(?:a\s+)?note[:\s]+(.+)$/i,
    extract: (m) => ({ payload: m[1].trim() }),
  },
  {
    type: 'add_note',
    regex: /^note[:\s]+(.+)$/i,
    extract: (m) => ({ payload: m[1].trim() }),
  },
  { type: 'show_notes', regex: /^(?:show|list|view|get|my)\s*(?:all\s+)?notes?$/i },
  {
    type: 'delete_note',
    regex: /^(?:delete|remove)\s+note\s+(\d+|".+")$/i,
    extract: (m) => ({ payload: m[1].replace(/"/g, '') }),
  },
  
  // Tasks
  {
    type: 'add_task',
    regex: /^(?:add|create|new)\s+(?:a\s+)?task[:\s]+(.+?)(?:\s+(?:priority|p)[:\s]*(low|medium|high))?(?:\s+(?:due|by)[:\s]*(.+))?$/i,
    extract: (m) => ({
      payload: m[1].trim(),
      priority: (m[2]?.toLowerCase() as 'low' | 'medium' | 'high') || 'medium',
      dueDate: m[3]?.trim(),
    }),
  },
  {
    type: 'add_task',
    regex: /^task[:\s]+(.+)$/i,
    extract: (m) => ({ payload: m[1].trim(), priority: 'medium' }),
  },
  { type: 'show_tasks', regex: /^(?:show|list|view|get|my)\s*(?:all\s+)?tasks?$/i },
  {
    type: 'complete_task',
    regex: /^(?:complete|done|finish|check)\s+task\s+(\d+|".+")$/i,
    extract: (m) => ({ payload: m[1].replace(/"/g, '') }),
  },
  {
    type: 'delete_task',
    regex: /^(?:delete|remove)\s+task\s+(\d+|".+")$/i,
    extract: (m) => ({ payload: m[1].replace(/"/g, '') }),
  },
  
  // History
  { type: 'show_history', regex: /^(?:show|view|list|get|my)\s*(?:analysis\s+)?history$/i },
  
  // Analysis - catch-all for longer messages
  {
    type: 'analyze',
    regex: /^(?:analyze|help me with|think about|process|prioritize)[:\s]+(.+)$/is,
    extract: (m) => ({ payload: m[1].trim() }),
  },
]

// ─── Parse Intent ───────────────────────────────────────────────────────────

export function parseIntent(input: string): ParsedIntent {
  const trimmed = input.trim()

  // Check patterns
  for (const { type, regex, extract } of patterns) {
    const match = trimmed.match(regex)
    if (match) {
      return { type, ...(extract ? extract(match) : {}) }
    }
  }

  // If message is long enough, treat as analysis
  if (trimmed.length >= 20) {
    return { type: 'analyze', payload: trimmed }
  }

  return { type: 'unknown' }
}

// ─── Analysis Types (mirrored from analysis-tab) ────────────────────────────

export interface AnalysisResult {
  summary: string
  problems: string[]
  priorities: { item: string; urgency: 1 | 2 | 3 | 4 | 5 }[]
  actions: string[]
}

// ─── Mock Analysis Function ─────────────────────────────────────────────────

export async function runAnalysis(input: string): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return {
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
  }
}

// ─── Format Analysis Result ─────────────────────────────────────────────────

export function formatAnalysisResult(result: AnalysisResult): string {
  const urgencyLabels = ['Low', 'Medium', 'High', 'Very High', 'Critical']
  
  let text = `**Summary**\n${result.summary}\n\n`

  text += `**Problems Identified**\n`
  result.problems.forEach((p) => {
    text += `- ${p}\n`
  })
  text += '\n'

  text += `**Priorities**\n`
  result.priorities.forEach((p) => {
    text += `- [${urgencyLabels[p.urgency - 1]}] ${p.item}\n`
  })
  text += '\n'

  text += `**Next Actions**\n`
  result.actions.forEach((a, i) => {
    text += `${i + 1}. ${a}\n`
  })

  return text
}

// ─── Note & Task Types ──────────────────────────────────────────────────────

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
}

export interface Task {
  id: string
  description: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  completed: boolean
  createdAt: string
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  notes: 'clearmind-notes',
  tasks: 'clearmind-tasks',
  history: 'clearmind-history',
  chatHistory: 'clearmind-chat',
} as const
