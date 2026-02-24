# OBS PowerGrid

**Versão:** 0.1.0 (MVP)
**Status:** MVP funcional — M1 a M6 implementados
**Início:** 2026-01-28

---

## Visão Geral

Aplicativo desktop que monitora consumo de energia de tomadas inteligentes Tuya e exibe como overlay no OBS Studio. Streamers e criadores de conteúdo mostram dados em tempo real (watts, tensão, corrente) durante transmissões ao vivo.

**Características principais:**

- Comunicação local (TCP/AES) com latência <100ms ou via Cloud
- Overlay customizável (cores, fontes, layout) com sistema de presets
- Múltiplas tomadas com URLs individuais ou combinadas
- Dashboard com histórico, gráficos e cálculo de custo (kWh)
- Timer e counter para streams com overlays dedicados
- Dados 100% locais, zero telemetria, código aberto

---

## Arquitetura

```
┌─────────────────┐     ┌─────────────────────────────────────┐     ┌─────────────────┐
│   Tuya Cloud    │────▶│           Sidecar Express           │────▶│   Smart Plug    │
│   (REST API)    │     │            (:47531)                 │     │   (TCP/AES)     │
└─────────────────┘     │  ┌─────────────────────────────┐    │     └─────────────────┘
        │               │  │  SQLCipher DB (criptografado)│    │
        │               │  └─────────────────────────────┘    │
        │               └─────────────────────────────────────┘
        │                              ↑
        │                    ┌─────────┴─────────┐
        │               Neutralino App      OBS Browser Source
        │               (config UI)         (/overlay)
        │
        └───── OAuth, buscar devices, Local Keys
```

- **Tuya Cloud:** Busca automática de dispositivos e credenciais (onboarding)
- **Sidecar:** Processo Node.js com banco SQLCipher criptografado
- **Local API:** Comunicação direta via rede local — latência <100ms
- **Cloud API:** Alternativa para quando não está na mesma rede

---

## Stack Tecnológica

| Camada     | Tecnologia                                      | Propósito                      |
| ---------- | ----------------------------------------------- | ------------------------------ |
| Desktop    | Neutralino.js 6.5.0                             | Runtime leve (~2-5 MB)         |
| Frontend   | React 19.x + TypeScript 5.7.x + Vite 6.x        | UI de configuração             |
| UI         | Radix UI + Tailwind CSS 4.x (padrões shadcn/ui) | Componentes                    |
| Ícones     | Phosphor Icons                                  | Iconografia                    |
| Gráficos   | Recharts 3.x                                    | Histórico, custos, comparações |
| Backend    | Node.js 22.x + Express 5.x                      | Sidecar HTTP                   |
| Banco      | better-sqlite3-multiple-ciphers 12.x            | SQLite + SQLCipher             |
| ORM        | Drizzle ORM 0.45.x                              | Type-safe queries              |
| Crypto     | argon2 0.44.x + Node.js crypto                  | Argon2id + AES-256-GCM         |
| Tuya Local | TuyAPI 7.5.x                                    | Protocolo TCP/AES              |
| Tuya Cloud | @tuya/tuya-connector-nodejs 2.x                 | OAuth, busca de devices        |
| Testes     | Vitest 4.x                                      | Unit/integration tests         |
| Formatação | Prettier 3.x                                    | Code formatting                |
| Linting    | ESLint 9.x                                      | Code quality                   |

---

## Estrutura do Projeto

```
├── apps/
│   ├── desktop/           # Frontend React (Neutralino) — @obs-tuya/desktop
│   │   ├── src/
│   │   │   ├── pages/     # 20 páginas
│   │   │   ├── components/# Componentes (layout, cards, charts, dialogs, UI)
│   │   │   ├── services/  # API client, sidecar management, tray
│   │   │   └── styles/    # globals.css (design system)
│   │   └── index.html     # Google Fonts (Inter + JetBrains Mono)
│   └── sidecar/           # Backend Node.js — @obs-tuya/sidecar
│       └── src/
│           ├── routes/    # 13 route files
│           ├── services/  # 17 services
│           └── db/        # Schema (9 tabelas), init, migrations
├── packages/
│   └── shared/            # Internal package — @obs-tuya/shared
│       └── src/index.ts   # 36 tipos, 51 endpoints, constantes
├── scripts/               # Dev scripts (dev-neu, build-dist)
├── docs/                  # Documentação (português)
│   ├── README.md          # Este documento
│   ├── architecture.md    # 16 ADRs documentados
│   ├── privacy-policy.md  # Política de privacidade
│   ├── milestones.md      # M1-M7 com escopo e status
│   ├── setup-guide.md     # Guia de configuração
│   ├── requirements/      # 42 FR + 16 NFR
│   └── design/            # App map, user journeys, design system
└── neutralino.config.json # Config (500x600, singlePageServe)
```

