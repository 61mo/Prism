import { useMemo } from 'react'
import type { HistoryEntry, SmartFolder } from '../../types'

interface SmartFoldersProps {
  entries: HistoryEntry[]
  onCategorySelect: (category: string) => void
  onPlayVideo: (entry: HistoryEntry) => void
}

export function SmartFolders({ entries, onCategorySelect, onPlayVideo }: SmartFoldersProps) {
  const folders = useMemo(() => {
    const categorized = new Map<string, HistoryEntry[]>()
    const uncategorized: HistoryEntry[] = []

    for (const entry of entries) {
      if (entry.category) {
        const list = categorized.get(entry.category) || []
        list.push(entry)
        categorized.set(entry.category, list)
      } else {
        uncategorized.push(entry)
      }
    }

    const result: SmartFolder[] = Array.from(categorized.entries())
      .map(([category, catEntries]) => ({
        category,
        count: catEntries.length,
        entries: catEntries
      }))
      .sort((a, b) => b.count - a.count)

    if (uncategorized.length > 0) {
      result.push({
        category: 'Uncategorized',
        count: uncategorized.length,
        entries: uncategorized
      })
    }

    return result
  }, [entries])

  if (folders.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        padding: 20,
        fontSize: 12,
        lineHeight: 1.6
      }}>
        <p style={{ fontSize: 24, marginBottom: 8 }}>📁</p>
        <p>No categorized videos yet.</p>
        <p style={{ fontSize: 11, marginTop: 4 }}>
          Click the 🏷️ button to run AI classification, or videos will be auto-classified based on folder names.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {folders.map(folder => (
        <div key={folder.category}>
          {/* Folder header */}
          <div
            onClick={() => onCategorySelect(folder.category)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              cursor: 'pointer',
              transition: 'background var(--transition)',
              marginBottom: 2
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {getCategoryIcon(folder.category)} {folder.category}
            </span>
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 8,
              background: 'var(--accent-subtle)',
              color: 'var(--accent)'
            }}>
              {folder.count}
            </span>
          </div>

          {/* Recent videos in this category (show first 3) */}
          {folder.entries.slice(0, 3).map(entry => (
            <div
              key={entry.id}
              onClick={() => onPlayVideo(entry)}
              style={{
                padding: '4px 10px 4px 20px',
                fontSize: 11,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                borderRadius: 'var(--radius-sm)',
                transition: 'background var(--transition)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {entry.fileName}
            </div>
          ))}

          {folder.entries.length > 3 && (
            <div
              onClick={() => onCategorySelect(folder.category)}
              style={{
                padding: '2px 10px 2px 20px',
                fontSize: 10,
                color: 'var(--accent)',
                cursor: 'pointer'
              }}
            >
              + {folder.entries.length - 3} more...
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Movie': '🎬',
    'TV Series': '📺',
    'Documentary': '📚',
    'Tutorial': '🎓',
    'Lecture': '🏫',
    'Music': '🎵',
    'Podcast': '🎙️',
    'Sports': '⚽',
    'Gaming': '🎮',
    'Animation': '🎨',
    'Sci-Fi': '🚀',
    'Drama': '🎭',
    'Comedy': '😂',
    'Action': '💥',
    'Horror': '👻',
    'News': '📰',
    'Vlog': '📹',
    'Review': '⭐',
    'Unboxing': '📦',
    'Uncategorized': '❓',
    'Other': '📁'
  }
  return icons[category] || '📁'
}
