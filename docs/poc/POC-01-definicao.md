# POC-01: Neutralino + React + TuyAPI

**Data:** 2026-01-28
**Status:** Aprovada - Pronta para implementação

---

## 1. Objetivo

Validar a arquitetura **Neutralino.js + React + Sidecar Node.js** para criar um overlay de consumo de energia para OBS Studio.

### Critérios de Sucesso

| #   | Critério                | Como validar                  |
| --- | ----------------------- | ----------------------------- |
| 1   | App Neutralino executa  | Abrir .exe, UI aparece        |
| 2   | Sidecar conecta no Tuya | Ver status "conectado"        |
| 3   | Dados são exibidos      | Watts/volts aparecem na UI    |
| 4   | Overlay funciona no OBS | Browser Source mostra dados   |
| 5   | Fundo transparente      | Só o conteúdo aparece no OBS  |
| 6   | Refresh automático      | Dados atualizam a cada 2-5s   |
| 7   | Config persiste         | Reiniciar app, config mantida |

---

## 2. Stack Definida

| Camada          | Tecnologia    | Versão |
| --------------- | ------------- | ------ |
| Runtime Desktop | Neutralino.js | 5.x    |
| Frontend        | React         | 18.x   |
| Linguagem       | TypeScript    | 5.x    |
| Build Tool      | Vite          | 5.x    |
| UI Components   | shadcn/ui     | latest |
| Styling         | Tailwind CSS  | 4.x    |
| Sidecar         | Node.js       | 20.x   |
| Tuya Client     | TuyAPI        | 7.x    |
| HTTP Server     | Express       | 4.x    |

---

## 3. Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         OBS Studio                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Browser Source: http://localhost:8080/overlay             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│         Neutralino App      │                                    │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │                    React App                               │  │
│  │  ┌─────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │   / (Config)        │  │  /overlay                  │  │  │
│  │  │                     │  │                            │  │  │
│  │  │  Device ID: [____]  │  │  ┌────────────────────┐   │  │  │
│  │  │  Local Key: [____]  │  │  │   ⚡ 125 W         │   │  │  │
│  │  │  IP: [____]         │  │  │   220 V            │   │  │  │
│  │  │                     │  │  └────────────────────┘   │  │  │
│  │  │  [Salvar] [Testar]  │  │  background: transparent  │  │  │
│  │  │                     │  │                            │  │  │
│  │  │  Status: Conectado  │  │  fetch(/api/status)        │  │  │
│  │  │  Power: 125W        │  │  every 2 seconds           │  │  │
│  │  └─────────────────────┘  └────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ Neutralino spawns process         │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                 Sidecar Node.js (:8081)                     │  │
│  │                                                             │  │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐    │  │
│  │  │    TuyAPI       │    │    Express Server           │    │  │
│  │  │                 │    │                             │    │  │
│  │  │  - connect()    │───▶│  GET /status                │    │  │
│  │  │  - get status   │    │  → { power, volts, ... }    │    │  │
│  │  │  - events       │    │                             │    │  │
│  │  └─────────────────┘    │  POST /config               │    │  │
│  │          │              │  → update device config     │    │  │
│  │          │              └─────────────────────────────┘    │  │
│  └──────────┼─────────────────────────────────────────────────┘  │
└─────────────┼────────────────────────────────────────────────────┘
              │ TCP/AES (LAN)
        ┌─────┴─────┐
        │ Smart Plug │
        │   Tuya     │
        └───────────┘
