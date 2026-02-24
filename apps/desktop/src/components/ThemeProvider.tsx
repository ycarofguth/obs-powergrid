import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { ThemeContext, type Theme } from '../hooks/use-theme'
import { updateSettings } from '../services/api'

const THEME_STORAGE_KEY = 'obs-powergrid-theme'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyThemeToDOM(resolved: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.add('theme-transition')
  root.classList.toggle('dark', resolved === 'dark')
  setTimeout(() => root.classList.remove('theme-transition'), 250)
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) return stored
    return 'dark'
  })

  const resolved = useMemo(() => resolveTheme(theme), [theme])

  // Apply to DOM on mount and changes
  useEffect(() => {
    applyThemeToDOM(resolved)
  }, [resolved])

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyThemeToDOM(resolveTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    updateSettings({ theme: newTheme }).catch((err) => {
      console.warn('[Theme] Failed to persist theme to backend:', err)
    })
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme: resolved, setTheme }),
    [theme, resolved, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
