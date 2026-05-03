import { AnalysisResult, AnalysisPriority } from './types'

// ─── Groq Response Parser ───────────────────────────────────────────────────

/**
 * Parse raw Groq API response into structured AnalysisResult
 * Handles various response formats from the LLM
 */
export function parseGroqResponse(rawResponse: string): AnalysisResult {
  // Default result structure
  const result: AnalysisResult = {
    summary: '',
    problems: [],
    priorities: [],
    actions: [],
  }

  try {
    // Try to parse as JSON first (if model returns structured output)
    const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1])
      return {
        summary: parsed.summary || '',
        problems: parsed.problems || [],
        priorities: (parsed.priorities || []).map(mapPriority),
        actions: parsed.actions || [],
      }
    }

    // Parse markdown-style sections
    const sections = extractSections(rawResponse)

    result.summary = sections.summary || extractFirstParagraph(rawResponse)
    result.problems = sections.problems || extractListItems(rawResponse, /problems?|issues?|challenges?/i)
    result.priorities = (sections.priorities || extractPriorities(rawResponse)).map(mapPriority)
    result.actions = sections.actions || extractListItems(rawResponse, /actions?|steps?|recommendations?|next/i)

    // Ensure we have at least some content
    if (!result.summary && !result.problems.length && !result.actions.length) {
      result.summary = rawResponse.slice(0, 500)
    }
  } catch (error) {
    console.warn('Error parsing Groq response:', error)
    result.summary = rawResponse.slice(0, 500)
  }

  return result
}

// ─── Section Extractors ─────────────────────────────────────────────────────

interface ExtractedSections {
  summary?: string
  problems?: string[]
  priorities?: Array<{ item: string; urgency: number }>
  actions?: string[]
}

