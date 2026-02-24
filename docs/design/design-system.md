# Design System — OBS PowerGrid

**Versão:** 0.1.0
**Última atualização:** 2026-02-21

---

## Conceito

**Professional Dark Mode + Neon Glow:** Interface escura com paleta neutra (zinc) e acentos coloridos semânticos, com efeitos de glow sutis em azul. Combina a legibilidade profissional com o visual atrativo para streamers.

**Filosofia visual:**

- **Tokens semânticos:** Componentes usam APENAS classes semânticas (`bg-primary`, `text-success`), NUNCA cores hardcoded (`bg-blue-500`, `text-emerald-400`)
- **Centralizado em globals.css:** Para mudar o tema inteiro, editar APENAS `apps/desktop/src/styles/globals.css`
- **Dark mode only:** Color scheme fixo em dark (zinc neutral)
- **Feedback claro:** Cores semânticas distintas para cada estado (success, warning, destructive, info)
- **Glow sutil:** Efeitos de brilho nos focus states, card hover, e classes utilitárias — nunca agressivo

---

## Onde Editar

| O que mudar            | Arquivo                                      | Seção                                 |
| ---------------------- | -------------------------------------------- | ------------------------------------- |
| Cores do tema          | `apps/desktop/src/styles/globals.css`        | `@theme { }` (Tailwind 4)             |
| HSL para shadcn compat | `apps/desktop/src/styles/globals.css`        | `:root { }`                           |
| Sidebar cores          | `apps/desktop/src/styles/globals.css`        | `:root { --sidebar-* }`               |
| Chart cores            | `apps/desktop/src/styles/globals.css`        | `:root { --chart-* }`                 |
| Glow effects           | `apps/desktop/src/styles/globals.css`        | `:root { --glow-* }`                  |
| Border radius          | `apps/desktop/src/styles/globals.css`        | `@theme { --radius* }`                |
| Fontes carregadas      | `apps/desktop/index.html`                    | Google Fonts `<link>`                 |
| Font families          | `apps/desktop/src/styles/globals.css`        | `body { font-family }` e `.font-mono` |
| Form styles globais    | `apps/desktop/src/styles/globals.css`        | Form Elements section                 |
| Animações              | `apps/desktop/src/styles/globals.css`        | `@keyframes`                          |
| Sidebar layout         | `apps/desktop/src/components/MainLayout.tsx` | `AppSidebar` component                |
| Ícones                 | Componentes TSX                              | `@phosphor-icons/react` imports       |

---

## Paleta de Cores

### Tokens Semânticos (definidos em `@theme {}`)

| Token                            | Hex                    | Uso                                         | Classe Tailwind                      |
| -------------------------------- | ---------------------- | ------------------------------------------- | ------------------------------------ |
| `--color-primary`                | `#3B82F6` (blue-500)   | CTAs, links, active state, focus ring, glow | `bg-primary`, `text-primary`         |
| `--color-primary-foreground`     | `#ffffff`              | Texto sobre primary                         | `text-primary-foreground`            |
| `--color-secondary`              | `#27272a` (zinc-800)   | Backgrounds secundários                     | `bg-secondary`                       |
| `--color-secondary-foreground`   | `#fafafa`              | Texto sobre secondary                       | `text-secondary-foreground`          |
| `--color-accent`                 | `#27272a` (zinc-800)   | Hover states                                | `bg-accent`                          |
| `--color-accent-foreground`      | `#fafafa`              | Texto sobre accent                          | `text-accent-foreground`             |
| `--color-destructive`            | `#ef4444` (red-500)    | Erros, ações destrutivas, desconectado      | `bg-destructive`, `text-destructive` |
| `--color-destructive-foreground` | `#ffffff`              | Texto sobre destructive                     | `text-destructive-foreground`        |
| `--color-success`                | `#22c55e` (green-500)  | Conectado, sucesso, positivo                | `bg-success`, `text-success`         |
| `--color-success-foreground`     | `#ffffff`              | Texto sobre success                         | `text-success-foreground`            |
| `--color-warning`                | `#fbbf24` (amber-400)  | Energia (watts), caution, connecting        | `bg-warning`, `text-warning`         |
| `--color-warning-foreground`     | `#09090b`              | Texto sobre warning                         | `text-warning-foreground`            |
| `--color-info`                   | `#a855f7` (purple-500) | Config, informacional                       | `bg-info`, `text-info`               |
| `--color-info-foreground`        | `#ffffff`              | Texto sobre info                            | `text-info-foreground`               |

