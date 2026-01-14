const { app, BrowserWindow, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

let mainWindow
let serverProcess

// 获取应用根目录
function getAppRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app')
  }
  return path.join(__dirname, '..')
}

// 获取数据库路径
function getDatabasePath() {
  if (app.isPackaged) {
    // 打包后，数据库放在用户数据目录
    const userDataPath = app.getPath('userData')
    return path.join(userDataPath, 'data.db')
  }
  return path.join(getAppRoot(), 'prisma', 'data.db')
}

// 确保数据库目录存在
function ensureDatabaseExists() {
  const dbPath = getDatabasePath()
  const dbDir = path.dirname(dbPath)

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // 如果是打包版本且用户数据目录没有数据库，复制初始数据库
  if (app.isPackaged && !fs.existsSync(dbPath)) {
    const sourceDb = path.join(process.resourcesPath, 'app', 'prisma', 'data.db')
    if (fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, dbPath)
    }
  }
}

// 启动 Next.js 服务器
function startServer() {
  const appRoot = getAppRoot()
  const serverPath = path.join(appRoot, '.next', 'standalone', 'server.js')

  // 设置环境变量
  const env = {
    ...process.env,
    PORT: '3000',
    HOSTNAME: 'localhost',
    DATABASE_URL: `file:${getDatabasePath()}`
  }

  console.log('Starting server from:', serverPath)
  console.log('Database path:', getDatabasePath())

  serverProcess = spawn('node', [serverPath], {
    cwd: path.join(appRoot, '.next', 'standalone'),
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  })

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`)
  })

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`)
  })

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error)
  })

  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`)
  })
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'AI Novel Web',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false // 等待加载完成再显示
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

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 等待服务器启动
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

// 应用准备就绪
app.whenReady().then(async () => {
  ensureDatabaseExists()
  startServer()

  try {
    await waitForServer()
    createWindow()
  } catch (error) {
    console.error('Failed to start application:', error)
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
  }
})

// 应用退出前清理
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})

// 应用退出时确保服务器进程被终止
app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM')
  }
})
