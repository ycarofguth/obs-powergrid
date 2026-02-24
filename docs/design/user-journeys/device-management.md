# Jornada: Gerenciamento de Tomadas

**Última atualização:** 2026-02-02

---

## Persona

Usuário que já completou o onboarding e quer gerenciar seus dispositivos: adicionar novas tomadas, editar, remover, conectar, desconectar, habilitar/desabilitar e reordenar.

## Pré-condições

- Onboarding concluído
- App desbloqueado (senha inserida)
- Credenciais Cloud configuradas

## Decisões Aplicáveis

| Decisão                   | Escolha                                              |
| ------------------------- | ---------------------------------------------------- |
| Auto-connect ao abrir app | **Não** — conexão sempre manual                      |
| Quando perde comunicação  | **Retry automático + alerta** (30s entre tentativas) |
| Ordenação                 | **Drag and drop** — usuário reordena livremente      |

---

## Fluxo 1: Listar e Visualizar Tomadas

**Tela:** `DeviceListPage` — **Rota:** `/devices`

1. Usuário acessa "Tomadas" no menu
2. Sistema exibe lista de tomadas cadastradas, na ordem definida pelo usuário (drag and drop)
3. Para cada tomada exibe:
   - Nome
   - Status: `Desconectada` | `Conectando...` | `Conectada` | `Reconectando...` | `Desabilitada`
   - Potência atual (se conectada): ex. "115.0W"
   - Modo: `Local` | `Cloud`
   - Ícone de drag handle para reordenação
4. Ações inline por tomada:
   - **Conectar** (se desconectada e habilitada)
   - **Desconectar** (se conectada)
   - **Ver detalhes** → navega para `/devices/:id`
5. Ações globais:
   - Botão "Adicionar tomada"
   - Campo de busca/filtro por nome

---

## Fluxo 2: Adicionar Tomada

**Tela:** `DeviceSelector` (reutilizável) — **Rota:** `/devices/add`

### Via Cloud (caminho principal)

1. Usuário clica "Adicionar tomada"
2. Sistema busca dispositivos via Tuya Cloud API
3. Sistema exibe lista de dispositivos **ainda não cadastrados**
4. Para cada dispositivo: nome, Device ID, categoria, status online/offline
5. Usuário seleciona dispositivo(s)
6. Para cada selecionado, toggle: Local ou Cloud
7. Se modo Local: sistema tenta resolver IP automaticamente
8. Se IP não resolvido: campo para inserir IP manualmente
9. Usuário clica "Adicionar"
10. Sistema salva no banco (credenciais criptografadas)
11. Tomada aparece na lista com status "Desconectada"
12. Log registrado: "Dispositivo X adicionado"

### Via manual (fallback)

1. Na tela de adicionar, link "Adicionar manualmente"
2. Formulário com campos: nome, Device ID, Local Key, IP Address, versão protocolo
3. Validação de campos obrigatórios
4. Mesmo fluxo de salvamento (criptografia + banco)

---

## Fluxo 3: Conectar Tomada

**Tela:** `DeviceListPage` ou `DeviceDetailPage`

1. Usuário clica "Conectar" em uma tomada desconectada e habilitada
2. Status muda para "Conectando..."
3. Sistema inicia conexão:
   - **Modo Local:** abre conexão TCP/AES com o dispositivo via TuyAPI
   - **Modo Cloud:** inicia polling da Tuya Cloud API
4. **Se sucesso:**
   - Status muda para "Conectada"
   - Dados em tempo real começam a aparecer (W, V, A)
   - Sistema inicia armazenamento de leituras no banco
   - Log registrado: "Tomada X conectada (modo Local/Cloud)"
5. **Se falha:**
   - Status muda para "Desconectada"
   - Mensagem de erro: "Falha ao conectar com Tomada X. Verifique se o dispositivo está ligado e na mesma rede."
   - Log registrado: "Falha ao conectar Tomada X: [razão]"

---

## Fluxo 4: Perda de Comunicação (Retry Automático)

1. Tomada está conectada e funcionando
2. Comunicação é perdida (Wi-Fi caiu, dispositivo desligou, etc.)
3. Status muda para "Reconectando..."
4. Sistema tenta reconectar a cada 30 segundos
5. Notificação no dashboard: "Tomada X perdeu comunicação. Reconectando..."
6. **Se reconectar:**
   - Status volta para "Conectada"
   - Dados retomam normalmente
   - Log: "Tomada X reconectada após X tentativas"