### Neutros (Zinc Scale — zero blue saturation)

| Token                      | Hex       | Tailwind Equiv. | Uso                         |
| -------------------------- | --------- | --------------- | --------------------------- |
| `--color-background`       | `#09090b` | zinc-950        | Background principal (body) |
| `--color-foreground`       | `#fafafa` | zinc-50         | Texto principal             |
| `--color-card`             | `#18181b` | zinc-900        | Background de cards         |
| `--color-card-foreground`  | `#fafafa` | zinc-50         | Texto em cards              |
| `--color-muted`            | `#27272a` | zinc-800        | Background muted            |
| `--color-muted-foreground` | `#a1a1aa` | zinc-400        | Texto muted, placeholders   |
| `--color-border`           | `#27272a` | zinc-800        | Bordas                      |
| `--color-input`            | `#18181b` | zinc-900        | Background de inputs        |
| `--color-ring`             | `#3B82F6` | blue-500        | Focus ring                  |

### Sidebar

| Token                          | Valor                                                |
| ------------------------------ | ---------------------------------------------------- |
| `--sidebar-background`         | `#09090b` (zinc-950)                                 |
| `--sidebar-foreground`         | `#fafafa` (zinc-50)                                  |
| `--sidebar-primary`            | `#3B82F6` (blue-500)                                 |
| `--sidebar-primary-foreground` | `#ffffff`                                            |
| `--sidebar-accent`             | `rgba(161, 161, 170, 0.08)` (zinc neutro para hover) |
| `--sidebar-accent-foreground`  | `#3B82F6`                                            |
| `--sidebar-border`             | `#27272a` (zinc-800)                                 |

### Chart Colors

| Variable    | Cor                | Uso                   |
| ----------- | ------------------ | --------------------- |
| `--chart-1` | `#3B82F6` (blue)   | Primary data, voltage |
| `--chart-2` | `#22c55e` (green)  | Secondary data, cost  |
| `--chart-3` | `#fbbf24` (amber)  | Energy, power         |
| `--chart-4` | `#ef4444` (red)    | Alerts, errors        |
| `--chart-5` | `#a855f7` (purple) | Info, additional      |

---

## Regra de Ouro: Tokens Semânticos

**NUNCA** usar cores Tailwind hardcoded nos componentes. **SEMPRE** usar tokens semânticos.

| ERRADO (hardcoded)  | CORRETO (semântico)          |
| ------------------- | ---------------------------- |
| `text-emerald-400`  | `text-success`               |
| `bg-emerald-500/15` | `bg-success/15`              |
| `text-amber-400`    | `text-warning`               |
| `bg-amber-500/10`   | `bg-warning/10`              |
| `text-rose-400`     | `text-destructive`           |
| `bg-rose-500/10`    | `bg-destructive/10`          |
| `text-purple-400`   | `text-info`                  |
| `bg-purple-500/10`  | `bg-info/10`                 |
| `text-cyan-400`     | `text-primary`               |
| `bg-cyan-500/15`    | `bg-primary/15`              |
| `text-slate-500`    | `text-muted-foreground`      |
| `bg-zinc-800`       | `bg-muted` ou `bg-secondary` |
| `border-zinc-700`   | `border-border`              |

**Opacity modifiers** funcionam com tokens: `bg-success/15`, `border-primary/20`, `text-destructive/80`

---

## Neon Glow Effects

### Variáveis de Glow (definidas em `:root`)

| Variable                | Valor                              | Cor base       |
| ----------------------- | ---------------------------------- | -------------- |
| `--glow-primary`        | `0 0 8px rgba(59, 130, 246, 0.3)`  | Blue           |
| `--glow-primary-strong` | `0 0 16px rgba(59, 130, 246, 0.4)` | Blue (intenso) |
| `--glow-success`        | `0 0 8px rgba(34, 197, 94, 0.3)`   | Green          |
| `--glow-warning`        | `0 0 8px rgba(251, 191, 36, 0.3)`  | Amber          |
| `--glow-destructive`    | `0 0 8px rgba(239, 68, 68, 0.3)`   | Red            |

### Classes Utilitárias de Glow

