import { create } from 'zustand'
import type { HistoryEntry, SmartFolder } from '../types'

interface HistoryStore {
  entries: HistoryEntry[]
  smartFolders: SmartFolder[]
  isLoading: boolean
  isPanelOpen: boolean
  searchQuery: string
  selectedCategory: string | null

  setEntries: (entries: HistoryEntry[]) => void
  addEntry: (entry: HistoryEntry) => void
  removeEntry: (id: number) => void
  updateEntry: (id: number, partial: Partial<HistoryEntry>) => void

  setSmartFolders: (folders: SmartFolder[]) => void
  setLoading: (loading: boolean) => void
  togglePanel: () => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string | null) => void

  getFilteredEntries: () => HistoryEntry[]
  getCategoryEntries: (category: string) => HistoryEntry[]
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: [],
  smartFolders: [],
  isLoading: false,
  isPanelOpen: false,
  searchQuery: '',
  selectedCategory: null,

  setEntries: (entries) => set({ entries }),
  addEntry: (entry) =>
    set(state => ({
      entries: [entry, ...state.entries.filter(e => e.id !== entry.id)]
    })),
  removeEntry: (id) =>
    set(state => ({
      entries: state.entries.filter(e => e.id !== id)
    })),
  updateEntry: (id, partial) =>
    set(state => ({
      entries: state.entries.map(e =>
        e.id === id ? { ...e, ...partial } : e
      )
    })),

  setSmartFolders: (smartFolders) => set({ smartFolders }),
  setLoading: (isLoading) => set({ isLoading }),
  togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  getFilteredEntries: () => {
    const { entries, searchQuery, selectedCategory } = get()
    let filtered = entries

    if (selectedCategory) {
      filtered = filtered.filter(e => e.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.fileName.toLowerCase().includes(query) ||
        e.folderPath.toLowerCase().includes(query) ||
        e.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  },

  getCategoryEntries: (category) => {
    return get().entries.filter(e => e.category === category)
  }
}))
