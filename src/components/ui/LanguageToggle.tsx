import { memo } from 'react'
import { Globe } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'

export const LanguageToggle = memo(() => {
  const { language, setLanguage } = useSettingsStore()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'id' : 'en')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center p-2 rounded-lg bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-700 transition-colors"
      aria-label="Toggle language"
    >
      <Globe className="w-4 h-4 text-secondary-600 dark:text-secondary-300 mr-1" />
      <span className="text-sm font-medium text-secondary-600 dark:text-secondary-300">
        {language === 'en' ? 'EN' : 'ID'}
      </span>
    </button>
  )
})

LanguageToggle.displayName = 'LanguageToggle'