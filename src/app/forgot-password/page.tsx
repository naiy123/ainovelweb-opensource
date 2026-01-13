'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import Background from '@/components/login/Background'
import { LogoIcon, UserIcon, LockIcon, ArrowRightIcon, EyeIcon, EyeOffIcon } from '@/components/login/Icons'
import { checkPasswordStrength } from '@/lib/validators/password'

type Step = 'request' | 'reset' | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('request')
  const [username, setUsername] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const passwordStrength = newPassword ? checkPasswordStrength(newPassword) : null

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown])

  // 请求发送验证码
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/password/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        setMaskedPhone(data.maskedPhone || '***')
        setStep('reset')
        setCountdown(60)
        toast.success('验证码已发送')
      } else {
        setError(data.message || '请求失败')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 重新发送验证码
  const handleResendCode = useCallback(async () => {
    if (countdown > 0) return

    setError(null)
    try {
      const res = await fetch('/api/auth/password/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        setCountdown(60)
        toast.success('验证码已发送')
      } else {
        setError(data.message || '发送失败')
      }
    } catch {
      setError('网络错误，请重试')
    }
  }, [username, countdown])

  // 重置密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!smsCode || smsCode.length < 4) {
      setError('请输入验证码')
      return
    }
    if (!newPassword) {
      setError('请输入新密码')
      return
    }
    if (passwordStrength && passwordStrength.score < 2) {
      setError('密码强度不足')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          smsCode,
          newPassword,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setStep('success')
        toast.success('密码重置成功')
      } else {
        setError(data.message || '重置失败')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full font-sans text-ink-50 relative flex flex-col md:flex-row overflow-hidden">
      <Background />

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
      </div>

      {/* Right Panel */}
      <div className="relative w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-6 md:p-8 z-20">
        <div className="w-full max-w-md relative z-10 perspective-1000">
          <div className="relative p-8 md:p-10 backdrop-blur-2xl bg-ink-900/60 border border-ink-600/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl"></div>

            {step === 'request' && (
              <>
                <div className="mb-8 text-center relative">
                  <h2 className="text-3xl font-bold text-white mb-2 font-serif tracking-widest">找回密码</h2>
                  <div className="flex justify-center items-center gap-2">
                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
                    <p className="text-cyan-200/70 text-xs tracking-wider">输入用户名以继续</p>
                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
                  </div>
                </div>

                <form onSubmit={handleRequestReset} className="space-y-6">
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
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-400 text-xs px-1 animate-pulse flex items-center gap-1">
                      <span>!</span> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-cyan-700 to-blue-800 hover:from-cyan-600 hover:to-blue-700 focus:outline-none transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                       <svg className="animate-spin h-5 w-5 text-cyan-200" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                       </svg>
                    ) : (
                      <>
                        <span className="text-base font-serif tracking-widest">下一步</span>
                        <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="text-center text-sm text-ink-400">
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-200 transition-colors">
                      返回登录
                    </Link>
                  </div>
                </form>
              </>
            )}

            {step === 'reset' && (
              <>
                <div className="mb-8 text-center relative">
                  <h2 className="text-3xl font-bold text-white mb-2 font-serif tracking-widest">重置密码</h2>
                  <div className="flex justify-center items-center gap-2">
                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
                    <p className="text-cyan-200/70 text-xs tracking-wider">验证码已发送至 {maskedPhone}</p>
                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
                  </div>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  {/* SMS Code */}
                  <div className={`relative transition-all duration-300 ${activeField === 'smsCode' ? 'scale-[1.02]' : ''}`}>
                    <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'smsCode' ? 'text-cyan-400' : 'text-ink-400'}`}>
                      验证码
                    </label>
                    <div className={`flex items-center gap-2 border-b ${activeField === 'smsCode' ? 'border-cyan-400' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
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
                        onClick={handleResendCode}
                        disabled={countdown > 0}
                        className="mr-2 px-3 py-1.5 text-xs text-cyan-300 hover:text-white border border-cyan-900/50 hover:bg-cyan-900/30 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {countdown > 0 ? `${countdown}秒` : '重新发送'}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className={`relative transition-all duration-300 ${activeField === 'newPassword' ? 'scale-[1.02]' : ''}`}>
                    <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${activeField === 'newPassword' ? 'text-cyan-400' : 'text-ink-400'}`}>
                      新密码
                    </label>
                    <div className={`flex items-center border-b ${activeField === 'newPassword' ? 'border-cyan-400' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
                      <div className="pl-3 text-ink-400">
                        <LockIcon className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onFocus={() => setActiveField('newPassword')}
                        onBlur={() => setActiveField(null)}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                      确认新密码
                    </label>
                    <div className={`flex items-center border-b ${activeField === 'confirmPassword' ? 'border-cyan-400' : 'border-ink-600'} transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
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
                        placeholder="再次输入新密码"
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
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-400">密码不一致</p>
                    )}
                  </div>

                  {error && (
                    <div className="text-red-400 text-xs px-1 animate-pulse flex items-center gap-1">
                      <span>!</span> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-cyan-700 to-blue-800 hover:from-cyan-600 hover:to-blue-700 focus:outline-none transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                       <svg className="animate-spin h-5 w-5 text-cyan-200" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                       </svg>
                    ) : (
                      <span className="text-base font-serif tracking-widest">重置密码</span>
                    )}
                  </button>

                  <div className="text-center text-sm text-ink-400">
                    <button
                      type="button"
                      onClick={() => setStep('request')}
                      className="text-cyan-400 hover:text-cyan-200 transition-colors"
                    >
                      返回上一步
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 font-serif tracking-widest">密码重置成功</h2>
                <p className="text-ink-400 mb-8">请使用新密码登录</p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center py-3 px-8 border border-transparent rounded-lg text-white bg-gradient-to-r from-cyan-700 to-blue-800 hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  前往登录
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
