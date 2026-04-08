import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("electronAPI", {
	openFile: () => ipcRenderer.invoke("dialog:openFile"),
	saveFile: (defaultPath, filters) => ipcRenderer.invoke("dialog:saveFile", defaultPath, filters),
	readFile: (path) => ipcRenderer.invoke("fs:readFile", path),
	writeFile: (path, data) => ipcRenderer.invoke("fs:writeFile", path, data),
	newWindow: (path) => ipcRenderer.invoke("app:newWindow", path),
	getInitialFile: () => ipcRenderer.invoke("app:getInitialFile"),
	setTitle: (title) => ipcRenderer.invoke("app:setTitle", title),
	setDirty: (dirty) => ipcRenderer.send("app:setDirty", dirty)
});
//#endregion
