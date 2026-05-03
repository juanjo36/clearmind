'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/use-theme'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  variant?: 'icon' | 'dropdown'
}

export function ThemeToggle({
  className,
  showLabel = false,
  variant = 'icon',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          className
        )}
        disabled
      >
        <Sun className="h-5 w-5" />
      </button>
    )
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'flex items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
          showLabel ? 'h-9 gap-2 px-3' : 'h-9 w-9',
          className
        )}
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        {resolvedTheme === 'light' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
        {showLabel && (
          <span className="text-sm font-medium">
            {resolvedTheme === 'light' ? 'Dark' : 'Light'}
          </span>
        )}
      </button>
    )
  }

  // Dropdown variant with system option
  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTheme('light')}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-all',
            theme === 'light'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label="Light mode"
          title="Light mode"
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-all',
            theme === 'dark'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label="Dark mode"
          title="Dark mode"
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-all',
            theme === 'system'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label="System theme"
          title="System theme"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
