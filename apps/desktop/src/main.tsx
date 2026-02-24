import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { DialogProvider } from './components/Dialog'
import { ThemeProvider } from './components/ThemeProvider'
import './styles/globals.css'

async function setupNativeMenu() {
  const { window: neuWindow } = await import('@neutralinojs/lib')

  await neuWindow.setMainMenu([
    {
      id: 'edit',
      text: 'Edit',
      menuItems: [
        { id: 'undo', text: 'Undo', shortcut: 'z', action: 'undo:' },
        { id: 'redo', text: 'Redo', shortcut: 'Z', action: 'redo:' },
        { text: '-' },
        { id: 'cut', text: 'Cut', shortcut: 'x', action: 'cut:' },
        { id: 'copy', text: 'Copy', shortcut: 'c', action: 'copy:' },
        { id: 'paste', text: 'Paste', shortcut: 'v', action: 'paste:' },
        { id: 'selectAll', text: 'Select All', shortcut: 'a', action: 'selectAll:' },
      ],
    },
  ])
}

async function initApp() {
  const isNeutralinoEnv = typeof window !== 'undefined' && 'NL_PORT' in window

  if (isNeutralinoEnv) {
    const Neutralino = await import('@neutralinojs/lib')
    await Neutralino.init()

    const { startSidecar, setupSidecarLifecycle } = await import('./services/sidecar')
    setupSidecarLifecycle()

    try {
      await setupNativeMenu()
    } catch (error) {
      console.warn('[NativeMenu] Não disponível:', error)
    }

    try {
      const { setupTray } = await import('./services/tray')
      await setupTray()
    } catch (error) {
      console.warn('[Tray] Não disponível:', error)
    }

    try {
      await startSidecar()
    } catch (error) {
      console.error('Falha ao iniciar sidecar:', error)
    }
  } else {
    console.log('[Dev Mode] Inicie o sidecar manualmente: pnpm --filter sidecar dev')
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <DialogProvider>
            <App />
          </DialogProvider>
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>
  )

}

initApp()
