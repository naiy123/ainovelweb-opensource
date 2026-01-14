/**
 * Electron 主进程
 */
const { app, BrowserWindow, shell, ipcMain, Notification, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// 模块导入
const { createMenu } = require('./menu')
const { createTray, destroyTray } = require('./tray')

let mainWindow
let serverProcess

// ============ 路径工具函数 ============

/**
 * 获取应用根目录
 */
function getAppRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app')
  }
  return path.join(__dirname, '..')
}

/**
 * 获取数据库路径
 */
function getDatabasePath() {
  if (app.isPackaged) {
    const userDataPath = app.getPath('userData')
    return path.join(userDataPath, 'data.db')
  }
  return path.join(getAppRoot(), 'prisma', 'data.db')
}

/**
 * 获取 preload 脚本路径
 */
function getPreloadPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app', 'electron', 'preload.js')
  }
  return path.join(__dirname, 'preload.js')
}

// ============ 数据库初始化 ============

/**
 * 确保数据库存在
 */
function ensureDatabaseExists() {
  const dbPath = getDatabasePath()
  const dbDir = path.dirname(dbPath)

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  if (app.isPackaged && !fs.existsSync(dbPath)) {
    const sourceDb = path.join(process.resourcesPath, 'app', 'prisma', 'data.db')
    if (fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, dbPath)
    }
  }
}

// ============ 服务器管理 ============

/**
 * 检查是否为开发模式
 */
function isDev() {
  return !app.isPackaged
}

/**
 * 启动 Next.js 服务器（仅生产模式）
 */
function startServer() {
  // 开发模式下不启动 server（由 npm run dev 提供）
  if (isDev()) {
    console.log('[Main] Dev mode - using external Next.js dev server')
    return
  }

  const appRoot = getAppRoot()
  const serverPath = path.join(appRoot, '.next', 'standalone', 'server.js')

  const env = {
    ...process.env,
    PORT: '3000',
    HOSTNAME: 'localhost',
    DATABASE_URL: `file:${getDatabasePath()}`
  }

  console.log('[Main] Starting server from:', serverPath)
  console.log('[Main] Database path:', getDatabasePath())

  serverProcess = spawn('node', [serverPath], {
    cwd: path.join(appRoot, '.next', 'standalone'),
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  })

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server] ${data}`)
  })

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data}`)
  })

  serverProcess.on('error', (error) => {
    console.error('[Main] Failed to start server:', error)
  })

  serverProcess.on('exit', (code) => {
    console.log(`[Main] Server exited with code ${code}`)
  })
}

/**
 * 等待服务器启动
 */
function waitForServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const http = require('http')

    function check() {
      const req = http.get('http://localhost:3000', (res) => {
        resolve()
      })

      req.on('error', () => {
        if (retries > 0) {
          setTimeout(() => {
            retries--
            check()
          }, 500)
        } else {
          reject(new Error('Server failed to start'))
        }
      })

      req.end()
    }

    check()
  })
}

// ============ 窗口管理 ============

/**
 * 创建主窗口
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'AI Novel Web',
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath()
    },
    show: false
  })

  // 加载应用
  mainWindow.loadURL('http://localhost:3000')

  // 页面加载完成后显示窗口
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show()
  })

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 窗口关闭时隐藏到托盘（Windows/Linux）
  mainWindow.on('close', (event) => {
    if (!app.isQuitting && process.platform !== 'darwin') {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 创建菜单
  createMenu(mainWindow)

  // 创建托盘
  createTray(mainWindow)

  return mainWindow
}

// ============ IPC 处理器 ============

/**
 * 注册 IPC 处理器
 */
function registerIpcHandlers() {
  // 窗口操作
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    mainWindow?.close()
  })

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow?.isMaximized() || false
  })

  // 系统通知
  ipcMain.on('show-notification', (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })

  // 打开外部链接
  ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url)
  })

  // 获取应用版本
  ipcMain.handle('get-version', () => {
    return app.getVersion()
  })

  // 获取应用信息
  ipcMain.handle('get-app-info', () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome
    }
  })

  // 保存文件
  ipcMain.handle('save-file', async (event, { content, defaultName, fileType }) => {
    const filters = {
      txt: { name: 'Text Files', extensions: ['txt'] },
      epub: { name: 'EPUB Files', extensions: ['epub'] },
      json: { name: 'JSON Files', extensions: ['json'] }
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [filters[fileType] || filters.txt]
    })

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, 'utf-8')
      return { success: true, path: result.filePath }
    }

    return { success: false }
  })

  // 打开文件
  ipcMain.handle('open-file', async (event, options = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options.filters || [
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const content = fs.readFileSync(filePath, 'utf-8')
      return { success: true, path: filePath, content }
    }

    return { success: false }
  })
}

// ============ 应用生命周期 ============

// 应用准备就绪
app.whenReady().then(async () => {
  console.log('[Main] App ready, isDev:', isDev())

  // 注册 IPC 处理器
  registerIpcHandlers()

  // 初始化数据库（仅生产模式）
  if (!isDev()) {
    ensureDatabaseExists()
  }

  // 启动服务器（仅生产模式）
  startServer()

  try {
    await waitForServer()
    createWindow()
  } catch (error) {
    console.error('[Main] Failed to start application:', error)
    app.quit()
  }
})

// 所有窗口关闭时
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS 点击 dock 图标重新打开窗口
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
})

// 应用退出前
app.on('before-quit', () => {
  app.isQuitting = true
  destroyTray()
  if (serverProcess) {
    serverProcess.kill()
  }
})

// 应用退出时
app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM')
  }
})

// 阻止多实例
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}
