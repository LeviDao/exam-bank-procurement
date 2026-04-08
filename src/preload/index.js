import { contextBridge, ipcRenderer } from 'electron'

/**
 * Preload script — exposes a sandboxed API to the renderer via contextBridge.
 *
 * SECURITY:
 * - No direct access to Node.js modules from the renderer.
 * - Only whitelisted IPC channels are exposed.
 * - All file I/O happens in the main process.
 */
contextBridge.exposeInMainWorld('electronAPI', {

  // ═══════════════════════════════════════════
  //  FILE OPERATIONS
  // ═══════════════════════════════════════════

  /**
   * Open file picker → read file → returns { filePath, content, lastModified } or null.
   */
  openFile: () => ipcRenderer.invoke('dialog:openFile'),

  /**
   * Read a file by path. Returns content string.
   */
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),

  /**
   * Save content to the current file (or trigger Save As if no path).
   * @param {{ content: string, filePath?: string }} payload
   * @returns {Promise<{ success: boolean, filePath: string } | null>}
   */
  saveFile: ({ content, filePath }) =>
    ipcRenderer.invoke('file:save', { content, filePath }),

  /**
   * Always show Save As dialog.
   * @param {{ content: string, defaultPath?: string }} payload
   * @returns {Promise<{ success: boolean, filePath: string } | null>}
   */
  saveFileAs: ({ content, defaultPath }) =>
    ipcRenderer.invoke('file:saveAs', { content, defaultPath }),

  /**
   * Get the last-modified timestamp (ms) of a file on disk.
   * Used for recovery comparison (PRD §5.3).
   */
  getFileModifiedTime: (filePath) =>
    ipcRenderer.invoke('file:getModifiedTime', filePath),

  // ═══════════════════════════════════════════
  //  WINDOW STATE (SDI)
  // ═══════════════════════════════════════════

  /**
   * Tell main process that the document has unsaved changes.
   * Main process will update the title bar with/without asterisk (PRD §5.1).
   */
  setModified: (isModified) =>
    ipcRenderer.send('window:set-modified', isModified),

  /**
   * Override window title (rarely used — main auto-manages title).
   */
  setTitle: (title) =>
    ipcRenderer.send('window:set-title', title),

  /**
   * Close window bypassing the unsaved-changes guard.
   */
  forceClose: () =>
    ipcRenderer.send('window:force-close'),

  /**
   * Open a new SDI window, optionally with a file.
   */
  openNewWindow: (filePath) =>
    ipcRenderer.send('window:open-new', filePath),

  /**
   * Get current window state { filePath, isModified }.
   */
  getWindowState: () =>
    ipcRenderer.invoke('window:get-state'),

  /**
   * Update the filePath associated with this window.
   */
  setFilePath: (filePath) =>
    ipcRenderer.send('window:set-file-path', filePath),

  // ═══════════════════════════════════════════
  //  RECOVERY / AUTOSAVE (PRD §5.2)
  // ═══════════════════════════════════════════

  /**
   * Save recovery data (called by debounced autosave).
   * Main process auto-attaches filePath from window state.
   * @param {{ data: Question[] }} payload
   */
  saveRecovery: ({ data }) =>
    ipcRenderer.invoke('recovery:save', { data }),

  /**
   * Delete recovery file for this window (after explicit save).
   */
  deleteRecovery: () =>
    ipcRenderer.invoke('recovery:delete'),

  /**
   * Delete ALL recovery files (after user dismisses recovery on startup).
   */
  deleteAllRecovery: () =>
    ipcRenderer.invoke('recovery:deleteAll'),

  // ═══════════════════════════════════════════
  //  DIALOGS
  // ═══════════════════════════════════════════

  /**
   * Show 3-button unsaved changes dialog (PRD §5.4).
   * Returns: 0 = Save, 1 = Don't Save, 2 = Cancel
   */
  showUnsavedDialog: () =>
    ipcRenderer.invoke('dialog:unsaved-changes'),

  /**
   * Generic confirmation dialog.
   * Returns: 0 = OK, 1 = Cancel
   */
  confirmDialog: (message, title) =>
    ipcRenderer.invoke('dialog:confirm', message, title),

  /**
   * Show recovery dialog on startup (PRD §5.3).
   * Returns: 0 = Recover, 1 = Skip
   */
  showRecoveryDialog: ({ filePath, recoveryTimestamp }) =>
    ipcRenderer.invoke('dialog:recovery', { filePath, recoveryTimestamp }),

  // ═══════════════════════════════════════════
  //  MENU & EVENT LISTENERS
  //  (Main → Renderer one-way events)
  // ═══════════════════════════════════════════

  // File events
  onFileLoaded: (callback) =>
    ipcRenderer.on('file:loaded', (_, payload) => callback(payload)),
  onFileOpenAfterSaveCheck: (callback) =>
    ipcRenderer.on('file:open-after-save-check', (_, filePath) => callback(filePath)),

  // Menu shortcuts
  onMenuSave: (callback) =>
    ipcRenderer.on('menu:save', () => callback()),
  onMenuSaveAs: (callback) =>
    ipcRenderer.on('menu:save-as', () => callback()),
  onMenuUndo: (callback) =>
    ipcRenderer.on('menu:undo', () => callback()),
  onMenuRedo: (callback) =>
    ipcRenderer.on('menu:redo', () => callback()),
  onMenuHelp: (callback) =>
    ipcRenderer.on('menu:help', () => callback()),
  onMenuAbout: (callback) =>
    ipcRenderer.on('menu:about', () => callback()),

  // Window lifecycle
  onCloseRequested: (callback) =>
    ipcRenderer.on('window:close-requested', () => callback()),

  // Recovery
  onRecoveryFound: (callback) =>
    ipcRenderer.on('recovery:found', (_, data) => callback(data)),

  // ═══════════════════════════════════════════
  //  LISTENER CLEANUP
  // ═══════════════════════════════════════════

  /**
   * Remove all listeners for a channel. Call in useEffect cleanup.
   */
  removeAllListeners: (channel) =>
    ipcRenderer.removeAllListeners(channel)
})
