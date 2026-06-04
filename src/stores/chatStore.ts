import { create } from 'zustand'
import type { ChatSession, ChatMessage } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface ChatStore {
  sessions: Map<string, ChatSession>
  activeSessionId: string | null
  isStreaming: boolean
  isPanelOpen: boolean

  createSession: (videoPath: string, provider: 'openai' | 'anthropic', model: string) => string
  deleteSession: (sessionId: string) => void
  setActiveSession: (sessionId: string | null) => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void

  addMessage: (sessionId: string, message: ChatMessage) => void
  appendToLastMessage: (sessionId: string, chunk: string) => void
  setStreaming: (streaming: boolean) => void

  getActiveSession: () => ChatSession | undefined
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: new Map(),
  activeSessionId: null,
  isStreaming: false,
  isPanelOpen: false,

  createSession: (videoPath, provider, model) => {
    const id = uuidv4()
    const session: ChatSession = {
      id,
      videoPath,
      provider,
      model,
      title: `Chat - ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: new Date().toISOString()
    }

    set(state => {
      const newSessions = new Map(state.sessions)
      newSessions.set(id, session)
      return {
        sessions: newSessions,
        activeSessionId: id,
        isPanelOpen: true
      }
    })

    return id
  },

  deleteSession: (sessionId) =>
    set(state => {
      const newSessions = new Map(state.sessions)
      newSessions.delete(sessionId)
      return {
        sessions: newSessions,
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
      }
    }),

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
  togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),
  setPanelOpen: (open) => set({ isPanelOpen: open }),

  addMessage: (sessionId, message) =>
    set(state => {
      const session = state.sessions.get(sessionId)
      if (!session) return state

      const newSession = {
        ...session,
        messages: [...session.messages, message]
      }
      const newSessions = new Map(state.sessions)
      newSessions.set(sessionId, newSession)

      return { sessions: newSessions }
    }),

  appendToLastMessage: (sessionId, chunk) =>
    set(state => {
      const session = state.sessions.get(sessionId)
      if (!session) return state

      const messages = [...session.messages]
      if (messages.length === 0) return state

      const lastMsg = { ...messages[messages.length - 1], content: messages[messages.length - 1].content + chunk }
      messages[messages.length - 1] = lastMsg

      const newSession = { ...session, messages }
      const newSessions = new Map(state.sessions)
      newSessions.set(sessionId, newSession)

      return { sessions: newSessions }
    }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  getActiveSession: () => {
    const { sessions, activeSessionId } = get()
    if (!activeSessionId) return undefined
    return sessions.get(activeSessionId)
  }
}))
