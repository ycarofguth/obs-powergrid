import { useState, useEffect, useCallback } from 'react'
import { ArrowsClockwise, ArrowSquareOut, ArrowCircleUp, CheckCircle } from '@phosphor-icons/react'
import { checkForUpdate, getChangelog, type UpdateInfo, type ChangelogEntry } from '../services/api'

export function AboutPage() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [checking, setChecking] = useState(false)
  const [loadingChangelog, setLoadingChangelog] = useState(true)

  const fetchUpdateInfo = useCallback(async (force = false) => {
    setChecking(true)
    try {
      const response = await checkForUpdate(force)
      if (response.success && response.data) {
        setUpdateInfo(response.data)
      }
    } catch (err) {
      console.error('Error checking update:', err)
    } finally {
      setChecking(false)
    }
  }, [])

  const fetchChangelog = useCallback(async () => {
    setLoadingChangelog(true)
    try {
      const response = await getChangelog()
      if (response.success && response.data) {
        setChangelog(response.data)
      }
    } catch (err) {
      console.error('Error fetching changelog:', err)
    } finally {
      setLoadingChangelog(false)
    }
  }, [])

  useEffect(() => {
    fetchUpdateInfo()
    fetchChangelog()
  }, [fetchUpdateInfo, fetchChangelog])

  return (
    <div>
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">Sobre</h1>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* App Info */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">OBS PowerGrid</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Monitore o consumo de energia dos seus dispositivos Tuya e exiba como overlay no OBS
            Studio.
          </p>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versão instalada</span>
              <span className="font-mono text-foreground">
                v{updateInfo?.currentVersion || '0.1.0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Licença</span>
              <span className="text-foreground">GPL-3.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Política de Privacidade</span>
              <a
                href="https://github.com/ycarofguth/obs-powergrid/blob/main/docs/privacy-policy.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Ver documento
                <ArrowSquareOut size={12} weight="bold" />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Repositório</span>
              <a
                href="https://github.com/ycarofguth/obs-powergrid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                GitHub
                <ArrowSquareOut size={12} weight="bold" />
              </a>
            </div>
          </div>
        </div>

        {/* Update Status */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">ATUALIZAÇÕES</h3>
            <button
              onClick={() => fetchUpdateInfo(true)}
              disabled={checking}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md disabled:opacity-50"
            >
              {checking ? (
                <ArrowsClockwise size={16} weight="bold" className="animate-spin" />
              ) : (
                <ArrowsClockwise size={16} weight="bold" />
              )}
              Verificar agora
            </button>
          </div>

          {updateInfo?.updateAvailable ? (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <ArrowCircleUp size={20} weight="duotone" className="text-primary" />
                <span className="font-medium text-foreground">
                  Nova versão disponível: v{updateInfo.latestVersion}
                </span>
              </div>
              {updateInfo.releaseName && (
                <p className="text-sm text-muted-foreground mb-3">{updateInfo.releaseName}</p>
              )}
              {updateInfo.releaseUrl && (
                <a
                  href={updateInfo.releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                >
                  <ArrowSquareOut size={16} weight="bold" />
                  Baixar atualização
                </a>
              )}
            </div>
          ) : updateInfo ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle size={20} weight="duotone" className="text-success" />
              <span>Você está usando a versão mais recente</span>
            </div>
          ) : null}

          {updateInfo?.lastChecked && (
            <p className="text-xs text-muted-foreground mt-3">
              Última verificação: {new Date(updateInfo.lastChecked).toLocaleString()}
            </p>
          )}
        </div>

        {/* Changelog */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">CHANGELOG</h3>

          {loadingChangelog ? (
            <div className="text-center py-6">
              <ArrowsClockwise
                size={20}
                weight="bold"
                className="mx-auto text-muted-foreground animate-spin"
              />
            </div>
          ) : changelog.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma release encontrada. O changelog será exibido aqui quando houver releases no
              GitHub.
            </p>
          ) : (
            <div className="space-y-6">
              {changelog.map((release) => (
                <div key={release.version} className="border-l-2 border-border pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-medium text-foreground">{release.version}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(release.date).toLocaleDateString()}
                    </span>
                    <a
                      href={release.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ArrowSquareOut size={12} weight="bold" />
                    </a>
                  </div>
                  {release.name && release.name !== release.version && (
                    <p className="text-sm font-medium text-foreground mb-1">{release.name}</p>
                  )}
                  {release.body && (
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {release.body.length > 500
                        ? release.body.slice(0, 500) + '...'
                        : release.body}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
