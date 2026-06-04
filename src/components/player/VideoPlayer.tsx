import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { useSyncStore, type VideoPlayerRef } from '../../stores/syncStore'
import { ControlBar } from './ControlBar'
import { SubtitleOverlay } from '../subtitle/SubtitleOverlay'
import { getFileName } from '../../utils/formatTime'
import * as api from '../../api/browserApi'

interface VideoPlayerProps {
  playerId: string
  syncGroupId?: string
  onClose?: (playerId: string) => void
  onRegisterRef?: (id: string, ref: VideoPlayerRef | null) => void
  style?: React.CSSProperties
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  function VideoPlayer({ playerId, syncGroupId, onClose, onRegisterRef, style }, ref) {
    const videoElRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const bufferingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isSyncingSeek = useRef(false)
    const lastStoreSync = useRef(0)
    const intendedSpeed = useRef(1)
    const [ui, setUi] = useState({ time: 0, dur: 0, spd: 1, vol: 80, muted: false, playing: false })

    const player = usePlayerStore(s => s.players.get(playerId))
    const updatePlayerState = usePlayerStore(s => s.updatePlayerState)

    // Poll video element → UI state every 200ms
    useEffect(() => {
      const id = setInterval(() => {
        const v = videoElRef.current
        if (!v) return
        setUi(prev => {
          const t = v.currentTime
          const d = v.duration || 0
          const s = v.playbackRate
          const vol = Math.round(v.volume * 100)
          const m = v.muted
          const p = !v.paused
          if (prev.time === t && prev.dur === d && prev.spd === s && prev.vol === vol && prev.muted === m && prev.playing === p) return prev
          return { time: t, dur: d, spd: s, vol, muted: m, playing: p }
        })
      }, 200)
      return () => clearInterval(id)
    }, [])

    // Ref API
    const apiRef = useRef<VideoPlayerRef>({
      play: () => { videoElRef.current?.play() },
      pause: () => { videoElRef.current?.pause() },
      seek: (time: number) => {
        const v = videoElRef.current
        if (v && isFinite(time)) v.currentTime = Math.max(0, Math.min(time, v.duration || Infinity))
      },
      syncSeek: (time: number) => {
        isSyncingSeek.current = true
        const v = videoElRef.current
        if (v && isFinite(time)) v.currentTime = Math.max(0, Math.min(time, v.duration || Infinity))
      },
      setSpeed: (speed: number) => {
        const v = videoElRef.current
        if (v && isFinite(speed) && speed > 0) {
          v.playbackRate = Math.abs(speed)
          intendedSpeed.current = Math.abs(speed)
        }
      },
      setVolume: (volume: number) => {
        const v = videoElRef.current
        if (v) v.volume = Math.max(0, Math.min(1, volume / 100))
      },
      setMuted: (muted: boolean) => {
        const v = videoElRef.current
        if (v) v.muted = muted
      },
      getCurrentTime: () => videoElRef.current?.currentTime || 0,
      getDuration: () => videoElRef.current?.duration || 0,
      isPlaying: () => !videoElRef.current?.paused,
    })

    useImperativeHandle(ref, () => apiRef.current, [])
    useEffect(() => { onRegisterRef?.(playerId, apiRef.current); return () => onRegisterRef?.(playerId, null) }, [playerId])

    useEffect(() => {
      if (!syncGroupId) return
      const s = useSyncStore.getState()
      s.registerPlayer(syncGroupId, playerId, apiRef.current)
      return () => { s.unregisterPlayer(syncGroupId, playerId) }
    }, [syncGroupId, playerId])

    // Callback ref for video — set src imperatively
    const videoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
      videoElRef.current = el
      if (el && player?.filePath) {
        el.src = player.filePath
        el.load()
      }
    }, [player?.filePath])

    // ---- Video DOM events ----

    const handleLoadedMetadata = useCallback(() => {
      const v = videoElRef.current
      if (!v || !isFinite(v.duration)) return
      updatePlayerState(playerId, { duration: v.duration })
      v.playbackRate = intendedSpeed.current
      const h = api.getHistory({ limit: 100 })
      const last = h?.find((e: any) => e.filePath === player?.filePath && e.currentTime > 0)
      if (last && v) v.currentTime = last.currentTime
    }, [playerId, player?.filePath])

    const handleTimeUpdate = useCallback(() => {
      const v = videoElRef.current
      if (!v) return
      const now = Date.now()
      if (now - lastStoreSync.current > 1000) {
        lastStoreSync.current = now
        usePlayerStore.getState().setCurrentTime(playerId, Math.floor(v.currentTime))
      }
    }, [playerId])

    const handlePlay = useCallback(() => {
      usePlayerStore.getState().setPlaying(playerId, true)
    }, [playerId])

    const handlePause = useCallback(() => {
      usePlayerStore.getState().setPlaying(playerId, false)
    }, [playerId])

    const handleSeeked = useCallback(() => {
      const v = videoElRef.current
      if (!v || !isFinite(v.currentTime)) return
      usePlayerStore.getState().setCurrentTime(playerId, v.currentTime)
      v.playbackRate = intendedSpeed.current
      if (syncGroupId && !isSyncingSeek.current) {
        useSyncStore.getState().broadcastSeek(syncGroupId, playerId, v.currentTime)
      }
      isSyncingSeek.current = false
    }, [playerId, syncGroupId])

    const handleRateChange = useCallback(() => {
      const v = videoElRef.current
      if (!v) return
      if (Math.abs(v.playbackRate - intendedSpeed.current) > 0.01) {
        v.playbackRate = intendedSpeed.current
      }
    }, [])

    const handleWaiting = useCallback(() => {
      bufferingTimer.current = setTimeout(() => usePlayerStore.getState().setBuffering(playerId, true), 400)
    }, [playerId])

    const handleCanPlay = useCallback(() => {
      if (bufferingTimer.current) { clearTimeout(bufferingTimer.current); bufferingTimer.current = null }
      usePlayerStore.getState().setBuffering(playerId, false)
      const v = videoElRef.current
      if (v) v.playbackRate = intendedSpeed.current
    }, [playerId])

    const handleEnded = useCallback(() => {
      usePlayerStore.getState().setPlaying(playerId, false)
    }, [playerId])

    // ---- Button handlers ----

    const handleControlPlayPause = useCallback(() => {
      const v = videoElRef.current; if (!v) return
      if (v.paused) {
        v.play()
        if (syncGroupId) useSyncStore.getState().broadcastPlay(syncGroupId, playerId)
      } else {
        v.pause()
        if (syncGroupId) useSyncStore.getState().broadcastPause(syncGroupId, playerId)
      }
    }, [playerId, syncGroupId])

    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleFullscreen = useCallback(() => {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        (document.querySelector('[data-sync-grid]') || containerRef.current)?.requestFullscreen()
      }
    }, [])

    const handleClick = useCallback(() => {
      if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null }
      clickTimerRef.current = setTimeout(() => handleControlPlayPause(), 250)
    }, [handleControlPlayPause])

    const handleDoubleClick = useCallback(() => {
      if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null }
      handleFullscreen()
    }, [handleFullscreen])

    const handleSeek = useCallback((time: number) => {
      const v = videoElRef.current
      if (v && isFinite(time)) v.currentTime = Math.max(0, Math.min(time, v.duration || Infinity))
    }, [])

    const handleSpeedChange = useCallback((speed: number) => {
      const v = videoElRef.current
      if (!v || !isFinite(speed) || speed <= 0) return
      v.playbackRate = speed
      intendedSpeed.current = speed
      usePlayerStore.getState().setSpeed(playerId, speed)
      if (syncGroupId) useSyncStore.getState().broadcastSpeed(syncGroupId, playerId, speed)
    }, [playerId, syncGroupId])

    const handleVolumeChange = useCallback((vol: number) => {
      const v = videoElRef.current; if (v) v.volume = vol / 100
    }, [])

    const handleMuteToggle = useCallback(() => {
      const v = videoElRef.current; if (!v) return
      v.muted = !v.muted
      usePlayerStore.getState().setMuted(playerId, v.muted)
    }, [playerId])

    // Remote control command handler — broadcasts to all players in sync group
    const handleRemoteCommand = useCallback((action: string, value?: number) => {
      const v = videoElRef.current
      if (!v) return
      switch (action) {
        case 'play':
          v.play()
          if (syncGroupId) useSyncStore.getState().broadcastPlay(syncGroupId, playerId)
          break
        case 'pause':
          v.pause()
          if (syncGroupId) useSyncStore.getState().broadcastPause(syncGroupId, playerId)
          break
        case 'seek':
          if (value) {
            const newTime = Math.max(0, Math.min(v.currentTime + value, v.duration || Infinity))
            v.currentTime = newTime
            if (syncGroupId) useSyncStore.getState().broadcastSeek(syncGroupId, playerId, newTime)
          }
          break
        case 'speed':
          if (value && value > 0) {
            v.playbackRate = value
            intendedSpeed.current = value
            usePlayerStore.getState().setSpeed(playerId, value)
            if (syncGroupId) useSyncStore.getState().broadcastSpeed(syncGroupId, playerId, value)
          }
          break
      }
    }, [playerId, syncGroupId])

    if (!player) return null

    return (
      <div ref={containerRef} data-video-container style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: '#000', position: 'relative', ...style
      }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          <video
            ref={videoCallbackRef}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'pointer' }}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeeked={handleSeeked}
            onRateChange={handleRateChange}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            onEnded={handleEnded}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          />
          <SubtitleOverlay playerId={playerId} />
          {player.isBuffering && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', padding: '10px 20px', borderRadius: 8, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 13 }}>
              ⏳ Buffering...
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={() => onClose(playerId)}
            title="Close"
            style={{
              position: 'absolute', top: 4, right: 4, zIndex: 10,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, border: 'none', cursor: 'pointer'
            }}
          >✕</button>
        )}

        <ControlBar
          playing={ui.playing}
          currentTime={ui.time}
          duration={ui.dur}
          speed={ui.spd}
          fileName={getFileName(player.filePath)}
          onPlayPause={handleControlPlayPause}
          onSeek={handleSeek}
          onSpeedChange={handleSpeedChange}
          onFullscreen={handleFullscreen}
          onRemoteCommand={handleRemoteCommand}
        />
      </div>
    )
  }
)
