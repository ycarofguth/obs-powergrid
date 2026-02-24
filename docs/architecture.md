# Decisões de Arquitetura (ADRs)

Registro das decisões técnicas do projeto OBS PowerGrid.

---

## ADR-001: Neutralino em vez de Electron

**Status:** Aceita | **Data:** 2026-01-28

**Contexto:** Precisamos de um runtime desktop para a UI de configuração. Electron é o padrão da indústria mas gera binários de 150-200 MB.

**Decisão:** Usar Neutralino.js, que gera binários de ~2-5 MB usando o WebView nativo do sistema operacional.

**Consequências:**

- Binário final muito menor
- Não executa Node.js diretamente (necessita sidecar)
- Menor ecossistema e comunidade que Electron
- API nativa mais limitada

---

## ADR-002: Browser Source em vez de Plugin C++

**Status:** Aceita | **Data:** 2026-01-28

**Contexto:** OBS suporta plugins nativos em C++ e Browser Sources (URL renderizada como overlay). Precisamos exibir dados de consumo sobre a transmissão.

**Decisão:** Usar Browser Source apontando para um servidor HTTP local.

**Consequências:**

- Flexibilidade visual total (HTML/CSS/JS)
- Fundo transparente nativo
- Zero dependências no OBS — funciona com qualquer versão
- Debug fácil via Chrome DevTools
- Depende de servidor HTTP rodando localmente

---

## ADR-003: Local API em vez de Cloud API

**Status:** Aceita | **Data:** 2026-01-28

**Contexto:** Dispositivos Tuya podem ser acessados via Cloud API (REST, internet) ou Local API (TCP/AES, rede local). Para um overlay de stream, latência é crítica.

**Decisão:** Usar Local API via TuyAPI (protocolo TCP/AES direto na rede local).

**Consequências:**

- Latência <100ms (vs 250-600ms da Cloud API)
- Funciona sem internet
- Sem rate limits ou custos de API
- Requer que o dispositivo esteja na mesma rede
- Requer credenciais manuais (Local Key)

---

## ADR-004: Sidecar Node.js

**Status:** Aceita | **Data:** 2026-01-28

**Contexto:** Neutralino não executa Node.js. TuyAPI é uma biblioteca Node.js que implementa o protocolo Tuya via TCP/AES.

**Decisão:** Usar um processo Node.js separado (sidecar) gerenciado pelo Neutralino via `os.spawnProcess`.

**Consequências:**

- TuyAPI funciona normalmente
- Conexão TCP persistente com o dispositivo
- Sidecar serve API HTTP para overlay e app
- Precisa gerenciar ciclo de vida do processo (start/stop)
- Binário final inclui Node.js + dependências do sidecar

---

## ADR-005: Bring Your Keys (credenciais manuais do usuário)

**Status:** Aceita | **Data:** 2026-01-28 | **Atualizada:** 2026-02-16

**Contexto:** Para comunicar com dispositivos Tuya, são necessários Access ID, Access Secret (do projeto Tuya IoT Platform), além de Device ID, Local Key e IP de cada dispositivo. Avaliamos três abordagens: OAuth via Smart Home API (requer vincular devices à conta do desenvolvedor), Cloud Developer (cada usuário cria projeto no Tuya IoT), e Bring Your Keys.

**Decisão:** Bring Your Keys — o usuário cria seu próprio projeto no Tuya IoT Platform e configura Access ID/Secret no app. O app usa a Cloud API do Tuya com as credenciais do próprio usuário para buscar automaticamente seus devices, Local Keys e versão de protocolo.

**Motivo:** Com OAuth (Smart Home), os dispositivos do usuário ficariam temporariamente vinculados ao projeto do desenvolvedor para obter Local Keys, o que viola o princípio de privacidade do projeto (ADR-014). Com Bring Your Keys, as credenciais ficam 100% com o usuário.

**Consequências:**

