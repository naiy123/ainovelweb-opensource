'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import Background from '@/components/login/Background'
import { LogoIcon, UserIcon, LockIcon, PhoneIcon, ArrowRightIcon, CheckIcon, EyeIcon, EyeOffIcon } from '@/components/login/Icons'
import { checkPasswordStrength } from '@/lib/validators/password'

export default function RegisterPage() {
  const router = useRouter()

  // 表单状态
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeField, setActiveField] = useState<string | null>(null)

  // 验证码倒计时
  const [countdown, setCountdown] = useState(0)

  // 用户名检查
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameMessage, setUsernameMessage] = useState('')

  // 密码强度
  const passwordStrength = password ? checkPasswordStrength(password) : null

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

  // 检查用户名可用性（防抖）
  useEffect(() => {
    if (!username || username.length < 4) {
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
  }, [username])

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

  // 注册提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 验证
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
        // 自动登录
        const result = await signIn('credentials', {
          username: username.trim(),
          password,
          redirect: false,
        })
        if (result?.error) {
          router.push('/login')
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

  return (
    <div className="min-h-screen w-full font-sans text-ink-50 relative flex flex-col md:flex-row overflow-hidden">
      <Background />

      {/* 装饰边框 */}
      <div className="fixed top-4 left-4 right-4 bottom-4 border border-white/5 rounded-3xl pointer-events-none z-50 hidden md:block"></div>

      {/* Left Panel */}
      <div className="relative w-full md:w-1/2 lg:w-3/5 p-8 md:p-12 lg:p-20 flex flex-col justify-between z-10 min-h-[20vh] md:h-screen pointer-events-none">
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

        <div className="hidden md:flex flex-row-reverse items-start mt-10 h-full max-h-[60vh]">
           <div className="vertical-text text-5xl lg:text-6xl font-serif font-bold tracking-wider leading-relaxed text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-ink-400 opacity-90 hover:opacity-100 transition-opacity ml-8 border-r border-white/10 pr-8">
              开启创作
           </div>
           <div className="vertical-text text-5xl lg:text-6xl font-serif font-bold tracking-wider leading-relaxed text-transparent bg-clip-text bg-gradient-to-b from-ink-300 via-ink-100 to-white opacity-60 ml-8">
              加入我们
           </div>
        </div>
      </div>

      {/* Right Panel - 注册表单 */}
      <div className="relative w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-6 md:p-8 z-20">
        <div className="w-full max-w-md relative z-10 perspective-1000">
          <div className="relative p-8 md:p-10 backdrop-blur-2xl bg-ink-900/60 border border-ink-600/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl"></div>

            <div className="mb-8 text-center relative">
              <h2 className="text-3xl font-bold text-white mb-2 font-serif tracking-widest">创建账号</h2>
              <div className="flex justify-center items-center gap-2">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
                <p className="text-cyan-200/70 text-xs tracking-wider">开启你的创作之旅</p>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
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
                  <div className="mt-2">
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
                    <p className="text-xs text-ink-400 mt-1">{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className={`relative transition-all duration-300 ${activeField === 'confirmPassword' ? 'scale-[1.02]' : ''}`}>
                <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'confirmPassword' ? 'text-cyan-400' : 'text-ink-400'}`}>
                  确认密码
                </label>
                <div className={`flex items-center border-b ${activeField === 'confirmPassword' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                  <div className="pl-3 text-ink-400">
                    <LockIcon className="h-5 w-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onFocus={() => setActiveField('confirmPassword')}
                    onBlur={() => setActiveField(null)}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent border-none text-white px-3 py-3 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-wide"
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
              <div className={`relative transition-all duration-300 ${activeField === 'phone' ? 'scale-[1.02]' : ''}`}>
                <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'phone' ? 'text-cyan-400' : 'text-ink-400'}`}>
                  手机号
                </label>
                <div className={`flex items-center border-b ${activeField === 'phone' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                  <div className="pl-3 text-ink-400">
                    <PhoneIcon className="h-5 w-5" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onFocus={() => setActiveField('phone')}
                    onBlur={() => setActiveField(null)}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent border-none text-white px-3 py-3 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-wide"
                    placeholder="请输入手机号"
                    maxLength={11}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* SMS Code */}
              <div className={`relative transition-all duration-300 ${activeField === 'smsCode' ? 'scale-[1.02]' : ''}`}>
                <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'smsCode' ? 'text-cyan-400' : 'text-ink-400'}`}>
                  验证码
                </label>
                <div className={`flex items-center gap-2 border-b ${activeField === 'smsCode' ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                  <div className="pl-3 text-ink-400">
                    <LockIcon className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={smsCode}
                    onFocus={() => setActiveField('smsCode')}
                    onBlur={() => setActiveField(null)}
                    onChange={(e) => setSmsCode(e.target.value)}
                    className="w-full bg-transparent border-none text-white px-3 py-3 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-widest"
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
              <div className="flex items-center pt-2">
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
                className="group w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-cyan-700 to-blue-800 hover:from-cyan-600 hover:to-blue-700 focus:outline-none ring-offset-2 ring-offset-ink-900 focus:ring-2 focus:ring-cyan-500 transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Login Link */}
              <div className="text-center text-sm text-ink-400">
                已有账号？
                <Link href="/login" className="text-cyan-400 hover:text-cyan-200 ml-1 transition-colors">
                  立即登录
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="md:hidden mt-8 text-xs text-ink-500 text-center">
          灵机一动 · 笔下生花
        </div>
      </div>
    </div>
  )
}
