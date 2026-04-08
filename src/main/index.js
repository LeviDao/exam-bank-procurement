import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import fs from 'fs'
import path from 'path'
import os from 'os'

// ═══════════════════════════════════════════════
//  SDI WINDOW STATE
// ═══════════════════════════════════════════════

/**
 * Per-window state tracked by the main process.
 * @type {Map<string, { filePath: string|null, isModified: boolean }>}
 */
const windows = new Map()

// ═══════════════════════════════════════════════
//  RECOVERY PATHS  (PRD §5.2)
//   Windows:  %APPDATA%\ExamBankManager\
//   macOS:    ~/Library/Application Support/ExamBankManager/
//   Linux:    ~/.config/ExamBankManager/
// ═══════════════════════════════════════════════

function getAppDataDir() {
  let base
  if (process.platform === 'win32') {
    base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
  } else if (process.platform === 'darwin') {
    base = path.join(os.homedir(), 'Library', 'Application Support')
  } else {
    base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
  }
  return path.join(base, 'ExamBankManager')
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function getRecoveryDir() {
  const dir = getAppDataDir()
  ensureDir(dir)
  return dir
}

function getRecoveryPath(windowId) {
  return path.join(getRecoveryDir(), `recovery_${windowId}.json`)
}

// ═══════════════════════════════════════════════
//  WINDOW TITLE HELPERS  (PRD §5.1)
// ═══════════════════════════════════════════════

function formatTitle(filePath, isModified) {
  const name = filePath ? path.basename(filePath) : 'Untitled'
  const marker = isModified ? ' *' : ''
  return `${name}${marker} — Exam Bank Manager`
}

function updateWindowTitle(win) {
  const windowId = win.id.toString()
  const state = windows.get(windowId)
  if (!state) return
  win.setTitle(formatTitle(state.filePath, state.isModified))
}

// ═══════════════════════════════════════════════
//  WINDOW CREATION  (SDI — PRD §3.1)
// ═══════════════════════════════════════════════

function createWindow(filePath = null) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: formatTitle(filePath, false),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const windowId = win.id.toString()
  windows.set(windowId, { filePath, isModified: false })

  // ── Show & load file if provided ──
  win.on('ready-to-show', () => {
    win.show()
    if (filePath) {
      loadFileIntoWindow(win, filePath)
    }
  })

  // ── Close guard: check for unsaved changes (PRD §5.4) ──
  win.on('close', (e) => {
    const state = windows.get(windowId)
    if (state && state.isModified) {
      e.preventDefault()
      win.webContents.send('window:close-requested')
    }
  })

  // ── Cleanup on close ──
  win.on('closed', () => {
    // Remove recovery file on normal close
    try {
      const recoveryPath = getRecoveryPath(windowId)
      if (fs.existsSync(recoveryPath)) fs.unlinkSync(recoveryPath)
    } catch { /* ignore cleanup errors */ }
    windows.delete(windowId)
  })

  // ── Load renderer ──
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

/**
 * Read a file and send its content + metadata to the renderer.
 */
async function loadFileIntoWindow(win, filePath) {
  const windowId = win.id.toString()
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const stat = fs.statSync(filePath)

    // Update window state
    const state = windows.get(windowId)
    if (state) {
      state.filePath = filePath
      state.isModified = false
    }
    updateWindowTitle(win)

    // Send to renderer
    win.webContents.send('file:loaded', {
      filePath,
      content,
      lastModified: stat.mtimeMs
    })
  } catch (err) {
    dialog.showErrorBox('Lỗi mở file', `Không thể đọc file:\n${filePath}\n\n${err.message}`)
  }
}

// ═══════════════════════════════════════════════
//  NATIVE MENU  (PRD §3.2)
// ═══════════════════════════════════════════════

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow()
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: async (_, win) => {
            if (!win) return
            await handleOpenFile(win, false)
          }
        },
        {
          label: 'Open in New Window',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async (_, win) => {
            if (!win) return
            await handleOpenFile(win, true)
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: (_, win) => {
            if (win) win.webContents.send('menu:save')
          }
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: (_, win) => {
            if (win) win.webContents.send('menu:save-as')
          }
        },
        { type: 'separator' },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click: (_, win) => { if (win) win.close() }
        },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: (_, win) => win?.webContents.send('menu:undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: (_, win) => win?.webContents.send('menu:redo') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Hướng dẫn', accelerator: 'F1', click: (_, win) => win?.webContents.send('menu:help') },
        { label: 'Giới thiệu', click: (_, win) => win?.webContents.send('menu:about') }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}

