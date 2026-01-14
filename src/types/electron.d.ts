/**
 * Electron API 类型定义
 */

interface SaveFileOptions {
  content: string
  defaultName: string
  fileType: 'txt' | 'epub' | 'json'
}

interface SaveFileResult {
  success: boolean
  path?: string
}

interface OpenFileOptions {
  filters?: Array<{
    name: string
    extensions: string[]
  }>
}

interface OpenFileResult {
  success: boolean
  path?: string
  content?: string
}

interface AppInfo {
  name: string
  version: string
  platform: string
  arch: string
  electron: string
  node: string
  chrome: string
}

interface ElectronAPI {
  // 菜单操作监听
  onMenuAction: (callback: (action: string) => void) => void
  onNavigate: (callback: (path: string) => void) => void
  removeMenuActionListener: () => void
  removeNavigateListener: () => void

  // 窗口操作
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>

  // 系统操作
  notify: (title: string, body: string) => void
  openExternal: (url: string) => void
  getVersion: () => Promise<string>
  getAppInfo: () => Promise<AppInfo>

  // 文件操作
  saveFile: (options: SaveFileOptions) => Promise<SaveFileResult>
  openFile: (options?: OpenFileOptions) => Promise<OpenFileResult>

  // 平台信息
  platform: string
  isMac: boolean
  isWindows: boolean
  isLinux: boolean
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