```

---

## 4. Estrutura de Arquivos

```
tuya-obs-overlay/
├── package.json                 # Root (workspaces)
├── pnpm-workspace.yaml
├── neutralino.config.json
├── .gitignore
│
├── app/                         # Frontend React
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── components.json          # shadcn
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx             # Entry point
│   │   ├── App.tsx              # Router
│   │   ├── pages/
│   │   │   ├── Config.tsx       # Página de configuração
│   │   │   └── Overlay.tsx      # Página do overlay
│   │   ├── components/
│   │   │   ├── ui/              # shadcn components
│   │   │   ├── ConfigForm.tsx
│   │   │   ├── StatusCard.tsx
│   │   │   └── PowerDisplay.tsx
│   │   ├── hooks/
│   │   │   ├── useNeutralinoStorage.ts
│   │   │   └── useTuyaStatus.ts
│   │   ├── lib/
│   │   │   ├── neutralino.ts
│   │   │   └── utils.ts
│   │   └── styles/
│   │       └── globals.css
│   └── dist/                    # Build output
│
├── sidecar/                     # Backend Node.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts             # Entry point
│   │   ├── server.ts            # Express server
│   │   ├── tuya-client.ts       # TuyAPI wrapper
│   │   └── types.ts
│   └── dist/                    # Build output
│
└── docs/
    ├── PROJECT.md
    ├── research/
    └── poc/
        └── POC-01-definicao.md  # Este arquivo
```

---

## 5. Escopo da POC

### 5.1 Incluído (Must Have)

| Feature            | Descrição                            |
| ------------------ | ------------------------------------ |
| Config UI          | Inputs para Device ID, Local Key, IP |
| Salvar config      | Persistir credenciais localmente     |
| Testar conexão     | Botão para validar credenciais       |
| Exibir status      | Mostrar watts, volts, on/off         |
| Overlay básico     | HTML com fundo transparente          |
| Refresh automático | Polling a cada 2-5 segundos          |
| Iniciar sidecar    | App inicia Node.js automaticamente   |

### 5.2 Excluído (Deixar para MVP)

| Feature                | Motivo                  |
| ---------------------- | ----------------------- |
| UI polida              | Foco em funcionalidade  |
| Múltiplos dispositivos | Complexidade            |
| Temas/customização     | Foco em funcionalidade  |
| OAuth/login automático | Decisão pendente        |
| Instalador             | Não necessário para POC |
| Tray icon              | Nice to have            |
| Auto-start             | Nice to have            |

---

## 6. Autenticação (POC)

### 6.1 Método: Credenciais Manuais

O usuário obtém e configura manualmente:

| Campo      | Descrição           | Onde obter                          |
| ---------- | ------------------- | ----------------------------------- |
| Device ID  | Identificador único | Tuya IoT Platform                   |
| Local Key  | Chave AES           | Tuya IoT Platform / TinyTuya Wizard |
| IP Address | IP na rede local    | Router / Network scan               |

### 6.2 Como Obter Credenciais

**Opção A: Via Tuya IoT Platform**

1. Criar conta em https://iot.tuya.com
2. Criar Cloud Project
3. Linkar dispositivo via app Tuya Smart
4. Usar API Explorer → Query Device Details
5. Copiar `id` e `local_key`
6. Descobrir IP via router ou `arp -a`

**Opção B: Via TinyTuya Wizard (Python)**

```bash
pip install tinytuya
python -m tinytuya wizard
```

### 6.3 Armazenamento

```typescript
// Usando Neutralino.storage
interface Config {
  deviceId: string
  localKey: string
  deviceIp: string
  refreshInterval: number // ms
}

// Salvar
await Neutralino.storage.setData('config', JSON.stringify(config))

// Carregar
const data = await Neutralino.storage.getData('config')
const config = JSON.parse(data)
```

---

## 7. Comunicação Entre Componentes

### 7.1 React App ↔ Sidecar

**Protocolo:** HTTP REST

**Endpoints do Sidecar:**

| Método | Endpoint | Descrição        | Request             | Response                |
| ------ | -------- | ---------------- | ------------------- | ----------------------- |
| GET    | /status  | Status atual     | -                   | `{ power, volts, ... }` |
| GET    | /health  | Health check     | -                   | `{ connected: bool }`   |
| POST   | /config  | Atualizar config | `{ deviceId, ... }` | `{ success: bool }`     |
| POST   | /connect | Forçar reconexão | -                   | `{ success: bool }`     |

**Exemplo de Response /status:**

```json
{
  "connected": true,
  "power": true,
  "watts": 125,
  "volts": 220,
  "current": 568,
  "updatedAt": "2026-01-28T10:30:00Z"
}
```

### 7.2 Overlay → Sidecar

```typescript
// overlay/page.tsx
const [status, setStatus] = useState<TuyaStatus | null>(null)

