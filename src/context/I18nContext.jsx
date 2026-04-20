import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTranslations } from '../services/api'

const I18nContext = createContext()

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('admin_lang') || 'zh')
  const [translations, setTranslations] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_translations')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  const loadTranslations = useCallback(async (language) => {
    try {
      const t = await getTranslations(language)
      setTranslations(t)
      localStorage.setItem('admin_translations', JSON.stringify(t))
    } catch (error) {
      console.error('Failed to load translations:', error)
      // 如果加载失败，尝试用已保存的翻译
      const saved = localStorage.getItem('admin_translations')
      if (saved) setTranslations(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    loadTranslations(lang)
  }, [lang, loadTranslations])

  const changeLanguage = (newLang) => {
    setLang(newLang)
    localStorage.setItem('admin_lang', newLang)
  }

  const t = (key, params) => {
    let text = translations[key] || key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
      })
    }
    return text
  }

  return (
    <I18nContext.Provider value={{ lang, changeLanguage, t, translations }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