function extractSections(text: string): ExtractedSections {
  const sections: ExtractedSections = {}

  // Extract summary section
  const summaryMatch = text.match(/(?:^|\n)(?:#{1,3}\s*)?(?:summary|📌\s*summary)[:\s]*([\s\S]*?)(?=\n#{1,3}|\n\*\*|\n(?:⚠️|🎯|🚀)|$)/i)
  if (summaryMatch) {
    sections.summary = stripEmojiHeader(summaryMatch[1].trim())
  }

  // Extract problems section
  const problemsMatch = text.match(/(?:^|\n)(?:#{1,3}\s*)?(?:problems?|issues?|⚠️\s*problems?)[:\s]*([\s\S]*?)(?=\n#{1,3}|\n\*\*[A-Z]|\n(?:🎯|🚀)|$)/i)
  if (problemsMatch) {
    sections.problems = extractBulletPoints(stripEmojiHeader(problemsMatch[1]))
  }

  // Extract priorities section
  const prioritiesMatch = text.match(/(?:^|\n)(?:#{1,3}\s*)?(?:priorit(?:y|ies)|🎯\s*priorit(?:y|ies))[:\s]*([\s\S]*?)(?=\n#{1,3}|\n\*\*[A-Z]|\n(?:🚀)|$)/i)
  if (prioritiesMatch) {
    sections.priorities = extractPriorityItems(stripEmojiHeader(prioritiesMatch[1]))
  }

  // Extract actions section
  const actionsMatch = text.match(/(?:^|\n)(?:#{1,3}\s*)?(?:actions?|steps?|recommendations?|next\s*steps?|🚀\s*3\s*actions\s*for\s*today)[:\s]*([\s\S]*?)(?=\n#{1,3}|\n\*\*[A-Z]|$)/i)
  if (actionsMatch) {
    sections.actions = extractBulletPoints(stripEmojiHeader(actionsMatch[1]))
  }

  return sections
}

function extractFirstParagraph(text: string): string {
  const lines = text.split('\n').filter((line) => line.trim())
  const paragraphs = []
  let currentParagraph = ''

  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('*') || line.startsWith('-') || /^\d+\./.test(line)) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim())
        currentParagraph = ''
      }
    } else {
      currentParagraph += ' ' + line
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim())
  }

  return paragraphs[0] || text.slice(0, 300)
}

function extractBulletPoints(text: string): string[] {
  const items: string[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const match = line.match(/^[\s]*[-*•]\s*(.+)/) || line.match(/^[\s]*\d+\.\s*(.+)/)
    if (match) {
      const item = match[1].trim()
      if (item.length > 2) {
        items.push(item)
      }
    }
  }

  return items
}

function extractListItems(text: string, sectionPattern: RegExp): string[] {
  const sectionMatch = text.match(new RegExp(`(?:^|\\n)(?:#{1,3}|\\*\\*)\\s*${sectionPattern.source}[:\\s]*([\\s\\S]*?)(?=\\n#{1,3}|\\n\\*\\*[A-Z]|\\n(?:⚠️|🎯|🚀)|$)`, 'i'))

  if (sectionMatch) {
    return extractBulletPoints(sectionMatch[1])
  }

  return []
}

function extractPriorities(text: string): Array<{ item: string; urgency: number }> {
  const items = extractListItems(text, /priorit(?:y|ies)/i)

  return items.map((item, index) => {
    // Try to detect urgency from keywords
    const urgency = detectUrgency(item)
    return { item: cleanPriorityText(item), urgency }
  })
}

function extractPriorityItems(text: string): Array<{ item: string; urgency: number }> {
  const items = extractBulletPoints(text)

  return items.map((item) => ({
    item: cleanPriorityText(item),
    urgency: detectUrgency(item),
  }))
}

function detectUrgency(text: string): number {
  const lowerText = text.toLowerCase()

  if (/critical|urgent|asap|immediately|emergency/i.test(lowerText)) return 5
  if (/very\s*high|highest|top|essential/i.test(lowerText)) return 4
  if (/high|important|significant/i.test(lowerText)) return 3
  if (/medium|moderate|normal/i.test(lowerText)) return 2
  if (/low|minor|optional|nice\s*to\s*have/i.test(lowerText)) return 1

  // Check for explicit number
  const numberMatch = text.match(/\[(\d)\]|\((\d)\)|priority[:\s]*(\d)|(\d)\s*\/\s*5/i)
  if (numberMatch) {
    const num = parseInt(numberMatch[1] || numberMatch[2] || numberMatch[3] || numberMatch[4], 10)
    if (num >= 1 && num <= 5) return num as 1 | 2 | 3 | 4 | 5
  }

  return 3 // Default to medium
}

function cleanPriorityText(text: string): string {
  // Remove urgency indicators from the text
  return text
    .replace(/\[(?:critical|high|medium|low|\d)\]/gi, '')
    .replace(/\((?:urgent|important)\)/gi, '')
    .replace(/\(\s*\d\s*\/\s*5\s*\)/gi, '')
    .replace(/^(?:critical|urgent|high|medium|low)[:\s]*/i, '')
    .trim()
}

function stripEmojiHeader(text: string): string {
  return text
    .replace(/^(?:📌|⚠️|🎯|🚀)\s*/g, '')
    .trim()
}

function mapPriority(p: { item: string; urgency: number } | string): AnalysisPriority {
  if (typeof p === 'string') {
    return { item: p, urgency: 3 }
  }

  return {
    item: p.item,
    urgency: Math.max(1, Math.min(5, p.urgency)) as 1 | 2 | 3 | 4 | 5,
  }
}

// ─── Response Formatter ─────────────────────────────────────────────────────

/**
 * Format AnalysisResult into human-readable markdown text
 */
export function formatAnalysisAsMarkdown(result: AnalysisResult): string {
  let output = ''

  if (result.summary) {
    output += '## Summary\n\n' + result.summary + '\n\n'
  }

  if (result.problems.length > 0) {
    output += '## Problems Identified\n\n'
    result.problems.forEach((p) => (output += `- ${p}\n`))
    output += '\n'
  }

  if (result.priorities.length > 0) {
    output += '## Priorities\n\n'
    const urgencyLabels = ['Low', 'Medium', 'High', 'Very High', 'Critical']
    result.priorities.forEach((p) => {
      output += `- **[${urgencyLabels[p.urgency - 1]}]** ${p.item}\n`
    })
    output += '\n'
  }

  if (result.actions.length > 0) {
    output += '## Recommended Actions\n\n'
    result.actions.forEach((a, i) => (output += `${i + 1}. ${a}\n`))
  }

  return output.trim()
}
