import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { v4 as uuidv4 } from 'uuid'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import type { ChatMessage as ChatMessageType } from '../../types'
import * as api from '../../api/browserApi'
import { formatTime } from '../../utils/formatTime'

const EMPTY_TRACKS: any[] = []

interface Size { w: number; h: number }

export function ChatPanel() {
  const sessions = useChatStore(s => s.sessions)
  const activeSessionId = useChatStore(s => s.activeSessionId)
  const isStreaming = useChatStore(s => s.isStreaming)
  const setPanelOpen = useChatStore(s => s.setPanelOpen)
  const createSession = useChatStore(s => s.createSession)
  const addMessage = useChatStore(s => s.addMessage)
  const appendToLastMessage = useChatStore(s => s.appendToLastMessage)
  const setStreaming = useChatStore(s => s.setStreaming)
  const activePlayerId = usePlayerStore(s => s.activePlayerId)
  const player = usePlayerStore(s =>
    activePlayerId ? s.players.get(activePlayerId) : undefined
  )
  const settings = useSettingsStore(s => s.settings)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [size, setSize] = useState<Size>({ w: 400, h: 500 })
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 })
  const [interaction, setInteraction] = useState<'none' | 'drag' | 'resize'>('none')
  const [autoVision, setAutoVision] = useState(true)
  const interactionRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, startW: 0, startH: 0 })

  const activeSession = activeSessionId ? sessions.get(activeSessionId) : undefined

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setInteraction('drag')
    interactionRef.current = { startX: e.clientX, startY: e.clientY, startPosX: position.x, startPosY: position.y, startW: size.w, startH: size.h }
  }, [position, size])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setInteraction('resize')
    interactionRef.current = { startX: e.clientX, startY: e.clientY, startPosX: position.x, startPosY: position.y, startW: size.w, startH: size.h }
  }, [position, size])

  useEffect(() => {
    if (interaction === 'none') return
    const handleMouseMove = (e: MouseEvent) => {
      const d = interactionRef.current
      if (interaction === 'drag') {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 100, d.startPosX + e.clientX - d.startX)),
          y: Math.max(0, Math.min(window.innerHeight - 50, d.startPosY + e.clientY - d.startY))
        })
      } else {
        setSize({
          w: Math.max(300, Math.min(window.innerWidth - position.x, d.startW + e.clientX - d.startX)),
          h: Math.max(250, Math.min(window.innerHeight - position.y, d.startH + e.clientY - d.startY))
        })
      }
    }
    const handleMouseUp = () => setInteraction('none')
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [interaction, position])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return

    const apiKey = settings.defaultAiProvider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey
    if (!apiKey) {
      let sessionId = activeSessionId
      if (!sessionId) {
        sessionId = createSession(player?.filePath || '', settings.defaultAiProvider, settings.defaultChatModel)
      }
      addMessage(sessionId, {
        id: uuidv4(), role: 'assistant',
        content: '⚠️ API key not configured. Please go to Settings (⚙️) and enter your API key.',
        videoTimestamp: 0, createdAt: new Date().toISOString()
      })
      return
    }

    let sessionId = activeSessionId
    const provider = settings.defaultAiProvider
    const model = settings.defaultChatModel

    if (!sessionId) {
      sessionId = createSession(player?.filePath || '', provider, model)
    }

    const userMsg: ChatMessageType = {
      id: uuidv4(), role: 'user',
      content: content.trim(),
      videoTimestamp: player?.currentTime || 0,
      createdAt: new Date().toISOString()
    }
    addMessage(sessionId, userMsg)

    const assistantMsgId = uuidv4()
    const assistantMsg: ChatMessageType = {
      id: assistantMsgId, role: 'assistant',
      content: '', videoTimestamp: player?.currentTime || 0,
      createdAt: new Date().toISOString()
    }
    addMessage(sessionId, assistantMsg)
    setStreaming(true)

    const abortController = new AbortController()
    abortRef.current = abortController

    // Capture current frame from all video elements via canvas
    const imageBase64List: string[] = []
    if (autoVision) {
      try {
        const videoEls = document.querySelectorAll('video') as NodeListOf<HTMLVideoElement>
        for (const videoEl of videoEls) {
          if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
            const canvas = document.createElement('canvas')
            const maxW = 640
            const scale = Math.min(1, maxW / videoEl.videoWidth)
            canvas.width = Math.round(videoEl.videoWidth * scale)
            canvas.height = Math.round(videoEl.videoHeight * scale)
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (ctx) {
              ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
              const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1]
              if (base64 && base64.length > 3000) {
                imageBase64List.push(base64)
              }
            }
          }
        }
      } catch {
        // Frame capture is optional
      }
    }

    try {
      const session = useChatStore.getState().sessions.get(sessionId)
      const messages = session?.messages.filter(m => m.content !== '') || []

      const msgList = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      // Add video context to last user message
      if (imageBase64List.length > 0 && msgList.length > 0) {
        const lastIdx = msgList.length - 1
        const ts = formatTime(player?.currentTime || 0)
        msgList[lastIdx] = {
          ...msgList[lastIdx],
          content: `[The attached screenshot shows the video "${player?.fileName || 'Unknown'}" at ${ts}. Analyze what you see in the image.]\n\n${msgList[lastIdx].content}`
        }
      }

      await api.sendChatMessage({
        messages: msgList,
        videoContext: {
          title: player?.fileName || 'Unknown',
          path: player?.filePath || '',
          currentTime: player?.currentTime || 0
        },
        imageBase64List: imageBase64List.length > 0 ? imageBase64List : undefined,
        provider, model,
        apiKey: provider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey,
        baseUrl: provider === 'openai' ? settings.openaiBaseUrl : settings.anthropicBaseUrl,
        systemPrompt: settings.systemPrompt,
        onChunk: (chunk) => { appendToLastMessage(sessionId!, chunk) },
        signal: abortController.signal
      })
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        let errorMsg = err.message || 'Unknown error'
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
          errorMsg = `Network error. Check your Base URL and API Key in Settings.`
        }
        appendToLastMessage(sessionId!, `\n\n⚠️ Error: ${errorMsg}`)
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  return (
    <div data-panel className="glass-panel fade-in" style={{
      position: 'fixed', left: position.x, top: position.y,
      width: size.w, height: size.h,
      display: 'flex', flexDirection: 'column',
      zIndex: 200, overflow: 'hidden',
      minWidth: 300, minHeight: 250
    }}>
      <div
        onMouseDown={handleDragStart}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)',
          cursor: interaction === 'drag' ? 'grabbing' : 'grab', userSelect: 'none', flexShrink: 0
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>🤖 AI Chat</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={() => setAutoVision(v => !v)}
            title={autoVision ? 'AI can see your screen (click to disable)' : 'Text only (click to let AI see)'}
            style={{
              padding: '2px 6px', borderRadius: 8, fontSize: 10,
              background: autoVision ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
              color: autoVision ? 'var(--accent)' : 'var(--text-tertiary)',
              border: 'none', cursor: 'pointer'
            }}
          >
            {autoVision ? '👁️ Vision ON' : '📝 Text Only'}
          </button>
          <span style={{
            fontSize: 10, color: 'var(--text-tertiary)',
            padding: '2px 6px', borderRadius: 8, background: 'var(--bg-tertiary)'
          }}>
            {settings.defaultAiProvider === 'openai' ? 'GPT' : 'Claude'}
          </span>
          <button onClick={() => setPanelOpen(false)} style={{
            padding: '2px 6px', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)', fontSize: 14,
            border: 'none', background: 'none', cursor: 'pointer'
          }}>✕</button>
        </div>
      </div>

      <div style={{
        flex: 1, overflow: 'auto', padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        {!activeSession || activeSession.messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 40, fontSize: 13, lineHeight: 1.6 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🤖</p>
            <p style={{ fontWeight: 500, marginBottom: 8 }}>Ask me anything about the video!</p>
            <p style={{ fontSize: 12 }}>
              With 👁️ Vision ON, I can see your screen.<br/>
              Ask "What's happening in the video?" to try it.
            </p>
          </div>
        ) : (
          activeSession.messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={handleSendMessage}
        onCancel={() => abortRef.current?.abort()}
        isStreaming={isStreaming}
        disabled={!player}
      />

      <div
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute', right: 0, bottom: 0,
          width: 16, height: 16, cursor: 'nwse-resize', zIndex: 10
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ opacity: 0.4 }}>
          <path d="M14 16L16 14M10 16L16 10M6 16L16 6" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>
    </div>
  )
}