- Privacidade máxima — nenhum device vinculado à conta do desenvolvedor
- Setup requer que o usuário crie projeto no Tuya IoT Platform (documentado no setup-guide)
- Cloud API usada apenas com credenciais do próprio usuário
- Comunicação em tempo real pode ser local (TuyAPI) ou cloud (toggle por dispositivo)
- App não depende de trial ou quota do desenvolvedor

---

## ADR-006: Monorepo com apps/ + packages/ e pnpm workspaces

**Status:** Aceita | **Data:** 2026-02-01

**Contexto:** O projeto tem dois executáveis (desktop Neutralino e sidecar Node.js) e uma biblioteca interna de tipos compartilhados. Precisamos de uma estrutura de monorepo clara e ferramentas adequadas ao tamanho do projeto (3 pacotes, 1 desenvolvedor).

**Decisão:** Usar pnpm workspaces puro com separação `apps/` (executáveis) e `packages/` (bibliotecas). Sem Nx ou Turborepo — complexidade desnecessária para o tamanho do projeto. Turborepo pode ser adicionado no futuro se builds ficarem lentos.

**Consequências:**

- Separação semântica clara entre apps e libs
- Zero overhead de ferramentas de monorepo
- Build ordering manual (`&&` no package.json) — suficiente para 3 pacotes
- Sem cache de builds (aceitável enquanto builds demoram segundos)

---

## ADR-007: Shared como Internal Package (sem build)

**Status:** Aceita | **Data:** 2026-02-01

**Contexto:** O pacote `@obs-tuya/shared` exporta tipos TypeScript e constantes consumidos por desktop e sidecar. A prática tradicional é compilar pacotes compartilhados antes dos consumidores. A prática moderna para pacotes internos é exportar `.ts` direto.

**Decisão:** O shared exporta arquivos `.ts` diretamente (`"main": "./src/index.ts"`), sem etapa de build. Vite (desktop) e tsc/tsx (sidecar) fazem a transpilação.

**Consequências:**

- Mudanças propagam instantaneamente (sem rebuild do shared)
- Go-to-definition no IDE vai direto ao código fonte
- Tree-shaking funciona melhor (bundler analisa o source)
- Elimina bugs de tipos desatualizados entre pacotes
- Não pode ser publicado no npm sem adicionar build step

---

## ADR-008: Banco de dados com SQLCipher

**Status:** Aceita | **Data:** 2026-02-02

**Contexto:** Precisamos de um banco de dados local para armazenar: configurações de dispositivos, credenciais criptografadas, histórico de leituras, logs de atividade e preferências. Requisitos: criptografia at-rest, boa performance, compatibilidade com Node.js e builds multi-plataforma.

**Alternativas consideradas:**

| Opção                           | Prós                                               | Contras                                 |
| ------------------------------- | -------------------------------------------------- | --------------------------------------- |
| better-sqlite3-multiple-ciphers | Rápido, síncrono, SQLCipher integrado, bem mantido | Binding nativo, precisa compilar por SO |
| sql.js + crypto manual          | WASM, zero compilação nativa                       | Mais lento, criptografia só nos campos  |
| @journeyapps/sqlcipher          | Binding SQLCipher oficial                          | Menos mantido, API mais antiga          |

**Decisão:** Usar `better-sqlite3-multiple-ciphers` com `Drizzle ORM`.

- **better-sqlite3-multiple-ciphers**: Fork do better-sqlite3 com SQLCipher (AES-256-CBC) integrado. Criptografia transparente de todo o arquivo do banco.
- **Drizzle ORM**: ORM leve e type-safe para TypeScript. ~50KB, suporta better-sqlite3, schema declarativo, migrations.

**Consequências:**

- Banco de dados totalmente criptografado em disco
- Queries síncronas e rápidas
- Type-safety completo com Drizzle
- Precisa compilar bindings nativos para cada plataforma (Windows, Linux, macOS x64/arm64)
- CI/CD precisa de builds separados por plataforma
- `prebuild` ou GitHub Actions podem gerar binários pré-compilados

