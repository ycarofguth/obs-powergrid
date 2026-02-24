import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  ArrowCounterClockwise,
  Copy,
  Check,
  ArrowSquareOut,
} from '@phosphor-icons/react'
import {
  getTimerState,
  startTimer,
  pauseTimer,
  stopTimer,
  resetTimer,
  updateTimerConfig,
  getTimerOverlayUrl,
  type TimerState,
} from '../services/api'

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function computeDisplayMs(state: TimerState): number {
  let elapsed = state.elapsedMs
  if (state.status === 'running' && state.startedAt) {
    elapsed += Date.now() - state.startedAt
  }

  if (state.direction === 'down' && state.targetMs !== null) {
    const remaining = state.targetMs - elapsed
    return Math.max(0, remaining)
  }

  return elapsed
}

export function TimerPage() {
  const navigate = useNavigate()

  const [state, setState] = useState<TimerState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [displayMs, setDisplayMs] = useState(0)

  // Local form state
  const [label, setLabel] = useState('')
  const [direction, setDirection] = useState<'up' | 'down'>('up')
  const [targetMinutes, setTargetMinutes] = useState(5)
  const [targetSeconds, setTargetSeconds] = useState(0)

  const animFrameRef = useRef<number>(0)
  const stateRef = useRef<TimerState | null>(null)
  const isEditingRef = useRef(false)

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Tick loop for smooth display when running
  useEffect(() => {
    function tick() {
      if (stateRef.current) {
        setDisplayMs(computeDisplayMs(stateRef.current))
      }
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  const fetchState = useCallback(async () => {
    try {
      const response = await getTimerState()
      if (response.success && response.data) {
        setState(response.data)
        setDisplayMs(computeDisplayMs(response.data))
        // Sync form state from server only on initial load or when stopped (and not editing)
        if (!stateRef.current || (response.data.status === 'stopped' && !isEditingRef.current)) {
          setLabel(response.data.label)
          setDirection(response.data.direction)
          if (response.data.targetMs !== null) {
            const totalSec = Math.floor(response.data.targetMs / 1000)
            setTargetMinutes(Math.floor(totalSec / 60))
            setTargetSeconds(totalSec % 60)
          }
        }
        setError(null)
      } else {
        setError(response.error?.message || 'Erro ao carregar timer')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
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
      const targetMs = direction === 'down' ? (targetMinutes * 60 + targetSeconds) * 1000 : null
      const response = await updateTimerConfig({ label, direction, targetMs })
      if (response.success && response.data) {
        setState(response.data)
      }
    } catch {
      setError('Erro ao atualizar configuração')
    }
  }

  const handleStart = async () => {
    try {
      // Send config first if stopped
      if (state?.status === 'stopped') {
        await handleUpdateConfig()
      }
      const response = await startTimer()
      if (response.success && response.data) {
        setState(response.data)
      }
    } catch {
      setError('Erro ao iniciar timer')
    }
  }

  const handlePause = async () => {
    try {
      const response = await pauseTimer()
      if (response.success && response.data) {
        setState(response.data)
      }
    } catch {
      setError('Erro ao pausar timer')
    }
  }

  const handleStop = async () => {
    try {
      const response = await stopTimer()
      if (response.success && response.data) {
        setState(response.data)
      }
    } catch {
      setError('Erro ao parar timer')
    }
  }

  const handleReset = async () => {
    try {
      const response = await resetTimer()
      if (response.success && response.data) {
        setState(response.data)
        setDisplayMs(computeDisplayMs(response.data))
      }
    } catch {
      setError('Erro ao resetar timer')
    }
  }

  const handleCopyUrl = () => {
    const url = getTimerOverlayUrl()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const overlayUrl = getTimerOverlayUrl()

  const isRunning = state?.status === 'running'
  const isPaused = state?.status === 'paused'
  const isStopped = state?.status === 'stopped' || !state

  const statusLabel =
    state?.status === 'running' ? 'Rodando' : state?.status === 'paused' ? 'Pausado' : 'Parado'

  const statusColor =
    state?.status === 'running'
      ? 'text-success'
      : state?.status === 'paused'
        ? 'text-warning'
        : 'text-muted-foreground'

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
          <h1 className="text-xl font-bold text-foreground">Timer</h1>
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
            {/* Label */}
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
                    placeholder="Ex: Tempo de stream"
                    className="w-full px-3 py-2 bg-secondary rounded-md text-sm"
                    disabled={isRunning}
                  />
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Direção</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDirection('up')
                        if (isStopped) {
                          updateTimerConfig({ label, direction: 'up', targetMs: null })
                            .then((r) => {
                              if (r.success && r.data) setState(r.data)
                            })
                            .catch(() => {})
                        }
                      }}
                      disabled={isRunning || isPaused}
                      className={`flex-1 px-4 py-2 rounded-md text-sm disabled:opacity-50 ${
                        direction === 'up' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                      }`}
                    >
                      Cronômetro
                    </button>
                    <button
                      onClick={() => {
                        setDirection('down')
                        if (isStopped) {
                          const tMs = (targetMinutes * 60 + targetSeconds) * 1000
                          updateTimerConfig({ label, direction: 'down', targetMs: tMs })
                            .then((r) => {
                              if (r.success && r.data) setState(r.data)
                            })
                            .catch(() => {})
                        }
                      }}
                      disabled={isRunning || isPaused}
                      className={`flex-1 px-4 py-2 rounded-md text-sm disabled:opacity-50 ${
                        direction === 'down' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                      }`}
                    >
                      Contagem regressiva
                    </button>
                  </div>
                </div>

                {/* Target time (countdown only) */}
                {direction === 'down' && (
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Tempo alvo</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-muted-foreground mb-1">Minutos</label>
                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={targetMinutes}
                          onChange={(e) =>
                            setTargetMinutes(Math.max(0, parseInt(e.target.value) || 0))
                          }
                          onFocus={() => (isEditingRef.current = true)}
                          onBlur={() => {
                            isEditingRef.current = false
                            handleUpdateConfig()
                          }}
                          className="w-full px-3 py-2 bg-secondary rounded-md text-sm"
                          disabled={isRunning || isPaused}
                        />
                      </div>
                      <span className="text-lg text-muted-foreground mt-4">:</span>
                      <div className="flex-1">
                        <label className="block text-xs text-muted-foreground mb-1">Segundos</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={targetSeconds}
                          onChange={(e) =>
                            setTargetSeconds(
                              Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                            )
                          }
                          onFocus={() => (isEditingRef.current = true)}
                          onBlur={() => {
                            isEditingRef.current = false
                            handleUpdateConfig()
                          }}
                          className="w-full px-3 py-2 bg-secondary rounded-md text-sm"
                          disabled={isRunning || isPaused}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Control buttons */}
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-3">Controles</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStart}
                  disabled={isRunning}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-success text-success-foreground rounded-md text-sm hover:bg-success/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} weight="bold" />
                  Iniciar
                </button>
                <button
                  onClick={handlePause}
                  disabled={!isRunning}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-warning text-warning-foreground rounded-md text-sm hover:bg-warning/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pause size={18} weight="bold" />
                  Pausar
                </button>
                <button
                  onClick={handleStop}
                  disabled={isStopped}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-destructive text-destructive-foreground rounded-md text-sm hover:bg-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Square size={18} weight="bold" />
                  Parar
                </button>
                <button
                  onClick={handleReset}
                  className="p-3 bg-secondary text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/80"
                  title="Resetar"
                >
                  <ArrowCounterClockwise size={18} weight="bold" />
                </button>
              </div>
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
                className="min-h-[200px] rounded-md overflow-hidden flex flex-col items-center justify-center gap-4"
                style={{ background: '#1a1a1a' }}
              >
                {label && <div className="text-sm text-white/60">{label}</div>}
                <div className="text-5xl font-mono font-bold text-white tracking-wider">
                  {formatTime(displayMs)}
                </div>
                <div className={`flex items-center gap-2 text-sm ${statusColor}`}>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      state?.status === 'running'
                        ? 'bg-success animate-pulse'
                        : state?.status === 'paused'
                          ? 'bg-warning'
                          : 'bg-muted-foreground'
                    }`}
                  />
                  {statusLabel}
                </div>
                {state?.direction === 'down' && state?.targetMs !== null && (
                  <div className="text-xs text-white/40">Alvo: {formatTime(state.targetMs)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
