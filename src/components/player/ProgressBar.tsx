import { useRef, useCallback, useState, useEffect } from 'react'
import { formatTime } from '../../utils/formatTime'

interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  bufferProgress?: number
}

export function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [hoverPercent, setHoverPercent] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)
  const isDragging = useRef(false)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const getTime = useCallback((clientX: number) => {
    if (!barRef.current || !duration) return 0
    const rect = barRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return ratio * duration
  }, [duration])

  const getPercent = useCallback((clientX: number) => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  }, [])

  // Mouse events only for hover tooltip — dragging uses native events
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setHoverPercent(getPercent(e.clientX))
  }, [getPercent])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) return
    onSeek(getTime(e.clientX))
  }, [getTime, onSeek])

  // Dragging via native events for reliable capture
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    onSeek(getTime(e.clientX))
  }, [getTime, onSeek])

  useEffect(() => {
    // Native mousemove/mouseup on document so drag works beyond bar bounds
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      setHoverPercent(getPercent(e.clientX))
      onSeek(getTime(e.clientX))
    }
    const onUp = () => {
      isDragging.current = false
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [getTime, getPercent, onSeek])

  return (
    <div
      ref={barRef}
      style={{
        position: 'relative', height: 5, borderRadius: 3,
        background: 'var(--bg-tertiary)', cursor: 'pointer', width: '100%'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => { setShowTooltip(false); isDragging.current = false }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Play progress */}
      <div style={{
        position: 'absolute', top: 0, left: 0, height: '100%',
        width: `${progress}%`, background: 'var(--accent)', borderRadius: 3,
        transition: isDragging.current ? 'none' : 'width 100ms linear', pointerEvents: 'none'
      }} />

      {/* Scrubber dot */}
      {showTooltip && (
        <>
          <div style={{
            position: 'absolute', top: -4, left: `${hoverPercent}%`, transform: 'translateX(-50%)',
            width: 12, height: 12, borderRadius: '50%', background: '#fff',
            boxShadow: '0 0 4px rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 1
          }} />
          <div style={{
            position: 'absolute', top: -28, left: `${hoverPercent}%`, transform: 'translateX(-50%)',
            padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.9)',
            color: '#fff', fontSize: 11, fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap', pointerEvents: 'none'
          }}>
            {formatTime((hoverPercent / 100) * duration)}
          </div>
        </>
      )}
    </div>
  )
}
