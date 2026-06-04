import type { SpeedOption } from '../types'

export const SPEED_OPTIONS: SpeedOption[] = [
  0.25, 0.5, 0.75, 0.9, 1, 1.25, 1.5, 2, 3, 6
]

export const LONG_PRESS_SPEED = 3
export const REWIND_SPEED = -3
export const LONG_PRESS_THRESHOLD_MS = 150
export const SEEK_STEP_SECONDS = 5
export const PROGRESS_UPDATE_INTERVAL_MS = 250

export const KEY_BINDINGS = {
  PLAY_PAUSE: 'Space',
  SEEK_FORWARD: 'ArrowRight',
  SEEK_BACKWARD: 'ArrowLeft',
  VOLUME_UP: 'ArrowUp',
  VOLUME_DOWN: 'ArrowDown',
  MUTE: 'KeyM',
  FULLSCREEN: 'KeyF',
  SPEED_UP: 'Period',
  SPEED_DOWN: 'Comma',
  TOGGLE_CHAT: 'KeyC',
  TOGGLE_SUBTITLE: 'KeyS',
  TOGGLE_SYNC: 'KeyY'
} as const

export const DEFAULT_SETTINGS = {
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  anthropicApiKey: '',
  anthropicBaseUrl: 'https://api.anthropic.com',
  defaultAiProvider: 'openai' as const,
  defaultChatModel: 'gpt-4o',
  systemPrompt: 'You are an AI assistant helping a user who is watching a video. Answer concisely. The user is watching a video and doesn\'t want to read walls of text.',
  ffmpegPath: 'ffmpeg',
  theme: 'dark' as const,
  defaultVolume: 80,
  defaultSpeed: 1,
  historyAutoSave: true
}
