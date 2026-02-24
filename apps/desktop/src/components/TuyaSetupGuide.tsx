import { useState } from 'react'
import { ArrowSquareOut, CaretDown, CaretRight } from '@phosphor-icons/react'

interface TuyaSetupGuideProps {
  defaultOpen?: boolean
}

async function openExternal(e: React.MouseEvent, url: string) {
  e.preventDefault()
  try {
    const { os } = await import('@neutralinojs/lib')
    await os.open(url)
  } catch {
    window.open(url, '_blank')
  }
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      onClick={(e) => openExternal(e, href)}
      className="text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
    >
      {children} <ArrowSquareOut size={12} weight="bold" />
    </a>
  )
}

const steps = [
  {
    title: 'Por que preciso de credenciais Cloud?',
    content: (
      <>
        <p className="mb-2">
          Para se comunicar localmente com sua tomada, o app precisa da <strong>Local Key</strong> —
          uma chave única de cada dispositivo. A única forma de obtê-la é através da API de
          desenvolvedor da Tuya.
        </p>
        <p className="mb-2">
          Para isso, você precisa criar uma <strong>conta de desenvolvedor gratuita</strong> no Tuya
          IoT Platform e gerar credenciais de acesso (Access ID e Access Secret).
        </p>
        <p className="text-muted-foreground">
          Suas credenciais ficam armazenadas apenas na sua máquina, dentro de um banco de dados
          criptografado (AES-256 + SQLCipher). Mesmo que seu computador seja comprometido, os dados
          permanecem protegidos.
        </p>
      </>
    ),
  },
  {
    title: 'Criar conta no Tuya IoT Platform',
    content: (
      <>
        <p className="mb-2">
          Acesse <ExternalLink href="https://platform.tuya.com">platform.tuya.com</ExternalLink> e
          crie uma conta gratuita (ou faça login se já tiver).
        </p>
        <p className="text-muted-foreground">
          Use o mesmo e-mail da sua conta Tuya Smart (app do celular) para vincular os dispositivos
          automaticamente.
        </p>
      </>
    ),
  },
  {
    title: 'Criar um Cloud Project',
    content: (
      <>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>
            No painel, vá em <strong>Cloud → Development</strong>
          </li>
          <li>
            Clique em <strong>Create Cloud Project</strong>
          </li>
          <li>Escolha um nome (ex: &quot;OBS Energy Monitor&quot;)</li>
          <li>
            Em <strong>Industry</strong>, selecione <strong>Smart Home</strong>
          </li>
          <li>
            Em <strong>Development Method</strong>, selecione <strong>Custom</strong>
          </li>
          <li>
            Em <strong>Data Center</strong>, selecione o mesmo configurado no seu projeto Tuya
            (geralmente <strong>Western America Data Center</strong>)
          </li>
        </ol>
      </>
    ),
  },
  {
    title: 'Autorizar APIs necessárias',
    content: (
      <>
        <p className="mb-2">
          Após criar o projeto, você precisa autorizar as APIs de dispositivos:
        </p>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>
            Vá em <strong>API Explorer → Authorize API</strong>
          </li>
          <li>
            Adicione: <strong>IoT Core</strong>, <strong>Smart Home Basic Service</strong>
          </li>
          <li>Confirme a autorização</li>
        </ol>
        <p className="mt-2 text-muted-foreground">
          Sem essas APIs, o app não conseguirá buscar seus dispositivos.
        </p>
      </>
    ),
  },
  {
    title: 'Vincular dispositivos ao projeto',
    content: (
      <>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>
            No projeto, vá na aba <strong>Devices</strong>
          </li>
          <li>
            Clique na aba <strong>Link App Account</strong>
          </li>
          <li>
            Clique no botão azul <strong>Add App Account</strong>
          </li>
          <li>
            Selecione a opção <strong>Tuya App Account Authorization</strong>
          </li>
          <li>
            Abra o app <strong>Tuya Smart</strong> no celular e escaneie o QR Code
          </li>
          <li>
            Selecione <strong>Smart Home Device Management</strong> e confirme
          </li>
        </ol>
        <p className="mt-2 text-muted-foreground">
          Isso vincula seus dispositivos ao projeto para obter os Local Keys. A vinculação pode ser
          removida depois.
        </p>
      </>
    ),
  },
  {
    title: 'Copiar Access ID e Access Secret',
    content: (
      <>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>
            No projeto, vá em <strong>Overview</strong>
          </li>
          <li>
            Copie o <strong>Access ID/Client ID</strong>
          </li>
          <li>
            Copie o <strong>Access Secret/Client Secret</strong>
          </li>
        </ol>
        <p className="mt-2 text-muted-foreground">
          Cole essas credenciais na configuração Cloud do app. O app usará apenas suas próprias
          credenciais — nenhum dado é enviado para terceiros.
        </p>
      </>
    ),
  },
]

export function TuyaSetupGuide({ defaultOpen = false }: TuyaSetupGuideProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(defaultOpen ? 0 : null)

  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isOpen = expandedStep === index

        return (
          <div key={index} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedStep(isOpen ? null : index)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                {index + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">{step.title}</span>
              {isOpen ? (
                <CaretDown size={16} weight="bold" className="text-muted-foreground shrink-0" />
              ) : (
                <CaretRight size={16} weight="bold" className="text-muted-foreground shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="px-3 pb-3 pl-12 text-sm text-foreground">{step.content}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
