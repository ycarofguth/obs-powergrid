<p align="center">
  <img src="apps/desktop/resources/icons/icon-256.png" width="128" alt="OBS PowerGrid">
</p>

<h1 align="center">OBS PowerGrid</h1>

<p align="center">
  Monitore o consumo de energia das suas tomadas inteligentes Tuya em tempo real no OBS Studio.
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/ycarofguth/obs-powergrid?label=vers%C3%A3o" alt="Versao">
  <img src="https://img.shields.io/github/license/ycarofguth/obs-powergrid" alt="Licenca">
  <img src="https://img.shields.io/badge/plataforma-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Plataforma">
  <img src="https://img.shields.io/badge/node-%3E%3D22-green" alt="Node.js">
</p>

---

## Sobre

OBS PowerGrid conecta suas tomadas inteligentes Tuya ao OBS Studio, exibindo dados de consumo de energia (watts, tensao, corrente) como overlay customizavel durante transmissoes ao vivo. Ideal para streamers e criadores de conteudo que querem mostrar o consumo real do setup em tempo real.

Todos os dados ficam no seu computador. Zero telemetria, zero rastreamento, codigo aberto.

---

## Funcionalidades

- **Monitoramento em tempo real** — Potencia (W/kW), tensao (V) e corrente (A/mA) com latencia <100ms
- **Overlay para OBS** — Browser Source customizavel (cores, fontes, layout, metricas visiveis)
- **Comunicacao local** — Protocolo TCP/AES direto na rede local, sem depender da nuvem
- **Comunicacao cloud** — Alternativa via Tuya Cloud API quando nao esta na mesma rede
- **Dashboard** — Graficos de potencia, custo por hora, comparacao entre dispositivos, rankings
- **Calculo de custo** — Projecao de custo diario baseado no preco do kWh configurado
- **Multiplas tomadas** — Overlays individuais ou combinado, cada um com URL propria
- **Timer e counter** — Ferramentas para stream com overlays dedicados
- **Presets de overlay** — Salve e reutilize configuracoes de estilo
- **Import automatico** — Busca dispositivos, Local Keys e versao de protocolo via Tuya Cloud
- **Banco criptografado** — SQLCipher + AES-256-GCM para proteger credenciais
- **Zero telemetria** — Nenhum dado sai do seu computador (exceto comunicacao com Tuya)

---

## Seguranca e Privacidade

| Camada              | Tecnologia                      | Protege                             |
| ------------------- | ------------------------------- | ----------------------------------- |
| Banco de dados      | SQLCipher (AES-256-CBC)         | Todo o arquivo .db                  |
| Campos sensiveis    | AES-256-GCM                     | Local Key, Access ID, Access Secret |
| Derivacao de chaves | Argon2id (64MB, 3 iter.) + HKDF | Senha → chaves separadas            |
| Comunicacao local   | TCP/AES (TuyAPI)                | Dados entre app e tomada            |

- Sem backend remoto, sem analytics, sem crash reporting
- Senha nunca armazenada — usada apenas para derivar chaves de criptografia
- Se esquecer a senha, dados sao perdidos (sem recuperacao)
- Codigo aberto e verificavel

Leia a [Politica de Privacidade](docs/privacy-policy.md) completa.

---

## Download