| Classe              | Efeito                                               | Onde usar                             |
| ------------------- | ---------------------------------------------------- | ------------------------------------- |
| `.neon-text`        | `text-shadow: 0 0 8px rgba(blue, 0.4)`               | Títulos destacados, valores ativos    |
| `.neon-text-energy` | `text-shadow: 0 0 8px rgba(amber, 0.4)`              | Valores de energia (watts)            |
| `.icon-glow`        | `drop-shadow(0 0 4px rgba(blue, 0.3))`               | Ícones primários em destaque          |
| `.icon-glow-energy` | `drop-shadow(0 0 4px rgba(amber, 0.3))`              | Ícones de energia                     |
| `.icon-glow-status` | `drop-shadow(0 0 4px rgba(green, 0.3))`              | Ícones de status conectado            |
| `.shadow-primary`   | `box-shadow: var(--glow-primary)`                    | Cards/containers com destaque primary |
| `.shadow-energy`    | `box-shadow: var(--glow-warning)`                    | Cards/containers de energia           |
| `.shadow-status`    | `box-shadow: var(--glow-success)`                    | Cards/containers de status            |
| `.shadow-danger`    | `box-shadow: var(--glow-destructive)`                | Cards/containers de erro              |
| `.hover-glow`       | Border glow on hover (`border-color` + `box-shadow`) | Cards interativos                     |
| `.nav-active-glow`  | `box-shadow: 0 0 8px rgba(blue, 0.15)`               | Item de navegação ativo               |

### Onde o Glow é Aplicado Automaticamente

| Elemento           | Efeito                                                                     | Definido em                              |
| ------------------ | -------------------------------------------------------------------------- | ---------------------------------------- |
| Input/select focus | `box-shadow: var(--glow-primary)`                                          | globals.css (form elements)              |
| Card hover         | `border-color: rgba(blue, 0.15)` + `box-shadow: 0 0 12px rgba(blue, 0.06)` | globals.css (`[class*="bg-card"]:hover`) |
| Focus visible      | `outline: 2px solid rgba(blue, 0.5)`                                       | globals.css (`:focus-visible`)           |
| Grid pattern       | Linhas sutis blue 3% opacity                                               | globals.css (`.bg-grid-pattern`)         |

---

## Sidebar — Floating Pills

### Padrão Visual

O sidebar usa o padrão **Floating Pills** com componentes shadcn/ui (`ui/sidebar.tsx`):

```
┌──────────────────────────┐
│  ⚡ PowerGrid             │  ← Header: ícone Lightning + nome
│──────────────────────────│
│  ── Monitor ──────────   │  ← Section divider com linhas
│                          │
│  ╭───────────────────╮   │
│  │ ◉ Dashboard       │   │  ← Pill ativa: bg-primary/15
│  ╰───────────────────╯   │    text-primary, icon fill
│    ○ Dispositivos        │  ← Inativo: text-muted-foreground
│    ○ Overlays            │    icon regular
│                          │
│  ── Cloud ────────────   │
│    ○ Cloud               │
│                          │
│  ── Sistema ──────────   │
│    ○ Ferramentas         │
│    ○ Logs                │
│    ○ Configurações       │
│    ○ Segurança           │
│                          │
│    ○ Ajuda               │
│    ○ Sobre               │
│──────────────────────────│
│    ⇥ Sair                │  ← Footer: hover destructive
└──────────────────────────┘
```

### Estilos do Sidebar

| Elemento             | Classe/Estilo                                                                 |
| -------------------- | ----------------------------------------------------------------------------- |
| **Item ativo**       | `text-primary bg-primary/15 rounded-lg` + icon `weight="fill"`                |
| **Item inativo**     | `text-muted-foreground rounded-lg` + icon `weight="regular"`                  |
| **Hover**            | `hover:bg-muted/50 hover:text-foreground rounded-lg`                          |
| **Logout hover**     | `hover:text-destructive hover:bg-destructive/10 rounded-lg`                   |
| **Section divider**  | Classe `.nav-section-divider` — linhas `::before`/`::after` com texto central |
| **Header expandido** | Ícone `Lightning` fill + "PowerGrid" em `text-foreground`                     |
| **Header colapsado** | Ícone `Lightning` fill centralizado                                           |

### Detecção de Estado Ativo

```typescript
function isActive(pathname: string, item: NavItem): boolean {
  const patterns = item.match || [item.to]
  return patterns.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
```

### Comportamento

