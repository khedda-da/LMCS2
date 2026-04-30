'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Language } from '@/lib/i18n'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [language, setLanguageState] = useState<Language>('en')

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const savedLanguage = localStorage.getItem('language') as Language | null

    if (savedTheme) {
      setThemeState(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }

    if (savedLanguage) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    document.documentElement.lang = lang
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <LanguageContext.Provider value={{ language, setLanguage }}>
        {children}
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return default values if context is not available (during SSR or hydration)
  if (context === undefined) {
    return {
      theme: 'light' as const,
      toggleTheme: () => {},
      setTheme: () => {},
    }
  }
  return context
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  // Return default values if context is not available (during SSR or hydration)
  if (context === undefined) {
    return {
      language: 'en' as Language,
      setLanguage: () => {},
    }
  }
  return context
}
