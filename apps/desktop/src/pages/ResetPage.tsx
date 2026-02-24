import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, WarningCircle, Trash } from '@phosphor-icons/react'
import { resetApp } from '../services/api'

export function ResetPage() {
  const navigate = useNavigate()
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (confirmation !== 'APAGAR DADOS') {
      setError('Digite exatamente "APAGAR DADOS" para confirmar')
      return
    }

    setLoading(true)

    try {
      const response = await resetApp(confirmation)

      if (!response.success) {
        setError(response.error?.message || 'Erro ao resetar')
        return
      }

      navigate('/setup')
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <Trash size={32} weight="duotone" className="text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Esqueceu a senha?</h1>
          <p className="text-muted-foreground mt-2">
            Não é possível recuperar a senha. Você precisará apagar todos os dados.
          </p>
        </div>

        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          <strong>Atenção:</strong> Isso irá apagar permanentemente:
          <ul className="mt-2 ml-4 list-disc">
            <li>Todos os dispositivos cadastrados</li>
            <li>Histórico de leituras</li>
            <li>Credenciais armazenadas</li>
            <li>Todas as configurações</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="confirmation"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Digite <strong>APAGAR DADOS</strong> para confirmar
            </label>
            <input
              id="confirmation"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="APAGAR DADOS"
              disabled={loading}
              autoFocus
              className="focus:border-destructive focus:[box-shadow:0_0_0_2px_rgba(239,68,68,0.12),0_0_8px_rgba(239,68,68,0.08)]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              <WarningCircle size={16} weight="bold" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || confirmation !== 'APAGAR DADOS'}
            className="w-full py-2 px-4 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Apagando...' : 'Apagar tudo e recomeçar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} weight="bold" />
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  )
}
