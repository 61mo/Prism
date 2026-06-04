
interface TitleBarProps {
  viewMode: 'single' | 'sync'
  onToggleViewMode: () => void
  onOpenFile: () => void
  onOpenMultiple: () => void
  onOpenFolder: () => void
  onToggleChat: () => void
  onToggleSubtitle: () => void
  onOpenSettings: () => void
  hasPlayers: boolean
  canSync: boolean
}

export function TitleBar({
  viewMode,
  onToggleViewMode,
  onOpenFile,
  onOpenMultiple,
  onOpenFolder,
  onToggleChat,
  onToggleSubtitle,
  onOpenSettings,
  hasPlayers,
  canSync
}: TitleBarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 44,
      padding: '0 12px',
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: 'var(--glass-border)',
      WebkitAppRegion: 'drag',
      gap: 4,
      flexShrink: 0
    }}>
      {/* Drag region spacer */}
      <div style={{ width: 80, WebkitAppRegion: 'drag' }} />

      {/* App title */}
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginRight: 16,
        WebkitAppRegion: 'drag'
      }}>
        🔷 Prism
      </span>

      {/* Toolbar buttons */}
      <div style={{ display: 'flex', gap: 4, WebkitAppRegion: 'no-drag' }}>
        <div style={{ position: 'relative' }}>
          <ToolbarButton
            title="Open File"
            onClick={() => { onOpenFile(); setShowFileMenu(false) }}
          >
            📂 Open
          </ToolbarButton>
        </div>

        <ToolbarButton title="Open Multiple Files" onClick={onOpenMultiple}>
          📑 Multi
        </ToolbarButton>

        <ToolbarButton title="Open Folder" onClick={onOpenFolder}>
          📁 Folder
        </ToolbarButton>

        {canSync && (
          <ToolbarButton
            title={viewMode === 'sync' ? 'Switch to Single View' : 'Switch to Sync View'}
            onClick={onToggleViewMode}
            active={viewMode === 'sync'}
          >
            🔗 {viewMode === 'sync' ? 'Sync: ON' : 'Sync'}
          </ToolbarButton>
        )}
      </div>

      <div style={{ flex: 1, WebkitAppRegion: 'drag' }} />

      {/* Right-side buttons */}
      <div style={{ display: 'flex', gap: 4, WebkitAppRegion: 'no-drag' }}>
        {hasPlayers && (
          <>
            <ToolbarButton title="Subtitle Panel (Ctrl+Shift+S)" onClick={onToggleSubtitle}>
              💬 Subs
            </ToolbarButton>
            <ToolbarButton title="AI Chat (Ctrl+Shift+C)" onClick={onToggleChat}>
              🤖 AI Chat
            </ToolbarButton>
          </>
        )}
        <ToolbarButton title="Settings" onClick={onOpenSettings}>
          ⚙️
        </ToolbarButton>
      </div>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  active = false,
  title = ''
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      tabIndex={-1}
      style={{
        padding: '4px 10px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 12,
        fontWeight: 500,
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        background: active ? 'var(--accent-subtle)' : 'transparent',
        transition: 'all var(--transition)',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