- **Colapsável:** `collapsible="icon"` (shadcn) — colapsa para apenas ícones (48px)
- **Atalho:** `Ctrl/Cmd + B` para toggle
- **Persistência:** Estado salvo em cookie (7 dias)
- **Mobile:** Sheet/drawer (breakpoint 360px)
- **Tooltips:** Aparecem no modo colapsado (Radix Tooltip)

### Seções de Navegação

| Seção         | Itens                                       | Ícones                                         |
| ------------- | ------------------------------------------- | ---------------------------------------------- |
| Monitor       | Dashboard, Dispositivos, Overlays           | `ChartLineUp`, `Plug`, `Stack`                 |
| Cloud         | Cloud                                       | `Cloud`                                        |
| Sistema       | Ferramentas, Logs, Configurações, Segurança | `Wrench`, `FileText`, `GearSix`, `ShieldCheck` |
| _(sem label)_ | Ajuda, Sobre                                | `Question`, `Info`                             |
| Footer        | Sair                                        | `SignOut`                                      |

---

## Tipografia

### Fontes

Carregadas via Google Fonts em `apps/desktop/index.html`:

```
Inter: 400, 500, 600, 700
JetBrains Mono: 400, 500, 700
```

| Fonte          | Uso                                                      | Classe                      |
| -------------- | -------------------------------------------------------- | --------------------------- |
| Inter          | UI geral, headings, body text                            | Default (body font-family)  |
| JetBrains Mono | Valores numéricos (watts, volts, corrente), IDs, códigos | `.font-mono` ou `font-mono` |

### Convenções

- Headings: Inter, `font-bold` ou `font-semibold`
- Body: Inter, `font-normal`
- Valores de energia: JetBrains Mono, `font-bold`, `font-variant-numeric: tabular-nums`
- Classe utilitária: `.energy-value` (mono + tabular nums + transition)

---

## Ícones — Phosphor Icons

Pacote: `@phosphor-icons/react` v2.x

**Importar assim:**

```tsx
import { Lightning, WifiHigh, GearSix } from '@phosphor-icons/react'
```

### Convenções de Weight

| Weight    | Uso                                   | Exemplo                                  |
| --------- | ------------------------------------- | ---------------------------------------- |
| `fill`    | Item de nav ativo, ícones em destaque | `<Lightning size={20} weight="fill" />`  |
| `bold`    | Ações, botões                         | `<Plus size={16} weight="bold" />`       |
| `regular` | Item de nav inativo, ícones neutros   | `<GearSix size={18} weight="regular" />` |
| `duotone` | Ícones decorativos, seções, cards     | `<GearSix size={24} weight="duotone" />` |

### Tamanhos Padrão

| Contexto                                    | Size  |
| ------------------------------------------- | ----- |
| Inline com texto (badges, labels)           | 12-14 |
| Botões de ação, nav items                   | 16-20 |
| Headers de seção, cards                     | 20-24 |
| Ícones hero (tela de setup, estados vazios) | 32-40 |

### Mapeamento de Ícones

| Conceito       | Ícone Phosphor              | Import                  |
| -------------- | --------------------------- | ----------------------- |
| Energia/Watts  | `Lightning`                 | `@phosphor-icons/react` |
| Voltagem       | `WaveTriangle`              | `@phosphor-icons/react` |
| Corrente       | `Pulse`                     | `@phosphor-icons/react` |
| Conectado/WiFi | `WifiHigh`                  | `@phosphor-icons/react` |
| Desconectado   | `WifiSlash`                 | `@phosphor-icons/react` |
| Configurações  | `GearSix`                   | `@phosphor-icons/react` |
| Dashboard      | `ChartLineUp`               | `@phosphor-icons/react` |
| Dispositivos   | `Plug`                      | `@phosphor-icons/react` |
| Overlays       | `Stack`                     | `@phosphor-icons/react` |
| Cloud          | `Cloud`                     | `@phosphor-icons/react` |
| Ferramentas    | `Wrench`                    | `@phosphor-icons/react` |
| Logs           | `ListDashes`                | `@phosphor-icons/react` |
| Segurança      | `Shield`                    | `@phosphor-icons/react` |
| Ajuda          | `Question`                  | `@phosphor-icons/react` |
| Sobre          | `Info`                      | `@phosphor-icons/react` |
| Sair           | `SignOut`                   | `@phosphor-icons/react` |
| Adicionar      | `Plus`                      | `@phosphor-icons/react` |
| Editar         | `PencilSimple`              | `@phosphor-icons/react` |
| Remover        | `Trash`                     | `@phosphor-icons/react` |
| Copiar         | `Copy`                      | `@phosphor-icons/react` |
| Atualizar      | `ArrowsClockwise`           | `@phosphor-icons/react` |
| Sucesso        | `CheckCircle`               | `@phosphor-icons/react` |
| Erro           | `XCircle` / `WarningCircle` | `@phosphor-icons/react` |
| Voltar         | `ArrowLeft`                 | `@phosphor-icons/react` |
| Download       | `DownloadSimple`            | `@phosphor-icons/react` |
| Timer          | `Timer`                     | `@phosphor-icons/react` |
| Counter        | `Hash`                      | `@phosphor-icons/react` |

---

## Border Radius

| Token                      | Valor          | Uso                             |
| -------------------------- | -------------- | ------------------------------- |
| `--radius-sm`              | 0.125rem (2px) | Badges, tags, small elements    |
| `--radius` / `--radius-md` | 0.25rem (4px)  | Cards, inputs, buttons (padrão) |
| `--radius-lg`              | 0.375rem (6px) | Cards destacados, modals        |
| `rounded-full`             | 9999px         | Pills, avatars, dots de status  |

---

## Sombras

Definidas em `:root` — tons escuros (dark mode):

| Token              | Valor                         | Uso               |
| ------------------ | ----------------------------- | ----------------- |
| `--shadow-sm`      | `0 1px 2px rgba(0,0,0,0.5)`   | Hover sutil       |
| `--shadow-default` | `0 1px 3px rgba(0,0,0,0.6)`   | Cards padrão      |
| `--shadow-md`      | `0 4px 6px rgba(0,0,0,0.5)`   | Cards elevados    |
| `--shadow-lg`      | `0 10px 15px rgba(0,0,0,0.5)` | Modals, dropdowns |

---

## Transições

| Token               | Valor      | Uso                             |
| ------------------- | ---------- | ------------------------------- |
| `--transition-fast` | 150ms ease | Micro-interações (hover, focus) |
| `--transition-base` | 200ms ease | Transições padrão               |
| `--transition-slow` | 300ms ease | Animações maiores               |

---

## Animações

| Classe                  | Efeito                                | Uso                     |
| ----------------------- | ------------------------------------- | ----------------------- |
| `.animate-spin`         | Rotação 360° / 1s linear              | Loading spinners        |
| `.animate-pulse-energy` | Opacidade 1→0.7→1 / 2s                | Dados em tempo real     |
| `.animate-neon-pulse`   | Opacidade + text-shadow pulsante / 2s | Texto com glow pulsante |
| `.animate-glow-breathe` | Box-shadow respirando / 3s            | Cards com glow animado  |

**Respeta `prefers-reduced-motion`:** Todas as animações são desabilitadas quando o usuário prefere motion reduzido.

---

## Form Elements

Estilizados globalmente em `globals.css` para todos os tipos de input. Não precisa estilizar individualmente nos componentes.

**Background:** `var(--color-input)` (zinc-900)
**Border:** `1px solid var(--color-border)` (zinc-800)
**Radius:** `var(--radius)` (4px)
**Focus:** border blue + glow blue (`var(--glow-primary)`)
**Disabled:** opacity 0.5, cursor not-allowed
**Placeholder:** `var(--color-muted-foreground)` (zinc-400)

Select tem seta customizada (SVG Phosphor CaretDown).

---

## Componentes UI (Radix + Custom)

Componentes em `apps/desktop/src/components/ui/`:

| Componente | Origem                    | Arquivo            |
| ---------- | ------------------------- | ------------------ |
| Sidebar    | shadcn/ui pattern (Radix) | `ui/sidebar.tsx`   |
| Sheet      | Radix Dialog              | `ui/sheet.tsx`     |
| Tooltip    | Radix Tooltip             | `ui/tooltip.tsx`   |
| Separator  | Radix Separator           | `ui/separator.tsx` |

