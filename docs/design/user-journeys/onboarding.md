# Jornada: Onboarding (Primeiro Acesso)

**Última atualização:** 2026-02-02

---

## Persona

Streamer ou criador de conteúdo que quer exibir consumo de energia no OBS. Pode não ter conhecimento técnico avançado. Acabou de instalar o app pela primeira vez.

## Pré-condições

- App instalado (via download do GitHub Releases ou build manual)
- Tomada inteligente Tuya configurada e funcionando no app Smart Life/Tuya Smart
- Dispositivo na mesma rede Wi-Fi que o computador (se usar modo Local)
- Acesso à internet (para criar conta Tuya Developer e validar credenciais)

## Decisões Aplicáveis

| Decisão                | Escolha                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Cloud no onboarding    | **Obrigatório** — credenciais Cloud devem ser validadas para avançar               |
| Senha                  | Criada durante o onboarding (passo 2)                                              |
| Re-executar onboarding | **Não disponível** — configurações são alteradas individualmente nas telas normais |

---

## Fluxo Principal

### Passo 1 — Abertura do App

1. Usuário abre o app pela primeira vez
2. Sistema detecta que não existe banco de dados (primeiro uso)
3. Sistema exibe tela de boas-vindas do onboarding

### Passo 2 — Termos e Boas-vindas

**Tela:** `OnboardingWelcome`

1. Usuário vê breve descrição do que o app faz
2. Usuário vê resumo dos termos de uso e política de privacidade:
   - App funciona 100% local
   - Nenhuma informação é coletada ou enviada para servidores próprios
   - Código aberto e verificável
   - Comunicação externa apenas com Tuya Cloud (quando configurada) e GitHub (check versão)
3. Link para termos completos (abre modal)
4. Checkbox: "Li e aceito os termos de uso e política de privacidade"
5. Botão "Avançar" (desabilitado até aceitar)

### Passo 3 — Credenciais Cloud e Senha

**Tela:** `CloudCredentialsForm` (componente reutilizável)

**Subpasso 3a — Guia visual:**

