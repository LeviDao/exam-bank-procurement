/**
 * useAutosave.js
 * ──────────────
 * React hook that implements the debounced autosave mechanism (PRD §5.2).
 *
 * HOW IT WORKS:
 * 1. Renderer calls `triggerAutosave(questions)` whenever data changes.
 * 2. A 10-second debounce timer starts (or resets if already running).
 * 3. After 10s of inactivity, recovery data is written to disk via IPC.
 * 4. The recovery file is auto-deleted by main process when user
 *    explicitly saves (Ctrl+S / Save As).
 *
 * USAGE:
 *   const { triggerAutosave, cancelAutosave } = useAutosave()
 *
 *   // In your data-change handler:
 *   function onTableDataChange(newQuestions) {
 *     setQuestions(newQuestions)
 *     triggerAutosave(newQuestions)
 *   }
 */

import { useRef, useCallback, useEffect } from 'react'

const AUTOSAVE_DELAY_MS = 10_000 // 10 seconds (PRD §5.2)

export function useAutosave() {
  const timerRef = useRef(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  /**
   * Schedule a recovery save after 10s of inactivity.
   * Resets the timer on each call (debounce behavior).
   *
   * @param {Array<{stt: number, content: string, options: string[], answer: string, tags: string}>} questions
   */
  const triggerAutosave = useCallback((questions) => {
    // Reset existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return

      try {
        // Tell main process to mark window as modified (PRD §5.1)
        window.electronAPI?.setModified(true)

        // Write recovery data via IPC
        await window.electronAPI?.saveRecovery({ data: questions })
        console.debug('[Autosave] Recovery data saved.')
      } catch (err) {
        console.error('[Autosave] Failed:', err)
      }
    }, AUTOSAVE_DELAY_MS)
  }, [])

  /**
   * Cancel any pending autosave timer.
   * Call this when the user explicitly saves or discards changes.
   */
  const cancelAutosave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /**
   * Force an immediate save (bypass debounce).
   * Useful before window close when user has unsaved data.
   */
  const flushAutosave = useCallback(async (questions) => {
    cancelAutosave()

    if (!questions || questions.length === 0) return

    try {
      await window.electronAPI?.saveRecovery({ data: questions })
      console.debug('[Autosave] Flushed recovery data.')
    } catch (err) {
      console.error('[Autosave] Flush failed:', err)
    }
  }, [cancelAutosave])

  return { triggerAutosave, cancelAutosave, flushAutosave }
}
