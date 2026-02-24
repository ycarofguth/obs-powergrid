import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lightning, WarningCircle } from '@phosphor-icons/react'
import { PasswordInput } from '../components/PasswordInput'
import { login } from '../services/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password) {
      setError('Digite sua senha')
      return
    }

    setLoading(true)

    try {
      const response = await login(password)

      if (!response.success) {
        if (response.error?.code === 'INVALID_PASSWORD') {
          setError('Senha incorreta')
        } else {
          setError(response.error?.message || 'Erro ao fazer login')
        }
        return
      }

      navigate('/devices')
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/5 backdrop-blur-sm mb-4 [&>span]:[filter:drop-shadow(0_0_6px_rgba(59,130,246,0.7))]">
            <span className="block text-primary">
              <Lightning size={32} weight="fill" />
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-wide">
            PowerGrid
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Digite sua senha para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
              Senha
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="Digite sua senha"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              <WarningCircle size={16} weight="fill" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/reset"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </div>
  )
}
