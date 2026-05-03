"use client"

import { useState } from "react"
import { BarChart2, BookOpen, CheckSquare, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnalysisTab } from "./analysis-tab"
import { NotesTab } from "./notes-tab"
import { TasksTab } from "./tasks-tab"
import { HistoryTab } from "./history-tab"

// ─── Tab definitions ────────────────────────────────────────────────────────

type TabId = "analysis" | "notes" | "tasks" | "history"

interface Tab {
  id: TabId
  label: string
  icon: React.ElementType
  description: string
}

const TABS: Tab[] = [
  {
    id: "analysis",
    label: "Analysis",
    icon: BarChart2,
    description: "Insights and metrics from your work sessions",
  },
  {
    id: "notes",
    label: "Notes",
    icon: BookOpen,
    description: "Capture thoughts, ideas, and references",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    description: "Manage and prioritise what needs doing",
  },
  {
    id: "history",
    label: "History",
    icon: Clock,
    description: "Review past activity and completed work",
  },
]

// ─── Empty-state panel (placeholder for future content) ─────────────────────

function TabPanel({ tab, activeTab }: { tab: Tab; activeTab: TabId }) {
  // Show AnalysisTab when analysis tab is active
  if (activeTab === "analysis") {
    return (
      <AnalysisTab
        onAnalysisComplete={(result) => {
          console.log("Analysis completed:", result)
        }}
      />
    )
  }

  // Show NotesTab when notes tab is active
  if (activeTab === "notes") {
    return (
      <NotesTab
        onNotesSaved={(notes) => {
          console.log("Notes saved:", notes)
        }}
      />
    )
  }

  // Show TasksTab when tasks tab is active
  if (activeTab === "tasks") {
    return (
      <TasksTab
        onTasksSaved={(tasks) => {
          console.log("Tasks saved:", tasks)
        }}
      />
    )
  }

  // Show HistoryTab when history tab is active
  if (activeTab === "history") {
    return (
      <HistoryTab
        onDelete={(id) => {
          console.log("Analysis deleted:", id)
        }}
      />
    )
  }

  // Default placeholder for other tabs
  const Icon = tab.icon
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {tab.label}
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          {tab.description}
        </p>
      </div>
      <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        Content coming soon
      </span>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ClearMindTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("analysis")
  const currentTab = TABS.find((t) => t.id === activeTab)!

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── App header ── */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo mark */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 text-primary-foreground"
                aria-hidden="true"
              >
                <path
                  d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M16 3.5c2.5 1 4.5 3 5 5.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              ClearMind
            </span>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-xs font-medium text-accent">
              Focus mode
            </span>
          </div>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="border-b border-border bg-card">
        <nav
          className="mx-auto max-w-4xl px-4 sm:px-6"
          aria-label="Main navigation"
        >
          <ul
            className="flex gap-0 overflow-x-auto scrollbar-none"
            role="tablist"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = tab.id === activeTab

              return (
                <li key={tab.id} role="presentation">
                  <button
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-2 whitespace-nowrap px-4 py-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors duration-150",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                      strokeWidth={isActive ? 2 : 1.75}
                      aria-hidden="true"
                    />
                    {tab.label}

                    {/* Active underline indicator */}
                    {isActive && (
                      <span
                        className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* ── Tab content ── */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {TABS.map((tab) => (
            <section
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              hidden={tab.id !== activeTab}
              className={cn(
                "transition-opacity duration-200",
                tab.id === activeTab ? "opacity-100" : "opacity-0"
              )}
            >
              {tab.id === activeTab && <TabPanel tab={currentTab} activeTab={activeTab} />}
            </section>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="text-xs text-muted-foreground">
            ClearMind &copy; {new Date().getFullYear()}
          </p>
          <p className="text-xs text-muted-foreground">
            Tab {TABS.findIndex((t) => t.id === activeTab) + 1} of{" "}
            {TABS.length}
          </p>
        </div>
      </footer>
    </div>
  )
}
