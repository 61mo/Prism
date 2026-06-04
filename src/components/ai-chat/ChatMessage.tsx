import type { ChatMessage as ChatMessageType } from '../../types'
import { formatTime } from '../../utils/formatTime'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) return null

  const content = message.content || ''

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '100%'
    }}>
      <span style={{
        fontSize: 10,
        color: 'var(--text-tertiary)',
        marginBottom: 2,
        padding: '0 4px'
      }}>
        {isUser ? 'You' : 'AI'}
        {message.videoTimestamp > 0 && (
          <span style={{ marginLeft: 6 }}>at {formatTime(message.videoTimestamp)}</span>
        )}
      </span>

      <div style={{
        padding: '8px 12px',
        borderRadius: isUser ? 'var(--radius) var(--radius-sm) var(--radius) var(--radius)'
          : 'var(--radius-sm) var(--radius) var(--radius) var(--radius)',
        background: isUser ? 'var(--accent)' : 'var(--bg-tertiary)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: 13,
        lineHeight: 1.6,
        maxWidth: '85%',
        wordBreak: 'break-word',
        overflow: 'auto'
      }}>
        {!content ? (
          <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Thinking...</span>
        ) : isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                // Inline code
                code({ className, children, ...props }) {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontSize: '0.9em',
                        fontFamily: 'var(--font-mono)'
                      }} {...props}>
                        {children}
                      </code>
                    )
                  }
                  // Code block
                  return (
                    <pre style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'auto',
                      margin: '6px 0'
                    }}>
                      <code style={{
                        fontSize: '0.85em',
                        fontFamily: 'var(--font-mono)'
                      }} {...props}>
                        {children}
                      </code>
                    </pre>
                  )
                },
                // Links
                a({ children, ...props }) {
                  return (
                    <a style={{ color: isUser ? '#bfdbfe' : 'var(--accent)' }} {...props}>
                      {children}
                    </a>
                  )
                },
                // Paragraphs
                p({ children }) {
                  return <p style={{ margin: '4px 0' }}>{children}</p>
                },
                // Lists
                ul({ children }) {
                  return <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{children}</ul>
                },
                ol({ children }) {
                  return <ol style={{ margin: '4px 0', paddingLeft: 18 }}>{children}</ol>
                },
                // Headings
                h1({ children }) {
                  return <h1 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 4px' }}>{children}</h1>
                },
                h2({ children }) {
                  return <h2 style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px' }}>{children}</h2>
                },
                h3({ children }) {
                  return <h3 style={{ fontSize: 14, fontWeight: 600, margin: '6px 0 3px' }}>{children}</h3>
                },
                // Tables
                table({ children }) {
                  return (
                    <table style={{
                      borderCollapse: 'collapse',
                      margin: '6px 0',
                      fontSize: 12,
                      width: '100%'
                    }}>
                      {children}
                    </table>
                  )
                },
                th({ children }) {
                  return (
                    <th style={{
                      border: '1px solid var(--border)',
                      padding: '4px 8px',
                      background: 'rgba(255,255,255,0.05)',
                      fontWeight: 600,
                      textAlign: 'left'
                    }}>
                      {children}
                    </th>
                  )
                },
                td({ children }) {
                  return (
                    <td style={{
                      border: '1px solid var(--border)',
                      padding: '4px 8px'
                    }}>
                      {children}
                    </td>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