/**
 * Handle File → Open / Open in New Window.
 * Main process owns the dialog to avoid extra IPC round-trips.
 */
async function handleOpenFile(currentWin, inNewWindow) {
  const result = await dialog.showOpenDialog(currentWin, {
    properties: ['openFile'],
    filters: [
      { name: 'Exam Files', extensions: ['md', 'csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) return

  const filePath = result.filePaths[0]

  if (inNewWindow) {
    // Open in new SDI window
    createWindow(filePath)
  } else {
    // Open in current window — check for unsaved changes first
    const windowId = currentWin.id.toString()
    const state = windows.get(windowId)

    if (state && state.isModified) {
      // Ask renderer to handle unsaved-changes flow, then load file
      currentWin.webContents.send('file:open-after-save-check', filePath)
    } else {
      loadFileIntoWindow(currentWin, filePath)
    }
  }
}

// ═══════════════════════════════════════════════
//  APP LIFECYCLE
// ═══════════════════════════════════════════════

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildMenu())

  // ── Recovery check on startup (PRD §5.3) ──
  const recoveryDir = getRecoveryDir()
  let recoveryFiles = []
  try {
    recoveryFiles = fs.readdirSync(recoveryDir)
      .filter(f => f.startsWith('recovery_') && f.endsWith('.json'))
  } catch { /* dir might not exist yet */ }

  if (recoveryFiles.length > 0) {
    const win = createWindow()
    win.webContents.once('did-finish-load', () => {
      const recoveryData = []
      for (const f of recoveryFiles) {
        try {
          const raw = fs.readFileSync(path.join(recoveryDir, f), 'utf-8')
          const parsed = JSON.parse(raw)
          recoveryData.push({ file: f, ...parsed })
        } catch {
          // Corrupt recovery file — skip it
        }
      }
      if (recoveryData.length > 0) {
        win.webContents.send('recovery:found', recoveryData)
      }
    })
  } else {
    createWindow()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// PRD §5.4: On quit, check all windows sequentially
app.on('before-quit', (e) => {
  const allWindows = BrowserWindow.getAllWindows()
  const hasUnsaved = allWindows.some(win => {
    const state = windows.get(win.id.toString())
    return state && state.isModified
  })
  if (hasUnsaved) {
    // Let the close handlers on each window deal with it individually
    // (each will fire 'close' event → close guard above)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ═══════════════════════════════════════════════
//  IPC HANDLERS — FILE OPERATIONS
// ═══════════════════════════════════════════════

/**
 * dialog:openFile
 * Opens a file picker dialog. Returns { filePath, content } or null.
 */
ipcMain.handle('dialog:openFile', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Exam Files', extensions: ['md', 'csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled || result.filePaths.length === 0) return null

  const filePath = result.filePaths[0]
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const stat = fs.statSync(filePath)

    // Update window state
    const windowId = win.id.toString()
    const state = windows.get(windowId)
    if (state) {
      state.filePath = filePath
      state.isModified = false
    }
    updateWindowTitle(win)

    return { filePath, content, lastModified: stat.mtimeMs }
  } catch (err) {
    dialog.showErrorBox('Lỗi', `Không thể đọc file: ${err.message}`)
    return null
  }
})

/**
 * file:read
 * Read a file by path. Returns content string.
 */
ipcMain.handle('file:read', async (_, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (err) {
    throw new Error(`Không thể đọc file: ${err.message}`)
  }
})

/**
 * file:save
 * Save content to the current file path. If no path exists, trigger Save As.
 * Returns { success, filePath } or null if canceled.
 */
ipcMain.handle('file:save', async (event, { content, filePath }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const windowId = win.id.toString()
  const state = windows.get(windowId)

  // Determine target path
  let targetPath = filePath || (state && state.filePath)

  // No existing path → Save As
  if (!targetPath) {
    const result = await dialog.showSaveDialog(win, {
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'CSV', extensions: ['csv'] }
      ]
    })
    if (result.canceled) return null
    targetPath = result.filePath
  }

  try {
    fs.writeFileSync(targetPath, content, 'utf-8')

    // Update state
    if (state) {
      state.filePath = targetPath
      state.isModified = false
    }
    updateWindowTitle(win)

    // PRD §5.2: Delete recovery file after explicit save
    try {
      const recoveryPath = getRecoveryPath(windowId)
      if (fs.existsSync(recoveryPath)) fs.unlinkSync(recoveryPath)
    } catch { /* ignore */ }

    return { success: true, filePath: targetPath }
  } catch (err) {
    dialog.showErrorBox('Lỗi lưu file', err.message)
    return null
  }
})

/**
 * file:saveAs
 * Always shows Save As dialog. Returns { success, filePath } or null.
 */
ipcMain.handle('file:saveAs', async (event, { content, defaultPath }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const windowId = win.id.toString()
  const state = windows.get(windowId)

  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultPath || undefined,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'CSV', extensions: ['csv'] }
    ]
  })

  if (result.canceled) return null

  try {
    fs.writeFileSync(result.filePath, content, 'utf-8')

    // Update state
    if (state) {
      state.filePath = result.filePath
      state.isModified = false
    }
    updateWindowTitle(win)

    // PRD §5.2: Delete recovery file after explicit save
    try {
      const recoveryPath = getRecoveryPath(windowId)
      if (fs.existsSync(recoveryPath)) fs.unlinkSync(recoveryPath)
    } catch { /* ignore */ }

    return { success: true, filePath: result.filePath }
  } catch (err) {
    dialog.showErrorBox('Lỗi lưu file', err.message)
    return null
  }
})

