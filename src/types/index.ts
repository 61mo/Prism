// Tauri API type declarations
declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any>
      }
    }
  }
}

// Type definitions for the video player application

export interface PlayerState {
  id: string
  filePath: string
  fileName: string
  playing: boolean
  speed: number
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  isFullscreen: boolean
  isBuffering: boolean
  error: string | null
}

export interface SyncGroup {
  id: string
  playerIds: string[]
  syncProgress: boolean
  syncSpeed: boolean
  baseSpeed: number
}

export interface SyncConfig {
  syncProgress: boolean
  syncSpeed: boolean
}

export interface SubtitleCue {
  index: number
  startMs: number
  endMs: number
  text: string
}

export interface SubtitleTrack {
  id: string
  videoPath: string
  language: string
  source: 'ai_generated' | 'import'
  srtPath: string
  cues: SubtitleCue[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  videoTimestamp: number
  createdAt: string
}

export interface ChatSession {
  id: string
  videoPath: string
  provider: 'openai' | 'anthropic'
  model: string
  title: string
  messages: ChatMessage[]
  createdAt: string
}

export interface HistoryEntry {
  id: number
  filePath: string
  fileName: string
  folderPath: string
  fileSize: number | null
  durationSeconds: number | null
  currentTime: number
  progressPercent: number
  playCount: number
  category: string | null
  tags: string[]
  openedAt: string
  lastWatchedAt: string
}

export interface SmartFolder {
  category: string
  count: number
  entries: HistoryEntry[]
}

export interface UserSettings {
  openaiApiKey: string
  openaiBaseUrl: string
  anthropicApiKey: string
  anthropicBaseUrl: string
  defaultAiProvider: 'openai' | 'anthropic'
  defaultChatModel: string
  systemPrompt: string
  ffmpegPath: string
  theme: 'dark' | 'light'
  defaultVolume: number
  defaultSpeed: number
  historyAutoSave: boolean
}

export type SpeedOption = 0.25 | 0.5 | 0.75 | 0.9 | 1 | 1.25 | 1.5 | 2 | 3 | 6
