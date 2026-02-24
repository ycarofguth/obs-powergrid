# Requisitos Não-Funcionais

**Projeto:** OBS PowerGrid
**Versão:** 0.1.0 (MVP)
**Última atualização:** 2026-02-02

---

## Convenções

- **Prioridade:** Must (obrigatório) | Should (importante) | Could (desejável)
- **Milestone:** M1–M7 (ver [milestones.md](../milestones.md))
- **Status:** Draft | Aprovado | Implementado

---

## NFR-1xx: Performance

### NFR-101: Latência de leitura local

**Prioridade:** Must | **Milestone:** M3 | **Status:** Draft

A leitura de dados via protocolo local (TCP/AES) deve ter latência inferior a 100ms.

**Critérios de Aceitação:**

- [ ] Tempo entre requisição e resposta do dispositivo < 100ms (rede local)
- [ ] Overlay atualiza com frequência percebida como "tempo real"
- [ ] Medível via logs de performance

---

### NFR-102: Consumo de recursos

**Prioridade:** Should | **Milestone:** M3 | **Status:** Draft

O app e o sidecar juntos devem consumir recursos moderados, considerando que rodam simultaneamente com OBS e software de streaming.

**Critérios de Aceitação:**

- [ ] Uso de RAM combinado (Neutralino + sidecar) < 200MB em uso normal
- [ ] Uso de CPU < 5% em idle (quando não há dados sendo lidos ativamente, apenas polling)
- [ ] Sem memory leaks em uso prolongado (>24h)

---

### NFR-103: Tamanho do binário

**Prioridade:** Should | **Milestone:** M7 | **Status:** Draft

O binário distribuído deve ser significativamente menor que alternativas baseadas em Electron.

**Critérios de Aceitação:**

- [ ] Binário Neutralino (sem Node.js sidecar) < 10MB
- [ ] Pacote completo (Neutralino + sidecar + node_modules) < 50MB
- [ ] Documentar tamanho final por plataforma

---

### NFR-104: Tempo de inicialização

**Prioridade:** Should | **Milestone:** M3 | **Status:** Draft

O app deve iniciar e estar pronto para uso em tempo razoável.

**Critérios de Aceitação:**

- [ ] Tela de login (desbloqueio com senha) exibida em < 3 segundos
- [ ] Após desbloqueio, dashboard carregado em < 2 segundos
- [ ] Conexão automática com tomadas habilitadas iniciada imediatamente após desbloqueio

---

## NFR-2xx: Segurança

### NFR-201: Criptografia at-rest

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

Todos os dados sensíveis armazenados localmente devem estar criptografados.

**Critérios de Aceitação:**

- [ ] Banco de dados criptografado com SQLCipher (AES-256-CBC)
- [ ] Campos sensíveis com criptografia adicional (AES-256-GCM)
- [ ] Sem credenciais em plaintext em nenhum arquivo do sistema
- [ ] Sem credenciais em variáveis de ambiente (.env)
- [ ] Chaves de criptografia derivadas da senha do usuário, nunca hardcoded

---

### NFR-202: Segurança da senha

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

A derivação de chave a partir da senha deve seguir padrões criptográficos seguros.

**Critérios de Aceitação:**

- [ ] Algoritmo: Argon2id (preferido) ou PBKDF2 (fallback)
- [ ] Salt aleatório de pelo menos 16 bytes
- [ ] Para Argon2id: parâmetros mínimos — memory: 64MB, iterations: 3, parallelism: 1
- [ ] Para PBKDF2: mínimo 600.000 iterações (OWASP 2024)
- [ ] Chaves separadas derivadas via HKDF para SQLCipher e criptografia de campos

---

### NFR-203: Comunicação de rede

**Prioridade:** Must | **Milestone:** M3 | **Status:** Draft

A comunicação com dispositivos e APIs deve ser segura.

**Critérios de Aceitação:**

- [ ] Comunicação local: protocolo Tuya TCP/AES (criptografado nativamente)
- [ ] Comunicação Cloud: HTTPS obrigatório (Tuya Cloud API usa HTTPS)
- [ ] Sidecar HTTP: localhost only (não expor para rede externa)
- [ ] Sem envio de credenciais para servidores que não sejam Tuya Cloud API

---

### NFR-204: Segurança do sidecar HTTP

**Prioridade:** Must | **Milestone:** M3 | **Status:** Draft

O servidor HTTP do sidecar deve ser acessível apenas localmente.

**Critérios de Aceitação:**

- [ ] Bind em `127.0.0.1` (não em `0.0.0.0`)
- [ ] Sem autenticação necessária (é local, mas documentar o risco)
- [ ] Headers CORS configurados apenas para origens locais
- [ ] Sem rotas que exponham credenciais descriptografadas na resposta

---

## NFR-3xx: Privacidade

