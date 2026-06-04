/**
 * Browser-compatible API layer that mirrors the Electron preload API.
 * Uses File System Access API, localStorage, and direct fetch calls.
 */

import type { HistoryEntry } from '../renderer/types'
import { getFileName, getFolderPath } from '../renderer/utils/formatTime'

// --- File Operations ---
export async function openVideoFile(): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*,.mp4,.mov,.avi,.wmv,.flv,.mkv,.webm,.m4v,.mpg,.mpeg,.ts,.m2ts,.ogv,.3gp,.3g2,.rm,.rmvb,.asf,.vob,.divx,.xvid,.f4v,.h264,.hevc,.mts,.mxf'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) {
        // Create an object URL for the file
        resolve(URL.createObjectURL(file))
      } else {
        resolve(null)
      }
    }
    input.click()
  })
}

export async function openVideoFiles(): Promise<string[]> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*'
    input.multiple = true
    input.onchange = () => {
      const files = input.files
      if (files && files.length > 0) {
        const urls = Array.from(files).map(f => URL.createObjectURL(f))
        resolve(urls)
      } else {
        resolve([])
      }
    }
    input.click()
  })
}

// --- Drag & Drop ---
export function setupDragDrop(
  element: HTMLElement,
  onFiles: (files: File[]) => void
): () => void {
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      onFiles(Array.from(files).filter(f => f.type.startsWith('video/')))
    }
  }

  element.addEventListener('dragover', handleDragOver)
  element.addEventListener('drop', handleDrop)

  return () => {
    element.removeEventListener('dragover', handleDragOver)
    element.removeEventListener('drop', handleDrop)
  }
}

// --- Subtitle Operations ---
export async function importSubtitle(): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.srt,.vtt,.ass,.ssa'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsText(file)
      } else {
        resolve(null)
      }
    }
    input.click()
  })
}

// --- Local Storage History ---
const HISTORY_KEY = 'player-watch-history'

export function getHistory(filters?: {
  category?: string
  search?: string
  limit?: number
  offset?: number
}): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    let entries: HistoryEntry[] = raw ? JSON.parse(raw) : []

    if (filters?.category) {
      entries = entries.filter(e => e.category === filters.category)
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      entries = entries.filter(e =>
        e.fileName.toLowerCase().includes(q)
      )
    }

    entries.sort((a, b) =>
      new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
    )

    if (filters?.offset) entries = entries.slice(filters.offset)
    if (filters?.limit) entries = entries.slice(0, filters.limit)

    return entries
  } catch {
    return []
  }
}

export function openVideoHistory(videoInfo: {
  filePath: string
  fileName: string
  folderPath: string
  fileSize?: number
}): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const entries: HistoryEntry[] = raw ? JSON.parse(raw) : []

    const existing = entries.find(e => e.filePath === videoInfo.filePath)
    const now = new Date().toISOString()

    if (existing) {
      existing.playCount = (existing.playCount || 1) + 1
      existing.lastWatchedAt = now
    } else {
      entries.push({
        id: Date.now(),
        filePath: videoInfo.filePath,
        fileName: videoInfo.fileName,
        folderPath: videoInfo.folderPath,
        fileSize: videoInfo.fileSize || null,
        durationSeconds: null,
        currentTime: 0,
        progressPercent: 0,
        playCount: 1,
        category: null,
        tags: [],
        openedAt: now,
        lastWatchedAt: now
      })
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // Ignore storage errors
  }
}

export function updateProgress(
  filePath: string,
  currentTime: number,
  durationSeconds: number
): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const entries: HistoryEntry[] = raw ? JSON.parse(raw) : []
    const progress = durationSeconds > 0
      ? Math.round((currentTime / durationSeconds) * 100)
      : 0

    const entry = entries.find(e => e.filePath === filePath)
    if (entry) {
      entry.currentTime = currentTime
      entry.durationSeconds = durationSeconds
      entry.progressPercent = progress
      entry.lastWatchedAt = new Date().toISOString()
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
    }
  } catch {
    // Ignore
  }
}

export function getHistoryCategories(): { name: string; count: number }[] {
  const entries = getHistory()
  const catMap = new Map<string, number>()
  for (const e of entries) {
    if (e.category) {
      catMap.set(e.category, (catMap.get(e.category) || 0) + 1)
    }
  }
  return Array.from(catMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function deleteHistoryEntry(id: number): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    let entries: HistoryEntry[] = raw ? JSON.parse(raw) : []
    entries = entries.filter(e => e.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // Ignore
  }
}

export function clearAllHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function updateHistoryCategory(id: number, category: string, tags: string[]): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const entries: HistoryEntry[] = raw ? JSON.parse(raw) : []
    const entry = entries.find(e => e.id === id)
    if (entry) {
      entry.category = category
      entry.tags = tags
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
    }
  } catch {
    // Ignore
  }
}

