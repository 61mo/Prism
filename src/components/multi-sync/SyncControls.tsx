import { useSyncStore } from '../../stores/syncStore'

interface SyncControlsProps {
  groupId: string
  playerCount: number
  hasCustomLayout?: boolean
  onOpenLayoutEditor?: () => void
}

export function SyncControls({ groupId, playerCount, hasCustomLayout, onOpenLayoutEditor }: SyncControlsProps) {
  const syncGroup = useSyncStore(s => s.syncGroups.get(groupId))
  const toggleSyncProgress = useSyncStore(s => s.toggleSyncProgress)

  if (!syncGroup) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '6px 12px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      flexShrink: 0
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
        🔗 Sync Mode
      </span>

      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
        {playerCount} videos
      </span>

      <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

      {/* Progress sync toggle */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)'
      }}>
        <input
          type="checkbox"
          checked={syncGroup.syncProgress}
          onChange={() => toggleSyncProgress(groupId)}
          style={{ accentColor: 'var(--accent)' }}
        />
        Sync Progress Bar
      </label>

      <span style={{
        fontSize: 11,
        color: syncGroup.syncProgress ? 'var(--success)' : 'var(--warning)'
      }}>
        {syncGroup.syncProgress ? '🟢 synced' : '🟡 independent'}
      </span>

      {/* Layout editor button */}
      {onOpenLayoutEditor && (
        <>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <button
            onClick={onOpenLayoutEditor}
            title="Open video layout editor"
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              fontWeight: 500,
              color: hasCustomLayout ? '#fff' : 'var(--accent)',
              background: hasCustomLayout ? 'var(--accent)' : 'var(--accent-subtle)',
              transition: 'all var(--transition)'
            }}
          >
            🖌️ {hasCustomLayout ? 'Layout ✓' : 'Layout'}
          </button>
        </>
      )}

      <div style={{ flex: 1 }} />
    </div>
  )
}
