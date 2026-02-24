# Requisitos Funcionais

**Projeto:** OBS PowerGrid
**Versão:** 0.1.0 (MVP)
**Última atualização:** 2026-02-02

---

## Convenções

- **Prioridade:** Must (obrigatório) | Should (importante) | Could (desejável)
- **Milestone:** M1–M7 (ver [milestones.md](../milestones.md))
- **Status:** Draft | Aprovado | Implementado

---

## FR-1xx: Multi-device

### FR-101: Cadastrar tomada

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O usuário deve ser capaz de cadastrar uma nova tomada inteligente informando um nome de identificação e as credenciais do dispositivo.

**Critérios de Aceitação:**

- [ ] Formulário com campos: nome, Device ID, Local Key, IP Address
- [ ] Versão do protocolo é preenchida automaticamente via Cloud (FR-404)
- [ ] Credenciais são criptografadas antes de salvar no banco (FR-502, FR-503)
- [ ] Validação de campos obrigatórios antes de salvar
- [ ] Feedback visual de sucesso ou erro ao salvar
- [ ] Tomada aparece na listagem após cadastro

**Notas Técnicas:**

- Quando a integração Cloud estiver configurada (FR-401), os campos Device ID, Local Key, IP e versão de protocolo podem ser preenchidos automaticamente (FR-402)
- Fallback manual: usuário pode preencher todos os campos manualmente

---

### FR-102: Listar tomadas

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O usuário deve ver uma listagem de todas as tomadas cadastradas com status de conexão.

**Critérios de Aceitação:**

- [ ] Lista exibe: nome, status (conectada/desconectada/desabilitada), dados em tempo real (se conectada)
- [ ] Indicador visual de status (cor ou ícone)
- [ ] Ações rápidas acessíveis por tomada (conectar, desconectar, editar, remover)
- [ ] Lista atualiza automaticamente quando status muda
- [ ] Ordenação por drag and drop (ordem personalizada pelo usuário)
- [ ] Ordem persiste entre sessões e reflete no overlay combinado e dashboard

---

### FR-103: Editar tomada

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O usuário deve ser capaz de atualizar informações de uma tomada cadastrada.

**Critérios de Aceitação:**

- [ ] Editar: nome, Device ID, Local Key, IP Address
- [ ] Se a tomada estiver conectada, desconectar antes de aplicar alterações
- [ ] Campos sensíveis (Local Key) são re-criptografados ao salvar
- [ ] Validação de campos obrigatórios

---

### FR-104: Remover tomada

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O usuário deve ser capaz de remover uma tomada cadastrada.

**Critérios de Aceitação:**

- [ ] Confirmação antes de remover (diálogo "Tem certeza?")
- [ ] Se conectada, desconectar antes de remover
- [ ] Dados históricos associados são removidos junto
- [ ] Tomada desaparece da listagem imediatamente

---

### FR-105: Habilitar/desabilitar tomada

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O usuário deve ser capaz de habilitar ou desabilitar uma tomada cadastrada sem removê-la.

**Critérios de Aceitação:**

- [ ] Toggle de habilitar/desabilitar na listagem
- [ ] Tomada desabilitada não tenta conexão automática
- [ ] Tomada desabilitada não aparece no overlay nem no dashboard de monitoramento
- [ ] Tomada desabilitada permanece visível na listagem (com indicador visual)
- [ ] Estado persiste entre sessões do app

---

### FR-106: URL individual por tomada

**Prioridade:** Must | **Milestone:** M4 | **Status:** Draft

Cada tomada deve ter uma URL única para uso como Browser Source individual no OBS.

**Critérios de Aceitação:**

- [ ] URL no formato `http://localhost:{PORT}/overlay/{deviceId}`
- [ ] Exibe apenas dados da tomada específica
- [ ] Respeita configurações de estilo da tomada (FR-2xx)
- [ ] URL copiável com um clique na interface
- [ ] Retorna página com mensagem adequada se a tomada não existir ou estiver desabilitada

---

### FR-107: URL unificada (todas as tomadas)

**Prioridade:** Should | **Milestone:** M4 | **Status:** Draft

O usuário deve ter a opção de uma URL que exiba dados de todas as tomadas habilitadas em um único overlay.

**Critérios de Aceitação:**

