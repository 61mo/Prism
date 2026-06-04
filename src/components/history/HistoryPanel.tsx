import { useEffect, useState } from 'react'
import { useHistoryStore } from '../../stores/historyStore'
import { usePlayerStore } from '../../stores/playerStore'
import { HistoryCard } from './HistoryCard'
import { SmartFolders } from './SmartFolders'
import type { HistoryEntry } from '../../types'

export function HistoryPanel() {
  const entries = useHistoryStore(s => s.entries)
  const setEntries = useHistoryStore(s => s.setEntries)
  const isLoading = useHistoryStore(s => s.isLoading)
  const setLoading = useHistoryStore(s => s.setLoading)
  const togglePanel = useHistoryStore(s => s.togglePanel)
  const searchQuery = useHistoryStore(s => s.searchQuery)
  const setSearchQuery = useHistoryStore(s => s.setSearchQuery)
  const selectedCategory = useHistoryStore(s => s.selectedCategory)
  const setSelectedCategory = useHistoryStore(s => s.setSelectedCategory)
  const [view, setView] = useState<'list' | 'folders'>('list')
  const [isClassifying, setIsClassifying] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const history = await window.electronAPI?.getHistory({ limit: 100 })
      if (history) setEntries(history)
    } catch {
      // Ignore
    }
    setLoading(false)
  }

  const handleClassify = async () => {
    setIsClassifying(true)
    try {
      const result = await window.electronAPI?.runClassification()
      if (result) {
        await loadHistory()
      }
    } catch {
      // Ignore
    }
    setIsClassifying(false)
  }

  const handleClearAll = async () => {
    if (confirm('Clear all watch history?')) {
      await window.electronAPI?.clearAllHistory()
      setEntries([])
    }
  }

  const handlePlayVideo = async (entry: HistoryEntry) => {
    usePlayerStore.getState().registerPlayer(entry.filePath, entry.filePath, entry.fileName)
  }

  const handleDelete = async (id: number) => {
    await window.electronAPI?.deleteHistory(id)
    useHistoryStore.getState().removeEntry(id)
  }

  const filteredEntries = selectedCategory
    ? entries.filter(e => e.category === selectedCategory)
    : searchQuery
      ? entries.filter(e =>
        e.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.folderPath.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : entries

  return (
    <div data-panel style={{
      width: 320,
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      zIndex: 50
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600 }}>🕐 Watch History</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setView(v => v === 'list' ? 'folders' : 'list')}
            title={view === 'list' ? 'Smart Folders' : 'List View'}
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              background: 'var(--bg-tertiary)'
            }}
          >
            {view === 'list' ? '📁' : '📋'}
          </button>
          <button
            onClick={handleClassify}
            disabled={isClassifying}
            title="AI Classify"
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              background: 'var(--bg-tertiary)'
            }}
          >
            {isClassifying ? '🔄' : '🏷️'}
          </button>
          <button
            onClick={handleClearAll}
            title="Clear All History"
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              color: 'var(--danger)',
              background: 'var(--bg-tertiary)'
            }}
          >
            🗑️
          </button>
          <button onClick={togglePanel} style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: 14
          }}>
            ✕
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search history..."
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: 12,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)'
          }}
          onKeyDown={e => e.stopPropagation()}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 20 }}>Loading...</p>
        ) : view === 'folders' ? (
          <SmartFolders
            entries={entries}
            onCategorySelect={setSelectedCategory}
            onPlayVideo={handlePlayVideo}
          />
        ) : filteredEntries.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 20, fontSize: 12 }}>
            {searchQuery ? 'No results found' : 'No watch history yet'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {selectedCategory && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                marginBottom: 4
              }}>
                <span style={{ fontSize: 12, color: 'var(--accent)' }}>{selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{ fontSize: 11, color: 'var(--text-tertiary)' }}
                >
                  ✕ Clear filter
                </button>
              </div>
            )}
            {filteredEntries.map(entry => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onPlay={handlePlayVideo}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div style={{
        padding: '6px 12px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: 10,
        color: 'var(--text-tertiary)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>{entries.length} videos</span>
        <span>{view === 'list' ? 'List' : 'Smart Folders'}</span>
      </div>
    </div>
  )
}
