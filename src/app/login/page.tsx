'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Script from 'next/script'
import Link from 'next/link'
import Background from '@/components/login/Background'
import { LogoIcon, UserIcon, LockIcon, PhoneIcon, ArrowRightIcon, CheckIcon, WeChatIcon, EyeIcon, EyeOffIcon } from '@/components/login/Icons'
import { checkPasswordStrength } from '@/lib/validators/password'

// 微信登录 SDK 类型声明
declare global {
  interface Window {
    WxLogin: new (config: {
      self_redirect?: boolean
      id: string
      appid: string
      scope: string
      redirect_uri: string
      state: string
      style?: string
      href?: string
    }) => void
  }
}

// 认证模式
type AuthMode = 'wechat' | 'login' | 'register'

// 验证回调 URL 是否安全（防止开放重定向攻击）
function isValidCallbackUrl(url: string | null): string {
  if (!url) return '/dashboard'
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes(':')) {
    return url
  }
  return '/dashboard'
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = isValidCallbackUrl(searchParams.get('callbackUrl'))

  // 根据 URL 参数设置初始模式
  const initialMode = (searchParams.get('mode') as AuthMode) || 'wechat'

  // 认证模式状态
  const [mode, setMode] = useState<AuthMode>(
    ['wechat', 'login', 'register'].includes(initialMode) ? initialMode : 'wechat'
  )

  // 通用状态
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeField, setActiveField] = useState<string | null>(null)

  // 登录表单状态
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 注册表单额外状态
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameMessage, setUsernameMessage] = useState('')

  // 密码强度
  const passwordStrength = password ? checkPasswordStrength(password) : null

  // 微信登录状态
  const [wechatState, setWechatState] = useState('')
  const [wxSdkLoaded, setWxSdkLoaded] = useState(false)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  // 处理 URL 中的错误信息
  useEffect(() => {
    const wechatError = searchParams.get('error')
    const errorMessage = searchParams.get('message')

    if (wechatError === 'wechat_cancelled') {
      setError('您取消了微信登录')
    } else if (wechatError === 'invalid_state') {
      setError('登录状态验证失败，请重试')
    } else if (wechatError === 'wechat_failed') {
      setError(errorMessage ? decodeURIComponent(errorMessage) : '微信登录失败，请重试')
    }
  }, [searchParams])

  // 切换模式时清空错误
  useEffect(() => {
    setError(null)
  }, [mode])

  // 验证码倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown])

  // 注册模式：检查用户名可用性（防抖）
  useEffect(() => {
    if (mode !== 'register' || !username || username.length < 4) {
      setUsernameStatus('idle')
      setUsernameMessage('')
      return
    }

    const timer = setTimeout(async () => {
      setUsernameStatus('checking')
      try {
        const res = await fetch('/api/auth/register/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        const data = await res.json()

        if (data.available) {
          setUsernameStatus('available')
          setUsernameMessage('用户名可用')
        } else {
          setUsernameStatus(res.status === 400 ? 'invalid' : 'taken')
          setUsernameMessage(data.message)
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username, mode])

  // 微信扫码模式：获取 state 并初始化二维码
  useEffect(() => {
    if (mode !== 'wechat') return

    const fetchWechatState = async () => {
      try {
        const res = await fetch(`/api/auth/wechat/url?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        const data = await res.json()
        if (data.state) {
          setWechatState(data.state)
        } else {
          setError(data.error || '获取微信授权失败')
        }
      } catch {
        setError('网络错误，请刷新重试')
      }
    }

    fetchWechatState()
  }, [mode, callbackUrl])

  // 生成微信内嵌二维码
  const initWechatQR = useCallback(() => {
    if (!wxSdkLoaded || !qrContainerRef.current || !wechatState) return

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
    const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/wechat/callback`)

    qrContainerRef.current.innerHTML = ''

    new window.WxLogin({
      self_redirect: false,
      id: 'wechat-qr-container',
      appid: process.env.NEXT_PUBLIC_WECHAT_APP_ID || '',
      scope: 'snsapi_login',
      redirect_uri: redirectUri,
      state: wechatState,
      href: 'data:text/css;base64,' + btoa(`
        .impowerBox { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .impowerBox .qrcode { width: 200px; margin: 0; border: none; }
        .impowerBox .title { display: none; }
        .impowerBox .info { display: none; }
        .impowerBox .status { text-align: center; color: #666; font-size: 12px; padding: 8px 0 0; }
        .impowerBox .status.status_browser { display: none; }
        .status_icon { display: none; }
        .impowerBox .qrcode img { width: 200px; height: 200px; }
      `)
    })
  }, [wxSdkLoaded, wechatState])

  useEffect(() => {
    if (mode === 'wechat' && wechatState) {
      initWechatQR()
    }
  }, [mode, wechatState, initWechatQR])

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    setError(null)

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('验证码已发送')
        setCountdown(60)
      } else {
        setError(data.message || '发送失败')
      }
    } catch {
      setError('网络错误，请重试')
    }
  }, [phone])

  // 账号密码登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }
    if (!agreed) {
      setError('请先同意用户协议')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        toast.success('登录成功，欢迎回来！')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('登录失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 注册提交
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (usernameStatus !== 'available') {
      setError(usernameMessage || '请检查用户名')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }
    if (passwordStrength && passwordStrength.score < 2) {
      setError('密码强度不足，请按提示加强密码')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    if (!smsCode || smsCode.length < 4) {
      setError('请输入验证码')
      return
    }
    if (!agreed) {
      setError('请先同意用户协议')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          phone,
          smsCode,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('注册成功！')
        const result = await signIn('credentials', {
          username: username.trim(),
          password,
          redirect: false,
        })
        if (result?.error) {
          setMode('login')
        } else {
          router.push('/dashboard')
          router.refresh()
        }
      } else {
        setError(data.message || '注册失败')
      }
    } catch {
      setError('注册失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 模式标题
  const modeTitle = {
    wechat: '微信扫码登录',
    login: '账号登录',
    register: '创建账号',
  }

  const modeSubtitle = {
    wechat: '使用微信扫码快速登录',
    login: '使用账号密码登录',
    register: '开启你的创作之旅',
  }

  return (
    <div className="min-h-screen w-full font-sans text-ink-50 relative flex flex-col md:flex-row overflow-hidden">
      <Background />

      {/* 装饰边框 */}
      <div className="fixed top-4 left-4 right-4 bottom-4 border border-white/5 rounded-3xl pointer-events-none z-50 hidden md:block"></div>

      {/* Left Panel - 品牌展示区 */}
      <div className="relative w-full md:w-1/2 lg:w-3/5 p-8 md:p-12 lg:p-20 flex flex-col justify-between z-10 min-h-[30vh] md:h-screen pointer-events-none">

        {/* Brand Logo */}
        <div className="flex items-center space-x-4 pointer-events-auto w-fit group cursor-pointer">
          <div className="relative w-12 h-12 flex items-center justify-center">
             <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md group-hover:blur-lg transition-all duration-500"></div>
             <div className="relative w-full h-full border border-cyan-400/30 bg-ink-900/40 backdrop-blur-sm rounded-lg flex items-center justify-center rotate-45 group-hover:rotate-90 transition-transform duration-700">
                <LogoIcon className="w-6 h-6 text-cyan-200 -rotate-45 group-hover:-rotate-90 transition-transform duration-700" />
             </div>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-white drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
            灵机写作
          </h1>
        </div>

        {/* Hero Text - 竖排 */}
        <div className="hidden md:flex flex-row-reverse items-start mt-10 h-full max-h-[60vh]">
           <div className="vertical-text text-5xl lg:text-6xl font-serif font-bold tracking-wider leading-relaxed text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-ink-400 opacity-90 hover:opacity-100 transition-opacity ml-8 border-r border-white/10 pr-8">
              一念通天
           </div>
           <div className="vertical-text text-5xl lg:text-6xl font-serif font-bold tracking-wider leading-relaxed text-transparent bg-clip-text bg-gradient-to-b from-ink-300 via-ink-100 to-white opacity-60 ml-8">
              万字成神
           </div>
           <div className="flex flex-col justify-end h-full pb-4 pr-12 max-w-xs text-right">
             <p className="text-lg text-ink-200/80 font-serif leading-loose mb-6">
                这是属于你的<span className="text-cyan-400">道</span>。<br/>
                以此为基，<br/>
                构建三千世界。
             </p>
             <div className="flex flex-wrap justify-end gap-2">
               <span className="px-2 py-1 text-[10px] border border-cyan-500/20 text-cyan-300/80 rounded bg-ink-900/40">设定生成</span>
               <span className="px-2 py-1 text-[10px] border border-cyan-500/20 text-cyan-300/80 rounded bg-ink-900/40">剧情推演</span>
               <span className="px-2 py-1 text-[10px] border border-cyan-500/20 text-cyan-300/80 rounded bg-ink-900/40">灵感风暴</span>
             </div>
           </div>
        </div>
      </div>

      {/* Right Panel - 登录/注册表单 */}
      <div className="relative w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-6 md:p-8 z-20">
        <div className="w-full max-w-md relative z-10 perspective-1000">
          {/* Glassmorphism Card */}
          <div className="relative p-8 md:p-10 backdrop-blur-2xl bg-ink-900/60 border border-ink-600/30 rounded-2xl shadow-2xl overflow-hidden group">

            {/* 装饰角 */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl"></div>

            {/* Header */}
            <div className="mb-8 text-center relative">
              <h2 className="text-2xl font-bold text-white mb-2 font-serif tracking-widest">{modeTitle[mode]}</h2>
              <div className="flex justify-center items-center gap-2">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
                <p className="text-cyan-200/70 text-xs tracking-wider">{modeSubtitle[mode]}</p>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
              </div>
            </div>

            {/* 微信扫码模式 */}
            {mode === 'wechat' && (
              <div className="space-y-6">
                <div
                  id="wechat-qr-container"
                  ref={qrContainerRef}
                  className="flex items-center justify-center bg-white rounded-lg overflow-hidden mx-auto [&_iframe]:!w-[220px] [&_iframe]:!h-[220px]"
                  style={{ width: 220, height: 220 }}
                >
                  {(!wxSdkLoaded || !wechatState) && (
                    <div className="flex flex-col items-center justify-center gap-2 text-ink-500 w-full h-full">
                      <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">加载中...</span>
                    </div>
                  )}
                </div>
                <p className="text-center text-xs text-ink-400">
                  请使用微信扫描二维码登录
                </p>

                {/* Error Message */}
                {error && (
                  <div className="text-red-400 text-xs px-1 animate-pulse flex items-center justify-center gap-1">
                    <span>!</span> {error}
                  </div>
                )}
              </div>
            )}

            {/* 账号登录模式 */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Username Input */}
                <div className={`relative transition-all duration-300 ${activeField === 'username' ? 'scale-[1.02]' : ''}`}>
                  <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'username' ? 'text-cyan-400' : 'text-ink-400'}`}>
                    用户名
                  </label>
                  <div className={`flex items-center border-b ${activeField === 'username' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                    <div className="pl-3 text-ink-400">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onFocus={() => setActiveField('username')}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-transparent border-none text-white px-3 py-3 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-wide"
                      placeholder="请输入用户名"
                      maxLength={20}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className={`relative transition-all duration-300 ${activeField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'password' ? 'text-cyan-400' : 'text-ink-400'}`}>
                    密码
                  </label>
                  <div className={`flex items-center border-b ${activeField === 'password' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                    <div className="pl-3 text-ink-400">
                      <LockIcon className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onFocus={() => setActiveField('password')}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-none text-white px-3 py-3 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-wide"
                      placeholder="请输入密码"
                      maxLength={128}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pr-3 text-ink-400 hover:text-ink-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-red-400 text-xs px-1 animate-pulse flex items-center gap-1">
                    <span>!</span> {error}
                  </div>
                )}

                {/* Agreement & Forgot Password */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setAgreed(!agreed)}
                      className={`flex items-center justify-center h-4 w-4 rounded border transition-colors ${
                        agreed ? 'bg-cyan-600 border-cyan-600' : 'border-ink-500 bg-transparent hover:border-cyan-500'
                      }`}
                    >
                      {agreed && <CheckIcon className="h-3 w-3 text-white" />}
                    </button>
                    <div className="ml-2 text-xs text-ink-300 font-light">
                      已阅读并同意
                      <a href="/terms" className="text-cyan-400 hover:text-cyan-200 ml-1 transition-colors">《用户协议》</a>
                    </div>
                  </div>
                  <Link href="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-200 transition-colors">
                    忘记密码？
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-cyan-700 to-blue-800 hover:from-cyan-600 hover:to-blue-700 focus:outline-none ring-offset-2 ring-offset-ink-900 focus:ring-2 focus:ring-cyan-500 transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]"></div>

                  {isSubmitting ? (
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                  ) : (
                    <>
                      <span className="text-base font-serif tracking-widest relative z-10">登 录</span>
                      <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform relative z-10" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 账号注册模式 */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Username */}
                <div className={`relative transition-all duration-300 ${activeField === 'reg-username' ? 'scale-[1.02]' : ''}`}>
                  <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'reg-username' ? 'text-cyan-400' : 'text-ink-400'}`}>
                    用户名
                  </label>
                  <div className={`flex items-center border-b ${activeField === 'reg-username' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                    <div className="pl-3 text-ink-400">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onFocus={() => setActiveField('reg-username')}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-transparent border-none text-white px-3 py-2.5 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-wide text-sm"
                      placeholder="4-20位字母开头"
                      maxLength={20}
                      autoComplete="username"
                    />
                    {usernameStatus === 'checking' && (
                      <div className="pr-3">
                        <svg className="animate-spin h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      </div>
                    )}
                    {usernameStatus === 'available' && (
                      <div className="pr-3 text-green-400">
                        <CheckIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  {usernameMessage && usernameStatus !== 'available' && (
                    <p className="mt-1 text-xs text-red-400">{usernameMessage}</p>
                  )}
                </div>

                {/* Password */}
                <div className={`relative transition-all duration-300 ${activeField === 'reg-password' ? 'scale-[1.02]' : ''}`}>
                  <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'reg-password' ? 'text-cyan-400' : 'text-ink-400'}`}>
                    密码
                  </label>
                  <div className={`flex items-center border-b ${activeField === 'reg-password' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                    <div className="pl-3 text-ink-400">
                      <LockIcon className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onFocus={() => setActiveField('reg-password')}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-none text-white px-3 py-2.5 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-wide text-sm"
                      placeholder="6位以上，包含字母和数字"
                      maxLength={128}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pr-3 text-ink-400 hover:text-ink-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordStrength && (
                    <div className="mt-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded ${
                              i <= passwordStrength.score
                                ? passwordStrength.score <= 1
                                  ? 'bg-red-500'
                                  : passwordStrength.score <= 2
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                : 'bg-ink-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-ink-400 mt-0.5">{passwordStrength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className={`relative transition-all duration-300 ${activeField === 'reg-confirm' ? 'scale-[1.02]' : ''}`}>
                  <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'reg-confirm' ? 'text-cyan-400' : 'text-ink-400'}`}>
                    确认密码
                  </label>
                  <div className={`flex items-center border-b ${activeField === 'reg-confirm' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                    <div className="pl-3 text-ink-400">
                      <LockIcon className="h-5 w-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onFocus={() => setActiveField('reg-confirm')}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent border-none text-white px-3 py-2.5 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-wide text-sm"
                      placeholder="再次输入密码"
                      maxLength={128}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="pr-3 text-ink-400 hover:text-ink-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-400">密码不一致</p>
                  )}
                </div>

                {/* Phone */}
                <div className={`relative transition-all duration-300 ${activeField === 'reg-phone' ? 'scale-[1.02]' : ''}`}>
                  <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'reg-phone' ? 'text-cyan-400' : 'text-ink-400'}`}>
                    手机号
                  </label>
                  <div className={`flex items-center border-b ${activeField === 'reg-phone' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                    <div className="pl-3 text-ink-400">
                      <PhoneIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onFocus={() => setActiveField('reg-phone')}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent border-none text-white px-3 py-2.5 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-wide text-sm"
                      placeholder="请输入手机号"
                      maxLength={11}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* SMS Code */}
                <div className={`relative transition-all duration-300 ${activeField === 'reg-code' ? 'scale-[1.02]' : ''}`}>
                  <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'reg-code' ? 'text-cyan-400' : 'text-ink-400'}`}>
                    验证码
                  </label>
                  <div className={`flex items-center gap-2 border-b ${activeField === 'reg-code' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                    <div className="pl-3 text-ink-400">
                      <LockIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={smsCode}
                      onFocus={() => setActiveField('reg-code')}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => setSmsCode(e.target.value)}
                      className="w-full bg-transparent border-none text-white px-3 py-2.5 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-widest text-sm"
                      placeholder="输入验证码"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0}
                      className="mr-2 px-3 py-1.5 text-xs text-cyan-300 hover:text-white border border-cyan-900/50 hover:bg-cyan-900/30 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {countdown > 0 ? `${countdown}秒` : '获取验证码'}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="text-red-400 text-xs px-1 animate-pulse flex items-center gap-1">
                    <span>!</span> {error}
                  </div>
                )}

                {/* Agreement */}
                <div className="flex items-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAgreed(!agreed)}
                    className={`flex items-center justify-center h-4 w-4 rounded border transition-colors ${
                      agreed ? 'bg-cyan-600 border-cyan-600' : 'border-ink-500 bg-transparent hover:border-cyan-500'
                    }`}
                  >
                    {agreed && <CheckIcon className="h-3 w-3 text-white" />}
                  </button>
                  <div className="ml-2 text-xs text-ink-300 font-light">
                    已阅读并同意
                    <a href="/terms" className="text-cyan-400 hover:text-cyan-200 ml-1 transition-colors">《用户协议》</a>
                    <span className="mx-1">和</span>
                    <a href="/privacy" className="text-cyan-400 hover:text-cyan-200 transition-colors">《隐私政策》</a>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-cyan-700 to-blue-800 hover:from-cyan-600 hover:to-blue-700 focus:outline-none ring-offset-2 ring-offset-ink-900 focus:ring-2 focus:ring-cyan-500 transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {isSubmitting ? (
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-200" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                  ) : (
                    <>
                      <span className="text-base font-serif tracking-widest relative z-10">注 册</span>
                      <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform relative z-10" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 切换 */}
            <div className="mt-8 pt-6 border-t border-ink-700/50">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('wechat')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all text-sm ${
                    mode === 'wechat'
                      ? 'bg-[#07C160]/20 border border-[#07C160]/40 text-[#07C160]'
                      : 'bg-white/5 border border-white/5 text-ink-400 hover:bg-white/10 hover:text-ink-200'
                  }`}
                >
                  <WeChatIcon className="h-4 w-4" />
                  <span className="text-xs">微信</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all text-sm ${
                    mode === 'login'
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                      : 'bg-white/5 border border-white/5 text-ink-400 hover:bg-white/10 hover:text-ink-200'
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="text-xs">登录</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all text-sm ${
                    mode === 'register'
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                      : 'bg-white/5 border border-white/5 text-ink-400 hover:bg-white/10 hover:text-ink-200'
                  }`}
                >
                  <ArrowRightIcon className="h-4 w-4" />
                  <span className="text-xs">注册</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer for mobile */}
        <div className="md:hidden mt-8 text-xs text-ink-500 text-center">
          灵机一动 · 笔下生花
        </div>

        {/* Desktop Copyright */}
        <div className="absolute bottom-6 text-[10px] text-ink-600 hidden md:block tracking-widest">
           灵机科技
        </div>
      </div>

      {/* 微信登录 JS SDK */}
      <Script
        src="https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js"
        onLoad={() => setWxSdkLoaded(true)}
      />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-ink-950 flex items-center justify-center">
        <div className="text-cyan-400">加载中...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
