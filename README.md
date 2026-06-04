# 🔷 Prism

A modern multi-video player with AI chat, sync playback, speed control, and mobile remote control.

## Features

- **Multi-format playback** — MP4, MOV, AVI, WMV, FLV, MKV, WebM and more
- **Sync playback** — Play 2+ videos simultaneously with synced speed, play/pause, and progress
- **Speed control** — 0.25x to 6x, long-press → for 3x temporary speed (bilibili-style)
- **AI Chat** — Ask questions about the video, AI sees the current frame automatically
- **Mobile remote control** — Scan QR code to control playback from your phone
- **Subtitle support** — Import SRT/VTT files, synced with video
- **Glass UI** — Apple-style liquid glass design with dark/light themes

## Tech Stack

- **Framework**: Tauri v2 (Rust backend + WebView frontend)
- **UI**: React 19 + TypeScript + Zustand
- **AI**: OpenAI / Anthropic compatible API (user provides API key)
- **Styling**: CSS variables, glassmorphism

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## Building

Requires:
- Node.js 18+
- Rust toolchain
- Visual Studio Build Tools (Windows)

## Configuration

Open Settings (⚙️) to configure:
- AI API Key and Base URL
- Chat Model
- System Prompt
- Theme (Dark/Light)

## License

MIT
