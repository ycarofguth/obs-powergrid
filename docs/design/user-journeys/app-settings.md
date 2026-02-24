# Jornada: Configurações e Segurança

**Última atualização:** 2026-02-02

---

## Persona

Usuário que precisa alterar configurações do app: gerenciar credenciais Cloud, alterar senha, configurar preferências, consultar logs ou verificar atualizações.

## Pré-condições

- Onboarding concluído
- App desbloqueado

## Decisões Aplicáveis

| Decisão                | Escolha                                                      |
| ---------------------- | ------------------------------------------------------------ |
| Senha esquecida        | **Reset total** — apaga todos os dados e reinicia onboarding |
| Re-executar onboarding | **Não disponível** — alterações feitas nas telas normais     |
| Logs                   | **Ações + sistema** — ações do usuário + eventos do sistema  |
| Atualização            | **Link para releases page** — abre página do GitHub Releases |

---

## Fluxo 1: Chaves e Segurança

**Tela:** `SecurityPage` — **Rota:** `/security`

### 1a: Gerenciar Credenciais Cloud

1. Usuário acessa "Chaves e Segurança" no menu
2. Seção "Credenciais Cloud" exibe:
   - Access ID: campo com valor mascarado (••••••) + botão "Mostrar"
   - Access Secret: campo com valor mascarado + botão "Mostrar"
   - Status: "Válidas" (check verde) ou "Não verificadas"
3. Botão "Editar" → campos ficam editáveis
4. Botão "Testar Conexão" → valida contra Tuya Cloud API
5. Botão "Salvar" → re-criptografa e salva no banco
6. Log: "Credenciais Cloud atualizadas"

### 1b: Alterar Senha do App

1. Seção "Senha do App"
2. Campos: senha atual, nova senha, confirmar nova senha
3. Validação: senha atual deve estar correta
4. Requisitos mínimos da nova senha (8+ caracteres)
5. Ao salvar:
   - Sistema deriva nova chave via Argon2id
   - Re-abre SQLCipher com nova chave
   - Re-criptografa todos os campos sensíveis com nova chave derivada
   - Atualiza salt no banco
6. Feedback: "Senha alterada com sucesso"
7. Log: "Senha do app alterada"

### 1c: Senha Esquecida (Reset Total)

1. Na tela de Login, link "Esqueci minha senha"
2. Aviso claro:
   - "Sem a senha, não é possível descriptografar seus dados."
   - "Esta ação vai **apagar todos os dados** do app (tomadas, credenciais, histórico, configurações)."
   - "Você precisará configurar tudo novamente."
3. Campo de confirmação: digitar "APAGAR DADOS" (ou similar) para confirmar
4. Botão "Resetar App"
5. Sistema deleta o banco de dados SQLCipher
6. App reinicia e exibe onboarding
7. Log: não há (banco foi apagado)

### 1d: Informações de Segurança

1. Seção informativa (somente leitura):
   - Tipo de criptografia do banco: SQLCipher (AES-256)
   - Criptografia de campos: AES-256-GCM
   - Derivação de chave: Argon2id
   - Última alteração de senha: data/hora

---

## Fluxo 2: Configurações Gerais

**Tela:** `SettingsPage` — **Rota:** `/settings`

### Opções disponíveis

| Configuração          | Tipo                | Padrão | Descrição                              |
| --------------------- | ------------------- | ------ | -------------------------------------- |
| Preço do kWh          | Numérico (decimais) | Vazio  | Valor por kWh para cálculo de custo    |
| Moeda                 | Texto livre         | R$     | Prefixo da moeda exibida               |
| Intervalo de coleta   | Numérico (segundos) | 5      | Frequência de polling dos dispositivos |
| Retenção de histórico | Numérico (dias)     | 90     | Dias para manter leituras no banco     |
| Retenção de logs      | Numérico (dias)     | 30     | Dias para manter logs de atividade     |
| Termos de uso         | Link                | —      | Abre termos e política de privacidade  |

### Fluxo

1. Usuário acessa "Configurações" no menu
2. Formulário com os campos acima
3. Alterações salvas ao clicar "Salvar" (ou auto-save com debounce)
4. Feedback: "Configurações salvas"
5. Log: "Configurações atualizadas: [campos alterados]"

### Validações

- Intervalo de coleta: mínimo 1s, máximo 60s
- Retenção: mínimo 1 dia, máximo 365 dias
- kWh: valor positivo com até 4 casas decimais