Componentes custom:
| Componente | Arquivo | Descrição |
| --- | --- | --- |
| Dialog | `components/Dialog.tsx` | Sistema de dialogs (alert, confirm, success, error, warning) |
| StatusBadge | `components/StatusBadge.tsx` | Badge de status (connected, disconnected, connecting, error, disabled) |
| DeviceCard | `components/DeviceCard.tsx` | Card de dispositivo com ações |
| PasswordInput | `components/PasswordInput.tsx` | Input de senha com toggle visibilidade |
| MainLayout | `components/MainLayout.tsx` | Layout com sidebar Floating Pills |
| PowerChart | `components/charts/PowerChart.tsx` | Gráfico de potência (Recharts LineChart) |
| CostChart | `components/charts/CostChart.tsx` | Gráfico de custo (Recharts BarChart) |
| ComparisonPowerChart | `components/charts/ComparisonPowerChart.tsx` | Comparação multi-device (power) |
| ComparisonCostChart | `components/charts/ComparisonCostChart.tsx` | Comparação multi-device (cost) |
| PeriodSelector | `components/dashboard/PeriodSelector.tsx` | Seletor de período (1h-30d + custom) |
| DeviceSelector | `components/dashboard/DeviceSelector.tsx` | Multi-select de dispositivos |
| RankingCard | `components/dashboard/RankingCard.tsx` | Card de ranking |
| TuyaSetupGuide | `components/TuyaSetupGuide.tsx` | Accordion guia de setup Tuya |

---

## Estados Visuais de Status

| Estado       | Cor Token          | Dot                   | Badge                                | Exemplo de uso      |
| ------------ | ------------------ | --------------------- | ------------------------------------ | ------------------- |
| Conectado    | `success`          | `bg-success`          | `bg-success/15 text-success`         | Device online       |
| Desconectado | `muted-foreground` | `bg-muted-foreground` | `bg-muted text-muted-foreground`     | Device offline      |
| Conectando   | `warning`          | `bg-warning`          | `bg-warning/15 text-warning`         | Tentando conectar   |
| Erro         | `destructive`      | `bg-destructive`      | `bg-destructive/15 text-destructive` | Falha de conexão    |
| Desabilitado | `muted-foreground` | —                     | `bg-muted text-muted-foreground`     | Device desabilitado |

---

## Layout Desktop (Neutralino)

**Janela:** 500x600px (min 400x500, resizable)
**Layout:** Sidebar esquerda (Floating Pills) + conteúdo principal

```
┌──────────┬──────────────────────────┐
│ ⚡ PG    │                          │
│──────────│    Main Content          │
│─ Monitor─│    (pages via Outlet)    │
│ Dashboard│                          │
│ Devices  │                          │
│ Overlays │                          │
│          │                          │
│─ Cloud ──│                          │
│ Cloud    │                          │
│          │                          │
│─ Sistema─│                          │
│ Tools    │                          │
│ Logs     │                          │
│ Settings │                          │
│ Security │                          │
│          │                          │
│ Help     │                          │
│ About    │                          │
│──────────│                          │
│ Sair     │                          │
└──────────┴──────────────────────────┘
```

---

## Overlay (OBS Browser Source)

O overlay é HTML servido pelo sidecar, customizável via editor no app.

**Background:** Transparente por padrão (OBS remove). Configurável com cor + opacidade.
**Tipografia:** Font family configurável, text shadow para legibilidade sobre qualquer fundo.
**Layout:** Horizontal ou vertical.
**Métricas:** Power (W/kW), Voltage (V), Current (mA/A) — cada uma toggle on/off.

Cores default do overlay:
| Dado | Cor |
| --- | --- |
| Power (watts) | Amber (`#fbbf24`) |
| Voltage | Blue (`#3b82f6`) |
| Current | Green (`#22c55e`) |

---

## Gráficos (Recharts)

Convenções para cores nos gráficos:

| Tipo de dado     | Cor              | CSS Variable                   |
| ---------------- | ---------------- | ------------------------------ |
| Potência (W)     | Amber            | `var(--color-warning)`         |
| Custo (R$)       | Green            | `var(--color-success)`         |
| Média/referência | Blue             | `var(--color-primary)`         |
| Grid/eixos       | Border           | `hsl(var(--border))`           |
| Texto eixos      | Muted foreground | `hsl(var(--muted-foreground))` |

Tooltip customizado usa classes semânticas (`bg-card`, `border-border`, `text-muted-foreground`).

---

## Acessibilidade

- **Contraste:** WCAG AA mínimo para todos os textos
- **Focus visible:** `outline: 2px solid rgba(59, 130, 246, 0.5)` + `outline-offset: 2px`
- **Focus inputs:** Glow azul (`var(--glow-primary)`) no focus
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` desabilita todas as animações e transições
- **Labels:** Todos os form inputs têm labels associados
- **Cursor pointer:** Todos os elementos clicáveis
- **Color not only indicator:** Status usa ícone + cor + texto