useEffect(() => {
  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:8081/status')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to fetch status:', err)
    }
  }

  fetchStatus()
  const interval = setInterval(fetchStatus, 2000)
  return () => clearInterval(interval)
}, [])
```

### 7.3 React App → Neutralino

```typescript
// Iniciar sidecar
await Neutralino.os.spawnProcess('node sidecar/dist/index.js')

// Salvar config
await Neutralino.storage.setData('config', JSON.stringify(config))

// Ler config
const config = JSON.parse(await Neutralino.storage.getData('config'))
```

---

## 8. Overlay (OBS)

### 8.1 CSS para Transparência

```css
/* globals.css - página overlay */
html,
body {
  margin: 0;
  padding: 0;
  background: transparent !important;
  overflow: hidden;
}
```

### 8.2 Componente PowerDisplay

```tsx
// components/PowerDisplay.tsx
interface Props {
  watts: number
  volts: number
  connected: boolean
}

export function PowerDisplay({ watts, volts, connected }: Props) {
  if (!connected) {
    return <div className="text-red-500 text-sm">Desconectado</div>
  }

  return (
    <div className="inline-flex flex-col bg-black/70 text-white px-4 py-2 rounded-lg">
      <div className="text-3xl font-bold">⚡ {watts} W</div>
      <div className="text-sm opacity-70">{volts} V</div>
    </div>
  )
}
```

### 8.3 Configuração no OBS

1. Sources → Add → Browser Source
2. URL: `http://localhost:8080/overlay`
3. Width: 300
4. Height: 150
5. ✅ Custom CSS (deixar vazio ou override)
6. Posicionar na cena

---

## 9. Sidecar Node.js

### 9.1 TuyAPI Client

```typescript
// sidecar/src/tuya-client.ts
import TuyAPI from 'tuyapi'

interface TuyaConfig {
  deviceId: string
  localKey: string
  deviceIp: string
}

interface TuyaStatus {
  connected: boolean
  power: boolean
  watts: number
  volts: number
  current: number
  updatedAt: string
}

class TuyaClient {
  private device: TuyAPI | null = null
  private status: TuyaStatus = {
    connected: false,
    power: false,
    watts: 0,
    volts: 0,
    current: 0,
    updatedAt: new Date().toISOString(),
  }

  async connect(config: TuyaConfig): Promise<void> {
    this.device = new TuyAPI({
      id: config.deviceId,
      key: config.localKey,
      ip: config.deviceIp,
      version: '3.4',
    })

    this.device.on('connected', () => {
      console.log('Connected to device')
      this.status.connected = true
    })

    this.device.on('disconnected', () => {
      console.log('Disconnected from device')
      this.status.connected = false
    })

    this.device.on('data', (data: any) => {
      this.status = {
        connected: true,
        power: data.dps['1'] ?? false,
        watts: data.dps['5'] ?? 0,
        volts: (data.dps['6'] ?? 0) / 10, // Ajustar escala se necessário
        current: data.dps['4'] ?? 0,
        updatedAt: new Date().toISOString(),
      }
    })

    this.device.on('error', (err: Error) => {
      console.error('Device error:', err)
    })

    await this.device.find()
    await this.device.connect()
  }

  getStatus(): TuyaStatus {
    return this.status
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.disconnect()
      this.device = null
    }
  }
}

export const tuyaClient = new TuyaClient()
export type { TuyaConfig, TuyaStatus }
```

### 9.2 Express Server

```typescript
// sidecar/src/server.ts
import express from 'express'
import cors from 'cors'
import { tuyaClient, TuyaConfig } from './tuya-client'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ connected: tuyaClient.getStatus().connected })
})

app.get('/status', (req, res) => {
  res.json(tuyaClient.getStatus())
})

app.post('/config', async (req, res) => {
  try {
    const config: TuyaConfig = req.body
    await tuyaClient.disconnect()
    await tuyaClient.connect(config)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) })
  }
})

app.post('/connect', async (req, res) => {
  try {
    // Reconectar com config atual
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) })
  }
})

export function startServer(port: number = 8081): void {
  app.listen(port, () => {
    console.log(`Sidecar server running on http://localhost:${port}`)
  })
}
```

---

## 10. Fluxo de Execução

```
1. Usuário executa TuyaOBSOverlay.exe
              │
              ▼
