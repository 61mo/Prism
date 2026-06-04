import { useCallback, useRef, useEffect } from 'react'
import { useLongPress } from './useLongPress'
import { usePlayerStore } from '../stores/playerStore'
import { useSyncStore, type VideoPlayerRef } from '../stores/syncStore'
import { LONG_PRESS_SPEED, SEEK_STEP_SECONDS } from '../utils/constants'

interface UseVideoControlsOptions {
  playerId: string
  syncGroupId?: string
  videoRef: React.RefObject<VideoPlayerRef>
}

export function useVideoControls({
  playerId,
  syncGroupId,
  videoRef
}: UseVideoControlsOptions) {
  const store = usePlayerStore
  const syncStore = useSyncStore
  const previousSpeedRef = useRef(1)

  // Helper to get the player API (always reads latest via ref)
  const getPlayer = useCallback(() => videoRef.current, [videoRef])

  // ---- Action handlers ----

  const handlePlayPause = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    if (player.isPlaying()) {
      player.pause()
      if (syncGroupId) syncStore.getState().broadcastPause(syncGroupId, playerId)
    } else {
      player.play()
      if (syncGroupId) syncStore.getState().broadcastPlay(syncGroupId, playerId)
    }
  }, [playerId, syncGroupId, getPlayer])

  const handleSeekForward = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    const newTime = player.getCurrentTime() + SEEK_STEP_SECONDS
    const duration = player.getDuration()
    const clamped = Math.min(newTime, duration || Infinity)
    player.seek(clamped)
    if (syncGroupId) syncStore.getState().broadcastSeek(syncGroupId, playerId, clamped)
  }, [playerId, syncGroupId, getPlayer])

  const handleSeekBackward = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    const newTime = Math.max(0, player.getCurrentTime() - SEEK_STEP_SECONDS)
    player.seek(newTime)
    if (syncGroupId) syncStore.getState().broadcastSeek(syncGroupId, playerId, newTime)
  }, [playerId, syncGroupId, getPlayer])

  const handleSpeedUpStart = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    const state = store.getState().getPlayerState(playerId)
    previousSpeedRef.current = state?.speed || 1
    player.setSpeed(LONG_PRESS_SPEED)
    store.getState().setSpeed(playerId, LONG_PRESS_SPEED)
    if (syncGroupId) syncStore.getState().broadcastSpeed(syncGroupId, playerId, LONG_PRESS_SPEED)
  }, [playerId, syncGroupId, getPlayer])

  const handleSpeedUpEnd = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    const prevSpeed = previousSpeedRef.current
    player.setSpeed(prevSpeed)
    store.getState().setSpeed(playerId, prevSpeed)
    if (syncGroupId) syncStore.getState().broadcastSpeed(syncGroupId, playerId, prevSpeed)
  }, [playerId, syncGroupId, getPlayer])

  const handleRewindStart = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    const state = store.getState().getPlayerState(playerId)
    previousSpeedRef.current = state?.speed || 1
    // HTML5 video: negative speed simulated via seek loop
    player.setSpeed(-LONG_PRESS_SPEED)
    store.getState().setSpeed(playerId, -LONG_PRESS_SPEED)
  }, [playerId, getPlayer])

  const handleRewindEnd = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    const prevSpeed = previousSpeedRef.current
    player.setSpeed(prevSpeed)
    store.getState().setSpeed(playerId, prevSpeed)
  }, [playerId, getPlayer])

  const handleVolumeUp = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    const state = store.getState().getPlayerState(playerId)
    const newVol = Math.min(100, (state?.volume || 80) + 5)
    player.setVolume(newVol)
    store.getState().setVolume(playerId, newVol)
  }, [playerId, getPlayer])

  const handleVolumeDown = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    const state = store.getState().getPlayerState(playerId)
    const newVol = Math.max(0, (state?.volume || 80) - 5)
    player.setVolume(newVol)
    store.getState().setVolume(playerId, newVol)
  }, [playerId, getPlayer])

  const handleMute = useCallback(() => {
    const player = getPlayer()
    if (!player) return
    const state = store.getState().getPlayerState(playerId)
    const newMuted = !(state?.muted || false)
    player.setMuted(newMuted)
    store.getState().setMuted(playerId, newMuted)
  }, [playerId, getPlayer])

  const handleFullscreen = useCallback(() => {
    // Fullscreen the sync grid (outermost container), or video container if single
    const grid = document.querySelector('[data-sync-grid]') as HTMLElement
    const videoWrap = document.querySelector('[data-video-container]') as HTMLElement
    const target = grid || videoWrap
    target?.requestFullscreen()
  }, [])

  // ---- Register long-press for arrow keys ----
  useLongPress({
    key: 'ArrowRight',
    onShortPress: handleSeekForward,
    onLongPressStart: handleSpeedUpStart,
    onLongPressEnd: handleSpeedUpEnd
  })

  useLongPress({
    key: 'ArrowLeft',
    onShortPress: handleSeekBackward,
    onLongPressStart: handleRewindStart,
    onLongPressEnd: handleRewindEnd
  })

  // ---- Register other keyboard shortcuts on window ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return
      }

      let handled = true

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handlePlayPause()
          break
        case 'ArrowRight':
        case 'ArrowLeft':
          // Already handled by useLongPress, but prevent default here
          e.preventDefault()
          handled = false // Let useLongPress handle it
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeUp()
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeDown()
          break
        case 'KeyM':
          e.preventDefault()
          handleMute()
          break
        case 'KeyF':
          e.preventDefault()
          handleFullscreen()
          break
        default:
          handled = false
      }

      if (handled) return
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlePlayPause, handleVolumeUp, handleVolumeDown, handleMute, handleFullscreen])
}