---

## ADR-009: Estratégia de criptografia dupla

**Status:** Aceita | **Data:** 2026-02-02

**Contexto:** Dados sensíveis (Local Key, Access ID, Access Secret) precisam de proteção forte. SQLCipher criptografa o banco inteiro, mas se a chave do SQLCipher for comprometida, todos os dados ficam expostos. Queremos uma segunda camada de defesa.

**Decisão:** Criptografia em duas camadas:

1. **SQLCipher (camada 1):** Todo o arquivo `.db` criptografado com AES-256-CBC. Chave derivada da senha do usuário.
2. **AES-256-GCM (camada 2):** Campos sensíveis (Local Key, Access ID, Access Secret) criptografados individualmente antes de salvar no banco.

**Derivação de chaves:**

- Algoritmo: **Argon2id** (via pacote `argon2`, binding nativo)
- Parâmetros mínimos: memory 64MB, iterations 3, parallelism 1
- Salt: 16 bytes aleatórios, gerado no primeiro uso, armazenado no banco
- **HKDF** para derivar chaves separadas:
  - `key_sqlcipher` = HKDF(master_key, "sqlcipher")
  - `key_fields` = HKDF(master_key, "fields")

**Fluxo:**

```
senha → Argon2id(senha, salt) → master_key
master_key → HKDF("sqlcipher") → key_sqlcipher → abre SQLCipher
master_key → HKDF("fields") → key_fields → criptografa/descriptografa campos
```

**Consequências:**

- Comprometer key_sqlcipher não expõe automaticamente os campos sensíveis
- Comprometer key_fields não abre o banco
- Derivação lenta (Argon2id) protege contra brute-force
- Binding nativo do `argon2` precisa compilar por plataforma (já temos esse custo com SQLCipher)
- Sem recuperação de senha (dados perdidos se esquecer — reset total)

---

## ADR-010: Integração com Tuya Cloud API

**Status:** Aceita | **Data:** 2026-02-02

**Contexto:** Para eliminar a configuração manual de credenciais ("Bring Your Keys"), precisamos integrar com a Tuya Cloud API. Isso permite buscar automaticamente: lista de dispositivos, Local Keys e versão de protocolo.

**Decisão:** Usar o SDK oficial `@tuya/tuya-connector-nodejs` para integração com Tuya Cloud API.

**Arquitetura:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Tuya Cloud    │────▶│    Sidecar      │────▶│   Dispositivo   │
│   (REST API)    │     │   (Node.js)     │     │   (TCP/AES)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  OAuth + REST         │   HTTP local          │  TuyAPI
        │  (buscar devices,     │   (API interna)       │  (comunicação
        │   Local Keys,         │                       │   em tempo real)
        │   protocolo)          │                       │
