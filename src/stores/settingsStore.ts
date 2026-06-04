import { create } from 'zustand'
import type { UserSettings } from '../types'
import { DEFAULT_SETTINGS } from '../utils/constants'

interface SettingsStore {
  settings: UserSettings
  isLoaded: boolean

  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<UserSettings>) => void
  resetSettings: () => void
  getApiKey: (provider: 'openai' | 'anthropic') => string
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      // Try to load from localStorage (renderer-side persistence)
      const stored = localStorage.getItem('player-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        set({
          settings: { ...DEFAULT_SETTINGS, ...parsed },
          isLoaded: true
        })
        return
      }
    } catch {
      // Use defaults
    }
    set({ isLoaded: true })
  },

  updateSettings: (partial) =>
    set(state => {
      const newSettings = { ...state.settings, ...partial }
      // Persist to localStorage
      try {
        localStorage.setItem('player-settings', JSON.stringify(newSettings))
      } catch {
        // Ignore storage errors
      }
      return { settings: newSettings }
    }),

  resetSettings: () => {
    try {
      localStorage.removeItem('player-settings')
    } catch {
      // Ignore
    }
    set({ settings: DEFAULT_SETTINGS })
  },

  getApiKey: (provider) => {
    const { settings } = get()
    return provider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey
  }
}))
