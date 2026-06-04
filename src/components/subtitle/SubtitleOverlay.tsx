import { useEffect } from 'react'
import { useSubtitleStore } from '../../stores/subtitleStore'
import { usePlayerStore } from '../../stores/playerStore'

interface SubtitleOverlayProps {
  playerId: string
}

export function SubtitleOverlay({ playerId }: SubtitleOverlayProps) {
  const currentCues = useSubtitleStore(s => s.currentCues)
  const updateCurrentCues = useSubtitleStore(s => s.updateCurrentCues)
  const currentTime = usePlayerStore(s => s.players.get(playerId)?.currentTime || 0)

  useEffect(() => {
    const timeMs = currentTime * 1000
    updateCurrentCues(timeMs)
  }, [currentTime, updateCurrentCues])

  if (currentCues.length === 0) return null

  return (
    <div style={{
      position: 'absolute',
      bottom: 60,
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: '80%',
      textAlign: 'center',
      pointerEvents: 'none',
      zIndex: 10
    }}>
      {currentCues.map(cue => (
        <div
          key={cue.index}
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 0, 0, 0.75)',
            color: '#ffffff',
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.5,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            marginBottom: 4
          }}
        >
          {cue.text}
        </div>
      ))}
    </div>
  )
}