- [ ] URL no formato `http://localhost:{PORT}/overlay`
- [ ] Exibe dados de todas as tomadas habilitadas e conectadas
- [ ] Layout responsivo ao número de tomadas
- [ ] Tomadas que conectam/desconectam atualizam o overlay automaticamente
- [ ] URL copiável com um clique

---

### FR-108: Retry automático de conexão

**Prioridade:** Must | **Milestone:** M3 | **Status:** Draft

Quando uma tomada conectada perde comunicação, o sistema deve tentar reconectar automaticamente.

**Critérios de Aceitação:**

- [ ] Ao perder comunicação, status muda para "Reconectando..."
- [ ] Sistema tenta reconectar a cada 30 segundos
- [ ] Notificação no dashboard: "Tomada X perdeu comunicação. Reconectando..."
- [ ] Se reconectar: status volta para "Conectada", log registrado
- [ ] Se falhar após 10 tentativas (~5 minutos): status muda para "Desconectada", alerta persistente
- [ ] Usuário precisa reconectar manualmente após esgotamento de tentativas
- [ ] Log registrado em cada evento (início retry, sucesso, esgotamento)

---

### FR-109: Reset total (senha esquecida)

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

Na tela de login, opção para resetar o app quando o usuário esquece a senha.

**Critérios de Aceitação:**

- [ ] Link "Esqueci minha senha" na tela de login
- [ ] Aviso claro: dados serão perdidos permanentemente (senha deriva a chave de criptografia)
- [ ] Campo de confirmação: digitar "APAGAR DADOS" para confirmar
- [ ] Ao confirmar: deletar banco SQLCipher e reiniciar onboarding
- [ ] Sem mecanismo de recuperação (documentado claramente)

---

## FR-2xx: Overlay Customizável

### FR-201: Personalizar tamanho da fonte

**Prioridade:** Must | **Milestone:** M4 | **Status:** Draft

O usuário deve ser capaz de ajustar o tamanho da fonte do overlay.

**Critérios de Aceitação:**

- [ ] Slider ou input numérico para tamanho da fonte (range razoável, ex: 10–72px)
- [ ] Preview em tempo real na interface de configuração
- [ ] Valor persiste por tomada (cada tomada pode ter tamanho diferente)
- [ ] Valor padrão definido (ex: 40px)

---

### FR-202: Personalizar cor da fonte

**Prioridade:** Must | **Milestone:** M4 | **Status:** Draft

O usuário deve ser capaz de escolher a cor do texto do overlay.

**Critérios de Aceitação:**

