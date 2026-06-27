import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const THEME_KEY = 'novapos.theme'

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null
    return stored ?? getSystemTheme()
  })

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  return { theme, toggleTheme }
}
