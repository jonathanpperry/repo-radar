import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import type { ProjectScan } from '../shared/projects'

export const api = {
  chooseAndScanProjects: (): Promise<ProjectScan | null> =>
    ipcRenderer.invoke('projects:choose-and-scan'),
  openInVSCode: (repositoryPath: string): Promise<void> =>
    ipcRenderer.invoke('projects:open-in-vscode', repositoryPath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
