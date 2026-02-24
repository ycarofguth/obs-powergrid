import { useState } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'

interface PasswordInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Senha',
  disabled = false,
  autoFocus = false,
  className = '',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground
          hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
