import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (defaultPath?: string, filters?: any[]) => ipcRenderer.invoke('dialog:saveFile', defaultPath, filters),
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, data: string) => ipcRenderer.invoke('fs:writeFile', path, data),
  setTitle: (title: string) => ipcRenderer.invoke('app:setTitle', title),
  setDirty: (dirty: boolean) => ipcRenderer.send('app:setDirty', dirty)
});