Baixe a versao mais recente na pagina de [Releases](https://github.com/ycarofguth/obs-powergrid/releases/latest):

| Plataforma            | Instalador          | Arquivo Portavel |
| --------------------- | ------------------- | ---------------- |
| Windows (x64)         | `.exe` (instalador) | `.zip`           |
| macOS (Apple Silicon) | `.dmg`              | `.tar.gz`        |
| macOS (Intel)         | `.dmg`              | `.tar.gz`        |
| Linux (x64)           | —                   | `.tar.gz`        |

---

## Uso no OBS

1. Abra o OBS PowerGrid e conecte suas tomadas
2. Na pagina **Overlays**, copie a URL do overlay desejado
3. No OBS Studio, adicione uma fonte **Navegador** (Browser Source)
4. Cole a URL copiada (ex: `http://localhost:47531/overlay`)
5. Ajuste largura e altura conforme recomendado no editor de overlay

O fundo do overlay e transparente por padrao — funciona como overlay direto sobre a cena.

---

## Pre-requisitos da Tuya

Antes de usar o app, voce precisa:

1. Ter uma **tomada inteligente Tuya** com medicao de energia
2. Criar uma conta no [Tuya IoT Platform](https://iot.tuya.com)
3. Criar um **Cloud Project** e vincular seus dispositivos
4. Obter o **Access ID** e **Access Secret** do projeto

O app guia voce nesse processo durante o setup inicial.

---

## Desenvolvimento

### Pre-requisitos

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+

### Setup

```bash
# Clonar o repositorio
git clone https://github.com/ycarofguth/obs-powergrid.git
cd obs-powergrid

# Instalar dependencias
pnpm install

# Rodar em modo desenvolvimento (frontend + sidecar)
pnpm dev

# Rodar com janela Neutralino (desktop nativo)
pnpm dev:neu
```

### Comandos

| Comando        | Descricao                          |
| -------------- | ---------------------------------- |
| `pnpm dev`     | Frontend + sidecar em paralelo     |
| `pnpm dev:neu` | Modo desktop com Neutralino        |
| `pnpm build`   | Build completo (sidecar + desktop) |
| `pnpm test`    | Executar testes                    |
| `pnpm format`  | Formatar codigo                    |
| `pnpm lint`    | Verificar lint                     |
| `pnpm dist`    | Build de distribuicao              |

### Build para Distribuicao

```bash
pnpm dist
```

O script detecta a plataforma automaticamente e gera o pacote em `dist/`.

---

## Estrutura do Projeto

```
├── apps/
│   ├── desktop/           # Frontend React (Neutralino) — @obs-tuya/desktop
│   │   └── src/
│   │       ├── pages/     # 20 paginas
│   │       ├── components/# Componentes (layout, cards, charts, dialogs)
│   │       ├── services/  # API client, sidecar management, tray
│   │       └── styles/    # globals.css (design system)
│   └── sidecar/           # Backend Node.js — @obs-tuya/sidecar
│       └── src/
│           ├── routes/    # 13 arquivos de rotas
│           ├── services/  # 17 servicos
│           └── db/        # Schema (9 tabelas), init, migrations
├── packages/
│   └── shared/            # Tipos e constantes — @obs-tuya/shared
├── scripts/               # Scripts de dev e build
├── docs/                  # Documentacao (portugues)
└── neutralino.config.json # Configuracao Neutralino
```

---

## Arquitetura

```
┌─────────────────┐     ┌─────────────────────────────────────┐     ┌─────────────────┐
│   Tuya Cloud    │────▶│           Sidecar Express           │────▶│   Smart Plug    │
│   (REST API)    │     │            (:47531)                 │     │   (TCP/AES)     │
└─────────────────┘     │  ┌─────────────────────────────┐    │     └─────────────────┘
                        │  │  SQLCipher DB (criptografado)│    │
                        │  └─────────────────────────────┘    │
                        └─────────────────────────────────────┘
                                       ↑
                             ┌─────────┴─────────┐
                        Neutralino App      OBS Browser Source
                        (config UI)         (/overlay)
```

- **Neutralino.js** — Runtime desktop leve (~2-5 MB), alternativa ao Electron
- **Sidecar Express** — Processo Node.js local que gerencia conexoes e banco de dados
- **Comunicacao local** — TCP/AES direto com a tomada (<100ms de latencia)
- **Comunicacao cloud** — REST API da Tuya como alternativa (250-600ms)

---

## Stack

| Camada     | Tecnologia                  | Versao             |
| ---------- | --------------------------- | ------------------ |
| Desktop    | Neutralino.js               | 6.5.0              |
| Frontend   | React + TypeScript + Vite   | 19.x / 5.7.x / 6.x |
| UI         | Radix UI + Tailwind CSS     | 4.x                |
| Graficos   | Recharts                    | 3.x                |
| Backend    | Node.js + Express           | 22.x / 5.x         |
| Banco      | better-sqlite3 + SQLCipher  | 12.x               |
| ORM        | Drizzle ORM                 | 0.45.x             |
| Crypto     | argon2 + Node.js crypto     | 0.44.x             |
| Tuya Local | TuyAPI                      | 7.5.x              |
| Tuya Cloud | @tuya/tuya-connector-nodejs | 2.x                |
| Testes     | Vitest                      | 4.x                |

---

## Portas

| Porta | Servico               |
| ----- | --------------------- |
| 47531 | Sidecar Express       |
| 47532 | Neutralino            |
| 47533 | Vite dev server (dev) |

---

## Documentacao

| Documento                                                                     | Descricao                  |
| ----------------------------------------------------------------------------- | -------------------------- |
| [Decisoes de Arquitetura](docs/architecture.md)                               | 16 ADRs documentados       |
| [Requisitos Funcionais](docs/requirements/functional-requirements.md)         | 42 requisitos              |
| [Requisitos Nao-Funcionais](docs/requirements/non-functional-requirements.md) | 16 requisitos              |
| [Milestones](docs/milestones.md)                                              | M1-M7 com escopo e status  |
| [Design System](docs/design/design-system.md)                                 | Cores, tokens, componentes |
| [Politica de Privacidade](docs/privacy-policy.md)                             | Zero telemetria            |
| [Guia de Configuracao](docs/setup-guide.md)                                   | Setup inicial              |

---

## Contribuindo

Contribuicoes sao bem-vindas! Leia o [Guia de Contribuicao](CONTRIBUTING.md) para saber como participar.

---

## Licenca

Este projeto e licenciado sob a [GNU General Public License v3.0](LICENSE).

```
OBS PowerGrid
Copyright (C) 2026 ycaroguth

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```
