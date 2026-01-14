/**
 * 系统托盘
 */
const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('path')

let tray = null

/**
 * 创建系统托盘
 * @param {BrowserWindow} mainWindow - 主窗口实例
 */
function createTray(mainWindow) {
  // 托盘图标路径
  const iconPath = getIconPath()

  // 创建托盘图标（如果图标不存在则使用空图标）
  let icon
  try {
    icon = nativeImage.createFromPath(iconPath)
    // Windows 需要 16x16 或 32x32 的图标
    if (process.platform === 'win32') {
      icon = icon.resize({ width: 16, height: 16 })
    }
  } catch (error) {
    console.warn('[Tray] Failed to load icon, using empty icon')
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)

  // 设置托盘提示
  tray.setToolTip('AI Novel Web')

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: '新建小说',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('menu-action', 'new-novel')
        }
      }
    },
    { type: 'separator' },
    {
      label: '仪表盘',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate', '/dashboard')
        }
      }
    },
    {
      label: '智能封面',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate', '/cover-generator')
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })

  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  return tray
}

/**
 * 获取托盘图标路径
 */
function getIconPath() {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png'

  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', iconName)
  }

  // 开发模式下使用 public 目录的图标
  return path.join(__dirname, '..', 'public', iconName)
}

/**
 * 销毁托盘
 */
function destroyTray() {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

/**
 * 更新托盘图标
 * @param {string} iconPath - 新图标路径
 */
function updateTrayIcon(iconPath) {
  if (tray) {
    const icon = nativeImage.createFromPath(iconPath)
    tray.setImage(icon)
  }
}

/**
 * 更新托盘提示
 * @param {string} tooltip - 新提示文本
 */
function updateTrayTooltip(tooltip) {
  if (tray) {
    tray.setToolTip(tooltip)
  }
}

module.exports = {
  createTray,
  destroyTray,
  updateTrayIcon,
  updateTrayTooltip
}
