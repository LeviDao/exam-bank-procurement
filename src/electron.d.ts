interface ElectronAPI {
  openFile: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  saveFile: (defaultPath?: string, filters?: any[]) => Promise<{ canceled: boolean; filePath?: string }>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<boolean>;
  setTitle: (title: string) => Promise<void>;
  setDirty: (dirty: boolean) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
