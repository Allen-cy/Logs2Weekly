import { app, BrowserWindow, dialog, globalShortcut, Menu, Tray, nativeImage, ipcMain } from 'electron'
import path from 'node:path'
import { autoUpdater } from 'electron-updater'

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

let currentHotkey = 'CommandOrControl+M'
let currentTodoHotkey = 'CommandOrControl+J'
let quickWin: BrowserWindow | null = null

function createQuickWindow() {
    if (quickWin) return;
    
    quickWin = new BrowserWindow({
        width: 600,
        height: 120,
        frame: false,
        transparent: true,
        show: false,
        hasShadow: false,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            webSecurity: false,
        },
    })

    if (VITE_DEV_SERVER_URL) {
        quickWin.loadURL(`${VITE_DEV_SERVER_URL}/#quick`)
    } else {
        quickWin.loadFile(path.join(RENDERER_DIST, 'index.html'), { hash: 'quick' })
    }

    quickWin.on('blur', () => {
        quickWin?.hide()
    })
}

function registerGlobalShortcuts(logHotkey: string = 'CommandOrControl+M', todoHotkey: string = 'CommandOrControl+J') {
    try {
        globalShortcut.unregisterAll()
        
        const normalize = (key: string) => {
            if (key.includes('CommandOrControl') || key.includes('CmdOrCtrl')) return key;
            return key.replace(/Control|Ctrl|Cmd/gi, 'CommandOrControl');
        };

        const targetLog = normalize(logHotkey);
        const targetTodo = normalize(todoHotkey);

        globalShortcut.register(targetLog, () => {
            if (!quickWin) {
                createQuickWindow();
                quickWin?.once('ready-to-show', () => {
                    quickWin?.show();
                    quickWin?.focus();
                    quickWin?.webContents.send('set-quick-mode', 'log');
                });
            } else {
                if (quickWin.isVisible() && quickWin.isFocused()) {
                    quickWin.hide();
                } else {
                    quickWin.show();
                    quickWin.focus();
                    quickWin.webContents.send('set-quick-mode', 'log');
                }
            }
        })

        globalShortcut.register(targetTodo, () => {
            if (!quickWin) {
                createQuickWindow();
                quickWin?.once('ready-to-show', () => {
                    quickWin?.show();
                    quickWin?.focus();
                    quickWin?.webContents.send('set-quick-mode', 'todo');
                });
            } else {
                if (quickWin.isVisible() && quickWin.isFocused()) {
                    quickWin.hide();
                } else {
                    quickWin.show();
                    quickWin.focus();
                    quickWin.webContents.send('set-quick-mode', 'todo');
                }
            }
        })

        currentHotkey = targetLog;
        currentTodoHotkey = targetTodo;
        console.log(`Shortcuts registered: Log=${targetLog}, Todo=${targetTodo}`);
        return true;
    } catch (e) {
        console.error('Error registering shortcuts', e)
        return false
    }
}

ipcMain.on('set-hotkey', (event, hotkey) => {
    const success = registerGlobalShortcuts(hotkey, currentTodoHotkey)
    event.reply('set-hotkey-result', { success, hotkey })
})

ipcMain.on('set-todo-hotkey', (event, hotkey) => {
    const success = registerGlobalShortcuts(currentHotkey, hotkey)
    event.reply('set-todo-hotkey-result', { success, hotkey })
})

ipcMain.on('quick-submit', (event, data) => {
    if (win) {
        win.webContents.send('execute-quick-submit', data)
    }
    // Optional: bring main window to front for feedback? 
    // No, stay unobtrusive as per user request.
    quickWin?.hide()
})

ipcMain.on('quick-hide', () => {
    quickWin?.hide()
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

    // 自动更新：仅在生产环境启用
    if (!VITE_DEV_SERVER_URL) {
        setupAutoUpdater()
    }
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

// ========== 自动更新逻辑 ==========
function setupAutoUpdater() {
    // 不自动下载，先通知用户
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    // 检测到新版本
    autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info.version)
        win?.webContents.send('update-available', {
            version: info.version,
            releaseNotes: info.releaseNotes || ''
        })
    })

    // 没有新版本
    autoUpdater.on('update-not-available', () => {
        console.log('No update available.')
        win?.webContents.send('update-not-available')
    })

    // 下载进度
    autoUpdater.on('download-progress', (progress) => {
        win?.webContents.send('update-download-progress', {
            percent: Math.round(progress.percent),
            transferred: progress.transferred,
            total: progress.total
        })
    })

    // 下载完成，准备安装
    autoUpdater.on('update-downloaded', () => {
        console.log('Update downloaded, ready to install.')
        win?.webContents.send('update-downloaded')
    })

    // 更新错误
    autoUpdater.on('error', (err) => {
        console.error('Auto-updater error:', err)
    })

    // 启动后延迟 5 秒静默检查
    setTimeout(() => {
        autoUpdater.checkForUpdates().catch((err) => {
            console.error('Check for updates failed:', err)
        })
    }, 5000)
}

// 渲染进程请求手动检查更新
ipcMain.on('check-for-updates', () => {
    if (!VITE_DEV_SERVER_URL) {
        autoUpdater.checkForUpdates().catch((err) => {
            console.error('Manual check for updates failed:', err)
        })
    }
})

// 渲染进程确认下载更新
ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate().catch((err) => {
        console.error('Download update failed:', err)
    })
})

// 渲染进程请求安装并重启
ipcMain.on('install-update', () => {
    isQuitting = true
    autoUpdater.quitAndInstall()
})