7. **Se falhar após N tentativas (ex: 10 = 5 minutos):**
   - Status muda para "Desconectada"
   - Alerta persistente: "Não foi possível reconectar com Tomada X"
   - Log: "Tomada X desconectada após falha de reconexão"
   - Usuário precisa reconectar manualmente

---

## Fluxo 5: Desconectar Tomada

1. Usuário clica "Desconectar" em uma tomada conectada
2. Sistema encerra conexão TCP/AES ou polling Cloud
3. Status muda para "Desconectada"
4. Dados em tempo real param de atualizar
5. Leituras armazenadas no banco permanecem intactas
6. Log: "Tomada X desconectada pelo usuário"

---

## Fluxo 6: Editar Tomada

**Tela:** `DeviceDetailPage` > aba Configuração — **Rota:** `/devices/:id`

1. Usuário acessa detalhes da tomada
2. Navega para aba/seção "Configuração"
3. Campos editáveis: nome, Device ID, Local Key, IP, versão protocolo, modo (Local/Cloud)
4. **Se a tomada estiver conectada:**
   - Aviso: "A tomada será desconectada para aplicar as alterações"
   - Ao salvar, sistema desconecta → salva → usuário reconecta manualmente
5. **Se desconectada:** salva diretamente
6. Campos sensíveis (Local Key) são re-criptografados ao salvar
7. Log: "Tomada X editada: [campos alterados]"

---

## Fluxo 7: Habilitar/Desabilitar Tomada

1. Na lista de tomadas, toggle de habilitar/desabilitar
2. **Desabilitar:**
   - Se conectada, desconecta primeiro
   - Status muda para "Desabilitada"
   - Tomada não aparece no overlay nem no dashboard de monitoramento
   - Permanece visível na lista (com visual de desabilitada — opacidade reduzida)
   - Log: "Tomada X desabilitada"
3. **Habilitar:**
   - Status muda para "Desconectada" (não conecta automaticamente)
   - Volta a aparecer no overlay e dashboard
   - Log: "Tomada X habilitada"

---

## Fluxo 8: Remover Tomada

1. Na tela de detalhes, botão "Remover tomada"
2. Diálogo de confirmação: "Remover Tomada X? Todos os dados históricos serão apagados. Esta ação não pode ser desfeita."
3. **Se confirmar:**
   - Se conectada, desconecta primeiro
   - Remove do banco: configuração, histórico de leituras, configuração de overlay
   - Remove da lista
   - Log: "Tomada X removida"
4. **Se cancelar:** nada acontece

---

## Fluxo 9: Reordenar Tomadas (Drag and Drop)

1. Na lista de tomadas, usuário arrasta o drag handle de uma tomada
2. Solta na posição desejada
3. Nova ordem salva automaticamente no banco
4. Ordem reflete em: lista de tomadas, overlay combinado, cards no dashboard

---

## Fluxo 10: Ver Detalhes da Tomada

**Tela:** `DeviceDetailPage` — **Rota:** `/devices/:id`

1. Usuário clica em uma tomada na lista (ou "Ver detalhes")
2. Sistema exibe página de detalhes com abas/seções:

**Aba Monitoramento:**

- Dados em tempo real: potência (W/kW), tensão (V), corrente (A/mA), status on/off
- Gráfico de linha: potência ao longo do tempo
- Gráfico de barras: custo acumulado por hora/dia
- Custo desde conexão (baseado no kWh configurado)
- Seletor de período para histórico

**Aba Configuração:**

- Campos editáveis (Fluxo 6)
- Toggle habilitar/desabilitar
- Botão remover

**Aba Overlay:**

- Editor de layout (Fluxo na jornada overlay-config.md)
- URL individual copiável
- Preview com toggle dados reais/fictícios

---

## Resultado Esperado

- Usuário consegue gerenciar completamente suas tomadas sem fricção
- Status de cada tomada é sempre claro e visível
- Ações destrutivas (remover) têm confirmação
- Edição de tomada conectada é segura (desconecta antes)
- Ordem personalizada persiste entre sessões

---

## Requisitos Relacionados

FR-101, FR-102, FR-103, FR-104, FR-105, FR-106, FR-306, FR-405
