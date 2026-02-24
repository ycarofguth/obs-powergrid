import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { getAuthStatus, AUTH_LOCKED_EVENT, type AuthStatus } from './services/api'

// Layout
import { MainLayout } from './components/MainLayout'

// Pages
import { SetupPage } from './pages/SetupPage'
import { LoginPage } from './pages/LoginPage'
import { ResetPage } from './pages/ResetPage'
import { DevicesPage } from './pages/DevicesPage'
import { AddDevicePage } from './pages/AddDevicePage'
import { EditDevicePage } from './pages/EditDevicePage'
import { SecurityPage } from './pages/SecurityPage'
import { CloudSettingsPage } from './pages/CloudSettingsPage'
import { ImportDevicesPage } from './pages/ImportDevicesPage'
import { DashboardPage } from './pages/DashboardPage'
import { DeviceDashboardPage } from './pages/DeviceDashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { LogsPage } from './pages/LogsPage'
import { AboutPage } from './pages/AboutPage'
import { HelpPage } from './pages/HelpPage'
import ConfigPage from './pages/ConfigPage'
import { OverlayEditorPage } from './pages/OverlayEditorPage'
import { OverlaysPage } from './pages/OverlaysPage'
import { ToolsPage } from './pages/ToolsPage'
import { TimerPage } from './pages/TimerPage'
import { CounterPage } from './pages/CounterPage'

function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  // Handler para quando o app e bloqueado
  const handleLocked = useCallback(() => {
    console.log('[AuthGate] App locked, redirecting to login')
    setAuthStatus((prev) => (prev ? { ...prev, isUnlocked: false } : null))
    navigate('/login', { replace: true })
  }, [navigate])

  // Listener global para evento de bloqueio
  useEffect(() => {
    window.addEventListener(AUTH_LOCKED_EVENT, handleLocked)
    return () => window.removeEventListener(AUTH_LOCKED_EVENT, handleLocked)
  }, [handleLocked])

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await getAuthStatus()
        if (response.success && response.data) {
          setAuthStatus(response.data)
        }
      } catch (err) {
        console.error('Error checking auth:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [location.pathname])

  useEffect(() => {
    if (loading || !authStatus) return

    const publicPaths = ['/setup', '/login', '/reset']
    const isPublicPath = publicPaths.includes(location.pathname)

    // Nao configurado -> Setup
    if (!authStatus.isSetUp && location.pathname !== '/setup') {
      navigate('/setup', { replace: true })
      return
    }

    // Configurado mas bloqueado -> Login (exceto reset)
    if (authStatus.isSetUp && !authStatus.isUnlocked && !isPublicPath) {
      navigate('/login', { replace: true })
      return
    }

    // Configurado e desbloqueado
    if (authStatus.isSetUp && authStatus.isUnlocked) {
      if (!authStatus.isOnboardingComplete) {
        // Onboarding nao completo -> manter no setup
        if (location.pathname !== '/setup') {
          navigate('/setup', { replace: true })
        }
        return
      }

      // Onboarding completo e em pagina publica -> Dashboard
      if (isPublicPath) {
        navigate('/dashboard', { replace: true })
        return
      }
    }
  }, [authStatus, loading, location.pathname, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthGate>
      <Routes>
        {/* Rotas publicas */}
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset" element={<ResetPage />} />

        {/* Rotas protegidas com layout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/devices/:id" element={<DeviceDashboardPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/devices/add" element={<AddDevicePage />} />
          <Route path="/devices/:id" element={<EditDevicePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/cloud" element={<CloudSettingsPage />} />
          <Route path="/cloud/import" element={<ImportDevicesPage />} />
          <Route path="/overlays" element={<OverlaysPage />} />
          <Route path="/overlay/editor" element={<OverlayEditorPage />} />
          <Route path="/overlay/editor/:deviceId" element={<OverlayEditorPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/timer" element={<TimerPage />} />
          <Route path="/tools/counter" element={<CounterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/config" element={<ConfigPage />} />
        </Route>

        {/* Redirect padrao */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthGate>
  )
}

export default App
