import { BrowserWindow, app, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
//#region electron/main.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
app.disableHardwareAcceleration();
process.env.APP_ROOT = path.join(__dirname, "..");
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
var RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
var windows = /* @__PURE__ */ new Set();
var windowStates = /* @__PURE__ */ new Map();
var initialFiles = /* @__PURE__ */ new Map();
function createWindow(filePath) {
	const win = new BrowserWindow({
		width: 1280,
		height: 800,
		icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	windows.add(win);
	windowStates.set(win.id, false);
	if (filePath) initialFiles.set(win.id, filePath);
	win.on("close", (e) => {
		if (windowStates.get(win.id)) {
			e.preventDefault();
			if (dialog.showMessageBoxSync(win, {
				type: "question",
				buttons: ["Thoát không lưu", "Hủy"],
				title: "Xác nhận thoát",
				message: "Bạn có dữ liệu chưa được lưu. Bạn có chắc chắn muốn thoát ứng dụng mà không lưu bài không?",
				defaultId: 1,
				cancelId: 1
			}) === 0) {
				windowStates.set(win.id, false);
				win.close();
			}
		}
	});
	win.on("closed", () => {
		windows.delete(win);
		windowStates.delete(win.id);
		initialFiles.delete(win.id);
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(path.join(RENDERER_DIST, "index.html"));
}
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
	if (windows.size === 0) createWindow();
});
app.whenReady().then(() => {
	createWindow();
});
ipcMain.handle("dialog:openFile", async (e) => {
	const win = BrowserWindow.fromWebContents(e.sender);
	if (win) return dialog.showOpenDialog(win, { filters: [{
		name: "Markdown",
		extensions: ["md", "markdown"]
	}] });
	return dialog.showOpenDialog({ filters: [{
		name: "Markdown",
		extensions: ["md", "markdown"]
	}] });
});
ipcMain.handle("dialog:saveFile", async (e, defaultPath, filters) => {
	const win = BrowserWindow.fromWebContents(e.sender);
	const options = {
		defaultPath,
		filters: filters || [{
			name: "Markdown",
			extensions: ["md", "markdown"]
		}, {
			name: "CSV",
			extensions: ["csv"]
		}]
	};
	if (win) return dialog.showSaveDialog(win, options);
	return dialog.showSaveDialog(options);
});
ipcMain.handle("fs:readFile", async (_, filePath) => {
	return fs.promises.readFile(filePath, "utf-8");
});
ipcMain.handle("fs:writeFile", async (_, filePath, data) => {
	await fs.promises.writeFile(filePath, data, "utf-8");
	return true;
});
ipcMain.handle("app:newWindow", async (_, filePath) => {
	createWindow(filePath);
});
ipcMain.handle("app:getInitialFile", async (e) => {
	const win = BrowserWindow.fromWebContents(e.sender);
	if (win && initialFiles.has(win.id)) return initialFiles.get(win.id);
	return null;
});
ipcMain.on("app:setDirty", (e, dirtyStatus) => {
	const win = BrowserWindow.fromWebContents(e.sender);
	if (win) windowStates.set(win.id, dirtyStatus);
});
ipcMain.handle("app:setTitle", (e, title) => {
	const win = BrowserWindow.fromWebContents(e.sender);
	if (win) {
		let finalTitle = title;
		if (windowStates.get(win.id) && !title.endsWith("*")) finalTitle = title + "*";
		win.setTitle(finalTitle);
	}
});
//#endregion
export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL };
