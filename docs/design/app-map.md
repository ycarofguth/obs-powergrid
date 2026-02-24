# App Map

**Projeto:** OBS PowerGrid
**Versão:** 0.1.0 (MVP)
**Última atualização:** 2026-02-02

---

## Visão Geral da Navegação

```
┌─────────────────────────────────────────────────────────┐
│                    PRIMEIRO ACESSO                       │
│                                                         │
│  Onboarding Wizard ──→ Home (Dashboard)                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    USO REGULAR                           │
│                                                         │
│  Login (Senha) ──→ Home (Dashboard)                     │
│                        │                                │
│                   ┌────┴─────────────────────┐          │
│                   │        MENU              │          │
│                   ├──────────────────────────┤          │
│                   │  Home (Dashboard)        │          │
│                   │  Tomadas                 │          │
│                   │  Chaves e Segurança      │          │
│                   │  Configurações           │          │
│                   │  Logs                    │          │
│                   │  Atualizações            │          │
│                   └──────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## Princípio de Reutilização

As telas usadas no onboarding **são as mesmas telas** do app regular, exibidas em modo wizard (com navegação step-by-step). Isso significa:

- Não existem telas exclusivas do onboarding — apenas um wrapper de wizard que orquestra telas reutilizáveis
- Após o onboarding, o usuário acessa as mesmas telas individualmente via menu
- Componentes de formulário (credenciais, seleção de dispositivos, configuração de layout) são compartilhados

```
Onboarding Wizard
  └── usa → Tela de Credenciais Cloud (mesma de Chaves e Segurança)
  └── usa → Tela de Seleção de Dispositivos (mesma de Tomadas > Adicionar)
  └── usa → Tela de Configuração de Layout (mesma de Tomadas > Overlay)
```

---

## 1. Onboarding (Primeiro Acesso)

Fluxo linear com navegação avançar/voltar. Executado apenas na primeira abertura. Pode ser re-executado via Configurações.

### 1.1 Termos e Boas-vindas

| Item          | Detalhe                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| **Tela:**     | `OnboardingWelcome`                                                         |
| **Conteúdo:** | Breve descrição do app + resumo dos termos de uso e política de privacidade |
| **Ações:**    | Checkbox "Li e aceito os termos" → Botão "Avançar"                          |
| **Regra:**    | Não pode avançar sem aceitar                                                |
| **Link:**     | Termos completos acessíveis via link (abre modal ou nova aba)               |

### 1.2 Configuração de Credenciais e Senha

| Item                       | Detalhe                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Tela:**                  | `CloudCredentialsForm` (reutilizável)                                                                                              |
| **Conteúdo:**              | Macro passos visuais: (1) Criar conta Tuya Developer, (2) Criar Cloud Project e vincular app, (3) Copiar Access ID e Access Secret |
| **Campos:**                | Access ID, Access Secret                                                                                                           |
| **Senha:**                 | Campo para criar senha do app (aproveitando o momento de setup)                                                                    |
| **Ações:**                 | Botão "Testar Conexão" → Feedback de validação → Botão "Avançar"                                                                   |
| **Guia:**                  | Passo-a-passo ilustrado com links para Tuya IoT Platform                                                                           |
| **Componente reusado em:** | Chaves e Segurança                                                                                                                 |

### 1.3 Seleção de Dispositivos

| Item                       | Detalhe                                                    |
| -------------------------- | ---------------------------------------------------------- |
| **Tela:**                  | `DeviceSelector` (reutilizável)                            |
| **Conteúdo:**              | Lista de dispositivos encontrados via Cloud API            |
| **Exibe por device:**      | Nome, Device ID, categoria, status (online/offline)        |
| **Ação por device:**       | Checkbox para selecionar + toggle Local/Cloud para cada um |
| **Regra:**                 | Pelo menos 1 dispositivo selecionado para avançar          |
| **Componente reusado em:** | Tomadas > Adicionar                                        |

### 1.4 Configuração de Layout

| Item                       | Detalhe                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Tela:**                  | `OverlayLayoutEditor` (reutilizável)                                         |
| **Conteúdo:**              | Configuração visual do overlay para os dispositivos selecionados             |
| **Opções:**                | Font size, font color, borda, sombra, layout H/V, background, dados exibidos |
| **Preview:**               | Visualização em tempo real do overlay                                        |
| **Componente reusado em:** | Tomadas > Detalhes > Overlay                                                 |

### 1.5 Resumo

| Item          | Detalhe                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| **Tela:**     | `OnboardingSummary`                                                                   |
| **Conteúdo:** | Resumo do setup: credenciais configuradas, dispositivos selecionados, layout definido |
| **Exibe:**    | Checklist visual do que foi configurado                                               |
| **Ações:**    | Botão "Concluir" → Redireciona para Home (Dashboard)                                  |
| **Extras:**   | Dica de como adicionar Browser Source no OBS (URL para copiar)                        |

### Fluxo do Onboarding

```
[1.1 Termos] → [1.2 Credenciais + Senha] → [1.3 Dispositivos] → [1.4 Layout] → [1.5 Resumo] → Home
     ↑                   ↑                        ↑                    ↑
     └───────────────────┴────────────────────────┴────────────────────┘
                              (navegação voltar)
```

---

## 2. Login

Tela exibida em toda abertura do app (exceto primeiro acesso).

| Item       | Detalhe                                                   |
| ---------- | --------------------------------------------------------- |
| **Tela:**  | `LoginScreen`                                             |
| **Campo:** | Senha do app                                              |
| **Ação:**  | Desbloquear → Redireciona para Home                       |
| **Erro:**  | Feedback de senha incorreta (sem bloqueio por tentativas) |

---

## 3. Home (Dashboard)

Página inicial após login. Visão centralizada de tudo que é importante.

| Item      | Detalhe    |
| --------- | ---------- |
| **Tela:** | `HomePage` |
| **Rota:** | `/`        |

### Conteúdo

**Contadores/Mostradores:**

| Mostrador                | Descrição                                                     |
| ------------------------ | ------------------------------------------------------------- |
| Total de tomadas         | Número total de tomadas cadastradas                           |
| Tomadas conectadas       | Quantidade com monitoramento ativo                            |
| Consumo médio por tomada | Média de potência (W) das tomadas conectadas                  |
| Custo do período         | Consumo em R$ (ou moeda configurada) baseado no kWh informado |

**Ações rápidas:**

| Botão                 | Ação                                          |
| --------------------- | --------------------------------------------- |
| Adicionar tomada      | Abre fluxo de adicionar (Tomadas > Adicionar) |
| Ver todas as tomadas  | Navega para lista de Tomadas                  |
| Copiar URL do overlay | Copia URL unificada                           |
| Configurar kWh        | Abre configuração de preço                    |

**Resumo por tomada:**

- Cards compactos com: nome, status (conectada/desconectada), potência atual (W)
- Click no card → navega para detalhes da tomada

---

## 4. Menu

Navegação lateral ou superior, acessível de qualquer tela.

| Item do Menu       | Ícone     | Destino     | Descrição                        |
| ------------------ | --------- | ----------- | -------------------------------- |
| Home               | dashboard | `/`         | Dashboard principal              |
| Tomadas            | plug      | `/devices`  | Gerenciamento de dispositivos    |
| Chaves e Segurança | key/lock  | `/security` | Credenciais Cloud e senha do app |
| Configurações      | settings  | `/settings` | Preferências gerais do app       |
| Logs               | list      | `/logs`     | Histórico de atividades          |
| Atualizações       | download  | `/updates`  | Versão e changelog               |

**Comportamento:**

- Indicador visual da seção ativa
- Menu visível em todas as telas (exceto onboarding e login)
- Responsivo: sidebar em telas grandes, hamburger em telas menores (se aplicável)

---

## 5. Tomadas

Seção central de gerenciamento de dispositivos.

### 5.1 Lista de Tomadas

| Item                  | Detalhe                                                                                |
| --------------------- | -------------------------------------------------------------------------------------- |
| **Tela:**             | `DeviceListPage`                                                                       |
| **Rota:**             | `/devices`                                                                             |
| **Conteúdo:**         | Lista de todas as tomadas cadastradas                                                  |
| **Por tomada:**       | Nome, status (conectada/desconectada/desabilitada), potência atual, modo (Local/Cloud) |
| **Ações por tomada:** | Conectar/Desconectar, Habilitar/Desabilitar, Ver detalhes                              |
| **Ações globais:**    | Botão "Adicionar tomada", busca/filtro por nome                                        |

### 5.2 Adicionar Tomada

| Item             | Detalhe                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| **Tela:**        | `DeviceSelector` (reutilizável — mesma do onboarding 1.3)                  |
| **Acesso:**      | Botão na lista de tomadas ou ação rápida no Home                           |
| **Fluxo:**       | Buscar dispositivos via Cloud → Selecionar → Escolher Local/Cloud → Salvar |
| **Alternativa:** | Formulário manual (Device ID, Local Key, IP, versão protocolo)             |

### 5.3 Detalhes da Tomada

| Item      | Detalhe            |
| --------- | ------------------ |
| **Tela:** | `DeviceDetailPage` |
| **Rota:** | `/devices/:id`     |

**Abas ou seções:**

| Seção             | Conteúdo                                                                             |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Monitoramento** | Dados em tempo real (W, V, A, status on/off), gráfico de histórico, custo do período |
| **Configuração**  | Editar nome, credenciais, modo Local/Cloud, habilitar/desabilitar                    |
| **Overlay**       | `OverlayLayoutEditor` (reutilizável) + URL copiável + preview                        |

**Ações:**

- Conectar/Desconectar
- Editar informações
- Configurar overlay
- Copiar URL do overlay individual
- Remover tomada

### 5.4 Overlay Combinado

| Item          | Detalhe                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| **Acesso:**   | Dentro da seção Tomadas (botão "Overlay combinado") ou ação rápida no Home |
| **Conteúdo:** | `OverlayLayoutEditor` configurando o overlay unificado (todas as tomadas)  |
| **URL:**      | `http://localhost:{PORT}/overlay` — copiável                               |
| **Preview:**  | Visualização com dados de todas as tomadas conectadas                      |

---

## 6. Chaves e Segurança

Gerenciamento de credenciais e segurança do app.

| Item      | Detalhe        |
| --------- | -------------- |
| **Tela:** | `SecurityPage` |
| **Rota:** | `/security`    |

**Seções:**

| Seção                 | Conteúdo                                                                        |
| --------------------- | ------------------------------------------------------------------------------- |
| **Credenciais Cloud** | `CloudCredentialsForm` (reutilizável) — editar Access ID/Secret, testar conexão |
| **Senha do App**      | Alterar senha (requer senha atual)                                              |
| **Informações**       | Status da criptografia, última alteração de senha                               |

---

## 7. Configurações

Preferências gerais do app.

| Item      | Detalhe        |
| --------- | -------------- |
| **Tela:** | `SettingsPage` |
| **Rota:** | `/settings`    |

**Opções:**

| Configuração           | Descrição                                            |
| ---------------------- | ---------------------------------------------------- |
| Preço do kWh           | Valor e moeda para cálculo de custo                  |
| Intervalo de coleta    | Frequência de polling dos dispositivos (padrão: 5s)  |
| Retenção de histórico  | Dias para manter dados de leitura (padrão: 90 dias)  |
| Retenção de logs       | Dias para manter logs de atividade (padrão: 30 dias) |
| Re-executar onboarding | Botão para iniciar o wizard novamente                |
| Termos de uso          | Link para termos e política de privacidade           |

---

## 8. Logs

Histórico de atividades do sistema.

| Item      | Detalhe    |
| --------- | ---------- |
| **Tela:** | `LogsPage` |
| **Rota:** | `/logs`    |

**Conteúdo:**

- Lista cronológica reversa (mais recente primeiro)
- Cada entrada: timestamp, tipo, descrição, dispositivo (se aplicável)
- Filtros: por tipo (conexão, configuração, erro, sistema), por dispositivo, por período
- Opção de exportar logs

**Tipos de eventos registrados:**

| Tipo         | Exemplos                                                    |
| ------------ | ----------------------------------------------------------- |
| Sistema      | App aberto, app fechado                                     |
| Conexão      | Tomada X conectada, Tomada X desconectada, falha de conexão |
| Configuração | Credenciais alteradas, tomada adicionada, layout modificado |
| Erro         | Falha de comunicação, credenciais inválidas                 |

---

## 9. Atualizações e Changelog

Informações de versão e atualizações disponíveis.

| Item      | Detalhe       |
| --------- | ------------- |
| **Tela:** | `UpdatesPage` |
| **Rota:** | `/updates`    |

**Conteúdo:**

| Seção                  | Descrição                                               |
| ---------------------- | ------------------------------------------------------- |
| Versão instalada       | Número da versão atual                                  |
| Atualização disponível | Banner se nova versão existe, com link para download    |
| Changelog              | Lista de versões com release notes (do GitHub Releases) |

**Comportamento:**

- Dados buscados via GitHub API (repositório público)
- Cache local (busca 1x por dia no máximo)
- Funciona sem internet (mostra versão local, sem changelog remoto)

---

## Mapa de Componentes Reutilizáveis

Componentes que aparecem tanto no onboarding quanto no uso regular:

| Componente             | Onboarding | Uso Regular                                      |
| ---------------------- | ---------- | ------------------------------------------------ |
| `CloudCredentialsForm` | Passo 1.2  | Chaves e Segurança                               |
| `DeviceSelector`       | Passo 1.3  | Tomadas > Adicionar                              |
| `OverlayLayoutEditor`  | Passo 1.4  | Tomadas > Detalhes > Overlay / Overlay Combinado |

---

## Mapa de Rotas

```
/                     → HomePage (Dashboard)
/onboarding           → OnboardingWizard
/onboarding/welcome   → Passo 1.1
/onboarding/setup     → Passo 1.2
/onboarding/devices   → Passo 1.3
/onboarding/layout    → Passo 1.4
/onboarding/summary   → Passo 1.5
/login                → LoginScreen
/devices              → DeviceListPage
/devices/add          → DeviceSelector
/devices/:id          → DeviceDetailPage
/devices/:id/overlay  → OverlayLayoutEditor (device)
/overlay/combined     → OverlayLayoutEditor (combinado)
/security             → SecurityPage
/settings             → SettingsPage
/logs                 → LogsPage
/updates              → UpdatesPage
```

---

## Fluxo de Navegação Geral

```
Primeiro acesso:
  App abre → Onboarding Wizard → [1.1→1.2→1.3→1.4→1.5] → Home

Acessos subsequentes:
  App abre → Login → Home
                       │
                       ├─→ Tomadas ─→ Lista ─→ Detalhes ─→ Overlay
                       │                   └─→ Adicionar
                       │                   └─→ Overlay Combinado
                       │
                       ├─→ Chaves e Segurança
                       ├─→ Configurações
                       ├─→ Logs
                       └─→ Atualizações
```
