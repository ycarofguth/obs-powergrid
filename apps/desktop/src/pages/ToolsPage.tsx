import { Link } from 'react-router-dom'
import { Wrench, Timer, Hash } from '@phosphor-icons/react'
import { GlowIcon } from '../components/GlowIcon'

const tools = [
  {
    to: '/tools/timer',
    icon: <Timer size={32} weight="duotone" className="text-primary" />,
    title: 'Timer',
    description: 'Cronometro para exibir na live. Pode contar para cima ou para baixo.',
    button: 'Configurar',
  },
  {
    to: '/tools/counter',
    icon: <Hash size={32} weight="duotone" className="text-primary" />,
    title: 'Contador',
    description: 'Contador numerico para exibir na live. Controle via app.',
    button: 'Configurar',
  },
]

export function ToolsPage() {
  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center">
          <div className="flex items-center gap-3">
            <Wrench size={24} weight="duotone" className="text-foreground" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Ferramentas</h1>
              <p className="text-sm text-muted-foreground">
                Overlays extras para suas transmissoes
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.to}
              className="rounded-lg border border-border bg-card p-6 flex flex-col items-start gap-4"
            >
              <GlowIcon icon={tool.icon} color="primary" size="lg" />
              <div className="flex-1">
                <h2 className="text-lg font-medium text-foreground">{tool.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
              </div>
              <Link
                to={tool.to}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
              >
                {tool.button}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
