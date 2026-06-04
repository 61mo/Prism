import { useState } from 'react'
import { SPEED_OPTIONS } from '../../utils/constants'
import type { SpeedOption } from '../../types'

interface SpeedSelectorProps {
  currentSpeed: number
  onSpeedChange: (speed: number) => void
}

export function SpeedSelector({ currentSpeed, onSpeedChange }: SpeedSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (speed: SpeedOption) => {
    onSpeedChange(speed)
    setIsOpen(false)
  }

  const displaySpeed = SPEED_OPTIONS.includes(currentSpeed as SpeedOption)
    ? currentSpeed
    : currentSpeed

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Playback Speed"
        style={{
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent)',
          background: 'var(--accent-subtle)',
          transition: 'all var(--transition)',
          minWidth: 52,
          textAlign: 'center'
        }}
      >
        {displaySpeed}x
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 99
            }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 4,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            zIndex: 100,
            padding: 4,
            minWidth: 90
          }}>
            {SPEED_OPTIONS.map(speed => (
              <button
                key={speed}
                onClick={() => handleSelect(speed)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 12px',
                  textAlign: 'left',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-sm)',
                  color: speed === currentSpeed ? 'var(--accent)' : 'var(--text-secondary)',
                  background: speed === currentSpeed ? 'var(--accent-subtle)' : 'transparent',
                  transition: 'all var(--transition)'
                }}
                onMouseEnter={e => {
                  if (speed !== currentSpeed) e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={e => {
                  if (speed !== currentSpeed) e.currentTarget.style.background = 'transparent'
                }}
              >
                {speed}x
                {speed === 1 && ' (Normal)'}
                {speed === 3 && ' (Fast)'}
                {speed === 6 && ' (Very Fast)'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
