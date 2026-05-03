'use client'

import { useState } from 'react'
import {
  MessageSquare,
  StickyNote,
  CheckSquare,
  History,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatInterface } from './chat/chat-interface'
import { NotesTab } from './notes-tab'
import { TasksTab } from './tasks-tab'
import { HistoryTab } from './history-tab'
import { ThemeToggle } from './theme-toggle'

// ─── Navigation Types ───────────────────────────────────────────────────────

type Section = 'chat' | 'notes' | 'tasks' | 'history'

interface NavItem {
  id: Section
  label: string
  icon: React.ElementType
  description: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    description: 'AI-powered analysis',
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: StickyNote,
    description: 'Your thoughts',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    description: 'Things to do',
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    description: 'Past analyses',
  },
]

// ─── Main App Shell ─────────────────────────────────────────────────────────

export function AppShell() {
  const [activeSection, setActiveSection] = useState<Section>('chat')

  const activeItem = NAV_ITEMS.find((item) => item.id === activeSection)

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm md:h-16 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground md:h-9 md:w-9">
            <Brain className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              ClearMind
            </h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeSection === 'chat' && <ChatInterface />}

        {activeSection === 'notes' && (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Notes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capture and organize your thoughts
                </p>
              </div>
              <NotesTab />
            </div>
          </div>
        )}

        {activeSection === 'tasks' && (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Tasks
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track what needs to be done
                </p>
              </div>
              <TasksTab />
            </div>
          </div>
        )}

        {activeSection === 'history' && (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  History
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review your past analyses
                </p>
              </div>
              <HistoryTab />
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sticky bottom-0 z-40 flex h-16 shrink-0 items-center justify-around border-t border-border bg-card/95 backdrop-blur-sm md:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5', isActive && 'text-primary')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
