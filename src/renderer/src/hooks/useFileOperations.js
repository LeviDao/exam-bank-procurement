/**
 * useFileOperations.js
 * ────────────────────
 * React hook encapsulating the complete file I/O workflow.
 * Coordinates Open / Save / Save As / Close flows with IPC.
 *
 * RESPONSIBILITIES:
 * - Listen to menu events (Ctrl+S, Ctrl+Shift+S, close)
 * - Serialize data to the correct format (MD/CSV) based on file extension
 * - Manage `isModified` and `filePath` state
 * - Coordinate with useAutosave (cancel timer on save, flush before close)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { parseMarkdown, serializeMarkdown } from '../utils/markdownParser'
import { exportCSV, parseCSV } from '../utils/csvExporter'
import { useAutosave } from './useAutosave'

/**
 * Detect file type from extension.
 */
function getFileType(filePath) {
  if (!filePath) return 'md' // Default to markdown
  const ext = filePath.split('.').pop().toLowerCase()
  return ext === 'csv' ? 'csv' : 'md'
}

/**
 * Parse raw file content based on file type.
 */
function parseFileContent(content, filePath) {
  const type = getFileType(filePath)
  return type === 'csv' ? parseCSV(content) : parseMarkdown(content)
}

/**
 * Serialize questions to string based on file type.
 */
function serializeQuestions(questions, filePath) {
  const type = getFileType(filePath)
  return type === 'csv' ? exportCSV(questions) : serializeMarkdown(questions)
}

