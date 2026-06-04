/**
 * Video Engine Abstraction Layer
 *
 * Provides a unified interface for video playback that can use either:
 * - HTML5 <video> element (for formats supported by Chromium)
 * - mpv.js (libmpv) for universal format support
 *
 * The VideoPlayer component uses this interface, making it easy to
 * switch engines or use a hybrid approach.
 */

export interface IVideoEngine {
  loadFile(filePath: string): Promise<void>
  play(): void
  pause(): void
  seek(time: number): void
  setSpeed(speed: number): void
  setVolume(volume: number): void
  setMuted(muted: boolean): void
  destroy(): void

  getCurrentTime(): number
  getDuration(): number
  isPlaying(): boolean
  isLoading(): boolean

  onEvent(event: string, callback: (...args: any[]) => void): void
  offEvent(event: string, callback: (...args: any[]) => void): void
}

/**
 * HTML5 Video engine implementation.
 * Handles formats supported by Chromium: MP4, WebM, OGG.
 */
export class HTML5VideoEngine implements IVideoEngine {
  private video: HTMLVideoElement
  private eventCallbacks: Map<string, Set<(...args: any[]) => void>> = new Map()

  constructor(canvasOrVideo: HTMLVideoElement) {
    this.video = canvasOrVideo

    // Forward native events
    const events = ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata', 'waiting', 'canplay', 'error']
    for (const evt of events) {
      this.video.addEventListener(evt, () => {
        this.emit(evt)
      })
    }
  }

  async loadFile(filePath: string): Promise<void> {
    this.video.src = filePath
    this.video.load()
  }

  play(): void { this.video.play() }
  pause(): void { this.video.pause() }

  seek(time: number): void {
    this.video.currentTime = Math.max(0, Math.min(time, this.video.duration || Infinity))
  }

  setSpeed(speed: number): void {
    // HTML5 video only supports positive playbackRate
    if (speed < 0) {
      // For negative speed, we'd need a seek loop — handled at the component level
      this.video.playbackRate = Math.abs(speed)
    } else {
      this.video.playbackRate = speed
    }
  }

  setVolume(volume: number): void { this.video.volume = volume / 100 }
  setMuted(muted: boolean): void { this.video.muted = muted }

  getCurrentTime(): number { return this.video.currentTime }
  getDuration(): number { return this.video.duration || 0 }
  isPlaying(): boolean { return !this.video.paused }
  isLoading(): boolean { return this.video.readyState < 3 }

  destroy(): void {
    this.video.pause()
    this.video.removeAttribute('src')
    this.video.load()
  }

  onEvent(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set())
    }
    this.eventCallbacks.get(event)!.add(callback)
  }

  offEvent(event: string, callback: (...args: any[]) => void): void {
    this.eventCallbacks.get(event)?.delete(callback)
  }

  private emit(event: string, ...args: any[]): void {
    this.eventCallbacks.get(event)?.forEach(cb => cb(...args))
  }

  getVideoElement(): HTMLVideoElement {
    return this.video
  }
}

/**
 * Create an appropriate video engine based on file format.
 *
 * Currently uses HTML5VideoEngine as the default.
 * mpv.js integration can be added by implementing IVideoEngine
 * with the mpv.js Node Addon.
 */
export function createVideoEngine(
  element: HTMLVideoElement,
  _filePath?: string
): IVideoEngine {
  // TODO: Add mpv.js engine detection based on file extension
  // const ext = _filePath?.split('.').pop()?.toLowerCase()
  // if (ext && ['avi', 'wmv', 'flv', 'rmvb'].includes(ext)) {
  //   return new MpvEngine(canvas)
  // }
  return new HTML5VideoEngine(element)
}

/**
 * MpvEngine placeholder — to be implemented with mpv.js Node Addon.
 *
 * mpv.js renders video frames to a canvas element via OpenGL.
 * API reference: https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst
 */
export class MpvEngine implements IVideoEngine {
  private mpv: any = null
  private canvas: HTMLCanvasElement | null = null
  private eventCallbacks: Map<string, Set<(...args: any[]) => void>> = new Map()
  private _currentTime = 0
  private _duration = 0
  private _playing = false
  private _loading = true
  private _speed = 1
  private _volume = 80
  private _muted = false
  private renderLoopId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async loadFile(filePath: string): Promise<void> {
    // When mpv.js is available:
    // const mpv = await import('mpv.js')
    // this.mpv = await mpv.create({
    //   'vo': 'opengl',
    //   'hwdec': 'auto',
    //   'wid': this.canvas?.id
    // })
    // await this.mpv.command('loadfile', filePath)

    console.log('[MpvEngine] mpv.js not yet integrated. Loading:', filePath)
    this._loading = false
    this.emit('loadedmetadata')
  }

  play(): void {
    if (this.mpv) {
      this.mpv.property('pause', false)
    }
    this._playing = true
    this.emit('play')
  }

  pause(): void {
    if (this.mpv) {
      this.mpv.property('pause', true)
    }
    this._playing = false
    this.emit('pause')
  }

  seek(time: number): void {
    if (this.mpv) {
      this.mpv.command('seek', time, 'absolute')
    }
    this._currentTime = time
  }

  setSpeed(speed: number): void {
    if (this.mpv) {
      this.mpv.property('speed', speed)
    }
    this._speed = speed
  }

  setVolume(volume: number): void {
    if (this.mpv) {
      this.mpv.property('volume', volume)
    }
    this._volume = volume
  }

  setMuted(muted: boolean): void {
    if (this.mpv) {
      this.mpv.property('mute', muted)
    }
    this._muted = muted
  }

  getCurrentTime(): number { return this._currentTime }
  getDuration(): number { return this._duration }
  isPlaying(): boolean { return this._playing }
  isLoading(): boolean { return this._loading }

  destroy(): void {
    if (this.renderLoopId) cancelAnimationFrame(this.renderLoopId)
    if (this.mpv) {
      this.mpv.command('quit')
      this.mpv = null
    }
  }

  onEvent(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set())
    }
    this.eventCallbacks.get(event)!.add(callback)
  }

  offEvent(event: string, callback: (...args: any[]) => void): void {
    this.eventCallbacks.get(event)?.delete(callback)
  }

  private emit(event: string, ...args: any[]): void {
    this.eventCallbacks.get(event)?.forEach(cb => cb(...args))
  }
}