- [ ] Color picker para seleção de cor
- [ ] Input hexadecimal para inserção manual (ex: #FFFFFF)
- [ ] Preview em tempo real
- [ ] Valor persiste por tomada
- [ ] Valor padrão: branco (#FFFFFF)

---

### FR-203: Personalizar borda e sombra da fonte

**Prioridade:** Must | **Milestone:** M4 | **Status:** Draft

O usuário deve ser capaz de configurar borda (stroke/outline) e sombra (drop shadow) no texto do overlay para melhorar legibilidade sobre diferentes fundos.

**Critérios de Aceitação:**

- [ ] Toggle para habilitar/desabilitar borda do texto
- [ ] Cor da borda configurável (color picker)
- [ ] Espessura da borda configurável
- [ ] Toggle para habilitar/desabilitar sombra
- [ ] Cor e intensidade da sombra configuráveis
- [ ] Preview em tempo real
- [ ] Valores persistem por tomada

---

### FR-204: Layout horizontal e vertical

**Prioridade:** Must | **Milestone:** M4 | **Status:** Draft

O usuário deve escolher entre layout horizontal (dados lado a lado) e vertical (dados empilhados) no overlay.

**Critérios de Aceitação:**

- [ ] Opção de layout: horizontal ou vertical
- [ ] Horizontal: dados exibidos em uma linha (ex: "120W | 220V | 0.5A")
- [ ] Vertical: dados empilhados (cada métrica em uma linha)
- [ ] Preview em tempo real
- [ ] Valor persiste por tomada
- [ ] Valor padrão: vertical

---

### FR-205: Background do overlay

**Prioridade:** Must | **Milestone:** M4 | **Status:** Draft

O overlay deve suportar fundo transparente (padrão) e cor sólida configurável.

**Critérios de Aceitação:**

- [ ] Padrão: fundo transparente (funciona com "transparent background" do OBS Browser Source)
- [ ] Opção de cor sólida via color picker
- [ ] Opção de opacidade do fundo (0–100%)
- [ ] Border radius configurável (cantos arredondados)
- [ ] Padding configurável
- [ ] Preview em tempo real
- [ ] Valores persistem por tomada

---

### FR-206: Escolher dados exibidos no overlay

**Prioridade:** Should | **Milestone:** M4 | **Status:** Draft

O usuário deve poder escolher quais dados são exibidos no overlay de cada tomada.

**Critérios de Aceitação:**

- [ ] Checkboxes para cada métrica: potência (W), tensão (V), corrente (A), nome da tomada
- [ ] Pelo menos uma métrica deve estar selecionada
- [ ] Ordem das métricas configurável (drag and drop ou similar)
- [ ] Valores persistem por tomada

---

### FR-207: Presets de overlay

**Prioridade:** Should | **Milestone:** M4 | **Status:** Draft

O usuário deve poder salvar configurações de estilo como presets nomeados e aplicá-los em outras tomadas.

**Critérios de Aceitação:**

- [ ] Botão "Salvar como preset" no editor de overlay
- [ ] Campo para nomear o preset (ex: "Tema escuro", "Minimalista")
- [ ] Dropdown "Carregar preset" com lista de presets salvos
- [ ] Ao aplicar preset, configurações preenchem o editor (ponto de partida, customizável)
- [ ] Salvar após aplicar preset não altera o preset original
- [ ] Opções de renomear e deletar presets
- [ ] Deletar preset não afeta tomadas já configuradas com ele

---

### FR-208: Overlay combinado com estilo próprio

**Prioridade:** Should | **Milestone:** M4 | **Status:** Draft

O overlay combinado (todas as tomadas) deve ter configuração de estilo independente das tomadas individuais.

**Critérios de Aceitação:**

- [ ] Configuração de estilo separada para o overlay combinado
- [ ] Mesmas opções de personalização (font, cor, borda, sombra, layout, background)
- [ ] Opção adicional: disposição das tomadas no combinado (empilhadas, lado a lado)
- [ ] Preview mostra todas as tomadas habilitadas e conectadas
- [ ] Não herda estilo das tomadas individuais

---

## FR-3xx: Dashboard e Histórico

### FR-301: Dashboard unificado

**Prioridade:** Must | **Milestone:** M5 | **Status:** Draft

Tela principal do app com visão geral de todas as tomadas e informações centralizadas.

**Critérios de Aceitação:**

- [ ] Contadores: total de tomadas, tomadas conectadas/habilitadas, consumo médio por tomada (W), custo da sessão (desde conexão)
- [ ] Cards compactos por tomada habilitada: nome, status, potência atual
- [ ] Cards ordenados conforme ordem definida pelo usuário (drag and drop)
- [ ] Ações rápidas: adicionar tomada, ver todas, copiar URL overlay combinado, configurar kWh
- [ ] Atualização em tempo real dos dados
- [ ] Alertas: banner quando tomada está em "Reconectando..."

---

### FR-302: Dashboard detalhado por tomada

**Prioridade:** Must | **Milestone:** M5 | **Status:** Draft

Tela de detalhes para cada tomada com dados em tempo real e histórico.

**Critérios de Aceitação:**

- [ ] Dados em tempo real: potência (W/kW), voltagem (V), corrente (A/mA), status on/off, tempo conectado
- [ ] Unidades inteligentes: >1000W exibe kW, <1A exibe mA, 1 casa decimal
- [ ] Gráfico de linha: potência ao longo do tempo (com seletor de período)
- [ ] Gráfico de barras: custo acumulado por hora/dia (requer kWh configurado)
- [ ] Custo desde conexão (período padrão)
- [ ] Estatísticas do período: potência média, pico, consumo total kWh, custo total
- [ ] Informações do dispositivo: nome, ID, IP, versão do protocolo, modo Local/Cloud
- [ ] Ações: conectar, desconectar, editar, copiar URL do overlay

---

### FR-303: Mini-dashboard por source

**Prioridade:** Should | **Milestone:** M5 | **Status:** Draft

Na tela de gerenciamento de overlay/source, exibir um mini-dashboard de status com informações coletadas durante o monitoramento.

**Critérios de Aceitação:**

- [ ] Dados resumidos: última leitura, potência média, pico de potência
- [ ] Duração do monitoramento atual
- [ ] Indicador de status da conexão
- [ ] Exibido junto às configurações de cada source/overlay

---

### FR-304: Preço do kWh

**Prioridade:** Must | **Milestone:** M5 | **Status:** Draft

O usuário deve inserir o preço do kWh da sua energia para cálculo de custo.

**Critérios de Aceitação:**

- [ ] Campo para inserir preço por kWh (numérico, com decimais)
- [ ] Moeda configurável (R$, US$, etc.) ou pelo menos campo livre
- [ ] Valor persiste globalmente (aplicado a todas as tomadas)
- [ ] Exibir custo instantâneo (baseado na potência atual)
- [ ] Exibir custo acumulado do período de monitoramento

---

### FR-305: Seleção de período para histórico

**Prioridade:** Should | **Milestone:** M5 | **Status:** Draft

O usuário deve poder selecionar períodos para visualizar dados históricos e custos.

**Critérios de Aceitação:**

- [ ] Períodos pré-definidos: última hora, hoje, últimas 24h, última semana, último mês
- [ ] Período personalizado (date picker: data início e data fim)
- [ ] Gráficos e custos recalculados conforme período selecionado
- [ ] Funciona por tomada individual e no dashboard unificado

---

### FR-306: Armazenamento de histórico

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O sistema deve armazenar dados de leitura das tomadas para consulta futura.

**Critérios de Aceitação:**

- [ ] Armazenar leituras periodicamente (intervalo configurável, padrão: a cada 5 segundos)
- [ ] Dados armazenados: timestamp, device ID, potência, tensão, corrente, status
- [ ] Banco de dados local (SQLite)
- [ ] Política de retenção: dados mais antigos que X dias são removidos automaticamente (configurável)
- [ ] Dados sobrevivem a reinicialização do app

---

## FR-4xx: Cloud Integration

### FR-401: Configurar credenciais Tuya Cloud

**Prioridade:** Must | **Milestone:** M2 | **Status:** Draft

O usuário deve configurar as credenciais do projeto Tuya IoT Platform para integração Cloud.

**Critérios de Aceitação:**

- [ ] Formulário com campos: Access ID (Client ID) e Access Secret (Client Secret)
- [ ] Credenciais criptografadas no banco (FR-502, FR-503)
- [ ] Teste de conexão: botão para verificar se as credenciais são válidas
- [ ] Feedback claro de sucesso ou erro (credenciais inválidas, rede, etc.)
- [ ] Credenciais persistem entre sessões

**Notas Técnicas:**

- Access ID e Access Secret são obtidos em https://iot.tuya.com → Cloud → projeto
- Usados para autenticação OAuth 2.0 na Tuya Cloud API

---

### FR-402: Buscar dispositivos automaticamente

**Prioridade:** Must | **Milestone:** M2 | **Status:** Draft

Com credenciais Cloud configuradas, o sistema deve listar automaticamente todos os dispositivos Tuya do usuário.

**Critérios de Aceitação:**

- [ ] Botão "Buscar dispositivos" que consulta a Tuya Cloud API
- [ ] Lista exibe: nome do dispositivo, Device ID, categoria, status online/offline
- [ ] Usuário seleciona dispositivos da lista para cadastrar como tomadas
- [ ] Ao selecionar, Device ID e Local Key são preenchidos automaticamente
- [ ] IP Address é resolvido via descoberta na rede local ou informado manualmente

---

### FR-403: Buscar Local Key automaticamente

**Prioridade:** Must | **Milestone:** M2 | **Status:** Draft

O sistema deve obter a Local Key de cada dispositivo via Cloud API, eliminando a necessidade de obtê-la manualmente.

**Critérios de Aceitação:**

- [ ] Local Key obtida automaticamente ao selecionar dispositivo (FR-402)
- [ ] Local Key é criptografada e armazenada no banco
- [ ] Opção de atualizar Local Key (caso o dispositivo seja re-pareado)
- [ ] Fallback: campo manual editável caso a Cloud não retorne

---

### FR-404: Detectar versão de protocolo via Cloud

**Prioridade:** Must | **Milestone:** M2 | **Status:** Draft

O sistema deve detectar automaticamente a versão do protocolo Tuya de cada dispositivo consultando a Cloud API.

**Critérios de Aceitação:**

- [ ] Versão de protocolo obtida automaticamente ao buscar dispositivos
- [ ] Versões suportadas: 3.1, 3.2, 3.3, 3.4, 3.5
- [ ] Versão armazenada por dispositivo e usada automaticamente na conexão local
- [ ] Exibida na interface (informativo, nos detalhes da tomada)

**Notas Técnicas:**

- A versão de protocolo afeta a criptografia e o formato dos pacotes TCP
- TuyAPI aceita o parâmetro `version` no construtor

---

### FR-405: Toggle modo de comunicação (Local vs Cloud)

**Prioridade:** Must | **Milestone:** M3 | **Status:** Draft

O usuário deve escolher o modo de comunicação com cada tomada: Local (TCP direto) ou Cloud (via Tuya Cloud API).

**Critérios de Aceitação:**

- [ ] Toggle por tomada: Local ou Cloud
- [ ] Modo Local: conexão TCP/AES direta na rede local (requer mesmo Wi-Fi)
- [ ] Modo Cloud: requisições à Tuya Cloud API (funciona de qualquer rede)
- [ ] Indicador visual de qual modo está ativo
- [ ] Se Local falhar, sugerir Cloud como alternativa (sem troca automática)
- [ ] Padrão: Local (menor latência, funciona offline)

**Notas Técnicas:**

- Local: latência <100ms, sem rate limits, requer mesma rede
- Cloud: latência 250–600ms, rate limits da Tuya API, funciona de qualquer lugar

---

## FR-5xx: Segurança

### FR-501: Senha do aplicativo

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O usuário deve definir uma senha para proteger o acesso ao aplicativo e às chaves criptografadas.

**Critérios de Aceitação:**

- [ ] No primeiro uso, wizard solicita criação de senha
- [ ] Em usos subsequentes, tela de login solicita a senha para desbloquear
- [ ] Senha usada para derivar chave de criptografia do banco e dos campos sensíveis
- [ ] Tentativas incorretas: feedback de erro, sem bloqueio (app local, não faz sentido bloquear)
- [ ] Opção de alterar senha (requer senha atual)
- [ ] Ao alterar senha, re-criptografar todos os campos sensíveis com a nova chave

**Notas Técnicas:**

- Derivar chave AES-256 a partir da senha usando Argon2id (preferido) ou PBKDF2
- Salt aleatório gerado no primeiro uso, armazenado no DB (não é segredo)
- A chave derivada é usada para: (1) abrir o SQLCipher DB e (2) criptografar/descriptografar campos sensíveis

---

### FR-502: Banco de dados criptografado (SQLCipher)

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O banco de dados SQLite deve ser criptografado integralmente usando SQLCipher.

**Critérios de Aceitação:**

- [ ] Banco de dados é um arquivo SQLCipher (não pode ser aberto sem a senha)
- [ ] Chave do SQLCipher é derivada da senha do usuário (FR-501)
- [ ] Banco criado na primeira execução com senha definida
- [ ] Dados inacessíveis sem a senha correta
- [ ] Migração de schema funciona normalmente sobre SQLCipher

---

### FR-503: Criptografia de campos sensíveis

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

Além do SQLCipher, campos que contêm credenciais devem ter criptografia aplicacional (segunda camada).

**Critérios de Aceitação:**

- [ ] Campos criptografados: Local Key, Access ID, Access Secret, Cloud API tokens
- [ ] Algoritmo: AES-256-GCM (autenticado)
- [ ] Chave derivada da senha do usuário (mesma derivação, key diferente via HKDF)
- [ ] Descriptografia apenas em memória, no momento de uso
- [ ] Campos aparecem como blob criptografado no banco (mesmo abrindo com SQLCipher)

**Notas Técnicas:**

- Usar HKDF para derivar chaves separadas a partir da chave mestre: uma para SQLCipher, outra para campos
- Isso garante que comprometer a chave do SQLCipher não compromete os campos automaticamente

---

### FR-504: Zero telemetria

**Prioridade:** Must | **Milestone:** M1 | **Status:** Draft

O aplicativo não deve enviar nenhuma informação para servidores externos, exceto as comunicações explícitas com dispositivos Tuya e a Tuya Cloud API (quando configurada pelo usuário).

**Critérios de Aceitação:**

- [ ] Nenhuma requisição HTTP para servidores além de: Tuya Cloud API (quando o usuário habilita), dispositivos locais, GitHub API (para check de versão — FR-702)
- [ ] Nenhuma telemetria, analytics, crash reporting ou métricas enviadas
- [ ] Verificável pelo usuário (código aberto)
- [ ] Documentado na política de privacidade (FR-802)

---

## FR-6xx: Onboarding

### FR-601: Wizard de primeiro uso

**Prioridade:** Must | **Milestone:** M6 | **Status:** Draft

Na primeira execução, o app deve guiar o usuário por um wizard de configuração inicial.

**Critérios de Aceitação:**

- [ ] Passo 1: Boas-vindas + termos de uso e política de privacidade (aceite obrigatório)
- [ ] Passo 2: Configurar credenciais Cloud + criar senha do app (Cloud obrigatório para avançar)
- [ ] Passo 3: Selecionar dispositivos da lista Cloud (pelo menos 1 obrigatório)
- [ ] Passo 4: Configurar layout do overlay
- [ ] Passo 5: Resumo do setup concluído + dicas de uso no OBS
- [ ] Navegação: avançar, voltar (sem pular — todos os passos obrigatórios)
- [ ] Wizard não aparece em usos subsequentes
- [ ] Sem opção de re-executar (alterações feitas nas telas normais do app)
- [ ] Telas do wizard são componentes reutilizáveis do app regular

---

### FR-602: Guia para criar conta Tuya Developer

**Prioridade:** Must | **Milestone:** M6 | **Status:** Draft

Dentro do onboarding, guia passo-a-passo visual para criar conta na Tuya IoT Platform e obter credenciais do projeto Cloud.

**Critérios de Aceitação:**

- [ ] Instruções com screenshots/ilustrações para cada etapa
- [ ] Passos: criar conta, criar Cloud Project, vincular dispositivos, obter Access ID/Secret
- [ ] Links diretos para as páginas relevantes da Tuya IoT Platform
- [ ] Texto claro e acessível para não-técnicos
- [ ] Disponível também fora do wizard (no menu de ajuda)

---

### FR-603: Guia de primeiro dispositivo

**Prioridade:** Should | **Milestone:** M6 | **Status:** Draft

Após configurar credenciais, guiar o usuário no cadastro e teste da primeira tomada.

**Critérios de Aceitação:**

- [ ] Se Cloud configurada: mostrar lista de dispositivos encontrados, guiar seleção
- [ ] Se manual: explicar onde encontrar Device ID, Local Key e IP
- [ ] Teste automático de conexão após cadastro
- [ ] Exibir dados em tempo real como confirmação de sucesso
- [ ] Sugerir próximo passo: configurar overlay no OBS

---

## FR-7xx: Sistema

### FR-701: Changelog e informações de versão

**Prioridade:** Should | **Milestone:** M6 | **Status:** Draft

O app deve exibir informações de versão e changelog buscados do GitHub.

**Critérios de Aceitação:**

- [ ] Tela mostrando versão instalada
- [ ] Changelog por versão (release notes do GitHub Releases)
- [ ] Buscar informações via GitHub API (repositório público)
- [ ] Cache local das informações (não buscar a cada abertura)
- [ ] Funcionar graciosamente sem internet (exibir versão local, sem changelog remoto)

---

### FR-702: Verificação de atualização

**Prioridade:** Should | **Milestone:** M6 | **Status:** Draft

O app deve verificar se há versões mais recentes disponíveis no GitHub.

**Critérios de Aceitação:**

- [ ] Comparar versão instalada com a última release no GitHub
- [ ] Se nova versão disponível, exibir notificação discreta (badge ou banner)
- [ ] Link direto para a página de download (GitHub Releases)
- [ ] Verificação automática ao abrir o app (com intervalo mínimo, ex: 1x por dia)
- [ ] Verificação manual via botão nas configurações
- [ ] Sem auto-update (download manual pelo usuário)

---

### FR-703: Logs de atividade

**Prioridade:** Must | **Milestone:** M5 | **Status:** Draft

O app deve manter e exibir um log de atividades do sistema.

**Critérios de Aceitação:**

- [ ] Eventos de ações do usuário: abertura do app, conexão/desconexão, alteração de configurações, adição/remoção de tomadas
- [ ] Eventos do sistema: sidecar iniciado/parado, retry de conexão, polling iniciado/parado, limpeza de histórico
- [ ] Eventos de erro: falha de conexão, credenciais inválidas, erro de rede, timeout
- [ ] Cada entrada: timestamp, tipo (Sistema/Conexão/Configuração/Erro), descrição, dispositivo (se aplicável)
- [ ] Tela de logs com filtros combináveis: por tipo, por dispositivo, por período
- [ ] Logs armazenados no banco de dados local
- [ ] Política de retenção configurável (padrão: últimos 30 dias)
- [ ] Opção de exportar logs (.csv ou .txt)

---

### FR-704: Menu centralizado

**Prioridade:** Must | **Milestone:** M6 | **Status:** Draft

O app deve ter um menu de navegação que centralize o acesso a todas as funcionalidades.

**Critérios de Aceitação:**

- [ ] Acesso a: Dashboard, Tomadas, Overlays, Logs, Configurações, Sobre/Changelog
- [ ] Indicador de seção ativa
- [ ] Acessível de qualquer tela
- [ ] Design consistente e responsivo

---

### FR-705: Configurações gerais

**Prioridade:** Must | **Milestone:** M6 | **Status:** Draft

Tela de configurações globais do aplicativo.

**Critérios de Aceitação:**

- [ ] Configurar preço do kWh (numérico, com decimais, até 4 casas)
- [ ] Configurar moeda (campo livre, padrão: R$)
- [ ] Configurar intervalo de coleta de dados (1–60 segundos, padrão: 5s)
- [ ] Configurar retenção de histórico (1–365 dias, padrão: 90 dias)
- [ ] Configurar retenção de logs (1–365 dias, padrão: 30 dias)
- [ ] Link para termos de uso e política de privacidade

---

## FR-8xx: Distribuição

### FR-801: Build multi-plataforma

**Prioridade:** Must | **Milestone:** M7 | **Status:** Draft

O app deve ser compilável para Windows, Linux e macOS.

**Critérios de Aceitação:**

- [ ] Build funcional para Windows (x64)
- [ ] Build funcional para Linux (x64, AppImage ou similar)
- [ ] Build funcional para macOS (x64 + arm64/Apple Silicon)
- [ ] Script ou pipeline de build para todas as plataformas
- [ ] Binário final inclui: Neutralino runtime, frontend, sidecar Node.js

---

### FR-802: GitHub Releases

**Prioridade:** Must | **Milestone:** M7 | **Status:** Draft

Releases devem ser publicadas no GitHub com binários pré-compilados para cada plataforma.

**Critérios de Aceitação:**

- [ ] Assets por plataforma na seção Releases do GitHub
- [ ] Release notes descrevendo mudanças
- [ ] Versionamento semântico (SemVer)
- [ ] Usuário pode baixar e executar sem instalar Node.js ou ferramentas de build

---

### FR-803: Build manual pelo usuário

**Prioridade:** Must | **Milestone:** M7 | **Status:** Draft

Documentação clara para o usuário clonar o repositório e fazer build manualmente.

**Critérios de Aceitação:**

- [ ] README com instruções passo-a-passo: clone, install, build
- [ ] Pré-requisitos documentados: Node.js 22+, pnpm 10+
- [ ] `pnpm install && pnpm build` deve ser suficiente
- [ ] Instruções de verificação (testar se funciona)

---

### FR-804: CI/CD pipeline

**Prioridade:** Must | **Milestone:** M7 | **Status:** Draft

Pipeline automatizado para build, teste e publicação de releases.

**Critérios de Aceitação:**

- [ ] GitHub Actions para CI (build + test em cada push/PR)
- [ ] GitHub Actions para CD (build multi-plataforma + upload de assets na criação de tag)
- [ ] Testes devem passar antes de permitir merge
- [ ] Build de release automatizado ao criar tag vX.Y.Z

---

### FR-805: Política de privacidade e termos de uso

**Prioridade:** Must | **Milestone:** M7 | **Status:** Draft

O app deve ter política de privacidade e termos de uso acessíveis.

**Critérios de Aceitação:**

- [ ] Documento de política de privacidade no repositório e acessível no app
- [ ] Declaração explícita: nenhuma informação coletada, nenhuma telemetria
- [ ] Declaração: aplicação funciona 100% local (exceto Tuya Cloud quando habilitada pelo usuário)
- [ ] Declaração: código aberto, verificável
- [ ] Declaração: sem responsabilidade sobre uso de credenciais pelo usuário
- [ ] Aceite no primeiro uso (checkbox no wizard ou passo dedicado)
- [ ] Termos acessíveis via menu do app a qualquer momento
