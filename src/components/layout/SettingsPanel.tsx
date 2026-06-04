import { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const settings = useSettingsStore(s => s.settings)
  const updateSettings = useSettingsStore(s => s.updateSettings)
  const resetSettings = useSettingsStore(s => s.resetSettings)

  const [localSettings, setLocalSettings] = useState({ ...settings })

  const handleSave = () => {
    updateSettings(localSettings)
    onClose()
  }

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      resetSettings()
      setLocalSettings({
        openaiApiKey: '',
        openaiBaseUrl: 'https://api.openai.com/v1',
        anthropicApiKey: '',
        anthropicBaseUrl: 'https://api.anthropic.com',
        defaultAiProvider: 'openai',
        defaultChatModel: 'gpt-4o',
        systemPrompt: 'You are an AI assistant helping a user who is watching a video. Answer concisely.',
        ffmpegPath: 'ffmpeg',
        theme: 'dark',
        defaultVolume: 80,
        defaultSpeed: 1,
        historyAutoSave: true
      })
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 520,
      maxHeight: '80vh',
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(var(--glass-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-blur))',
      border: 'var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: -1
        }}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>⚙️ Settings</h2>
        <button onClick={onClose} style={{
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
          fontSize: 16
        }}>
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* AI Provider Settings */}
        <Section title="🤖 AI Provider">
          <Field label="Default AI Provider">
            <select
              value={localSettings.defaultAiProvider}
              onChange={e => setLocalSettings(s => ({
                ...s,
                defaultAiProvider: e.target.value as 'openai' | 'anthropic',
                defaultChatModel: e.target.value === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-6'
              }))}
              style={selectStyle}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
            </select>
          </Field>

          <Field label="OpenAI API Key">
            <input
              type="password"
              value={localSettings.openaiApiKey}
              onChange={e => setLocalSettings(s => ({ ...s, openaiApiKey: e.target.value }))}
              placeholder="sk-..."
              style={inputStyle}
              onKeyDown={e => e.stopPropagation()}
            />
          </Field>

          <Field label="OpenAI Base URL">
            <input
              type="text"
              value={localSettings.openaiBaseUrl}
              onChange={e => setLocalSettings(s => ({ ...s, openaiBaseUrl: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              style={inputStyle}
              onKeyDown={e => e.stopPropagation()}
            />
            <Hint>Supports OpenAI-compatible APIs (Ollama, LM Studio, DeepSeek, etc.)</Hint>
          </Field>

          <Field label="Anthropic API Key">
            <input
              type="password"
              value={localSettings.anthropicApiKey}
              onChange={e => setLocalSettings(s => ({ ...s, anthropicApiKey: e.target.value }))}
              placeholder="sk-ant-..."
              style={inputStyle}
              onKeyDown={e => e.stopPropagation()}
            />
          </Field>

          <Field label="Anthropic Base URL">
            <input
              type="text"
              value={localSettings.anthropicBaseUrl}
              onChange={e => setLocalSettings(s => ({ ...s, anthropicBaseUrl: e.target.value }))}
              placeholder="https://api.anthropic.com"
              style={inputStyle}
              onKeyDown={e => e.stopPropagation()}
            />
          </Field>

          <Field label="Chat Model">
            <input
              type="text"
              value={localSettings.defaultChatModel}
              onChange={e => setLocalSettings(s => ({ ...s, defaultChatModel: e.target.value }))}
              style={inputStyle}
              onKeyDown={e => e.stopPropagation()}
            />
            <Hint>e.g., gpt-4o, gpt-4o-mini, claude-sonnet-4-6, deepseek-chat, llama3</Hint>
          </Field>

          <Field label="System Prompt">
            <textarea
              value={localSettings.systemPrompt}
              onChange={e => setLocalSettings(s => ({ ...s, systemPrompt: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              onKeyDown={e => e.stopPropagation()}
            />
            <Hint>Base instructions for the AI. Video context (title, timestamp, subtitles) is appended automatically.</Hint>
          </Field>
        </Section>

        {/* Playback Settings */}
        <Section title="🎬 Playback">
          <Field label="Default Volume">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min="0"
                max="100"
                value={localSettings.defaultVolume}
                onChange={e => setLocalSettings(s => ({ ...s, defaultVolume: parseInt(e.target.value) }))}
                className="volume-slider"
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 30 }}>{localSettings.defaultVolume}%</span>
            </div>
          </Field>

          <Field label="Default Speed">
            <select
              value={localSettings.defaultSpeed}
              onChange={e => setLocalSettings(s => ({ ...s, defaultSpeed: parseFloat(e.target.value) }))}
              style={selectStyle}
            >
              {[0.25, 0.5, 0.75, 0.9, 1, 1.25, 1.5, 2, 3, 6].map(s => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
          </Field>

        </Section>

        {/* Appearance */}
        <Section title="🎨 Appearance">
          <Field label="Theme">
            <select
              value={localSettings.theme}
              onChange={e => setLocalSettings(s => ({ ...s, theme: e.target.value as 'dark' | 'light' }))}
              style={selectStyle}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </Field>
        </Section>

        {/* History */}
        <Section title="📋 History">
          <Field label="Auto-save watch history">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localSettings.historyAutoSave}
                onChange={e => setLocalSettings(s => ({ ...s, historyAutoSave: e.target.checked }))}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: 13 }}>Automatically save watched videos to history</span>
            </label>
          </Field>
        </Section>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <button
          onClick={handleReset}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            color: 'var(--danger)',
            background: 'transparent'
          }}
        >
          Reset Defaults
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              background: 'var(--bg-tertiary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              background: 'var(--accent)'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
      {children}
    </p>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontSize: 13,
  fontFamily: 'var(--font-mono)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)'
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 13,
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)'
}
