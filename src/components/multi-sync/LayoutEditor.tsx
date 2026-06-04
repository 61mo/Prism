import { useState, useCallback, useRef } from 'react'
import { VideoPlayer } from '../player/VideoPlayer'

interface LayoutCell {
  playerId: string
  x: number
  y: number
  width: number
  height: number
}

interface LayoutEditorProps {
  playerIds: string[]
  syncGroupId: string
  onClose: () => void
  onApply: (cells: LayoutCell[]) => void
}

const PRESETS: { name: string; gen: (ids: string[]) => LayoutCell[] }[] = [
  { name: 'Grid', gen: ids => {
    const cols = Math.ceil(Math.sqrt(ids.length)), rows = Math.ceil(ids.length / cols)
    return ids.map((id, i) => ({ playerId: id, x: (i%cols)/cols, y: Math.floor(i/cols)/rows, width: 1/cols, height: 1/rows }))
  }},
  { name: 'Side by Side', gen: ids => ids.map((id, i) => ({ playerId: id, x: i/ids.length, y: 0, width: 1/ids.length, height: 1 })) },
  { name: 'Stacked', gen: ids => ids.map((id, i) => ({ playerId: id, x: 0, y: i/ids.length, width: 1, height: 1/ids.length })) },
  { name: '1 Big + Side', gen: ids => {
    if (ids.length <= 1) return [{ playerId: ids[0], x:0, y:0, width:1, height:1 }]
    const main = { playerId: ids[0], x: 0, y: 0, width: 0.6, height: 1 }
    const rest = ids.slice(1).map((id, i) => ({ playerId: id, x: 0.6, y: i/(ids.length-1), width: 0.4, height: 1/(ids.length-1) }))
    return [main, ...rest]
  }},
]

export function LayoutEditor({ playerIds, syncGroupId, onClose, onApply }: LayoutEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cells, setCells] = useState<LayoutCell[]>(() => PRESETS[0].gen(playerIds))
  const [selected, setSelected] = useState<number | null>(null)

  // During drag, we track mouse and cell start states with refs (not state)
  // to avoid re-render lag
  const dragRef = useRef<{
    cellIndex: number
    startMouseX: number
    startMouseY: number
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    e.preventDefault()
    setSelected(index)

    const cell = cells[index]
    dragRef.current = {
      cellIndex: index,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: cell.x,
      startY: cell.y,
      startW: cell.width,
      startH: cell.height,
    }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return
      const d = dragRef.current
      const cw = containerRef.current.clientWidth
      const ch = containerRef.current.clientHeight
      if (!cw || !ch) return

      const dx = (ev.clientX - d.startMouseX) / cw
      const dy = (ev.clientY - d.startMouseY) / ch

      // Move mode: pan position
      const newX = Math.max(0, Math.min(1 - d.startW, d.startX + dx))
      const newY = Math.max(0, Math.min(1 - d.startH, d.startY + dy))

      setCells(prev => prev.map((c, i) =>
        i === d.cellIndex ? { ...c, x: newX, y: newY } : c
      ))
    }

    const onUp = () => {
      dragRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleSlider = (index: number, field: keyof LayoutCell, value: number) => {
    setCells(prev => prev.map((c, i) =>
      i === index ? { ...c, [field]: Math.max(0.05, Math.min(1, value)) } : c
    ))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 400, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <b style={{ fontSize: 14 }}>🎬 Layout Editor</b>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Click + drag to move. Sliders to resize.</span>
        <div style={{ flex: 1 }} />
        {PRESETS.map(p => (
          <button key={p.name} onClick={() => { setCells(p.gen(playerIds)); setSelected(null) }}
            style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            {p.name}
          </button>
        ))}
        <span style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <button onClick={onClose} style={{ padding: '4px 12px', borderRadius: 4, fontSize: 12, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
        <button onClick={() => onApply(cells)} style={{ padding: '4px 16px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: '#fff' }}>Apply</button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
        {cells.map((cell, i) => (
          <div key={cell.playerId}
            onMouseDown={e => handleMouseDown(e, i)}
            style={{
              position: 'absolute',
              left: `${cell.x * 100}%`, top: `${cell.y * 100}%`,
              width: `${cell.width * 100}%`, height: `${cell.height * 100}%`,
              border: selected === i ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.2)',
              overflow: 'hidden', cursor: 'grab', background: '#111',
              transition: selected !== i ? 'border-color 0.2s' : 'none'
            }}>
            <VideoPlayer playerId={cell.playerId} syncGroupId={syncGroupId} style={{ width: '100%', height: '100%' }} />
          </div>
        ))}
      </div>

      {/* Controls */}
      {selected !== null && cells[selected] && (
        <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 16 }}>
          {(['x', 'y', 'width', 'height'] as const).map(field => (
            <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 500, minWidth: 36 }}>{field}</span>
              <input type="range" min={5} max={100} style={{ width: 90, accentColor: 'var(--accent)' }}
                value={Math.round(cells[selected][field] * 100)}
                onChange={e => handleSlider(selected, field, Number(e.target.value) / 100)} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, minWidth: 28 }}>{Math.round(cells[selected][field] * 100)}%</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
