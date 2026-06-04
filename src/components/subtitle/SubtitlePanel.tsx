import { useState, useCallback } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { useSubtitleStore } from '../../stores/subtitleStore'
import type { SubtitleTrack, SubtitleCue } from '../../types'

const EMPTY_TRACKS: SubtitleTrack[] = []

interface SubtitlePanelProps {
  onClose: () => void
}

export function SubtitlePanel({ onClose }: SubtitlePanelProps) {
  const activePlayerId = usePlayerStore(s => s.activePlayerId)
  const player = usePlayerStore(s => activePlayerId ? s.players.get(activePlayerId) : undefined)
  const tracks = useSubtitleStore(s => activePlayerId ? (s.tracks.get(activePlayerId) ?? EMPTY_TRACKS) : EMPTY_TRACKS)
  const activeTrackId = useSubtitleStore(s => s.activeTrackId)
  const setActiveTrack = useSubtitleStore(s => s.setActiveTrack)
  const setCues = useSubtitleStore(s => s.setCues)
  const [error, setError] = useState<string | null>(null)

  // Import SRT/VTT file
  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.srt,.vtt,.ass,.ssa'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const content = reader.result as string
          const cues: SubtitleCue[] = []
          const blocks = content.trim().split(/\n\s*\n/)
          for (const block of blocks) {
            const lines = block.trim().split('\n')
            if (lines.length < 3) continue
            const idx = parseInt(lines[0], 10)
            if (isNaN(idx)) continue
            const tm = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/)
            if (!tm) continue
            const startMs = +tm[1]*3600000 + +tm[2]*60000 + +tm[3]*1000 + +tm[4]
            const endMs = +tm[5]*3600000 + +tm[6]*60000 + +tm[7]*1000 + +tm[8]
            const text = lines.slice(2).join('\n').trim()
            if (text) cues.push({ index: idx, startMs, endMs, text })
          }
          if (cues.length === 0) { setError('No valid subtitle cues found.'); return }
          const trackId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
          const videoPath = player?.filePath || activePlayerId || ''
          const track: SubtitleTrack = { id: trackId, videoPath, language: file.name, source: 'import', srtPath: '', cues }
          useSubtitleStore.getState().addTrack(videoPath, track)
          setActiveTrack(videoPath, trackId)
          setCues(cues)
          setError(null)
        } catch (err: any) {
          setError('Failed to parse: ' + err.message)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [player?.filePath, activePlayerId])

  // Export SRT
  const handleExport = useCallback(() => {
    const cues = useSubtitleStore.getState().cues
    if (cues.length === 0) return
    const fmt = (s: number) => {
      const h = Math.floor(s/3600000), m = Math.floor((s%3600000)/60000), sec = Math.floor((s%60000)/1000), ms = s%1000
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`
    }
    const srt = cues.map((c, i) => `${i+1}\n${fmt(c.startMs)} --> ${fmt(c.endMs)}\n${c.text}\n`).join('\n')
    const blob = new Blob([srt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${player?.fileName || 'subtitle'}.srt`; a.click()
    URL.revokeObjectURL(url)
  }, [player?.fileName])

  const handleSelect = useCallback((trackId: string) => {
    if (!player?.filePath) return
    const track = tracks.find(t => t.id === trackId)
    if (track) { setActiveTrack(player.filePath, trackId); setCues(track.cues) }
  }, [player?.filePath, tracks])

  const handleRemove = useCallback((trackId: string) => {
    if (!player?.filePath) return
    useSubtitleStore.getState().removeTrack(player.filePath, trackId)
    if (useSubtitleStore.getState().activeTrackId === trackId) setCues([])
  }, [player?.filePath])

  return (
    <div data-panel className="slide-in" style={{
      position: 'fixed', top: 44, right: 0, bottom: 40, width: 300,
      background: 'var(--bg-secondary)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderLeft: 'var(--glass-border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 50,
      boxShadow: '-4px 0 16px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600 }}>💬 Subtitles</h3>
        <button onClick={onClose} style={{ padding: '2px 8px', color: 'var(--text-secondary)', fontSize: 16, border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!player ? (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>Open a video to manage subtitles</p>
        ) : (
          <>
            <button onClick={handleImport} style={btn}>📄 Import SRT/VTT File</button>

            {error && <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontSize: 12 }}>{error}</div>}

            {tracks.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Tracks</h4>
                  {useSubtitleStore.getState().activeTrackId && (
                    <button onClick={handleExport} style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 10, color: 'var(--accent)', background: 'var(--accent-subtle)', border: 'none', cursor: 'pointer' }}>💾 Export SRT</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {tracks.map(track => (
                    <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => handleSelect(track.id)} style={{
                        flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-sm)', textAlign: 'left', fontSize: 12,
                        color: track.id === useSubtitleStore.getState().activeTrackId ? 'var(--accent)' : 'var(--text-secondary)',
                        background: track.id === useSubtitleStore.getState().activeTrackId ? 'var(--accent-subtle)' : 'transparent',
                        border: track.id === useSubtitleStore.getState().activeTrackId ? '1px solid var(--accent)' : '1px solid transparent',
                        cursor: 'pointer'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>📄 {track.language}</span>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>{track.cues.length}</span>
                        </div>
                      </button>
                      <button onClick={() => handleRemove(track.id)} style={{ padding: '4px 6px', fontSize: 11, color: 'var(--text-tertiary)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tracks.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 16 }}>Import an SRT/VTT file to display subtitles.</p>}
          </>
        )}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
        💡 Import subtitle files to sync with video playback.
      </div>
    </div>
  )
}

const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', background: 'var(--bg-tertiary)', transition: 'all var(--transition)', border: 'none', cursor: 'pointer' }
