import { useCallback, useRef, useEffect } from 'react'

interface UseLongPressOptions {
  key: string
  thresholdMs?: number
  onShortPress?: () => void
  onLongPressStart?: () => void
  onLongPressEnd?: () => void
}

/**
 * Detects long press on a specific keyboard key.
 * - Key held < thresholdMs → triggers onShortPress
 * - Key held >= thresholdMs → triggers onLongPressStart (once), then onLongPressEnd on release
 *
 * Mimics bilibili's PC player behavior: short press = seek 5s, long press = temporary speed change.
 */
export function useLongPress({
  key,
  thresholdMs = 150,
  onShortPress,
  onLongPressStart,
  onLongPressEnd
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const longPressTriggeredRef = useRef(false)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== key) return
      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return
      }

      // event.repeat = true means the key is being held down
      if (event.repeat) {
        event.preventDefault()
        return
      }

      event.preventDefault()
      isLongPressRef.current = false
      longPressTriggeredRef.current = false

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        if (!longPressTriggeredRef.current) {
          longPressTriggeredRef.current = true
          onLongPressStart?.()
        }
      }, thresholdMs)
    },
    [key, thresholdMs, onLongPressStart]
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== key) return
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return
      }

      event.preventDefault()

      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      if (isLongPressRef.current) {
        onLongPressEnd?.()
      } else {
        onShortPress?.()
      }

      isLongPressRef.current = false
      longPressTriggeredRef.current = false
    },
    [key, onShortPress, onLongPressEnd]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [handleKeyDown, handleKeyUp])
}