1. Sistema exibe macro passos ilustrados:
   - **(1)** Criar conta no [Tuya IoT Platform](https://iot.tuya.com)
   - **(2)** Criar Cloud Project e vincular app Smart Life
   - **(3)** Copiar Access ID e Access Secret do projeto
2. Cada passo tem link direto para a página relevante na Tuya
3. Texto claro e acessível para não-técnicos

**Subpasso 3b — Inserir credenciais:**

4. Usuário preenche:
   - **Access ID** (Client ID)
   - **Access Secret** (Client Secret)
5. Botão "Testar Conexão"
6. Sistema valida as credenciais contra a Tuya Cloud API
7. **Se válidas:** feedback visual de sucesso (check verde)
8. **Se inválidas:** mensagem de erro clara ("Credenciais inválidas. Verifique o Access ID e Secret no seu projeto em iot.tuya.com")
9. Usuário **não pode avançar** sem credenciais válidas

**Subpasso 3c — Criar senha:**

10. Campo "Criar senha do app"
11. Campo "Confirmar senha"
12. Dica: "Esta senha protege suas chaves de criptografia. Se esquecê-la, os dados serão perdidos."
13. Requisitos mínimos de senha (ex: 8+ caracteres)
14. Botão "Avançar"

**Ao avançar:**

15. Sistema cria o banco SQLCipher com chave derivada da senha (Argon2id)
16. Sistema criptografa Access ID e Access Secret com AES-256-GCM e salva no banco
17. Log registrado: "Credenciais Cloud configuradas"

### Passo 4 — Seleção de Dispositivos

**Tela:** `DeviceSelector` (componente reutilizável)

1. Sistema busca dispositivos via Tuya Cloud API automaticamente
2. Sistema exibe lista de dispositivos encontrados:
   - Nome do dispositivo
   - Device ID
   - Categoria (smart plug, switch, etc.)
   - Status (online/offline)
3. Para cada dispositivo, sistema obteve automaticamente: Local Key e versão de protocolo
4. Usuário marca checkbox nos dispositivos que quer monitorar
5. Para cada dispositivo selecionado, toggle: **Local** ou **Cloud**
   - Local: "Comunicação direta pela rede local. Menor latência, requer mesma rede Wi-Fi."
   - Cloud: "Comunicação via Tuya Cloud. Funciona de qualquer rede, maior latência."
6. **Regra:** pelo menos 1 dispositivo deve ser selecionado para avançar
7. Botão "Avançar"

**Ao avançar:**

8. Sistema salva dispositivos selecionados no banco (credenciais criptografadas)
9. Para cada dispositivo modo Local: sistema tenta resolver IP via rede local
10. Se IP não resolvido automaticamente: solicita IP manualmente (campo editável)
11. Log registrado: "Dispositivo X adicionado" (para cada um)

### Passo 5 — Configuração de Layout

**Tela:** `OverlayLayoutEditor` (componente reutilizável)

1. Sistema exibe editor de overlay para os dispositivos selecionados
2. Usuário configura:
   - Tamanho da fonte (slider, padrão: 16px)
   - Cor da fonte (color picker, padrão: #FFFFFF)
   - Borda do texto (toggle + cor + espessura)
   - Sombra do texto (toggle + cor + intensidade)
   - Layout: horizontal ou vertical
   - Background: transparente (padrão) ou cor sólida com opacidade
   - Dados exibidos: checkboxes (W, V, A, nome)
3. Preview em tempo real com toggle dados fictícios / dados reais
4. Configuração aplica para cada dispositivo individualmente
5. Botão "Avançar"

**Ao avançar:**

6. Sistema salva configurações de overlay no banco
7. Log registrado: "Layout do overlay configurado"

### Passo 6 — Resumo

**Tela:** `OnboardingSummary`

1. Checklist visual do setup concluído:
   - ✓ Termos aceitos
   - ✓ Credenciais Cloud configuradas
   - ✓ Senha do app criada
   - ✓ X dispositivo(s) cadastrado(s)
   - ✓ Layout do overlay configurado
2. Para cada dispositivo: nome, modo (Local/Cloud), URL do overlay
3. Dica de como usar no OBS:
   - "Adicione uma Browser Source no OBS"
   - "Cole a URL: `http://localhost:47531/overlay/{id}`"
   - "Dimensões recomendadas: 400x100 (horizontal) ou 200x300 (vertical)"
4. Botão "Copiar URL" para cada dispositivo
5. Botão "Concluir" → Redireciona para Home (Dashboard)

---

## Fluxos Alternativos

### FA-1: Credenciais Cloud inválidas

- **Quando:** Passo 3, subpasso 3b, item 8
- **Comportamento:** Mensagem de erro. Campos permanecem editáveis. Usuário corrige e tenta novamente
- **Não pode:** avançar sem validação bem-sucedida

### FA-2: Nenhum dispositivo encontrado

- **Quando:** Passo 4, item 2
- **Comportamento:** Mensagem "Nenhum dispositivo encontrado. Verifique se seus dispositivos estão vinculados ao projeto Cloud em iot.tuya.com"
- **Ação:** Botão "Buscar novamente" para retentar
- **Não pode:** avançar sem pelo menos 1 dispositivo

### FA-3: IP não resolvido (modo Local)

- **Quando:** Passo 4, item 10
- **Comportamento:** Campo de IP editável para inserção manual
- **Dica:** "O IP pode ser encontrado no app do seu roteador ou no app Tuya Smart > Dispositivo > Configurações"

### FA-4: Usuário fecha app durante onboarding

- **Comportamento:** Onboarding reinicia do início na próxima abertura
- **Dados parciais:** Se a senha já foi criada (passo 3c), o banco existe. Na reabertura, detectar banco sem flag de onboarding concluído → reiniciar wizard
- **Alternativa simples:** Só marcar onboarding como concluído no passo 6. Se banco existe mas onboarding não concluído → apagar banco e reiniciar

---

## Resultado Esperado

- Banco SQLCipher criado e criptografado
- Credenciais Cloud salvas (criptografadas)
- Pelo menos 1 dispositivo cadastrado com credenciais completas
- Layout do overlay configurado
- Usuário na Home (Dashboard), pronto para conectar dispositivos manualmente
- Onboarding não aparecerá novamente

---

## Requisitos Relacionados

FR-401, FR-402, FR-403, FR-404, FR-501, FR-502, FR-503, FR-504, FR-601, FR-602, FR-805
