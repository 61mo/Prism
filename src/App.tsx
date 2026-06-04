import { useEffect, useState, useRef, useCallback } from 'react'
import { usePlayerStore } from './stores/playerStore'
import { useSettingsStore } from './stores/settingsStore'
import { useChatStore } from './stores/chatStore'
import { TitleBar } from './components/layout/TitleBar'
import { VideoPlayer } from './components/player/VideoPlayer'
import { SyncGrid } from './components/multi-sync/SyncGrid'
import { SubtitlePanel } from './components/subtitle/SubtitlePanel'
import { ChatPanel } from './components/ai-chat/ChatPanel'
import { SettingsPanel } from './components/layout/SettingsPanel'
import { EmptyState } from './components/player/EmptyState'
import { GlobalVolumeBar } from './components/player/GlobalVolumeBar'
import { LONG_PRESS_SPEED, LONG_PRESS_THRESHOLD_MS, SEEK_STEP_SECONDS } from './utils/constants'
import * as api from './api/browserApi'
import type { VideoPlayerRef } from './stores/syncStore'
import './styles/globals.css'

type ViewMode = 'single' | 'sync'

export default function App() {
  const players = usePlayerStore(s => s.players)
  const activePlayerId = usePlayerStore(s => s.activePlayerId)
  const chatOpen = useChatStore(s => s.isPanelOpen)
  const settings = useSettingsStore(s => s.settings)
  const loadSettings = useSettingsStore(s => s.loadSettings)

  const [viewMode, setViewMode] = useState<ViewMode>('single')
  const [showSettings, setShowSettings] = useState(false)
  const [showSubtitlePanel, setShowSubtitlePanel] = useState(false)

  const playerCount = players.size

  // Global volume state
  const [globalVolume, setGlobalVolume] = useState(80)
  const [globalMuted, setGlobalMuted] = useState(false)
  const globalVolRef = useRef(80)
  const globalMutedRef = useRef(false)

  // Global ref to the active player's imperative API
  const activePlayerRef = useRef<VideoPlayerRef | null>(null)

  // Collect ALL player refs for sync broadcast
  const allPlayerRefs = useRef<Map<string, VideoPlayerRef>>(new Map())

  const registerPlayerRef = useCallback((id: string, ref: VideoPlayerRef | null) => {
    if (ref) {
      allPlayerRefs.current.set(id, ref)
    } else {
      allPlayerRefs.current.delete(id)
    }
  }, [])

  // Update active ref when activePlayerId changes
  useEffect(() => {
    activePlayerRef.current = allPlayerRefs.current.get(
      activePlayerId || Array.from(players.keys())[0]
    ) || null
  }, [activePlayerId, players])

  useEffect(() => { loadSettings() }, [loadSettings])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  // ---- Long-press state (useRef — survives effect re-registration) ----
  const longPressRef = useRef({
    timer: null as ReturnType<typeof setTimeout> | null,
    isLong: false,
    fired: false,
    prevSpeed: 1,
    seekDir: 0, // 1 = forward, -1 = backward
  })

  // Helper: apply action to ALL registered players (sync mode)
  const forEachPlayer = useCallback((fn: (id: string, ref: VideoPlayerRef) => void) => {
    allPlayerRefs.current.forEach((ref, id) => fn(id, ref))
  }, [])

  // Global volume change (from slider or wheel)
  const handleGlobalVolumeChange = useCallback((vol: number) => {
    const v = Math.max(0, Math.min(100, vol))
    globalVolRef.current = v
    globalMutedRef.current = false
    setGlobalVolume(v)
    setGlobalMuted(false)
    forEachPlayer((id, ref) => { ref.setVolume(v); ref.setMuted(false) })
  }, [forEachPlayer])

  // Global mute toggle
  const handleGlobalMuteToggle = useCallback(() => {
    const newMuted = !globalMutedRef.current
    globalMutedRef.current = newMuted
    setGlobalMuted(newMuted)
    forEachPlayer((id, ref) => ref.setMuted(newMuted))
  }, [forEachPlayer])

  // Mouse wheel → global volume (anywhere on page)
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // Don't capture when scrolling inside chat/history/settings panels
      const target = e.target as HTMLElement
      if (target.closest('[data-panel]') || target.closest('input') || target.closest('textarea') || target.closest('select')) return

      // Only adjust volume when there are videos loaded
      if (usePlayerStore.getState().players.size === 0) return

      e.preventDefault()
      const delta = e.deltaY > 0 ? -2 : 2
      handleGlobalVolumeChange(globalVolRef.current + delta)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [handleGlobalVolumeChange])

  // ---- GLOBAL KEYBOARD HANDLER (single instance, no conflicts) ----
  useEffect(() => {
    const s = longPressRef.current

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const p = activePlayerRef.current

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (!p) break
          // Toggle play/pause on ALL players simultaneously
          if (p.isPlaying()) {
            forEachPlayer((id, ref) => ref.pause())
          } else {
            forEachPlayer((id, ref) => ref.play())
          }
          break

        case 'ArrowLeft': {
          // ← only short-press seek backward (no long-press)
          e.preventDefault()
          if (!p || e.repeat) return
          const t = p.getCurrentTime() - SEEK_STEP_SECONDS
          const clamped = Math.max(0, t)
          forEachPlayer((id, ref) => ref.syncSeek(clamped))
          break
        }

        case 'ArrowRight': {
          // → short-press seek forward, long-press 3x speed
          e.preventDefault()
          if (!p || e.repeat) return

          if (s.timer) { clearTimeout(s.timer); s.timer = null }

          s.seekDir = 1  // forward
          s.prevSpeed = usePlayerStore.getState().players.get(activePlayerId!)?.speed || 1
          s.isLong = false
          s.fired = false

          s.timer = setTimeout(() => {
            s.isLong = true
            if (!s.fired) {
              s.fired = true
              forEachPlayer((id, ref) => {
                ref.setSpeed(LONG_PRESS_SPEED)
                usePlayerStore.getState().setSpeed(id, LONG_PRESS_SPEED)
              })
            }
          }, LONG_PRESS_THRESHOLD_MS)
          break
        }

        case 'ArrowUp':
          e.preventDefault()
          forEachPlayer((id, ref) => {
            const v = Math.min(100, (usePlayerStore.getState().players.get(id)?.volume || 80) + 5)
            ref.setVolume(v)
            usePlayerStore.getState().setVolume(id, v)
          })
          break

        case 'ArrowDown':
          e.preventDefault()
          forEachPlayer((id, ref) => {
            const v = Math.max(0, (usePlayerStore.getState().players.get(id)?.volume || 80) - 5)
            ref.setVolume(v)
            usePlayerStore.getState().setVolume(id, v)
          })
          break

        case 'm':
        case 'M':
          e.preventDefault()
          handleGlobalMuteToggle()
          break

        case 'f':
        case 'F':
          e.preventDefault()
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            (document.querySelector('[data-sync-grid]') || document.querySelector('[data-video-container]') as HTMLElement)?.requestFullscreen()
          }
          break
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight') return  // Only ArrowRight needs keyup (long-press speed restore)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      e.preventDefault()

      const p = activePlayerRef.current
      if (!p) return

      if (s.timer) { clearTimeout(s.timer); s.timer = null }

      if (s.isLong) {
        // Long press ended: restore original speed on ALL players, NO seek
        forEachPlayer((id, ref) => {
          ref.setSpeed(s.prevSpeed)
          usePlayerStore.getState().setSpeed(id, s.prevSpeed)
        })
      } else {
        // Short press: seek on ALL players
        const t = p.getCurrentTime() + s.seekDir * SEEK_STEP_SECONDS
        const dur = p.getDuration()
        const clamped = s.seekDir > 0 ? Math.min(t, dur || Infinity) : Math.max(0, t)
        forEachPlayer((id, ref) => ref.syncSeek(clamped))
      }

      s.isLong = false
      s.fired = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [activePlayerId, handleGlobalMuteToggle])

  // Drag & drop
  useEffect(() => {
    const cleanup = api.setupDragDrop(document.body, (files) => {
      for (const file of files) {
        const url = URL.createObjectURL(file)
        usePlayerStore.getState().registerPlayer(url, url, file.name)
        // Video opened via drag & drop
      }
      if (files.length > 1) setViewMode('sync')
    })
    return cleanup
  }, [])

  const handleOpenVideo = async () => {
    const url = await api.openVideoFile()
    if (url) {
      usePlayerStore.getState().registerPlayer(url, url, 'Video')
      // Video opened
    }
  }

  const handleOpenMultipleVideos = async () => {
    const urls = await api.openVideoFiles()
    if (urls?.length) {
      for (const url of urls) {
        usePlayerStore.getState().registerPlayer(url, url, 'Video')
      }
      setViewMode(urls.length > 1 ? 'sync' : 'single')
    }
  }

  const handleClosePlayer = (playerId: string) => {
    usePlayerStore.getState().unregisterPlayer(playerId)
    allPlayerRefs.current.delete(playerId)
  }

  // Ctrl+Shift+C/S shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); useChatStore.getState().togglePanel() }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') { e.preventDefault(); setShowSubtitlePanel(s => !s) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      <TitleBar
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(m => m === 'sync' ? 'single' : 'sync')}
        onOpenFile={handleOpenVideo} onOpenMultiple={handleOpenMultipleVideos}
        onOpenFolder={handleOpenVideo}
        onToggleChat={() => useChatStore.getState().togglePanel()}
        onToggleSubtitle={() => setShowSubtitlePanel(s => !s)}
        onOpenSettings={() => setShowSettings(s => !s)}
        hasPlayers={playerCount > 0} canSync={playerCount >= 2}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {playerCount === 0 ? (
            <EmptyState onOpenFile={handleOpenVideo} onOpenMultiple={handleOpenMultipleVideos} onOpenFolder={handleOpenVideo} />
          ) : viewMode === 'sync' && playerCount >= 2 ? (
            <SyncGrid
              playerIds={Array.from(players.keys())}
              groupId="sync-group-1"
              onClosePlayer={handleClosePlayer}
              onRegisterRef={registerPlayerRef}
            />
          ) : (
            <VideoPlayer
              playerId={activePlayerId || Array.from(players.keys())[0]}
              syncGroupId={undefined}
              onClose={handleClosePlayer}
              onRegisterRef={registerPlayerRef}
            />
          )}
        </main>

      </div>

      {showSubtitlePanel && <SubtitlePanel onClose={() => setShowSubtitlePanel(false)} />}

      {/* Global volume bar — always visible at bottom */}
      <GlobalVolumeBar
        volume={globalVolume}
        muted={globalMuted}
        onVolumeChange={handleGlobalVolumeChange}
        onMuteToggle={handleGlobalMuteToggle}
      />

      {chatOpen && <ChatPanel />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
