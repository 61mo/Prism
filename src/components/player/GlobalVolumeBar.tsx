import { useState, useRef, useEffect, useCallback } from 'react'

interface GlobalVolumeBarProps {
  volume: number
  muted: boolean
  onVolumeChange: (vol: number) => void
  onMuteToggle: () => void
}

export function GlobalVolumeBar({ volume, muted, onVolumeChange, onMuteToggle }: GlobalVolumeBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [dragVol, setDragVol] = useState<number | null>(null)

  const displayVol = dragVol ?? (muted ? 0 : volume)

  const calcVol = useCallback((clientX: number) => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    const v = calcVol(e.clientX)
    setDragVol(v)
    onVolumeChange(v)
  }, [calcVol, onVolumeChange])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const v = calcVol(e.clientX)
      setDragVol(v)
      onVolumeChange(v)
    }
    const onUp = () => {
      isDragging.current = false
      setDragVol(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [calcVol, onVolumeChange])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 16px', background: 'var(--bg-secondary)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: 'var(--glass-border)', flexShrink: 0
    }}>
      <button onClick={onMuteToggle} title={muted ? 'Unmute (M)' : 'Mute (M)'} style={btn}>
        {muted || volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
      </button>

      <div
        ref={barRef}
        onMouseDown={handleMouseDown}
        style={{
          flex: 1, height: 20, display: 'flex', alignItems: 'center',
          cursor: 'pointer', position: 'relative'
        }}
      >
        {/* Track background */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4,
          background: 'var(--bg-tertiary)', borderRadius: 2
        }} />
        {/* Fill */}
        <div style={{
          position: 'absolute', left: 0, height: 4, borderRadius: 2,
          width: `${displayVol}%`, background: 'var(--accent)',
          transition: isDragging.current ? 'none' : 'width 0.1s'
        }} />
        {/* Thumb */}
        <div style={{
          position: 'absolute', left: `${displayVol}%`, transform: 'translateX(-50%)',
          width: 14, height: 14, borderRadius: '50%', background: 'var(--accent)',
          boxShadow: '0 0 4px rgba(0,0,0,0.3)', transition: isDragging.current ? 'none' : 'left 0.1s'
        }} />
      </div>

      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', minWidth: 32, textAlign: 'right' }}>
        {displayVol}%
      </span>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '4px 6px', borderRadius: 'var(--radius-sm)', fontSize: 16,
  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer'
}