/**
 * file:getModifiedTime
 * Get the last-modified timestamp of a file on disk.
 * Used by recovery logic (PRD §5.3) to compare with recovery timestamp.
 */
ipcMain.handle('file:getModifiedTime', async (_, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null
    const stat = fs.statSync(filePath)
    return stat.mtimeMs
  } catch {
    return null
  }
})

// ═══════════════════════════════════════════════
//  IPC HANDLERS — WINDOW STATE (SDI)
// ═══════════════════════════════════════════════

/**
 * window:set-modified
 * Renderer tells main process that document has unsaved changes.
 * Updates window title with/without the asterisk marker (PRD §5.1).
 */
ipcMain.on('window:set-modified', (event, isModified) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  const windowId = win.id.toString()
  const state = windows.get(windowId)
  if (state) {
    state.isModified = isModified
    updateWindowTitle(win)
  }
})

ipcMain.on('window:set-title', (event, title) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.setTitle(title)
})

/**
 * window:force-close
 * Close the window without the unsaved-changes guard.
 * Called by renderer after user chooses "Don't Save" or has already saved.
 */
ipcMain.on('window:force-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  const windowId = win.id.toString()
  const state = windows.get(windowId)
  if (state) state.isModified = false // Bypass close guard
  win.close()
})

/**
 * window:open-new
 * Create a new SDI window, optionally with a file.
 */
ipcMain.on('window:open-new', (_, filePath) => {
  createWindow(filePath || null)
})

/**
 * window:get-state
 * Renderer queries current window state (filePath, isModified).
 */
ipcMain.handle('window:get-state', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return null
  const windowId = win.id.toString()
  return windows.get(windowId) || null
})

/**
 * window:set-file-path
 * Update the filePath associated with this window.
 */
ipcMain.on('window:set-file-path', (event, filePath) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  const windowId = win.id.toString()
  const state = windows.get(windowId)
  if (state) {
    state.filePath = filePath
    updateWindowTitle(win)
  }
})

// ═══════════════════════════════════════════════
//  IPC HANDLERS — RECOVERY / AUTOSAVE (PRD §5.2)
// ═══════════════════════════════════════════════

/**
 * recovery:save
 * Write recovery data to disk. Called by the debounced autosave in renderer.
 *
 * Recovery file structure (PRD §5.2):
 * {
 *   filePath: string | null,    // Path to the original file (if any)
 *   data: Question[],           // Full table data as array of objects
 *   timestamp: number           // Date.now() epoch ms
 * }
 */
