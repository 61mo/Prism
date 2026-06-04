import type { HistoryEntry } from '../../types'
import { formatTime, formatFileSize } from '../../utils/formatTime'

interface HistoryCardProps {
  entry: HistoryEntry
  onPlay: (entry: HistoryEntry) => void
  onDelete: (id: number) => void
}

export function HistoryCard({ entry, onPlay, onDelete }: HistoryCardProps) {
  const progress = entry.progressPercent || 0

  return (
    <div style={{
      padding: '8px 10px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-tertiary)',
      cursor: 'pointer',
      transition: 'background var(--transition)',
      position: 'relative'
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
      onClick={() => onPlay(entry)}
    >
      {/* Progress bar */}
      {progress > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          width: `${progress}%`,
          background: 'var(--accent)',
          borderRadius: '0 0 var(--radius-sm) var(--radius-sm)'
        }} />
      )}

      {/* File name */}
      <div style={{
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-primary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginBottom: 2
      }}>
        {entry.fileName}
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 10,
        color: 'var(--text-tertiary)'
      }}>
        <span>{formatTime(entry.currentTime)} / {formatTime(entry.durationSeconds || 0)}</span>
        <span>{entry.playCount > 1 ? `×${entry.playCount}` : ''}</span>
        <span>{entry.lastWatchedAt ? formatRelativeTime(entry.lastWatchedAt) : ''}</span>
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
          {entry.tags.map((tag, i) => (
            <span key={i} style={{
              padding: '0 5px',
              borderRadius: 6,
              fontSize: 9,
              background: 'var(--accent-subtle)',
              color: 'var(--accent)'
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Delete button (shown on hover) */}
      <button
        onClick={e => {
          e.stopPropagation()
          onDelete(entry.id)
        }}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          padding: '1px 6px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 10,
          color: 'var(--danger)',
          opacity: 0,
          transition: 'opacity var(--transition)'
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
      >
        ✕
      </button>
    </div>
  )
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(isoString).toLocaleDateString()
}
