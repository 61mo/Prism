import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  onCancel: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onCancel, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    if (!input.trim() || isStreaming || disabled) return
    onSend(input)
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't let keyboard events bubble to video player
    e.stopPropagation()

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      padding: '8px 12px',
      borderTop: '1px solid var(--border-subtle)',
      flexShrink: 0
    }}>
      {disabled && (
        <div style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          textAlign: 'center',
          marginBottom: 4
        }}>
          Open a video to start chatting
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Open a video first...' : 'Ask about the video... (Enter to send)'}
          rows={2}
          disabled={disabled || isStreaming}
          style={{
            flex: 1,
            resize: 'none',
            padding: '6px 10px',
            fontSize: 13,
            lineHeight: 1.5,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />

        {isStreaming ? (
          <button
            onClick={onCancel}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--danger)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              alignSelf: 'flex-end'
            }}
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              background: disabled || !input.trim() ? 'var(--bg-tertiary)' : 'var(--accent)',
              color: disabled || !input.trim() ? 'var(--text-tertiary)' : '#fff',
              fontSize: 13,
              fontWeight: 600,
              alignSelf: 'flex-end',
              transition: 'all var(--transition)'
            }}
          >
            Send
          </button>
        )}
      </div>
    </div>
  )
}
