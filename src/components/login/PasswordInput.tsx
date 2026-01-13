'use client'

import { useState, forwardRef } from 'react'
import { LockIcon, EyeIcon, EyeOffIcon } from './Icons'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  onFocus?: () => void
  onBlur?: () => void
  isActive?: boolean
  maxLength?: number
  autoComplete?: string
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({
  value,
  onChange,
  placeholder = '请输入密码',
  label = '密码',
  error,
  onFocus,
  onBlur,
  isActive = false,
  maxLength = 128,
  autoComplete = 'current-password',
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={`relative transition-all duration-300 ${isActive ? 'scale-[1.02]' : ''}`}>
      <label className={`absolute left-0 -top-5 text-xs transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-ink-400'}`}>
        {label}
      </label>
      <div className={`flex items-center border-b ${
        error
          ? 'border-red-500'
          : isActive
            ? 'border-cyan-400 shadow-[0_4px_12px_-4px_rgba(34,211,238,0.2)]'
            : 'border-ink-600'
      } transition-all duration-300 bg-ink-800/20 rounded-t-sm`}>
        <div className="pl-3 text-ink-400">
          <LockIcon className="h-5 w-5" />
        </div>
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-none text-white px-3 py-3 focus:ring-0 focus:outline-none placeholder-ink-600 font-sans tracking-wide"
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="pr-3 text-ink-400 hover:text-ink-200 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
})

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