---

## Fluxo 3: Logs de Atividade

**Tela:** `LogsPage` — **Rota:** `/logs`

### Visualização

1. Usuário acessa "Logs" no menu
2. Lista cronológica reversa (mais recente primeiro)
3. Cada entrada:

| Campo       | Exemplo                                  |
| ----------- | ---------------------------------------- |
| Timestamp   | 2026-02-02 14:32:15                      |
| Tipo        | Conexão                                  |
| Descrição   | Tomada "PC Gamer" conectada (modo Local) |
| Dispositivo | PC Gamer                                 |

### Filtros

4. Filtro por tipo:
   - Sistema (app aberto, app fechado, sidecar iniciado/parado)
   - Conexão (conectou, desconectou, reconectando, falha)
   - Configuração (credenciais alteradas, tomada adicionada/editada/removida, layout alterado)
   - Erro (falha de comunicação, credenciais inválidas, erro de criptografia)
5. Filtro por dispositivo: dropdown com lista de tomadas
6. Filtro por período: date picker (início → fim)
7. Filtros combináveis

### Ações

8. Botão "Exportar logs" → salva como arquivo .csv ou .txt
9. Paginação ou scroll infinito para logs longos

### Eventos registrados pelo sistema

| Categoria        | Eventos                                                                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sistema**      | App aberto, app fechado, sidecar iniciado, sidecar parado, banco aberto, limpeza de histórico executada                                                                                            |
| **Conexão**      | Tomada conectada, tomada desconectada, início de retry, retry bem-sucedido, retry esgotado, polling iniciado, polling parado                                                                       |
| **Configuração** | Credenciais Cloud configuradas/atualizadas, tomada adicionada/editada/removida, tomada habilitada/desabilitada, layout alterado, preset criado/deletado, senha alterada, configurações atualizadas |
| **Erro**         | Falha de conexão (com razão), credenciais inválidas, erro de criptografia, erro de rede, timeout                                                                                                   |

---

## Fluxo 4: Atualizações e Changelog

**Tela:** `UpdatesPage` — **Rota:** `/updates`

### Verificação de versão

1. Usuário acessa "Atualizações" no menu
2. Sistema exibe versão instalada: "v1.0.0"
3. Sistema verifica última versão no GitHub (se não verificou nas últimas 24h):
   - Consulta GitHub API: `GET /repos/{owner}/{repo}/releases/latest`
4. **Se nova versão disponível:**
   - Banner: "Nova versão disponível: v1.1.0"
   - Botão "Ver no GitHub" → abre página de Releases no navegador
5. **Se versão atual:**
   - Mensagem: "Você está na versão mais recente"
6. **Se sem internet:**
   - Mensagem: "Não foi possível verificar atualizações"
   - Mostra versão instalada normalmente

### Changelog

7. Lista de versões com release notes (do GitHub Releases API)
8. Cada versão exibe:
   - Número da versão
   - Data de publicação
   - Release notes (markdown renderizado)
9. Versões em ordem decrescente (mais recente primeiro)
10. Cache local: dados buscados e armazenados, atualizados a cada verificação

### Verificação automática

11. Ao abrir o app (após login), verifica se já passaram 24h desde a última verificação
12. Se sim, busca em background
13. Se nova versão: badge/indicador no menu "Atualizações"

---

## Fluxos Alternativos

### FA-1: Alteração de senha falha (senha atual incorreta)

- Mensagem: "Senha atual incorreta"
- Campos permanecem editáveis
- Nenhuma alteração feita

### FA-2: Exportar logs sem dados

- Botão "Exportar" desabilitado ou mostra "Nenhum log para exportar"

### FA-3: GitHub API indisponível

- Changelog mostra dados do cache local (se existir)
- Se sem cache: "Changelog indisponível. Verifique sua conexão."
- Versão instalada sempre visível (não depende de rede)

---

## Resultado Esperado

- Credenciais gerenciáveis de forma segura (mascaradas, editáveis, testáveis)
- Senha alterável com re-criptografia transparente
- Reset total como último recurso para senha esquecida
- Configurações globais acessíveis e claras
- Logs completos e filtráveis para troubleshooting
- Informações de versão e atualização acessíveis

---

## Requisitos Relacionados

FR-401, FR-501, FR-502, FR-503, FR-701, FR-702, FR-703, FR-705, FR-805, NFR-201, NFR-202
