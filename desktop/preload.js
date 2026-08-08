const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,

  getVersion: () => ipcRenderer.invoke("get-version"),

  getAutoLaunch: () => ipcRenderer.invoke("get-auto-launch"),
  setAutoLaunch: (enabled) =>
    ipcRenderer.invoke("set-auto-launch", enabled),
});
