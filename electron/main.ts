import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;
let isDirty = false;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  win.on('close', (e) => {
    if (isDirty) {
      e.preventDefault();
      const choice = dialog.showMessageBoxSync(win!, {
        type: 'question',
        buttons: ['Thoát không lưu', 'Hủy'],
        title: 'Xác nhận thoát',
        message: 'Bạn có dữ liệu chưa được lưu. Bạn có chắc chắn muốn thoát ứng dụng mà không lưu bài không?',
        defaultId: 1,
        cancelId: 1
      });
      if (choice === 0) {
        isDirty = false; // Allow exit
        app.quit();
      }
    }
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
  if (!win) return { canceled: true };
  return dialog.showOpenDialog(win, {
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  });
});

ipcMain.handle('dialog:saveFile', async (_, defaultPath, filters) => {
  if (!win) return { canceled: true };
  return dialog.showSaveDialog(win, {
    defaultPath,
    filters: filters || [{ name: 'Markdown', extensions: ['md', 'markdown'] }, { name: 'CSV', extensions: ['csv'] }]
  });
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  return fs.promises.readFile(filePath, 'utf-8');
});

ipcMain.handle('fs:writeFile', async (_, filePath, data) => {
  await fs.promises.writeFile(filePath, data, 'utf-8');
  return true;
});

ipcMain.on('app:setDirty', (_, dirtyStatus) => {
  isDirty = dirtyStatus;
});

ipcMain.handle('app:setTitle', (_, title) => {
  if (win) {
    let finalTitle = title;
    if (isDirty && !title.endsWith('*')) {
      finalTitle = title + '*';
    }
    win.setTitle(finalTitle);
  }
});
