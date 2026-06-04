interface EmptyStateProps {
  onOpenFile: () => void
  onOpenMultiple: () => void
  onOpenFolder: () => void
}

export function EmptyState({ onOpenFile, onOpenMultiple, onOpenFolder }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 16,
      padding: 40
    }}>
      <div style={{ fontSize: 64, opacity: 0.6 }}>🎬</div>
      <h2 style={{
        fontSize: 24,
        fontWeight: 600,
        color: 'var(--text-primary)',
        textAlign: 'center'
      }}>
        Prism
      </h2>
      <p style={{
        fontSize: 14,
        color: 'var(--text-secondary)',
        textAlign: 'center',
        maxWidth: 420,
        lineHeight: 1.6
      }}>
        Open a video file to start watching. Supports MP4, MOV, AVI, WMV, FLV, MKV and more.
        Open multiple videos to enable sync playback mode.
      </p>

      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 8
      }}>
        <ActionButton icon="📂" label="Open Video" hint="Ctrl+O" onClick={onOpenFile} />
        <ActionButton icon="📑" label="Open Multiple" hint="Ctrl+Shift+O" onClick={onOpenMultiple} />
        <ActionButton icon="📁" label="Open Folder" hint="Ctrl+Shift+F" onClick={onOpenFolder} />
      </div>

      <div style={{
        marginTop: 32,
        padding: '16px 24px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        maxWidth: 500
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
          ⌨️ Keyboard Shortcuts
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12 }}>
          <ShortcutKey keys="Space" desc="Play / Pause" />
          <ShortcutKey keys="→" desc="Seek +5s / Hold → 3x" />
          <ShortcutKey keys="←" desc="Seek -5s" />
          <ShortcutKey keys="M" desc="Mute" />
          <ShortcutKey keys="F / Double-click" desc="Fullscreen" />
          <ShortcutKey keys="Ctrl+Shift+C" desc="AI Chat" />
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon, label, hint, onClick }: {
  icon: string
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '20px 32px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)',
        border: '2px dashed var(--border)',
        color: 'var(--text-primary)',
        transition: 'all var(--transition)',
        cursor: 'pointer'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.background = 'var(--accent-subtle)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--bg-secondary)'
      }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{hint}</span>
    </button>
  )
}

function ShortcutKey({ keys, desc }: { keys: string; desc: string }) {
  return (
    <>
      <span style={{
        fontFamily: 'var(--font-mono)',
        color: 'var(--accent)',
        background: 'var(--accent-subtle)',
        padding: '1px 6px',
        borderRadius: 3,
        fontSize: 11
      }}>
        {keys}
      </span>
      <span style={{ color: 'var(--text-tertiary)' }}>{desc}</span>
    </>
  )
}
