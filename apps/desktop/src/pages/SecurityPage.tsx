import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, WarningCircle, SignOut, Trash, Key } from '@phosphor-icons/react'
import { PasswordInput } from '../components/PasswordInput'
import { changePassword, resetApp, logout } from '../services/api'
import { GlowIcon } from '../components/GlowIcon'

type View = 'main' | 'change-password' | 'reset'

export function SecurityPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('main')

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changeError, setChangeError] = useState<string | null>(null)
  const [changeLoading, setChangeLoading] = useState(false)

  // Reset state
  const [confirmation, setConfirmation] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangeError(null)

    if (newPassword.length < 8) {
      setChangeError('A nova senha deve ter no mínimo 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setChangeError('As senhas não coincidem')
      return
    }

    setChangeLoading(true)

    try {
      const response = await changePassword(currentPassword, newPassword)

      if (!response.success) {
        if (response.error?.code === 'INVALID_PASSWORD') {
          setChangeError('Senha atual incorreta')
        } else {
          setChangeError(response.error?.message || 'Erro ao alterar senha')
        }
        return
      }

      // Limpa e volta para a view principal
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setView('main')
      alert('Senha alterada com sucesso!')
    } catch (err) {
      setChangeError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setChangeLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError(null)

    if (confirmation !== 'APAGAR DADOS') {
      setResetError('Digite exatamente "APAGAR DADOS" para confirmar')
      return
    }

    setResetLoading(true)

    try {
      const response = await resetApp(confirmation)

      if (!response.success) {
        setResetError(response.error?.message || 'Erro ao resetar')
        return
      }

      navigate('/setup')
    } catch (err) {
      setResetError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setResetLoading(false)
    }
  }

  if (view === 'change-password') {
    return (
      <div>
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-4">
            <button
              onClick={() => setView('main')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Alterar senha</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Senha atual
                </label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Digite sua senha atual"
                  disabled={changeLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Nova senha
                </label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Mínimo 8 caracteres"
                  disabled={changeLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Confirmar nova senha
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Digite a nova senha novamente"
                  disabled={changeLoading}
                />
              </div>

              {changeError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  <WarningCircle size={16} weight="bold" />
                  {changeError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setView('main')}
                  className="flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changeLoading}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium"
                >
                  {changeLoading ? 'Alterando...' : 'Alterar senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'reset') {
    return (
      <div>
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-4">
            <button
              onClick={() => setView('main')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Resetar app</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-card border border-destructive/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <GlowIcon icon={<Trash size={20} weight="duotone" />} color="destructive" />
              <div>
                <h2 className="font-medium text-foreground">Apagar todos os dados</h2>
                <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              <strong>Atenção:</strong> Isso irá apagar permanentemente:
              <ul className="mt-2 ml-4 list-disc">
                <li>Todos os dispositivos cadastrados</li>
                <li>Histórico de leituras</li>
                <li>Credenciais armazenadas</li>
                <li>Todas as configurações</li>
              </ul>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
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
                  disabled={resetLoading}
                  className="focus:border-destructive focus:[box-shadow:0_0_0_2px_rgba(239,68,68,0.12),0_0_8px_rgba(239,68,68,0.08)]"
                />
              </div>

              {resetError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  <WarningCircle size={16} weight="bold" />
                  {resetError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setView('main')}
                  className="flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || confirmation !== 'APAGAR DADOS'}
                  className="flex-1 py-2 px-4 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 font-medium"
                >
                  {resetLoading ? 'Apagando...' : 'Apagar tudo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Main view
  return (
    <div>
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">Segurança</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-card border border-border rounded-lg">
          <button
            onClick={() => setView('change-password')}
            className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <GlowIcon icon={<Key size={20} weight="duotone" />} color="primary" />
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Alterar senha</h3>
              <p className="text-sm text-muted-foreground">Mude sua senha de acesso ao app</p>
            </div>
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <GlowIcon icon={<SignOut size={20} weight="duotone" />} color="secondary" />
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Sair</h3>
              <p className="text-sm text-muted-foreground">
                Bloqueia o app (requer senha ao abrir)
              </p>
            </div>
          </button>
        </div>

        <div className="bg-card border border-destructive/20 rounded-lg">
          <button
            onClick={() => setView('reset')}
            className="w-full flex items-center gap-4 p-4 text-left hover:bg-destructive/5 rounded-lg transition-colors"
          >
            <GlowIcon icon={<Trash size={20} weight="duotone" />} color="destructive" />
            <div className="flex-1">
              <h3 className="font-medium text-destructive">Resetar app</h3>
              <p className="text-sm text-muted-foreground">Apaga todos os dados permanentemente</p>
            </div>
          </button>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">OBS PowerGrid v0.1.0</p>
        </div>
      </div>
    </div>
  )
}
