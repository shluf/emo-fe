import { memo } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'

export const ThemeToggle = memo(() => {
  const { theme, toggleTheme } = useSettingsStore()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-secondary-600 dark:text-secondary-300" />
      ) : (
        <Sun className="w-5 h-5 text-secondary-600 dark:text-secondary-300" />
      )}
    </button>
  )
})

ThemeToggle.displayName = 'ThemeToggle'