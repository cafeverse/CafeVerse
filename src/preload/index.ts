import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  fetchMovies: (params: {
    page: number
    limit: number
    search?: string
    genres?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => ipcRenderer.invoke('fetch-movies', params),
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
  },
  discord: {
    updateActivity: (activity: {
      details?: string
      state?: string
      startTimestamp?: number
      largeImageKey?: string
      largeImageText?: string
      smallImageKey?: string
      smallImageText?: string
    }) => ipcRenderer.send('discord-update-activity', activity),
    clearActivity: () => ipcRenderer.send('discord-clear-activity')
  },
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  autoUpdater: {
    checkForUpdates: (): void => ipcRenderer.send('updater-check'),
    downloadUpdate: (): void => ipcRenderer.send('updater-download'),
    quitAndInstall: (): void => ipcRenderer.send('updater-install'),
    onUpdateAvailable: (callback: (info: unknown) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, info: unknown): void => callback(info)
      ipcRenderer.on('updater-available', listener)
      return (): void => {
        ipcRenderer.removeListener('updater-available', listener)
      }
    },
    onUpdateNotAvailable: (callback: () => void): (() => void) => {
      const listener = (): void => callback()
      ipcRenderer.on('updater-not-available', listener)
      return (): void => {
        ipcRenderer.removeListener('updater-not-available', listener)
      }
    },
    onDownloadProgress: (callback: (progress: unknown) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, progress: unknown): void => callback(progress)
      ipcRenderer.on('updater-progress', listener)
      return (): void => {
        ipcRenderer.removeListener('updater-progress', listener)
      }
    },
    onUpdateDownloaded: (callback: (info: unknown) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, info: unknown): void => callback(info)
      ipcRenderer.on('updater-downloaded', listener)
      return (): void => {
        ipcRenderer.removeListener('updater-downloaded', listener)
      }
    },
    onError: (callback: (error: unknown) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, error: unknown): void => callback(error)
      ipcRenderer.on('updater-error', listener)
      return (): void => {
        ipcRenderer.removeListener('updater-error', listener)
      }
    }
  }
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
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
