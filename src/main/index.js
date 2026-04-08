import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import fs from 'fs'
import path from 'path'

// ── SDI: Track all open windows ──
const windows = new Map() // windowId → { filePath, isModified }

function getRecoveryDir() {
  const appData = process.env.APPDATA
    || (process.platform === 'darwin'
      ? path.join(require('os').homedir(), 'Library', 'Application Support')
      : path.join(require('os').homedir(), '.config'))
  const dir = path.join(appData, 'ExamBankManager')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getRecoveryPath(windowId) {
  return path.join(getRecoveryDir(), `recovery_${windowId}.json`)
}

function createWindow(filePath = null) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: filePath ? `${path.basename(filePath)} — Exam Bank Manager` : 'Untitled — Exam Bank Manager',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Track this window
  const windowId = win.id.toString()
  windows.set(windowId, { filePath, isModified: false })

  win.on('ready-to-show', () => {
    win.show()
    // If a file path was provided, notify the renderer to load it
    if (filePath) {
      win.webContents.send('file:opened', filePath)
    }
  })

  // SDI: Handle close with unsaved changes check
  win.on('close', (e) => {
    const state = windows.get(windowId)
    if (state && state.isModified) {
      e.preventDefault()
      win.webContents.send('window:close-requested')
    }
  })

  win.on('closed', () => {
    // Clean up recovery file on normal close
    const recoveryPath = getRecoveryPath(windowId)
    if (fs.existsSync(recoveryPath)) {
      fs.unlinkSync(recoveryPath)
    }
    windows.delete(windowId)
  })

  // Load renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

// ── Menu Template ──
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => createWindow() },
        { label: 'Open', accelerator: 'CmdOrCtrl+O', click: (_, win) => win?.webContents.send('menu:open') },
        { label: 'Open in New Window', accelerator: 'CmdOrCtrl+Shift+O', click: (_, win) => win?.webContents.send('menu:open-new-window') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: (_, win) => win?.webContents.send('menu:save') },
        { label: 'Save As', accelerator: 'CmdOrCtrl+Shift+S', click: (_, win) => win?.webContents.send('menu:save-as') },
        { type: 'separator' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', click: (_, win) => win?.close() },
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
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

// ── App lifecycle ──
app.whenReady().then(() => {
  Menu.setApplicationMenu(buildMenu())

  // Check for recovery files on startup
  const recoveryDir = getRecoveryDir()
  const recoveryFiles = fs.readdirSync(recoveryDir).filter(f => f.startsWith('recovery_') && f.endsWith('.json'))

  if (recoveryFiles.length > 0) {
    // Will be handled by the first window's renderer after creation
    const win = createWindow()
    win.webContents.once('did-finish-load', () => {
      const recoveryData = recoveryFiles.map(f => {
        const content = fs.readFileSync(path.join(recoveryDir, f), 'utf-8')
        return { file: f, data: JSON.parse(content) }
      })
      win.webContents.send('recovery:found', recoveryData)
    })
  } else {
    createWindow()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC Handlers ──

// File operations
ipcMain.handle('dialog:openFile', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Exam Files', extensions: ['md', 'csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.handle('dialog:saveFile', async (event, defaultPath) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showSaveDialog(win, {
    defaultPath,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'CSV', extensions: ['csv'] }
    ]
  })
  if (result.canceled) return null
  return result.filePath
})

ipcMain.handle('file:read', async (_, filePath) => {
  return fs.readFileSync(filePath, 'utf-8')
})

ipcMain.handle('file:write', async (_, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf-8')
  return true
})

// Window state management (SDI)
ipcMain.on('window:set-modified', (event, isModified) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const windowId = win.id.toString()
  const state = windows.get(windowId)
  if (state) {
    state.isModified = isModified
  }
})

ipcMain.on('window:set-title', (event, title) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.setTitle(title)
})

ipcMain.on('window:force-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const windowId = win.id.toString()
  const state = windows.get(windowId)
  if (state) state.isModified = false
  win.close()
})

ipcMain.on('window:open-new', (_, filePath) => {
  createWindow(filePath)
})

// Recovery / Autosave
ipcMain.handle('recovery:save', async (event, data) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const windowId = win.id.toString()
  const recoveryPath = getRecoveryPath(windowId)
  const payload = {
    ...data,
    timestamp: Date.now()
  }
  fs.writeFileSync(recoveryPath, JSON.stringify(payload, null, 2), 'utf-8')
  return true
})

ipcMain.handle('recovery:delete', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const windowId = win.id.toString()
  const recoveryPath = getRecoveryPath(windowId)
  if (fs.existsSync(recoveryPath)) {
    fs.unlinkSync(recoveryPath)
  }
  return true
})

ipcMain.handle('dialog:confirm', async (event, message, title = 'Xác nhận') => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showMessageBox(win, {
    type: 'question',
    title,
    message,
    buttons: ['Lưu', 'Không lưu', 'Hủy'],
    defaultId: 0,
    cancelId: 2
  })
  return result.response // 0=Save, 1=Don't Save, 2=Cancel
})
