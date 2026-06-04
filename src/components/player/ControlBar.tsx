import { formatTime } from '../../utils/formatTime'
import { SpeedSelector } from './SpeedSelector'
import { ProgressBar } from './ProgressBar'
import { RemoteControl } from './RemoteControl'

interface ControlBarProps {
  playing: boolean
  currentTime: number
  duration: number
  speed: number
  fileName: string
  onPlayPause: () => void
  onSeek: (time: number) => void
  onSpeedChange: (speed: number) => void
  onFullscreen: () => void
  onRemoteCommand?: (action: string, value?: number) => void
}

export function ControlBar({
  playing,
  currentTime,
  duration,
  speed,
  fileName,
  onPlayPause,
  onSeek,
  onSpeedChange,
  onFullscreen,
  onRemoteCommand
}: ControlBarProps) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: 'var(--glass-border)',
      padding: '8px 12px',
      flexShrink: 0
    }}>
      <ProgressBar currentTime={currentTime} duration={duration} onSeek={onSeek} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <button onClick={onPlayPause} title={playing ? 'Pause (Space)' : 'Play (Space)'} style={btn}>
          {playing ? '⏸' : '▶'}
        </button>

        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', minWidth: 100, textAlign: 'center' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <SpeedSelector currentSpeed={speed} onSpeedChange={onSpeedChange} />

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
        </span>

        {onRemoteCommand && <RemoteControl onCommand={onRemoteCommand} />}
        <button onClick={onFullscreen} title="Fullscreen (F / Double-click)" style={btn}>⛶</button>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 16,
  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', minWidth: 32, border: 'none', background: 'none', cursor: 'pointer'
}