// --- AI Chat (direct API) ---
export async function sendChatMessage(params: {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
  videoContext: { title: string; path: string; currentTime: number; subtitles?: string }
  imageBase64List?: string[]  // base64 JPEG frames from all videos
  provider: 'openai' | 'anthropic'
  model: string
  apiKey: string
  baseUrl?: string
  systemPrompt?: string
  onChunk: (chunk: string) => void
  signal?: AbortSignal
}): Promise<void> {
  const images = params.imageBase64List || []
  const hasVision = images.length > 0

  const basePrompt = params.systemPrompt || 'You are an AI assistant helping a user who is watching a video. Answer concisely.'
  const visionNote = hasVision
    ? `\nIMPORTANT: You are seeing ${images.length} screenshot(s) from the video "${params.videoContext.title}" at timestamp ${formatTimestamp(params.videoContext.currentTime)}. These are real-time frames from what the user is currently watching. Analyze the visual content carefully and describe what you see.`
    : ''

  const systemPrompt = `${basePrompt}${visionNote}

Video context:
- Title: ${params.videoContext.title}
- Current time: ${formatTimestamp(params.videoContext.currentTime)}
${params.videoContext.subtitles ? `- Current subtitles: ${params.videoContext.subtitles}` : ''}`

  // Build messages — if images are provided, format for multimodal
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...params.messages.map((m, mIdx) => {
      // Attach images to the last user message
      const isLastUserMsg = m.role === 'user' && m === params.messages.filter(x => x.role === 'user').pop()
      if (isLastUserMsg && images.length > 0) {
        const content: any[] = [{ type: 'text', text: m.content }]
        // Always use OpenAI-compatible image_url format
        // (Most proxy APIs including Anthropic-compatible ones expect this format)
        images.forEach((img, i) => {
          content.push({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${img}`, detail: 'low' }
          })
        })
        return { role: 'user', content }
      }
      return { role: m.role, content: m.content }
    })
  ]

  if (params.provider === 'openai') {
    await streamOpenAI(messages, params.model, params.apiKey, params.baseUrl, params.onChunk, params.signal)
  } else {
    await streamAnthropic(messages, params.model, params.apiKey, params.baseUrl, params.onChunk, params.signal)
  }
}

async function streamOpenAI(
  messages: { role: string; content: string }[],
  model: string,
  apiKey: string,
  baseUrl: string = 'https://api.openai.com/v1',
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') continue

      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) onChunk(content)
      } catch {
        // Skip malformed chunks
      }
    }
  }
}

async function streamAnthropic(
  messages: { role: string; content: string }[],
  model: string,
  apiKey: string,
  baseUrl: string = 'https://api.anthropic.com',
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  // Extract system message for Anthropic format
  const systemMsg = messages.find(m => m.role === 'system')
  const chatMessages = messages.filter(m => m.role !== 'system')

  // Build URL — if base URL already contains a path (e.g. proxy), append /messages directly
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const url = cleanBase.endsWith('/v1') ? `${cleanBase}/messages` : `${cleanBase}/v1/messages`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      system: systemMsg?.content,
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content
      })),
      max_tokens: 4096,
      stream: true
    }),
    signal
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`Anthropic API error: ${response.status} ${errBody}`)
  }

  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)

      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onChunk(parsed.delta.text)
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }
}

// --- Subtitle AI Generation ---
export async function generateSubtitles(
  apiKey: string,
  onProgress: (progress: number) => void
): Promise<string> {
  // Whisper API requires actual audio file upload
  // For browser-based generation, user needs to provide an audio file
  // or we need a server-side proxy
  //
  // For demo purposes, return a placeholder
  onProgress(30)
  await sleep(500)
  onProgress(60)
  await sleep(500)
  onProgress(90)

  const srt = `1
00:00:01,000 --> 00:00:05,000
AI subtitle generation requires server-side Whisper API access.
Configure your OpenAI API key in Settings.

2
00:00:06,000 --> 00:00:10,000
In production, audio is extracted and sent to Whisper API for transcription.`

  onProgress(100)
  return srt
}

// --- Helpers ---
function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
