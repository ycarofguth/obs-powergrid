import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Minus,
  ArrowCounterClockwise,
  Copy,
  Check,
  ArrowSquareOut,
} from '@phosphor-icons/react'
import {
  getCounterState,
  incrementCounter,
  decrementCounter,
  resetCounter,
  updateCounterConfig,
  getCounterOverlayUrl,
  type CounterState,
} from '../services/api'

export function CounterPage() {
  const navigate = useNavigate()

  const [state, setState] = useState<CounterState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Local form state
  const [label, setLabel] = useState('')
  const [step, setStep] = useState(1)
  const [min, setMin] = useState<string>('')
  const [max, setMax] = useState<string>('')
  const isEditingRef = useRef(false)

  const fetchState = useCallback(async () => {
    try {
      const response = await getCounterState()
      if (response.success && response.data) {
        setState(response.data)
        // Sync form state from server on first load (and not editing)
        if (!state && !isEditingRef.current) {
          setLabel(response.data.label)
          setStep(response.data.step)
          setMin(response.data.min !== null ? String(response.data.min) : '')
          setMax(response.data.max !== null ? String(response.data.max) : '')
        }
        setError(null)
      } else {
        setError(response.error?.message || 'Erro ao carregar contador')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchState()
  }, [fetchState])

  // Poll every 500ms
  useEffect(() => {
    const interval = setInterval(fetchState, 500)
    return () => clearInterval(interval)
  }, [fetchState])

  const handleUpdateConfig = async () => {
    try {
      const response = await updateCounterConfig({
        label,
        step,
        min: min !== '' ? Number(min) : null,
        max: max !== '' ? Number(max) : null,
      })
      if (response.success && response.data) {
        setState(response.data)
      }
    } catch {
      setError('Erro ao atualizar configuração')
    }
  }

  const handleIncrement = async () => {
    try {
      const response = await incrementCounter()
      if (response.success && response.data) {
        setState(response.data)
      }
    } catch {
      setError('Erro ao incrementar')
    }
  }

  const handleDecrement = async () => {
    try {
      const response = await decrementCounter()
      if (response.success && response.data) {
        setState(response.data)
      }
    } catch {
      setError('Erro ao decrementar')
    }
  }

  const handleReset = async () => {
    try {
      const response = await resetCounter()
      if (response.success && response.data) {
        setState(response.data)
      }
    } catch {
      setError('Erro ao resetar contador')
    }
  }

  const handleCopyUrl = () => {
    const url = getCounterOverlayUrl()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const overlayUrl = getCounterOverlayUrl()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-3">
          <button
            onClick={() => navigate('/tools')}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Contador</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* Configuration */}
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-3">Configuração</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Label</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onFocus={() => (isEditingRef.current = true)}
                    onBlur={() => {
                      isEditingRef.current = false
                      handleUpdateConfig()
                    }}
                    placeholder="Ex: Mortes, Vitórias"
                    className="w-full px-3 py-2 bg-secondary rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Passo</label>
                  <input
                    type="number"
                    min="1"
                    value={step}
                    onChange={(e) => setStep(Math.max(1, parseInt(e.target.value) || 1))}
                    onFocus={() => (isEditingRef.current = true)}
                    onBlur={() => {
                      isEditingRef.current = false
                      handleUpdateConfig()
                    }}
                    className="w-full px-3 py-2 bg-secondary rounded-md text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Valor mínimo (opcional)
                    </label>
                    <input
                      type="number"
                      value={min}
                      onChange={(e) => setMin(e.target.value)}
                      onFocus={() => (isEditingRef.current = true)}
                      onBlur={() => {
                        isEditingRef.current = false
                        handleUpdateConfig()
                      }}
                      placeholder="Sem limite"
                      className="w-full px-3 py-2 bg-secondary rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Valor máximo (opcional)
                    </label>
                    <input
                      type="number"
                      value={max}
                      onChange={(e) => setMax(e.target.value)}
                      onFocus={() => (isEditingRef.current = true)}
                      onBlur={() => {
                        isEditingRef.current = false
                        handleUpdateConfig()
                      }}
                      placeholder="Sem limite"
                      className="w-full px-3 py-2 bg-secondary rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Control buttons */}
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-3">Controles</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDecrement}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-destructive text-destructive-foreground rounded-md text-lg font-bold hover:bg-destructive/80 active:scale-95 transition-transform"
                >
                  <Minus size={24} weight="bold" />
                </button>
                <button
                  onClick={handleIncrement}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-success text-success-foreground rounded-md text-lg font-bold hover:bg-success/80 active:scale-95 transition-transform"
                >
                  <Plus size={24} weight="bold" />
                </button>
              </div>
              <button
                onClick={handleReset}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-muted-foreground rounded-md text-sm hover:text-foreground hover:bg-secondary/80"
              >
                <ArrowCounterClockwise size={16} weight="bold" />
                Resetar
              </button>
            </section>

            {/* Overlay URL */}
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-3">URL do Overlay</h2>
              <p className="text-xs text-muted-foreground mb-2">
                Use esta URL como Browser Source no OBS
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={overlayUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-secondary text-sm rounded-md font-mono text-muted-foreground"
                />
                <button
                  onClick={handleCopyUrl}
                  className="p-2 bg-secondary hover:bg-secondary/80 rounded-md"
                  title="Copiar URL"
                >
                  {copied ? (
                    <Check size={18} weight="bold" className="text-success" />
                  ) : (
                    <Copy size={18} weight="bold" />
                  )}
                </button>
                <a
                  href={overlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-secondary hover:bg-secondary/80 rounded-md"
                  title="Abrir em nova aba"
                >
                  <ArrowSquareOut size={18} weight="bold" />
                </a>
              </div>
            </section>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-3">Pré-visualização</h2>
              <div
                className="min-h-[200px] rounded-md overflow-hidden flex flex-col items-center justify-center gap-3"
                style={{ background: '#1a1a1a' }}
              >
                {state?.label && <div className="text-sm text-white/60">{state.label}</div>}
                <div className="text-6xl font-mono font-bold text-white">{state?.value ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
