import type { SubtitleCue } from '../types'

export function parseSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  const blocks = content.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    const index = parseInt(lines[0], 10)
    if (isNaN(index)) continue

    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    )

    if (!timeMatch) continue

    const startMs =
      parseInt(timeMatch[1]) * 3600000 +
      parseInt(timeMatch[2]) * 60000 +
      parseInt(timeMatch[3]) * 1000 +
      parseInt(timeMatch[4])

    const endMs =
      parseInt(timeMatch[5]) * 3600000 +
      parseInt(timeMatch[6]) * 60000 +
      parseInt(timeMatch[7]) * 1000 +
      parseInt(timeMatch[8])

    const text = lines.slice(2).join('\n').trim()

    cues.push({ index, startMs, endMs, text })
  }

  return cues
}

export function parseVTT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []

  // Remove WEBVTT header
  const body = content.replace(/^WEBVTT.*\n/, '').trim()
  const blocks = body.split(/\n\s*\n/)

  let cueIndex = 0
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) continue

    // VTT can have optional cue identifier
    let timeLine = lines[0]
    let textStart = 1

    if (timeLine.includes('-->')) {
      // First line is the timestamp
    } else if (lines.length > 1 && lines[1].includes('-->')) {
      timeLine = lines[1]
      textStart = 2
    } else {
      continue
    }

    const timeMatch = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    )

    if (!timeMatch) continue

    const startMs =
      parseInt(timeMatch[1]) * 3600000 +
      parseInt(timeMatch[2]) * 60000 +
      parseInt(timeMatch[3]) * 1000 +
      parseInt(timeMatch[4])

    const endMs =
      parseInt(timeMatch[5]) * 3600000 +
      parseInt(timeMatch[6]) * 60000 +
      parseInt(timeMatch[7]) * 1000 +
      parseInt(timeMatch[8])

    // Remove VTT tags like <v>, <c>, etc.
    const text = lines.slice(textStart).join('\n').replace(/<[^>]+>/g, '').trim()

    cueIndex++
    cues.push({ index: cueIndex, startMs, endMs, text })
  }

  return cues
}

export function parseSubtitleFile(content: string, fileName: string): SubtitleCue[] {
  if (fileName.endsWith('.vtt') || content.startsWith('WEBVTT')) {
    return parseVTT(content)
  }
  return parseSRT(content)
}

export function getActiveCues(cues: SubtitleCue[], currentTimeMs: number): SubtitleCue[] {
  return cues.filter(cue => currentTimeMs >= cue.startMs && currentTimeMs <= cue.endMs)
}

export function cuesToSRT(cues: SubtitleCue[]): string {
  return cues.map((cue, i) => {
    const startTime = formatSRTTime(cue.startMs / 1000)
    const endTime = formatSRTTime(cue.endMs / 1000)
    return `${i + 1}\n${startTime} --> ${endTime}\n${cue.text}\n`
  }).join('\n')
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}
