/**
 * Electron Preload Script
 *
 * 在渲染进程中暴露安全的 API，用于主进程和渲染进程之间的通信
 */
const { contextBridge, ipcRenderer } = require('electron')

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // ============ 菜单操作监听 ============

  /**
   * 监听菜单操作
   * @param {function} callback - 回调函数，接收 action 参数
   */
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action))
  },

  /**
   * 监听导航事件
   * @param {function} callback - 回调函数，接收 path 参数
   */
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path))
  },

  /**
   * 移除菜单操作监听
   */
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action')
  },

  /**
   * 移除导航监听
   */
  removeNavigateListener: () => {
    ipcRenderer.removeAllListeners('navigate')
  },

  // ============ 窗口操作 ============

  /**
   * 最小化窗口
   */
  minimize: () => ipcRenderer.send('window-minimize'),

  /**
   * 最大化/还原窗口
   */
  maximize: () => ipcRenderer.send('window-maximize'),

  /**
   * 关闭窗口
   */
  close: () => ipcRenderer.send('window-close'),

  /**
   * 检查窗口是否最大化
   */
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // ============ 系统操作 ============

  /**
   * 显示系统通知
   * @param {string} title - 通知标题
   * @param {string} body - 通知内容
   */
  notify: (title, body) => ipcRenderer.send('show-notification', { title, body }),

  /**
   * 在默认浏览器中打开链接
   * @param {string} url - 要打开的 URL
   */
  openExternal: (url) => ipcRenderer.send('open-external', url),

  /**
   * 获取应用版本
   */
  getVersion: () => ipcRenderer.invoke('get-version'),

  /**
   * 获取应用信息
   */
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // ============ 文件操作 ============

  /**
   * 显示保存文件对话框并保存内容
   * @param {object} options - 选项
   * @param {string} options.content - 要保存的内容
   * @param {string} options.defaultName - 默认文件名
   * @param {string} options.fileType - 文件类型 (txt, epub, etc.)
   */
  saveFile: (options) => ipcRenderer.invoke('save-file', options),

  /**
   * 显示打开文件对话框
   * @param {object} options - 选项
   */
  openFile: (options) => ipcRenderer.invoke('open-file', options),

  // ============ 平台信息 ============

  /**
   * 获取当前平台
   */
  platform: process.platform,

  /**
   * 是否是 macOS
   */
  isMac: process.platform === 'darwin',

  /**
   * 是否是 Windows
   */
  isWindows: process.platform === 'win32',

  /**
   * 是否是 Linux
   */
  isLinux: process.platform === 'linux',
})

// 日志输出
console.log('[Preload] Electron API exposed to renderer')