export function useFileOperations() {
  const [questions, setQuestions] = useState([])
  const [filePath, setFilePath] = useState(null)
  const [isModified, setIsModified] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Sẵn sàng')

  const questionsRef = useRef(questions)
  questionsRef.current = questions

  const { triggerAutosave, cancelAutosave, flushAutosave } = useAutosave()

  // ── Mark document as modified ──
  const markModified = useCallback(() => {
    if (!isModified) {
      setIsModified(true)
      window.electronAPI?.setModified(true)
    }
  }, [isModified])

  const markSaved = useCallback(() => {
    setIsModified(false)
    window.electronAPI?.setModified(false)
    cancelAutosave()
  }, [cancelAutosave])

  // ── Update questions (from table edits) ──
  const updateQuestions = useCallback((newQuestions) => {
    setQuestions(newQuestions)
    markModified()
    triggerAutosave(newQuestions)
  }, [markModified, triggerAutosave])

  // ── OPEN ──
  const handleOpen = useCallback(async () => {
    const result = await window.electronAPI?.openFile()
    if (!result) return // Canceled

    const parsed = parseFileContent(result.content, result.filePath)
    setQuestions(parsed)
    setFilePath(result.filePath)
    markSaved()
    setStatusMessage(`Đã mở: ${result.filePath} (${parsed.length} câu hỏi)`)
  }, [markSaved])

  // ── SAVE (Ctrl+S) ──
  const handleSave = useCallback(async () => {
    const content = serializeQuestions(questionsRef.current, filePath)
    const result = await window.electronAPI?.saveFile({ content, filePath })

    if (result?.success) {
      setFilePath(result.filePath)
      markSaved()
      setStatusMessage(`Đã lưu: ${result.filePath}`)
    }
    // If null → user canceled Save As dialog
  }, [filePath, markSaved])

  // ── SAVE AS (Ctrl+Shift+S) ──
  const handleSaveAs = useCallback(async () => {
    const content = serializeQuestions(questionsRef.current, filePath)
    const result = await window.electronAPI?.saveFileAs({
      content,
      defaultPath: filePath || undefined
    })

    if (result?.success) {
      // Re-serialize if extension changed (e.g. .md → .csv)
      if (getFileType(result.filePath) !== getFileType(filePath)) {
        const reContent = serializeQuestions(questionsRef.current, result.filePath)
        await window.electronAPI?.saveFile({ content: reContent, filePath: result.filePath })
      }

      setFilePath(result.filePath)
      markSaved()
      setStatusMessage(`Đã lưu: ${result.filePath}`)
    }
  }, [filePath, markSaved])

  // ── CLOSE with unsaved-changes check (PRD §5.4) ──
  const handleCloseRequested = useCallback(async () => {
    if (!isModified) {
      window.electronAPI?.forceClose()
      return
    }

    const choice = await window.electronAPI?.showUnsavedDialog()

    switch (choice) {
      case 0: // Save
        await handleSave()
        window.electronAPI?.forceClose()
        break
      case 1: // Don't Save
        cancelAutosave()
        window.electronAPI?.forceClose()
        break
      case 2: // Cancel
      default:
        // Do nothing — keep window open
        break
    }
  }, [isModified, handleSave, cancelAutosave])

  // ── Handle "Open in current window" after save check ──
  const handleOpenAfterSaveCheck = useCallback(async (pendingFilePath) => {
    if (isModified) {
      const choice = await window.electronAPI?.showUnsavedDialog()
      if (choice === 0) {
        await handleSave()
      } else if (choice === 2) {
        return // Cancel — abort open
      }
    }

    // Load the pending file
    try {
      const content = await window.electronAPI?.readFile(pendingFilePath)
      const parsed = parseFileContent(content, pendingFilePath)
      setQuestions(parsed)
      setFilePath(pendingFilePath)
      markSaved()
      window.electronAPI?.setFilePath(pendingFilePath)
      setStatusMessage(`Đã mở: ${pendingFilePath} (${parsed.length} câu hỏi)`)
    } catch (err) {
      setStatusMessage(`Lỗi: ${err.message}`)
    }
  }, [isModified, handleSave, markSaved])

  // ── Handle file loaded from main process (startup/recovery) ──
  const handleFileLoaded = useCallback((payload) => {
    const parsed = parseFileContent(payload.content, payload.filePath)
    setQuestions(parsed)
    setFilePath(payload.filePath)
    markSaved()
    setStatusMessage(`Đã mở: ${payload.filePath} (${parsed.length} câu hỏi)`)
  }, [markSaved])

  // ── Handle recovery data (PRD §5.3) ──
  const handleRecoveryFound = useCallback(async (recoveryItems) => {
    for (const item of recoveryItems) {
      const choice = await window.electronAPI?.showRecoveryDialog({
        filePath: item.filePath,
        recoveryTimestamp: item.timestamp
      })

      if (choice === 0) {
        // Recover
        setQuestions(item.data || [])
        setFilePath(item.filePath || null)
        markModified() // Data recovered but not yet saved to disk
        setStatusMessage(`Đã khôi phục ${(item.data || []).length} câu hỏi từ phiên trước`)
        break // Only recover one (SDI: one file per window)
      }
    }
    // Cleanup all recovery files
    await window.electronAPI?.deleteAllRecovery()
  }, [markModified])

  // ── Register IPC listeners ──
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    api.onMenuSave(handleSave)
    api.onMenuSaveAs(handleSaveAs)
    api.onCloseRequested(handleCloseRequested)
    api.onFileLoaded(handleFileLoaded)
    api.onFileOpenAfterSaveCheck(handleOpenAfterSaveCheck)
    api.onRecoveryFound(handleRecoveryFound)

    return () => {
      api.removeAllListeners('menu:save')
      api.removeAllListeners('menu:save-as')
      api.removeAllListeners('window:close-requested')
      api.removeAllListeners('file:loaded')
      api.removeAllListeners('file:open-after-save-check')
      api.removeAllListeners('recovery:found')
    }
  }, [handleSave, handleSaveAs, handleCloseRequested, handleFileLoaded, handleOpenAfterSaveCheck, handleRecoveryFound])

  return {
    // State
    questions,
    filePath,
    isModified,
    statusMessage,

    // Actions
    updateQuestions,
    handleOpen,
    handleSave,
    handleSaveAs,
    setStatusMessage
  }
}
