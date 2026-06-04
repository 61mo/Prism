# 🔷 Prism

A modern multi-video player with AI chat, sync playback, speed control, and mobile remote control.

## Features

### 🎬 Video Playback
- Supports MP4, MOV, AVI, WMV, FLV, MKV, WebM, HEVC and 500+ formats
- Hardware-accelerated decoding via system WebView2
- Double-click or press F to toggle fullscreen

### ⚡ Speed Control
- 10 speed options: 0.25x, 0.5x, 0.75x, 0.9x, 1x, 1.25x, 1.5x, 2x, 3x, 6x
- Long-press `→` for temporary 3x speed (release to restore original speed)
- Short-press `→` / `←` to seek ±5 seconds

### 🔗 Multi-Video Sync
- Open 2+ videos simultaneously in grid layout
- Sync play/pause, speed, and progress across all videos
- Toggle progress bar sync on/off independently
- Custom layout editor: drag and resize each video freely

### 🤖 AI Chat
- Ask questions about the video in natural language
- AI automatically captures the current video frame for visual context
- Supports OpenAI, Anthropic, and compatible APIs (e.g., DeepSeek, Xiaomi Mimo)
- Streaming responses with Markdown and LaTeX math formula rendering
- Floating, draggable, resizable chat panel

### 📱 Mobile Remote Control
- Scan QR code to control playback from your phone
- Play/pause, seek ±5s/±30s, speed control
- No app installation required — works in mobile browser

### 💬 Subtitles
- Import SRT/VTT subtitle files
- Subtitles sync with video playback
- Export subtitles as SRT file

### 🎨 UI
- Apple-style liquid glass (glassmorphism) design
- Dark and Light theme
- Global volume bar with mouse wheel control

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `→` | Seek +5s (short) / 3x speed (long press) |
| `←` | Seek -5s |
| `M` | Mute / Unmute |
| `F` | Fullscreen / Exit fullscreen |
| `Ctrl+Shift+C` | Toggle AI Chat |
| `Ctrl+Shift+S` | Toggle Subtitle Panel |
| Mouse wheel | Volume ±2% |

## Requirements

- **OS**: Windows 10 / 11 (64-bit)
- **Runtime**: WebView2 (pre-installed on Windows 11, auto-installs on Windows 10)
- **AI features**: Requires an API key from OpenAI, Anthropic, or a compatible provider
- **Remote control**: Phone and computer must be on the same local network (same WiFi)

## Development

```bash
# Prerequisites
# - Node.js 18+
# - Rust toolchain (https://rustup.rs)
# - Visual Studio Build Tools with "C++ desktop development" workload

# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## Notes

- **Video format support**: Prism uses the system WebView2 for video decoding. Most common formats (MP4, MKV, MOV, AVI, FLV, WMV) are supported. For rare codecs, convert to MP4 (H.264) first.
- **AI Chat**: The AI sees the current video frame when you send a message. If the API does not support image input, the chat works in text-only mode automatically.
- **Remote control**: Both devices must be on the same WiFi/LAN network. If the connection fails, check your firewall settings and ensure port 18923 is not blocked.
- **Remote control QR code**: The QR code contains a local IP address (e.g., `192.168.x.x:18923`). This only works within your local network, not over the internet.
- **Subtitle generation**: AI subtitle generation is not included. Import external SRT/VTT files or create them manually.
- **Settings persistence**: All settings (API keys, theme, speed preferences) are saved locally in the browser's localStorage.

## License

MIT