---

## Autenticação e Segurança

### Fluxo de Credenciais

1. Usuário configura Access ID e Access Secret do projeto [Tuya IoT Platform](https://iot.tuya.com)
2. App busca automaticamente: lista de dispositivos, Local Keys, versão de protocolo
3. Credenciais criptografadas com AES-256-GCM e armazenadas no SQLCipher DB
4. Senha do app deriva as chaves de criptografia via Argon2id

### Criptografia

- **Banco:** SQLCipher (AES-256-CBC) — todo o arquivo criptografado
- **Campos sensíveis:** AES-256-GCM — segunda camada de proteção
- **Derivação:** Argon2id (64MB, 3 iter.) + HKDF para chaves separadas

### Reset de Senha

Sem recuperação. Se esquecer a senha, os dados são perdidos (reset total).

---

## Funcionalidades Implementadas

### M1–M6 (Completos)

- **Autenticação:** Setup, login, logout, troca de senha, reset total
- **Dispositivos:** CRUD completo, import da Cloud, habilitar/desabilitar, toggle local/cloud
- **Monitoramento:** Conexão local (TCP/AES) e cloud (REST polling) com retry automático
- **Dashboard:** Visão geral + individual, gráficos de potência e custo, comparação multi-device, rankings
- **Overlays:** Editor visual com preview, presets, overlays individuais e combinado
- **Ferramentas:** Timer (countdown/up) e counter com overlays para OBS
- **Configurações:** Preço kWh, moeda, retenção de dados/logs, polling interval, minimize to tray
- **Logs:** Filtros por tipo/device/data, export CSV, limpeza automática
- **Cloud:** Credenciais Tuya, busca de devices, refresh de Local Key/protocolo
- **Sistema:** Verificação de atualização via GitHub, changelog, system tray, menu nativo

### M7 (Pendente)

- CI/CD pipeline com GitHub Actions
- Build multi-plataforma automatizado (Win/Linux/Mac)
- Publicação de release no GitHub Releases

---

## Documentação

| Documento                                                                  | Descrição                          |
| -------------------------------------------------------------------------- | ---------------------------------- |
| [Decisões de Arquitetura](./architecture.md)                               | 16 ADRs documentados               |
| [Requisitos Funcionais](./requirements/functional-requirements.md)         | 42 requisitos                      |
| [Requisitos Não-Funcionais](./requirements/non-functional-requirements.md) | 16 requisitos                      |
| [Milestones](./milestones.md)                                              | M1-M7 com escopo e status          |
| [Design System](./design/design-system.md)                                 | Cores, tokens, ícones, componentes |
| [App Map](./design/app-map.md)                                             | Rotas e navegação                  |
| [User Journeys](./design/user-journeys/)                                   | 5 jornadas detalhadas              |
| [Política de Privacidade](./privacy-policy.md)                             | Zero telemetria, código aberto     |
| [Guia de Configuração](./setup-guide.md)                                   | Setup inicial                      |

---

## Portas

| Porta | Serviço               |
| ----- | --------------------- |
| 47531 | Sidecar Express       |
| 47532 | Neutralino local      |
| 47533 | Vite dev server (dev) |

---

## Data Points (DPS)

| DPS | Nome    | Tipo    | Descrição     |
| --- | ------- | ------- | ------------- |
| 1   | switch  | Boolean | Liga/Desliga  |
| 4   | current | Integer | Corrente (mA) |
| 5   | power   | Integer | Potência (W)  |
| 6   | voltage | Integer | Tensão (V)    |

---

## Links Externos

- [TuyAPI](https://github.com/codetheweb/tuyapi) — Protocolo local
- [Tuya Cloud SDK](https://github.com/tuya/tuya-connector-nodejs) — Cloud API
- [Neutralino.js](https://neutralino.js.org/docs/) — Runtime desktop
- [Drizzle ORM](https://orm.drizzle.team/) — ORM
- [Recharts](https://recharts.org/) — Gráficos
- [Phosphor Icons](https://phosphoricons.com/) — Ícones
- [shadcn/ui](https://ui.shadcn.com/) — Padrões de theming