ipcMain.handle('recovery:save', async (event, { data }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return false
  const windowId = win.id.toString()
  const state = windows.get(windowId)

  const payload = {
    filePath: state ? state.filePath : null,
    data,
    timestamp: Date.now()
  }

  try {
    const recoveryPath = getRecoveryPath(windowId)
    ensureDir(path.dirname(recoveryPath))
    fs.writeFileSync(recoveryPath, JSON.stringify(payload, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('[Recovery] Write failed:', err.message)
    return false
  }
})

/**
 * recovery:delete
 * Remove the recovery file for the current window.
 * Called after user explicitly saves (Ctrl+S / Save As).
 */
ipcMain.handle('recovery:delete', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return false
  const windowId = win.id.toString()
  try {
    const recoveryPath = getRecoveryPath(windowId)
    if (fs.existsSync(recoveryPath)) fs.unlinkSync(recoveryPath)
    return true
  } catch {
    return false
  }
})

/**
 * recovery:deleteAll
 * Remove ALL recovery files. Called when user dismisses recovery dialog.
 */
ipcMain.handle('recovery:deleteAll', async () => {
  try {
    const dir = getRecoveryDir()
    const files = fs.readdirSync(dir).filter(f => f.startsWith('recovery_') && f.endsWith('.json'))
    for (const f of files) {
      fs.unlinkSync(path.join(dir, f))
    }
    return true
  } catch {
    return false
  }
})

// ═══════════════════════════════════════════════
//  IPC HANDLERS — DIALOGS
// ═══════════════════════════════════════════════

/**
 * dialog:unsaved-changes
 * Show 3-button dialog for unsaved changes (PRD §5.4):
 * Returns: 0 = Lưu (Save), 1 = Không lưu (Don't Save), 2 = Hủy (Cancel)
 */
ipcMain.handle('dialog:unsaved-changes', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const windowId = win.id.toString()
  const state = windows.get(windowId)
  const fileName = state?.filePath ? path.basename(state.filePath) : 'Untitled'

  const result = await dialog.showMessageBox(win, {
    type: 'warning',
    title: 'Thay đổi chưa được lưu',
    message: `"${fileName}" có thay đổi chưa được lưu.\nBạn muốn lưu trước khi đóng?`,
    buttons: ['Lưu', 'Không lưu', 'Hủy'],
    defaultId: 0,
    cancelId: 2,
    noLink: true
  })
  return result.response
})

/**
 * dialog:confirm
 * Generic confirmation dialog.
 */
ipcMain.handle('dialog:confirm', async (event, message, title = 'Xác nhận') => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showMessageBox(win, {
    type: 'question',
    title,
    message,
    buttons: ['OK', 'Hủy'],
    defaultId: 0,
    cancelId: 1
  })
  return result.response // 0 = OK, 1 = Cancel
})

/**
 * dialog:recovery
 * Show recovery dialog on startup (PRD §5.3).
 * Returns: 0 = Khôi phục, 1 = Bỏ qua
 */
ipcMain.handle('dialog:recovery', async (event, { filePath, recoveryTimestamp }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const fileName = filePath ? path.basename(filePath) : 'file chưa lưu'

  let extraInfo = ''

  if (filePath && fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath)
    if (stat.mtimeMs > recoveryTimestamp) {
      extraInfo = '\n\n⚠️ File gốc đã thay đổi sau khi crash. Khôi phục sẽ ghi đè.'
    }
  } else if (filePath) {
    extraInfo = '\n\nFile gốc không còn tồn tại. Bạn sẽ cần lưu thành file mới (Save As).'
  }

  const result = await dialog.showMessageBox(win, {
    type: 'info',
    title: 'Phục hồi dữ liệu',
    message: `Phát hiện dữ liệu chưa lưu từ phiên trước cho "${fileName}".${extraInfo}\n\nBạn muốn khôi phục?`,
    buttons: ['Khôi phục', 'Bỏ qua'],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  })
  return result.response // 0 = Recover, 1 = Skip
})
