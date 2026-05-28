import { app, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerMoviesIpc } from './moviesApi'
import { ElectronBlocker } from '@ghostery/adblocker-electron'
import fetch from 'cross-fetch'
import { autoUpdater } from 'electron-updater'
import {
  initDiscordRPC,
  updateDiscordActivity,
  clearDiscordActivity,
  shutdownDiscordRPC
} from './discord'

let mainWindow: BrowserWindow

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    frame: false, // Truly frameless
    backgroundColor: '#0c0a09',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    console.log(`[Security] Blocked window open request to: ${details.url}`)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (
      !url.startsWith('http://localhost:') &&
      !url.startsWith('file://') &&
      !url.startsWith('https://localhost:')
    ) {
      console.log(`[Security] Blocked top-level navigation to: ${url}`)
      event.preventDefault()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Enable Widevine feature
app.commandLine.appendSwitch('enable-features', 'Widevine')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const { components } = require('electron') as any
    if (components) {
      await components.whenReady()
      console.log('components ready:', components.status())
    }
  } catch (err) {
    console.error('Failed to load components:', err)
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Block ad and tracking networks
  try {
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
    blocker.enableBlockingInSession(session.defaultSession)
    console.log('adblocker enabled')
  } catch (error) {
    console.error('Failed to initialize adblocker:', error)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Register Movies IPC
  registerMoviesIpc()

  // Register Discord RPC IPC
  ipcMain.on('discord-update-activity', (_event, activity) => {
    updateDiscordActivity(activity)
  })

  ipcMain.on('discord-clear-activity', () => {
    clearDiscordActivity()
  })

  // Initialize Discord Rich Presence
  initDiscordRPC()

  // Register Window Controls IPC
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow?.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    mainWindow?.close()
  })

  ipcMain.handle('get-app-version', () => app.getVersion())

  createWindow()
  registerUpdater(mainWindow)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function registerUpdater(window: BrowserWindow): void {
  autoUpdater.autoDownload = false
  autoUpdater.allowPrerelease = true

  if (is.dev) {
    autoUpdater.updateConfigPath = join(__dirname, '../../dev-app-update.yml')
    // @ts-ignore: forceDevUpdateConfig is required to test real update functionality locally
    autoUpdater.forceDevUpdateConfig = true
  }

  // Log updater activities
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available')
    window.webContents.send('updater-available', info)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] Update not available.')
    window.webContents.send('updater-not-available')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    console.log('[Updater] Download progress:', progressObj)
    window.webContents.send('updater-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info)
    window.webContents.send('updater-downloaded', info)
  })

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err)
    window.webContents.send(
      'updater-error',
      err == null ? 'unknown' : (err.stack || err).toString()
    )
  })

  ipcMain.on('updater-check', () => {
    console.log('[Updater] Renderer requested update check.')
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[Updater] Check for updates failed:', err)
      window.webContents.send('updater-error', err.toString())
    })
  })

  ipcMain.on('updater-download', () => {
    console.log('[Updater] Renderer requested update download.')
    autoUpdater.downloadUpdate().catch((err) => {
      console.error('[Updater] Download update failed:', err)
      window.webContents.send('updater-error', err.toString())
    })
  })

  ipcMain.on('updater-install', () => {
    console.log('[Updater] Renderer requested update installation.')
    autoUpdater.quitAndInstall()
  })

  // Start checking for updates automatically a few seconds after launch
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[Updater] Failed to run startup update check:', err)
    })
  }, 5000)
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  shutdownDiscordRPC()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
