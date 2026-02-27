import { ArrowSquareOut, Monitor, Cloud, Plug, Lightning } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { TuyaSetupGuide } from '../components/TuyaSetupGuide'
import { getOverlayUrl } from '../services/api'

export function HelpPage() {
  return (
    <div>
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">Ajuda</h1>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tuya Setup Guide */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Cloud size={20} weight="duotone" className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Como configurar o Tuya IoT Platform
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Guia passo-a-passo para criar sua conta, projeto Cloud e obter as credenciais
            necessárias para conectar seus dispositivos.
          </p>
          <TuyaSetupGuide defaultOpen />
        </div>

        {/* OBS Setup Guide */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Monitor size={20} weight="duotone" className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Como usar o Overlay no OBS</h2>
          </div>

          <ol className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="font-medium text-foreground">Adicionar Browser Source</p>
                <p className="text-muted-foreground">
                  No OBS Studio, clique em <strong>+</strong> na lista de fontes e selecione{' '}
                  <strong>Browser Source</strong> (Fonte de Navegador).
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0 mt-0.5">
                2
              </span>
              <div>
                <p className="font-medium text-foreground">Configurar URL</p>
                <p className="text-muted-foreground">
                  Cole a URL do overlay. O formato é:{' '}
                  <code className="px-1 py-0.5 bg-secondary rounded text-xs font-mono">
                    {getOverlayUrl()}
                  </code>
                </p>
                <p className="text-muted-foreground mt-1">
                  Para um dispositivo específico, vá em{' '}
                  <Link to="/overlays" className="text-primary hover:underline">
                    Overlays
                  </Link>{' '}
                  e copie a URL individual.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0 mt-0.5">
                3
              </span>
              <div>
                <p className="font-medium text-foreground">Ajustar dimensões</p>
                <p className="text-muted-foreground">
                  Defina largura <strong>400</strong> e altura <strong>200</strong>. Ajuste conforme
                  necessário para seu layout de stream.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0 mt-0.5">
                4
              </span>
              <div>
                <p className="font-medium text-foreground">Posicionar na cena</p>
                <p className="text-muted-foreground">
                  Arraste o overlay para a posição desejada na sua cena do OBS. O fundo é
                  transparente, então funciona sobre qualquer conteúdo.
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Plug size={20} weight="duotone" className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Gerenciar Dispositivos</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Para adicionar, remover ou editar dispositivos, vá em{' '}
              <Link to="/devices" className="text-primary hover:underline">
                Dispositivos
              </Link>
              .
            </p>
            <p className="text-muted-foreground">
              Para importar dispositivos automaticamente da sua conta Tuya, configure as credenciais
              Cloud em{' '}
              <Link to="/cloud" className="text-primary hover:underline">
                Cloud
              </Link>{' '}
              e use o botão &quot;Importar Dispositivos&quot;.
            </p>
            <p className="text-muted-foreground">
              Cada dispositivo pode operar em modo <strong>Local</strong> (conexão direta, menor
              latência) ou <strong>Cloud</strong> (via internet, funciona de qualquer rede).
            </p>
          </div>
        </div>

        {/* External Links */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightning size={20} weight="duotone" className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Links Úteis</h2>
          </div>
          <div className="space-y-2">
            <a
              href="https://github.com/ycarofguth/obs-powergrid/blob/main/docs/privacy-policy.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowSquareOut size={16} weight="bold" />
              Política de Privacidade
            </a>
            <a
              href="https://iot.tuya.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowSquareOut size={16} weight="bold" />
              Tuya IoT Platform
            </a>
            <a
              href="https://github.com/ycarofguth/obs-powergrid"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowSquareOut size={16} weight="bold" />
              Repositório GitHub (código-fonte)
            </a>
            <a
              href="https://github.com/ycarofguth/obs-powergrid/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowSquareOut size={16} weight="bold" />
              Reportar problema
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
