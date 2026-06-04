import { create } from 'zustand'
import type { SubtitleTrack, SubtitleCue } from '../types'

interface SubtitleStore {
  tracks: Map<string, SubtitleTrack[]>
  activeTrackId: string | null
  activeVideoPath: string | null
  cues: SubtitleCue[]
  currentCues: SubtitleCue[]
  isGenerating: boolean
  generationProgress: number

  setTracks: (videoPath: string, tracks: SubtitleTrack[]) => void
  addTrack: (videoPath: string, track: SubtitleTrack) => void
  removeTrack: (videoPath: string, trackId: string) => void
  setActiveTrack: (videoPath: string, trackId: string | null) => void
  setActiveVideo: (videoPath: string | null) => void

  setCues: (cues: SubtitleCue[]) => void
  updateCurrentCues: (currentTimeMs: number) => void

  setGenerating: (generating: boolean) => void
  setGenerationProgress: (progress: number) => void
}

export const useSubtitleStore = create<SubtitleStore>((set, get) => ({
  tracks: new Map(),
  activeTrackId: null,
  activeVideoPath: null,
  cues: [],
  currentCues: [],
  isGenerating: false,
  generationProgress: 0,

  setTracks: (videoPath, tracks) =>
    set(state => {
      const newTracks = new Map(state.tracks)
      newTracks.set(videoPath, tracks)
      return { tracks: newTracks }
    }),

  addTrack: (videoPath, track) =>
    set(state => {
      const existing = state.tracks.get(videoPath) || []
      const newTracks = new Map(state.tracks)
      newTracks.set(videoPath, [...existing.filter(t => t.id !== track.id), track])
      return { tracks: newTracks }
    }),

  removeTrack: (videoPath, trackId) =>
    set(state => {
      const existing = state.tracks.get(videoPath) || []
      const newTracks = new Map(state.tracks)
      newTracks.set(videoPath, existing.filter(t => t.id !== trackId))
      return {
        tracks: newTracks,
        activeTrackId: state.activeTrackId === trackId ? null : state.activeTrackId
      }
    }),

  setActiveTrack: (videoPath, trackId) =>
    set(state => {
      const tracks = state.tracks.get(videoPath) || []
      const track = trackId ? tracks.find(t => t.id === trackId) : undefined
      return {
        activeTrackId: trackId,
        activeVideoPath: videoPath,
        cues: track?.cues || []
      }
    }),

  setActiveVideo: (videoPath) => set({ activeVideoPath: videoPath }),

  setCues: (cues) => set({ cues }),

  updateCurrentCues: (currentTimeMs) => {
    const { cues } = get()
    const currentCues = cues.filter(
      cue => currentTimeMs >= cue.startMs && currentTimeMs <= cue.endMs
    )
    set({ currentCues })
  },

  setGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationProgress: (generationProgress) => set({ generationProgress })
}))