```

**Endpoints utilizados:**

| Endpoint                        | Propósito                                   |
| ------------------------------- | ------------------------------------------- |
| `GET /v1.0/token`               | Obter access token (OAuth)                  |
| `GET /v1.0/users/{uid}/devices` | Listar dispositivos do usuário              |
| `GET /v1.0/devices/{device_id}` | Detalhes do dispositivo (Local Key, versão) |

**Modo de comunicação (toggle por dispositivo):**

- **Local (TuyAPI):** TCP/AES direto na rede local. Latência <100ms, funciona offline.
- **Cloud (Tuya API):** REST via Tuya Cloud. Latência 250-600ms, funciona de qualquer rede.

**Consequências:**

- Setup automatizado (usuário só precisa Access ID/Secret do projeto)
- Local Keys obtidas sem script manual
- Versão de protocolo detectada automaticamente
- Dependência do SDK da Tuya (~200KB)
- Requer internet no onboarding (para validar credenciais e buscar devices)
- Comunicação em tempo real pode ser local (offline) ou cloud

---

## ADR-011: Detecção automática de versão de protocolo

**Status:** Aceita | **Data:** 2026-02-02

**Contexto:** Dispositivos Tuya usam diferentes versões do protocolo local (3.1, 3.2, 3.3, 3.4, 3.5). A versão afeta a criptografia e formato dos pacotes. TuyAPI precisa saber a versão para conectar corretamente.

**Alternativas:**

1. **Usuário informa manualmente:** Requer conhecimento técnico, propenso a erros.
2. **Auto-detect via tentativas:** Tentar cada versão até funcionar. Lento, pode causar bloqueio temporário.
3. **Obter via Cloud API:** Consultar Tuya Cloud para saber a versão exata.

**Decisão:** Obter versão de protocolo via Tuya Cloud API (opção 3).

A resposta de `GET /v1.0/devices/{device_id}` inclui o campo `protocol_version` (ou inferível de outros campos como `category` e `product_id`). Essa informação é obtida no momento do cadastro e armazenada no banco.

**Consequências:**

- Zero configuração manual de versão
- Funciona para qualquer dispositivo suportado pela Tuya
- Depende da Cloud API estar configurada (já é obrigatória no onboarding)
- Se versão não disponível na API (raro), fallback para 3.3 (mais comum)

---

## ADR-012: CI/CD com GitHub Actions

**Status:** Aceita | **Data:** 2026-02-02

**Contexto:** Precisamos de pipeline automatizado para: rodar testes em cada PR, buildar binários multi-plataforma, e publicar releases no GitHub.

**Decisão:** Usar GitHub Actions para CI/CD.

**Workflows:**

| Workflow      | Trigger           | Ação                                                      |
| ------------- | ----------------- | --------------------------------------------------------- |
| `ci.yml`      | Push/PR em `main` | Lint, test, type-check                                    |
| `release.yml` | Tag `v*`          | Build multi-plataforma, upload assets para GitHub Release |

**Build multi-plataforma:**

- **Windows:** x64
- **Linux:** x64 (AppImage ou tar.gz)
- **macOS:** x64 + arm64 (universal binary ou separados)

**Desafio:** Bindings nativos (better-sqlite3-multiple-ciphers, argon2) precisam ser compilados para cada plataforma/arquitetura.

**Estratégias:**

1. **Matrix build:** Jobs separados para cada SO no GitHub Actions (ubuntu, windows, macos)
2. **prebuild:** Usar `prebuild` ou `prebuild-install` para binários pré-compilados
3. **Cross-compilation:** Compilar para outras plataformas em um único runner (mais complexo)

**Decisão de implementação:** Matrix build com runners nativos.

**Consequências:**

- Build automatizado e reproduzível
- Releases consistentes com assets por plataforma
- Tempo de build maior (paralelo, mas múltiplos runners)
- Custo zero (GitHub Actions é gratuito para repos públicos)

---

## ADR-013: Verificação de atualização via GitHub API

**Status:** Aceita | **Data:** 2026-02-02

**Contexto:** Usuários precisam saber quando há versões novas disponíveis. Não queremos auto-update (complexo, requer assinatura de código), mas queremos notificar.

**Decisão:** Verificar atualizações consultando a GitHub Releases API.

**Implementação:**

```
GET https://api.github.com/repos/{owner}/{repo}/releases/latest
```

**Comportamento:**

- Verificação automática ao abrir o app (máximo 1x por dia)
- Verificação manual via botão em Configurações
- Comparar `tag_name` da release com versão instalada (SemVer)
- Se nova versão: badge no menu + banner na tela de Atualizações
- Link abre página de Releases no navegador (download manual)

**Consequências:**

- Zero infraestrutura própria
- Funciona enquanto GitHub existir
- Rate limit da API: 60 req/hora para não-autenticados (suficiente para nosso uso)
- Sem auto-update (usuário baixa e instala manualmente)
- Funciona offline (mostra versão local, sem check remoto)

---

## ADR-014: Zero telemetria e política de privacidade

**Status:** Aceita | **Data:** 2026-02-02

**Contexto:** Queremos que o app seja completamente transparente sobre o que faz com dados do usuário. Nenhuma informação deve ser enviada para servidores próprios.

**Decisão:** Zero telemetria. Nenhuma coleta de dados.

**Comunicações externas permitidas (e documentadas):**

| Destino                   | Propósito                      | Quando                              |
| ------------------------- | ------------------------------ | ----------------------------------- |
| Tuya Cloud API            | Buscar devices, Local Keys     | Configurado pelo usuário, explícito |
| Dispositivos Tuya (local) | Leitura de dados em tempo real | Sempre (modo local)                 |
| GitHub API                | Check de versão                | Automático (1x/dia) ou manual       |

**Proibido:**

- Telemetria, analytics, crash reporting
- Requisições para servidores próprios
- Coleta de métricas de uso
- Envio de dados de consumo para qualquer lugar

**Política de privacidade:**

- Documento em `docs/privacy-policy.md` e acessível no app
- Linguagem simples e direta
- Explica cada comunicação externa
- Código aberto = verificável
- Aceite obrigatório no onboarding

**Consequências:**

- Confiança do usuário (verificável)
- Sem custos de infraestrutura
- Sem métricas de uso (não sabemos quantos usam, onde, como)
- Bugs reportados manualmente pelo usuário

---

## ADR-015: Biblioteca de gráficos

**Status:** Aceita | **Data:** 2026-02-02

**Contexto:** Precisamos exibir gráficos de histórico: linha para potência ao longo do tempo, barras para custo acumulado. Requisitos: React-friendly, boa DX, performance aceitável para séries temporais de ~1000 pontos.

**Alternativas:**

| Biblioteca         | Tamanho | Prós                                      | Contras                   |
| ------------------ | ------- | ----------------------------------------- | ------------------------- |
| Recharts           | ~150KB  | React-first, declarativo, bem documentado | Mais pesado               |
| Chart.js           | ~60KB   | Flexível, canvas-based, popular           | Menos "React-like"        |
| uPlot              | ~30KB   | Ultra leve, muito rápido                  | API menos amigável        |
| Lightweight Charts | ~40KB   | Excelente para séries temporais           | Mais voltado para finance |

**Decisão:** Usar **Recharts**.

Justificativa: melhor integração com React (componentes declarativos), documentação excelente, comunidade ativa, features suficientes para nosso caso. O overhead de ~150KB é aceitável considerando que o app já inclui React e shadcn/ui.

**Consequências:**

- Gráficos declarativos e fáceis de estilizar
- Boa integração com Tailwind/shadcn
- Bundle maior (~150KB adicional)
- Performance adequada para ~1000 pontos (nosso caso)

---

## ADR-016: Menu nativo e System Tray via Neutralino

**Status:** Aceita | **Data:** 2026-02-16

**Contexto:** O WKWebView do macOS suprime `alert()`/`confirm()` e não suporta Cmd+V para paste sem menu nativo. Além disso, streamers querem que o app rode em background (minimizado na bandeja).

**Decisão:** Usar APIs nativas do Neutralino para:

1. **Edit menu** (`window.setMainMenu`) com `action: 'paste:'` — resolve clipboard no macOS
2. **System tray** (`os.setTray`) — minimizar para bandeja (M6)
3. **Window state** (`window.getPosition/getSize`) — salvar posição/tamanho (M6)

**Consequências:**

- Ctrl+V/Cmd+V funciona nativamente no macOS
- `window.*` adicionado ao nativeAllowList (aumento mínimo de superfície de API)
- Tray e window state serão implementados no M6
- Requer ícone de tray 20x20 PNG