2. Neutralino carrega React app
              │
              ▼
3. React app verifica se tem config salva
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
4a. Não tem:        4b. Tem config:
    Mostra form         Inicia sidecar
              │               │
              ▼               ▼
5. Usuário preenche   Sidecar conecta
   e salva config     no dispositivo
              │               │
              ▼               ▼
6. App inicia         Exibe status
   sidecar            na UI
              │               │
              └───────┬───────┘
                      ▼
7. Usuário adiciona Browser Source no OBS
   URL: http://localhost:8080/overlay
                      │
                      ▼
8. Overlay faz fetch a cada 2s
   e exibe watts/volts
```

---

## 11. Tarefas de Implementação

### Fase 1: Setup (~2h)

- [ ] Inicializar monorepo com pnpm workspaces
- [ ] Configurar Neutralino.js
- [ ] Criar projeto Vite + React + TypeScript
- [ ] Configurar shadcn/ui + Tailwind
- [ ] Criar projeto sidecar Node.js

### Fase 2: Sidecar (~3h)

- [ ] Implementar TuyAPI client
- [ ] Implementar Express server
- [ ] Testar conexão com dispositivo real
- [ ] Documentar DPS do dispositivo

### Fase 3: Frontend (~4h)

- [ ] Página de configuração (Config.tsx)
- [ ] Componentes: ConfigForm, StatusCard
- [ ] Hook useNeutralinoStorage
- [ ] Página de overlay (Overlay.tsx)
- [ ] Componente PowerDisplay
- [ ] Hook useTuyaStatus

### Fase 4: Integração (~2h)

- [ ] Spawn sidecar via Neutralino
- [ ] Comunicação React ↔ Sidecar
- [ ] Persistência de config
- [ ] Tratamento de erros

### Fase 5: Testes (~2h)

- [ ] Testar no OBS (Windows)
- [ ] Testar no OBS (Mac, se possível)
- [ ] Validar transparência
- [ ] Validar refresh
- [ ] Documentar resultados

---

## 12. Requisitos para Testar

### Hardware

- [ ] Smart plug Tuya com medição de energia
- [ ] Computador Windows ou Mac
- [ ] Mesma rede Wi-Fi que o smart plug

### Software

- [ ] Node.js 20+ instalado
- [ ] pnpm instalado
- [ ] OBS Studio instalado

### Credenciais

- [ ] Device ID do smart plug
- [ ] Local Key do smart plug
- [ ] IP do smart plug na rede

---

## 13. Riscos e Mitigações

| Risco                      | Probabilidade | Impacto | Mitigação                     |
| -------------------------- | ------------- | ------- | ----------------------------- |
| DPS diferente do esperado  | Média         | Alto    | Documentar DPS do device real |
| TuyAPI não conecta         | Baixa         | Alto    | Testar versões de protocolo   |
| Neutralino spawn falha     | Baixa         | Alto    | Fallback para inicio manual   |
| CORS bloqueia fetch        | Baixa         | Médio   | Configurar CORS no sidecar    |
| Transparência não funciona | Baixa         | Médio   | Testar CSS alternatives       |

---

## 14. Próximos Passos

Após aprovação deste documento:

1. **Inicializar projeto** - Setup do monorepo
2. **Implementar sidecar** - TuyAPI + Express
3. **Implementar frontend** - React + shadcn
4. **Integrar** - Neutralino + sidecar
5. **Testar** - Validar critérios de sucesso
6. **Documentar resultados** - O que funcionou/não funcionou

---

## 15. Definições Pendentes para MVP

Estas decisões serão tomadas após a POC:

1. **Autenticação**: OAuth com backend vs credenciais manuais
2. **Empacotamento sidecar**: pkg, bun, ou node embutido
3. **Instalador**: electron-builder, NSIS, ou manual
4. **Distribuição**: GitHub releases, site próprio, ou app store
