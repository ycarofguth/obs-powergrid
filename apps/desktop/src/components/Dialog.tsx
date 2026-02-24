import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { X, Warning, WarningCircle, Info, CheckCircle, Question } from '@phosphor-icons/react'

// ==================== Types ====================

type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm'

interface DialogButton {
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  onClick?: () => void | Promise<void>
}

interface DialogOptions {
  type: DialogType
  title: string
  message: string | ReactNode
  buttons?: DialogButton[]
  onClose?: () => void
}

interface DialogContextValue {
  show: (options: DialogOptions) => void
  hide: () => void
  alert: (title: string, message: string) => Promise<void>
  success: (title: string, message: string) => Promise<void>
  warning: (title: string, message: string) => Promise<void>
  error: (title: string, message: string) => Promise<void>
  confirm: (title: string, message: string) => Promise<boolean>
}

// ==================== Context ====================

const DialogContext = createContext<DialogContextValue | null>(null)

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}

// ==================== Provider ====================

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const show = useCallback((options: DialogOptions) => {
    setDialog(options)
  }, [])

  const hide = useCallback(() => {
    setDialog(null)
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const alert = useCallback((title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        type: 'info',
        title,
        message,
        buttons: [
          {
            label: 'OK',
            variant: 'primary',
            onClick: () => {
              setDialog(null)
              resolve()
            },
          },
        ],
      })
    })
  }, [])

  const success = useCallback((title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        type: 'success',
        title,
        message,
        buttons: [
          {
            label: 'OK',
            variant: 'primary',
            onClick: () => {
              setDialog(null)
              resolve()
            },
          },
        ],
      })
    })
  }, [])

  const warning = useCallback((title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        type: 'warning',
        title,
        message,
        buttons: [
          {
            label: 'Entendi',
            variant: 'primary',
            onClick: () => {
              setDialog(null)
              resolve()
            },
          },
        ],
      })
    })
  }, [])

  const error = useCallback((title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        type: 'error',
        title,
        message,
        buttons: [
          {
            label: 'OK',
            variant: 'primary',
            onClick: () => {
              setDialog(null)
              resolve()
            },
          },
        ],
      })
    })
  }, [])

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve)
      setDialog({
        type: 'confirm',
        title,
        message,
        buttons: [
          {
            label: 'Cancelar',
            variant: 'ghost',
            onClick: () => {
              setDialog(null)
              setResolvePromise(null)
              resolve(false)
            },
          },
          {
            label: 'Confirmar',
            variant: 'danger',
            onClick: () => {
              setDialog(null)
              setResolvePromise(null)
              resolve(true)
            },
          },
        ],
      })
    })
  }, [])

  const value: DialogContextValue = { show, hide, alert, success, warning, error, confirm }

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog && <DialogComponent {...dialog} onClose={hide} />}
    </DialogContext.Provider>
  )
}

// ==================== Component ====================

const typeConfig: Record<DialogType, { icon: ReactNode; iconBg: string; iconColor: string }> = {
  info: {
    icon: <Info size={24} weight="duotone" />,
    iconBg: 'bg-primary/12',
    iconColor: 'text-primary',
  },
  success: {
    icon: <CheckCircle size={24} weight="duotone" />,
    iconBg: 'bg-success/12',
    iconColor: 'text-success',
  },
  warning: {
    icon: <Warning size={24} weight="duotone" />,
    iconBg: 'bg-warning/12',
    iconColor: 'text-warning',
  },
  error: {
    icon: <WarningCircle size={24} weight="duotone" />,
    iconBg: 'bg-destructive/12',
    iconColor: 'text-destructive',
  },
  confirm: {
    icon: <Question size={24} weight="duotone" />,
    iconBg: 'bg-primary/12',
    iconColor: 'text-primary',
  },
}

const buttonVariants: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold',
  ghost: 'bg-transparent text-muted-foreground hover:bg-[var(--hover-bg-subtle)]',
}

function DialogComponent({
  type,
  title,
  message,
  buttons,
  onClose,
}: DialogOptions & { onClose: () => void }) {
  const config = typeConfig[type]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const dialogButtons = buttons || [{ label: 'OK', variant: 'primary' as const, onClick: onClose }]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          <div className="flex gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.iconBg} ${config.iconColor}`}
            >
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
              <div className="mt-2 text-sm text-muted-foreground">
                {typeof message === 'string' ? <p>{message}</p> : message}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {dialogButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className={`px-4 py-2 text-sm rounded transition-all ${buttonVariants[button.variant || 'primary']}`}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { DialogComponent as Dialog }