### NFR-301: Zero coleta de dados

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O app não deve coletar, transmitir ou armazenar dados fora do computador do usuário.

**Critérios de Aceitação:**

- [ ] Nenhuma telemetria, analytics ou crash reporting
- [ ] Nenhuma requisição a servidores próprios (o projeto não tem servidores)
- [ ] Únicas comunicações externas: Tuya Cloud API (quando habilitada), GitHub API (check versão)
- [ ] Ambas as comunicações externas são opt-in ou transparentes
- [ ] Código aberto para verificação

---

### NFR-302: Política de privacidade clara

**Prioridade:** Must | **Milestone:** M7 | **Status:** Draft

O projeto deve ter documentação de privacidade clara e acessível.

**Critérios de Aceitação:**

- [ ] Política de privacidade no repositório GitHub
- [ ] Acessível dentro do app
- [ ] Linguagem simples e direta
- [ ] Explica exatamente quais comunicações externas existem e por quê
- [ ] Explica que o código é aberto e verificável

---

## NFR-4xx: Portabilidade

### NFR-401: Suporte multi-plataforma

**Prioridade:** Must | **Milestone:** M7 | **Status:** Draft

O app deve funcionar nas três plataformas desktop principais.

**Critérios de Aceitação:**

- [ ] Windows 10+ (x64)
- [ ] Linux: Ubuntu 22.04+, Fedora 38+, ou equivalentes (x64)
- [ ] macOS 12+ (x64 e arm64/Apple Silicon)
- [ ] Aparência consistente nas três plataformas (WebView nativo do Neutralino)
- [ ] SQLCipher compilado para cada plataforma

---

### NFR-402: Independência de instalação

**Prioridade:** Should | **Milestone:** M7 | **Status:** Draft

O usuário que baixar o binário pré-compilado não deve precisar instalar dependências adicionais.

**Critérios de Aceitação:**

- [ ] Node.js bundled no pacote de distribuição
- [ ] Sem necessidade de instalar Python, Node.js, ou outros runtimes
- [ ] Executável auto-contido (exceto dependências de sistema como WebView)
- [ ] Documentar pré-requisitos de sistema se houver (ex: WebView2 no Windows)

---

## NFR-5xx: Usabilidade

### NFR-501: Onboarding guiado

**Prioridade:** Must | **Milestone:** M6 | **Status:** Draft

Usuários não-técnicos devem conseguir configurar o app seguindo o wizard.

**Critérios de Aceitação:**

- [ ] Wizard com linguagem simples (sem jargão técnico desnecessário)
- [ ] Screenshots/ilustrações para passos na Tuya IoT Platform
- [ ] Mensagens de erro claras e acionáveis
- [ ] Possibilidade de pular etapas e completar depois

---

### NFR-502: Feedback do sistema

**Prioridade:** Must | **Milestone:** M3 | **Status:** Draft

O app deve comunicar claramente o que está acontecendo ao usuário.

**Critérios de Aceitação:**

- [ ] Loading states em todas as operações assíncronas
- [ ] Mensagens de sucesso e erro claras
- [ ] Status de conexão de cada tomada visível
- [ ] Indicador quando o sidecar está rodando/parado

---

### NFR-503: Acessibilidade básica

**Prioridade:** Should | **Milestone:** M6 | **Status:** Draft

O app deve seguir boas práticas básicas de acessibilidade.

**Critérios de Aceitação:**

- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Navegação por teclado funcional
- [ ] Labels em formulários (acessíveis para screen readers)
- [ ] Tamanhos de fonte legíveis

---

## NFR-6xx: Manutenibilidade

### NFR-601: Qualidade de código

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O código deve seguir padrões consistentes e ser testável.

**Critérios de Aceitação:**

- [ ] TypeScript strict mode em todos os pacotes
- [ ] ESLint sem erros
- [ ] Prettier sem arquivos desformatados
- [ ] Cobertura de testes: rotas da API e funções de criptografia (mínimo)
- [ ] Código em inglês, documentação em português

---

### NFR-602: Documentação técnica

**Prioridade:** Must | **Milestone:** M7 | **Status:** Draft

O projeto deve ter documentação suficiente para contribuição.

**Critérios de Aceitação:**

- [ ] README com instruções de setup e desenvolvimento
- [ ] CLAUDE.md atualizado com contexto do projeto
- [ ] ADRs para todas as decisões arquiteturais relevantes
- [ ] Requisitos documentados e rastreáveis

---

### NFR-603: Estrutura de monorepo

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

A estrutura do monorepo deve seguir convenções e ser escalável.

**Critérios de Aceitação:**

- [ ] Separação `apps/` (executáveis) e `packages/` (bibliotecas)
- [ ] pnpm workspaces para gerenciamento de dependências
- [ ] Shared como internal package (exporta .ts direto, sem build)
- [ ] Scripts centralizados na raiz para operações comuns
