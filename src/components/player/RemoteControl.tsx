import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { invoke } from '@tauri-apps/api/core'
import QRCode from 'qrcode'

interface RemoteControlProps {
  onCommand: (action: string, value?: number) => void
}

export function RemoteControl({ onCommand }: RemoteControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startServer = useCallback(async () => {
    try {
      const serverUrl = await invoke<string>('start_remote_server')
      setUrl(serverUrl)
      // Generate real QR code
      const qr = await QRCode.toDataURL(serverUrl, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      })
      setQrDataUrl(qr)
      startPolling()
    } catch (err: any) {
      setError(String(err) || 'Failed to start remote server')
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const cmds = await invoke<Array<{ action: string; value?: number }>>('get_remote_commands')
        for (const cmd of cmds) {
          onCommand(cmd.action, cmd.value)
        }
      } catch {
        // Ignore polling errors
      }
    }, 200)
  }, [onCommand])

  useEffect(() => {
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [])

  const handleClick = () => {
    if (!url) startServer()
    setIsOpen(!isOpen)
  }

  return (
    <>
      <button
        onClick={handleClick}
        title="Remote Control (QR Code)"
        style={{
          padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 16,
          color: isOpen ? 'var(--accent)' : 'var(--text-secondary)',
          background: isOpen ? 'var(--accent-subtle)' : 'transparent',
          border: 'none', cursor: 'pointer', minWidth: 32
        }}
      >
        📱
      </button>

      {isOpen && createPortal(
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: 'var(--glass-border)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
            padding: 24, zIndex: 9999, textAlign: 'center', minWidth: 280
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📱 Remote Control</h3>

            {error ? (
              <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>
            ) : url ? (
              <>
                <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 8 }} />
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '12px 0 4px', fontFamily: 'var(--font-mono)', userSelect: 'all' }}>
                  {url}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  Scan QR code or open URL on your phone
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Starting server...</p>
            )}

            <button onClick={() => setIsOpen(false)} style={{
              marginTop: 16, padding: '6px 20px', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600
            }}>Close</button>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
