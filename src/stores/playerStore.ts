import { create } from 'zustand'
import type { PlayerState } from '../types'

interface PlayerStore {
  players: Map<string, PlayerState>
  activePlayerId: string | null

  registerPlayer: (id: string, filePath: string, fileName: string) => void
  unregisterPlayer: (id: string) => void
  setActivePlayer: (id: string | null) => void

  updatePlayerState: (id: string, partial: Partial<PlayerState>) => void
  setPlaying: (id: string, playing: boolean) => void
  setSpeed: (id: string, speed: number) => void
  setCurrentTime: (id: string, time: number) => void
  setDuration: (id: string, duration: number) => void
  setVolume: (id: string, volume: number) => void
  setMuted: (id: string, muted: boolean) => void
  setBuffering: (id: string, buffering: boolean) => void
  setError: (id: string, error: string | null) => void
  setFullscreen: (id: string, fullscreen: boolean) => void

  getPlayerState: (id: string) => PlayerState | undefined
  getActivePlayer: () => PlayerState | undefined
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  players: new Map(),
  activePlayerId: null,

  registerPlayer: (id, filePath, fileName) =>
    set(state => {
      const newPlayers = new Map(state.players)
      newPlayers.set(id, {
        id,
        filePath,
        fileName,
        playing: false,
        speed: 1,
        currentTime: 0,
        duration: 0,
        volume: 80,
        muted: false,
        isFullscreen: false,
        isBuffering: false,
        error: null
      })
      return {
        players: newPlayers,
        activePlayerId: state.activePlayerId || id
      }
    }),

  unregisterPlayer: (id) =>
    set(state => {
      const newPlayers = new Map(state.players)
      newPlayers.delete(id)
      return {
        players: newPlayers,
        activePlayerId: state.activePlayerId === id
          ? (newPlayers.size > 0 ? newPlayers.keys().next().value : null)
          : state.activePlayerId
      }
    }),

  setActivePlayer: (id) => set({ activePlayerId: id }),

  updatePlayerState: (id, partial) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, ...partial })
      return { players: newPlayers }
    }),

  setPlaying: (id, playing) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, playing })
      return { players: newPlayers }
    }),

  setSpeed: (id, speed) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, speed })
      return { players: newPlayers }
    }),

  setCurrentTime: (id, currentTime) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, currentTime })
      return { players: newPlayers }
    }),

  setDuration: (id, duration) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, duration })
      return { players: newPlayers }
    }),

  setVolume: (id, volume) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, volume })
      return { players: newPlayers }
    }),

  setMuted: (id, muted) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, muted })
      return { players: newPlayers }
    }),

  setBuffering: (id, isBuffering) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, isBuffering })
      return { players: newPlayers }
    }),

  setError: (id, error) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, error })
      return { players: newPlayers }
    }),

  setFullscreen: (id, isFullscreen) =>
    set(state => {
      const player = state.players.get(id)
      if (!player) return state
      const newPlayers = new Map(state.players)
      newPlayers.set(id, { ...player, isFullscreen })
      return { players: newPlayers }
    }),

  getPlayerState: (id) => get().players.get(id),
  getActivePlayer: () => {
    const { players, activePlayerId } = get()
    if (!activePlayerId) return undefined
    return players.get(activePlayerId)
  }
}))
