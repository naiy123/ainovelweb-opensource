/**
 * 应用菜单配置
 */
const { Menu, shell, app } = require('electron')

/**
 * 创建应用菜单
 * @param {BrowserWindow} mainWindow - 主窗口实例
 * @param {object} handlers - IPC 处理函数
 */
function createMenu(mainWindow, handlers = {}) {
  const isMac = process.platform === 'darwin'

  const template = [
    // macOS 应用菜单
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: '关于 AI Novel Web', role: 'about' },
        { type: 'separator' },
        { label: '设置...', accelerator: 'CmdOrCtrl+,', click: () => navigateTo('/dashboard/profile') },
        { type: 'separator' },
        { label: '隐藏', role: 'hide' },
        { label: '隐藏其他', role: 'hideOthers' },
        { label: '显示全部', role: 'unhide' },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    }] : []),

    // 文件菜单
    {
      label: '文件',
      submenu: [
        {
          label: '新建小说',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendToRenderer('menu-action', 'new-novel')
        },
        { type: 'separator' },
        {
          label: '导出当前章节为 TXT',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => sendToRenderer('menu-action', 'export-txt')
        },
        { type: 'separator' },
        isMac ? { label: '关闭窗口', role: 'close' } : { label: '退出', role: 'quit' }
      ]
    },

    // 编辑菜单
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        { type: 'separator' },
        {
          label: '查找',
          accelerator: 'CmdOrCtrl+F',
          click: () => sendToRenderer('menu-action', 'find')
        },
        {
          label: '替换',
          accelerator: 'CmdOrCtrl+H',
          click: () => sendToRenderer('menu-action', 'replace')
        }
      ]
    },

    // 视图菜单
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: isMac ? 'Cmd+Option+I' : 'Ctrl+Shift+I',
          role: 'toggleDevTools'
        }
      ]
    },

    // AI 菜单
    {
      label: 'AI',
      submenu: [
        {
          label: '生成章节内容',
          accelerator: 'CmdOrCtrl+G',
          click: () => sendToRenderer('menu-action', 'ai-generate')
        },
        {
          label: '生成章节摘要',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendToRenderer('menu-action', 'ai-summary')
        },
        { type: 'separator' },
        {
          label: '生成角色卡片',
          click: () => sendToRenderer('menu-action', 'ai-generate-card')
        },
        {
          label: '生成封面',
          click: () => sendToRenderer('menu-action', 'ai-generate-cover')
        }
      ]
    },

    // 导航菜单
    {
      label: '导航',
      submenu: [
        {
          label: '仪表盘',
          accelerator: 'CmdOrCtrl+1',
          click: () => navigateTo('/dashboard')
        },
        {
          label: '智能封面',
          accelerator: 'CmdOrCtrl+2',
          click: () => navigateTo('/cover-generator')
        },
        {
          label: '朱雀降重',
          accelerator: 'CmdOrCtrl+3',
          click: () => navigateTo('/humanize')
        },
        { type: 'separator' },
        {
          label: '后退',
          accelerator: 'Alt+Left',
          click: () => mainWindow?.webContents.goBack()
        },
        {
          label: '前进',
          accelerator: 'Alt+Right',
          click: () => mainWindow?.webContents.goForward()
        }
      ]
    },

    // 窗口菜单
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        ...(isMac ? [
          { type: 'separator' },
          { label: '前置所有窗口', role: 'front' }
        ] : [
          { label: '关闭', role: 'close' }
        ])
      ]
    },

    // 帮助菜单
    {
      label: '帮助',
      submenu: [
        {
          label: '使用指南',
          click: () => shell.openExternal('https://github.com/naiy123/ainovelweb-opensource#readme')
        },
        {
          label: '快捷键列表',
          accelerator: 'CmdOrCtrl+/',
          click: () => sendToRenderer('menu-action', 'show-shortcuts')
        },
        { type: 'separator' },
        {
          label: '报告问题',
          click: () => shell.openExternal('https://github.com/naiy123/ainovelweb-opensource/issues')
        },
        { type: 'separator' },
        {
          label: '关于',
          click: () => sendToRenderer('menu-action', 'show-about')
        }
      ]
    }
  ]

  // 发送消息到渲染进程
  function sendToRenderer(channel, action) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, action)
    }
  }

  // 导航到指定路由
  function navigateTo(path) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('navigate', path)
    }
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  return menu
}

module.exports = { createMenu }
