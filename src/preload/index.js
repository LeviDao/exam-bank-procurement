import { contextBridge, ipcRenderer } from 'electron'

// Expose a safe, minimal API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // ── File Operations ──
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultPath) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),

  // ── Window Management (SDI) ──
  setModified: (isModified) => ipcRenderer.send('window:set-modified', isModified),
  setTitle: (title) => ipcRenderer.send('window:set-title', title),
  forceClose: () => ipcRenderer.send('window:force-close'),
  openNewWindow: (filePath) => ipcRenderer.send('window:open-new', filePath),

  // ── Recovery / Autosave ──
  saveRecovery: (data) => ipcRenderer.invoke('recovery:save', data),
  deleteRecovery: () => ipcRenderer.invoke('recovery:delete'),

  // ── Dialogs ──
  confirmDialog: (message, title) => ipcRenderer.invoke('dialog:confirm', message, title),

  // ── Menu & Event Listeners ──
  onMenuOpen: (callback) => ipcRenderer.on('menu:open', callback),
  onMenuOpenNewWindow: (callback) => ipcRenderer.on('menu:open-new-window', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu:save', callback),
  onMenuSaveAs: (callback) => ipcRenderer.on('menu:save-as', callback),
  onMenuUndo: (callback) => ipcRenderer.on('menu:undo', callback),
  onMenuRedo: (callback) => ipcRenderer.on('menu:redo', callback),
  onMenuHelp: (callback) => ipcRenderer.on('menu:help', callback),
  onMenuAbout: (callback) => ipcRenderer.on('menu:about', callback),
  onFileOpened: (callback) => ipcRenderer.on('file:opened', callback),
  onCloseRequested: (callback) => ipcRenderer.on('window:close-requested', callback),
  onRecoveryFound: (callback) => ipcRenderer.on('recovery:found', callback),

  // ── Cleanup listeners ──
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})
