import { app, BrowserWindow, dialog, globalShortcut, Menu, Tray, nativeImage, ipcMain } from 'electron'
import path from 'node:path'

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createTray() {
    const iconPath = path.join(process.env.VITE_PUBLIC, 'pwa-192x192.png')
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

    tray = new Tray(icon)
    const contextMenu = Menu.buildFromTemplate([
        { label: '显示窗口', click: () => win?.show() },
        {
            label: '置顶模式',
            type: 'checkbox',
            checked: win?.isAlwaysOnTop(),
            click: (item) => {
                win?.setAlwaysOnTop(item.checked)
                win?.webContents.send('always-on-top-changed', item.checked)
            }
        },
        { type: 'separator' },
        {
            label: '彻底退出', click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ])

    tray.setToolTip('Logs2Weekly')
    tray.setContextMenu(contextMenu)

    tray.on('click', () => {
        if (win?.isVisible()) {
            win.hide()
        } else {
            win?.show()
            win?.focus()
        }
    })
}

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        titleBarStyle: 'hiddenInset',
        icon: path.join(process.env.VITE_PUBLIC, 'pwa-192x192.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            webSecurity: false,
        },
    })

    // win.webContents.openDevTools()

    win.webContents.on('did-finish-load', () => {
        const indexPath = path.join(RENDERER_DIST, 'index.html')
        console.log('App loaded from:', indexPath)
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    }

    // MacOS tray behavior: close means hide
    win.on('close', (event) => {
        if (!isQuitting && process.platform === 'darwin') {
            event.preventDefault()
            win?.hide()
        }
        return false
    })
}

let currentHotkey = 'Alt+M'

function registerGlobalShortcuts(hotkey: string = 'Alt+M') {
    try {
        globalShortcut.unregisterAll()
        const success = globalShortcut.register(hotkey, () => {
            if (!win) return
            if (win.isVisible() && win.isFocused()) {
                win.hide()
            } else {
                win.show()
                win.focus()
                win.webContents.send('focus-add-log', true)
            }
        })
        if (success) {
            currentHotkey = hotkey
            console.log(`Global shortcut registered: ${hotkey}`)
        } else {
            console.error(`Failed to register shortcut: ${hotkey}`)
        }
        return success
    } catch (e) {
        console.error('Error registering shortcut', e)
        return false
    }
}

ipcMain.on('set-hotkey', (event, hotkey) => {
    const success = registerGlobalShortcuts(hotkey)
    event.reply('set-hotkey-result', { success, hotkey })
})

ipcMain.on('toggle-always-on-top', (_event, flag) => {
    win?.setAlwaysOnTop(flag)
    // Sync tray menu
    if (tray) {
        const contextMenu = Menu.buildFromTemplate([
            { label: '显示窗口', click: () => win?.show() },
            {
                label: '置顶模式',
                type: 'checkbox',
                checked: flag,
                click: (item) => {
                    win?.setAlwaysOnTop(item.checked)
                    win?.webContents.send('always-on-top-changed', item.checked)
                }
            },
            { type: 'separator' },
            { label: '彻底退出', click: () => { isQuitting = true; app.quit(); } }
        ])
        tray.setContextMenu(contextMenu)
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    } else {
        win?.show()
    }
})

app.on('before-quit', () => {
    isQuitting = true
})

app.whenReady().then(() => {
    createWindow()
    createTray()
    registerGlobalShortcuts()
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})
