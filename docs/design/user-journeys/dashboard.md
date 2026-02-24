# Jornada: Dashboard e Monitoramento

**Última atualização:** 2026-02-02

---

## Persona

Streamer usando o app no dia-a-dia. Quer ver rapidamente o status de todas as tomadas, consumo, custo, e acessar ações comuns sem navegar por múltiplas telas.

## Pré-condições

- Onboarding concluído
- App desbloqueado
- Pelo menos 1 tomada cadastrada

## Decisões Aplicáveis

| Decisão                 | Escolha                                                                        |
| ----------------------- | ------------------------------------------------------------------------------ |
| Período padrão de custo | **Desde conexão** — custo acumulado desde que a tomada foi conectada na sessão |
| Gráficos                | **Linha + barras** — linha para potência (W), barras para custo acumulado      |
| Unidades                | **Inteligente** — kW para >1000W, mA para <1A, 1 casa decimal                  |
| Auto-connect            | **Não** — usuário conecta manualmente                                          |

---

## Fluxo 1: Dashboard Principal (Home)

**Tela:** `HomePage` — **Rota:** `/`

### Visualização

1. Usuário abre o app e faz login
2. Sistema exibe o Dashboard com:

**Contadores/Mostradores (topo):**

| Mostrador        | Exemplo   | Descrição                                       |
| ---------------- | --------- | ----------------------------------------------- |
| Total de tomadas | `5`       | Todas cadastradas (incluindo desabilitadas)     |
| Conectadas       | `3/4`     | Conectadas / habilitadas                        |
| Consumo médio    | `85.3W`   | Média de potência das conectadas                |
| Custo da sessão  | `R$ 1,47` | Soma do custo de todas as tomadas desde conexão |

**Cards de tomadas (corpo):**

3. Grid de cards compactos, um por tomada habilitada
4. Cada card mostra:
   - Nome da tomada
   - Status (conectada / desconectada / reconectando)
   - Potência atual (se conectada): "115.0W"
   - Indicador visual de status (cor: verde/amarelo/vermelho/cinza)
5. Cards ordenados conforme drag and drop definido na lista de tomadas
6. Click no card → navega para `/devices/:id` (detalhes da tomada)

**Ações rápidas (lateral ou inferior):**

7. Botões de acesso rápido:
   - "Adicionar tomada" → `/devices/add`
   - "Ver todas as tomadas" → `/devices`
   - "Copiar URL overlay" → copia URL do overlay combinado
   - "Configurar kWh" → `/settings` (âncora no campo kWh)

### Alertas

8. Se alguma tomada está em "Reconectando...": banner de alerta no topo
   - "Tomada X perdeu comunicação. Reconectando..."
9. Se nenhuma tomada conectada: mensagem central sugerindo conectar

---

## Fluxo 2: Monitoramento Detalhado por Tomada

**Tela:** `DeviceDetailPage` > aba Monitoramento — **Rota:** `/devices/:id`

### Dados em tempo real

1. Usuário acessa detalhes de uma tomada conectada
2. Seção de dados em tempo real:

| Dado            | Formato               | Exemplo             |
| --------------- | --------------------- | ------------------- |
| Potência        | W ou kW (inteligente) | "115.0W" ou "1.2kW" |
| Tensão          | V                     | "220.0V"            |
| Corrente        | A ou mA (inteligente) | "0.52A" ou "850mA"  |
| Status          | On/Off                | Indicador visual    |
| Custo sessão    | Moeda configurada     | "R$ 0,34"           |
| Tempo conectado | HH:MM:SS              | "02:15:43"          |

3. Dados atualizam em tempo real (frequência do polling, padrão 5s)

### Gráfico de potência (linha)

4. Gráfico de linha: potência (W) no eixo Y, tempo no eixo X
5. Seletor de período:
   - Pré-definidos: última hora, hoje, últimas 24h, última semana, último mês
   - Personalizado: date picker (data início → data fim)
6. Zoom e pan no gráfico (se a biblioteca suportar)
7. Tooltip ao passar o mouse: timestamp + valor exato

### Gráfico de custo (barras)

8. Gráfico de barras: custo acumulado por intervalo
   - Período "última hora": barras por 5 minutos
   - Período "hoje" / "24h": barras por hora
   - Período "semana": barras por dia
   - Período "mês": barras por dia
9. Valor total do período exibido acima do gráfico
10. Requer preço kWh configurado (FR-304). Se não configurado: mensagem "Configure o preço do kWh em Configurações para ver custos"

### Estatísticas do período

11. Abaixo dos gráficos, resumo numérico:
    - Potência média do período
    - Potência máxima (pico)
    - Consumo total (kWh)
    - Custo total do período
    - Tempo total monitorado no período

---

## Fluxo 3: Mini-Dashboard por Source

**Tela:** `DeviceDetailPage` > aba Overlay

1. Na aba de overlay de cada tomada, seção "Status do monitoramento"
2. Exibe dados resumidos coletados enquanto a tomada estava sendo monitorada:

| Dado              | Descrição                             |
| ----------------- | ------------------------------------- |
| Última leitura    | Timestamp + valores da última leitura |
| Potência média    | Média desde conexão                   |
| Pico de potência  | Máximo registrado desde conexão       |
| Tempo monitorando | Duração da conexão atual              |
| Status            | Indicador de conexão                  |

3. Propósito: usuário vê rapidamente se o monitoramento está funcionando sem sair da configuração de overlay

---

## Fluxo 4: Configurar Preço do kWh

**Tela:** `SettingsPage` — **Rota:** `/settings`

1. Usuário acessa Configurações (via menu ou ação rápida no dashboard)
2. Campo "Preço do kWh":
   - Input numérico com decimais (ex: 0.85)
   - Campo de moeda/prefixo (ex: "R$", "US$", campo livre)
3. Ao salvar, todos os cálculos de custo recalculam automaticamente
4. Se não configurado: dashboards mostram consumo em kWh sem valor monetário

---

## Fluxos Alternativos

### FA-1: Nenhuma tomada cadastrada

- Dashboard mostra mensagem de boas-vindas: "Adicione sua primeira tomada para começar"
- Botão "Adicionar tomada" destacado
- Contadores zerados

### FA-2: Tomadas cadastradas mas nenhuma conectada

- Cards de tomadas mostram status "Desconectada"
- Contadores: total de tomadas, 0 conectadas, sem consumo/custo
- Mensagem: "Conecte uma tomada para iniciar o monitoramento"

### FA-3: Sem preço kWh configurado

- Contadores de custo exibem "—" ou "Configurar kWh"
- Gráfico de barras de custo não exibido (ou mostra apenas kWh sem valor)
- Link para configuração de kWh

### FA-4: Sem histórico (tomada recém-adicionada)

- Gráficos mostram "Sem dados para este período"
- Dados em tempo real aparecem normalmente quando conectada

---

## Resultado Esperado

- Visão rápida e centralizada do estado de todas as tomadas
- Dados em tempo real claros e legíveis
- Gráficos informativos de consumo e custo ao longo do tempo
- Ações rápidas acessíveis sem navegar por menus
- Custo calculado automaticamente quando kWh está configurado

---

## Requisitos Relacionados

FR-301, FR-302, FR-303, FR-304, FR-305, FR-306, FR-703
