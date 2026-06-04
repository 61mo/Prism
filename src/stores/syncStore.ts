import { create } from 'zustand'
import type { SyncConfig } from '../types'

interface VideoPlayerRef {
  play: () => void
  pause: () => void
  seek: (time: number) => void
  syncSeek: (time: number) => void  // seek without re-broadcasting (avoids infinite loop)
  setSpeed: (speed: number) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  isPlaying: () => boolean
}

interface SyncGroupData {
  id: string
  playerRefs: Map<string, VideoPlayerRef>
  syncProgress: boolean
  syncSpeed: boolean
  baseSpeed: number
}

interface SyncStore {
  syncGroups: Map<string, SyncGroupData>

  createSyncGroup: (id: string) => void
  removeSyncGroup: (id: string) => void

  registerPlayer: (groupId: string, playerId: string, ref: VideoPlayerRef) => void
  unregisterPlayer: (groupId: string, playerId: string) => void

  toggleSyncProgress: (groupId: string) => void
  setSyncConfig: (groupId: string, config: Partial<SyncConfig>) => void

  // Broadcast actions to all players in group (except source)
  broadcastPlay: (groupId: string, sourcePlayerId: string) => void
  broadcastPause: (groupId: string, sourcePlayerId: string) => void
  broadcastSeek: (groupId: string, sourcePlayerId: string, time: number) => void
  broadcastSpeed: (groupId: string, sourcePlayerId: string, speed: number) => void
  broadcastVolume: (groupId: string, sourcePlayerId: string, volume: number) => void
  broadcastMuted: (groupId: string, sourcePlayerId: string, muted: boolean) => void

  getGroupConfig: (groupId: string) => SyncConfig | undefined
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  syncGroups: new Map(),

  createSyncGroup: (id) =>
    set(state => {
      if (state.syncGroups.has(id)) return state  // already exists — don't reset!
      const newGroups = new Map(state.syncGroups)
      newGroups.set(id, {
        id,
        playerRefs: new Map(),
        syncProgress: true,
        syncSpeed: true,
        baseSpeed: 1
      })
      return { syncGroups: newGroups }
    }),

  removeSyncGroup: (id) =>
    set(state => {
      const newGroups = new Map(state.syncGroups)
      newGroups.delete(id)
      return { syncGroups: newGroups }
    }),

  registerPlayer: (groupId, playerId, ref) =>
    set(state => {
      const group = state.syncGroups.get(groupId)
      if (!group) return state

      const newPlayerRefs = new Map(group.playerRefs)
      newPlayerRefs.set(playerId, ref)

      const newGroups = new Map(state.syncGroups)
      newGroups.set(groupId, { ...group, playerRefs: newPlayerRefs })

      return { syncGroups: newGroups }
    }),

  unregisterPlayer: (groupId, playerId) =>
    set(state => {
      const group = state.syncGroups.get(groupId)
      if (!group) return state

      const newPlayerRefs = new Map(group.playerRefs)
      newPlayerRefs.delete(playerId)

      const newGroups = new Map(state.syncGroups)
      newGroups.set(groupId, { ...group, playerRefs: newPlayerRefs })

      return { syncGroups: newGroups }
    }),

  toggleSyncProgress: (groupId) =>
    set(state => {
      const group = state.syncGroups.get(groupId)
      if (!group) return state

      const newGroups = new Map(state.syncGroups)
      newGroups.set(groupId, { ...group, syncProgress: !group.syncProgress })

      return { syncGroups: newGroups }
    }),

  setSyncConfig: (groupId, config) =>
    set(state => {
      const group = state.syncGroups.get(groupId)
      if (!group) return state

      const newGroups = new Map(state.syncGroups)
      newGroups.set(groupId, { ...group, ...config })

      return { syncGroups: newGroups }
    }),

  broadcastPlay: (groupId, sourcePlayerId) => {
    const group = get().syncGroups.get(groupId)
    if (!group) return

    group.playerRefs.forEach((ref, playerId) => {
      if (playerId !== sourcePlayerId) {
        ref.play()
      }
    })
  },

  broadcastPause: (groupId, sourcePlayerId) => {
    const group = get().syncGroups.get(groupId)
    if (!group) return

    group.playerRefs.forEach((ref, playerId) => {
      if (playerId !== sourcePlayerId) {
        ref.pause()
      }
    })
  },

  broadcastSeek: (groupId, sourcePlayerId, time) => {
    const group = get().syncGroups.get(groupId)
    if (!group || !group.syncProgress) return

    group.playerRefs.forEach((ref, playerId) => {
      if (playerId !== sourcePlayerId) {
        // Clamp to target player's duration
        const duration = ref.getDuration()
        const clampedTime = Math.max(0, Math.min(time, duration || Infinity))
        ref.syncSeek(clampedTime)
      }
    })
  },

  broadcastSpeed: (groupId, sourcePlayerId, speed) => {
    const group = get().syncGroups.get(groupId)
    if (!group) return

    group.playerRefs.forEach((ref, playerId) => {
      if (playerId !== sourcePlayerId) {
        ref.setSpeed(speed)
      }
    })
  },

  broadcastVolume: (groupId: string, sourcePlayerId: string, volume: number) => {
    const group = get().syncGroups.get(groupId)
    if (!group) return

    group.playerRefs.forEach((ref, playerId) => {
      if (playerId !== sourcePlayerId) {
        ref.setVolume(volume)
      }
    })
  },

  broadcastMuted: (groupId: string, sourcePlayerId: string, muted: boolean) => {
    const group = get().syncGroups.get(groupId)
    if (!group) return

    group.playerRefs.forEach((ref, playerId) => {
      if (playerId !== sourcePlayerId) {
        ref.setMuted(muted)
      }
    })
  },

  getGroupConfig: (groupId) => {
    const group = get().syncGroups.get(groupId)
    if (!group) return undefined
    return {
      syncProgress: group.syncProgress,
      syncSpeed: group.syncSpeed
    }
  }
}))

export type { VideoPlayerRef, SyncGroupData }
