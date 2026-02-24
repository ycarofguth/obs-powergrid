# Jornada: Configuração de Overlay

**Última atualização:** 2026-02-02

---

## Persona

Streamer que quer personalizar a aparência do overlay de consumo de energia para combinar com o visual da sua transmissão. Quer configurar, copiar a URL e usar como Browser Source no OBS.

## Pré-condições

- Pelo menos 1 tomada cadastrada
- App desbloqueado

## Decisões Aplicáveis

| Decisão           | Escolha                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| Preview           | **Toggle** entre dados reais (se conectada) e dados fictícios          |
| Presets           | **Custom** — usuário salva configurações como presets nomeados         |
| Overlay combinado | **Estilo próprio** — configuração independente das tomadas individuais |
| Background        | **Ambas opções** — transparente (padrão) + cor sólida configurável     |
| Ajuda OBS         | **URL + dicas** — botão copiar URL + dimensões recomendadas            |

---

## Fluxo 1: Configurar Overlay Individual

**Tela:** `DeviceDetailPage` > aba Overlay — **Rota:** `/devices/:id`

### Acessar editor

1. Usuário acessa detalhes de uma tomada
2. Navega para aba "Overlay"
3. Sistema exibe o `OverlayLayoutEditor` com as configurações atuais da tomada

### Personalizar estilo

4. **Fonte:**
   - Tamanho: slider (10–72px, padrão: 40px)
   - Cor: color picker + input hex (padrão: #FFFFFF)
   - Borda: toggle on/off → cor + espessura (1–5px)
   - Sombra: toggle on/off → cor + intensidade

5. **Layout:**
   - Toggle: Horizontal ou Vertical (padrão: Vertical)
   - Horizontal: dados em uma linha — "120W | 220V | 0.5A"
   - Vertical: dados empilhados — cada métrica em uma linha

6. **Background:**
   - Opção 1: Transparente (padrão) — funciona com "transparent background" do OBS
   - Opção 2: Cor sólida — color picker + opacidade (0–100%)
   - Border radius (cantos arredondados, 0–20px)
   - Padding (espaçamento interno, 0–32px)

7. **Dados exibidos:**
   - Checkboxes: Potência (W), Tensão (V), Corrente (A), Nome da tomada
   - Pelo menos 1 item selecionado
   - Ordem configurável (drag and drop)

8. **Unidades inteligentes** (automático, sem configuração):
   - Potência > 1000W → exibe em kW (ex: "1.2kW")
   - Corrente < 1A → exibe em mA (ex: "850mA")
   - Demais: formato padrão com 1 casa decimal

### Preview

9. Preview em tempo real ao lado do editor
10. Toggle no preview: "Dados reais" / "Dados de exemplo"
    - Dados de exemplo: 115.0W, 220.0V, 0.52A (valores fixos padronizados)
    - Dados reais: valores ao vivo da tomada (se conectada), senão usa exemplo
11. Preview atualiza instantaneamente a cada mudança de configuração

### Salvar

12. Botão "Salvar" — persiste configuração no banco
13. Mudanças refletem imediatamente no overlay servido pelo sidecar (sem necessidade de recarregar o Browser Source no OBS)

---

## Fluxo 2: Presets de Overlay

### Salvar preset

1. Após personalizar o estilo, botão "Salvar como preset"
2. Diálogo: campo "Nome do preset" (ex: "Tema escuro", "Minimalista")
3. Sistema salva todas as configurações de estilo como preset nomeado no banco
4. Preset aparece na lista de presets disponíveis

### Aplicar preset

5. No editor de overlay (qualquer tomada), dropdown "Carregar preset"
6. Lista de presets salvos pelo usuário
7. Ao selecionar, configurações são aplicadas no editor
8. Usuário pode ajustar após aplicar (preset é ponto de partida)
9. Salvar aplica para aquela tomada específica (não altera o preset original)

### Gerenciar presets

10. Na lista de presets: opção de renomear e deletar
11. Deletar preset não afeta tomadas que foram configuradas com ele (configuração já foi aplicada)

---

## Fluxo 3: Configurar Overlay Combinado

**Rota:** `/overlay/combined`

### Acessar

1. Usuário acessa via:
   - Seção "Tomadas" → botão "Overlay combinado"
   - Ou ação rápida no Dashboard

### Configurar

2. Sistema exibe `OverlayLayoutEditor` para o overlay combinado
3. **Estilo próprio:** configuração independente das tomadas individuais
4. Mesmas opções de personalização (font, cor, borda, sombra, layout, background)
5. Opção adicional: disposição das tomadas no combinado (ex: empilhadas, lado a lado)
6. Preview mostra todas as tomadas habilitadas e conectadas

### URL e uso

7. URL: `http://localhost:47531/overlay`
8. Botão "Copiar URL"
9. Dica: "Dimensões recomendadas: depende do número de tomadas"

---

## Fluxo 4: Copiar URL e Usar no OBS

### No app

1. Na aba Overlay da tomada (ou overlay combinado), seção "Usar no OBS"
2. URL exibida: `http://localhost:47531/overlay/{deviceId}` (individual) ou `.../overlay` (combinado)
3. Botão "Copiar URL" → copia para clipboard
4. Dicas exibidas:
   - "No OBS, adicione uma fonte Browser Source"
   - "Cole a URL copiada"
   - "Dimensões recomendadas: 400x100 (horizontal) ou 200x300 (vertical)"
   - "Marque 'Desabilitar CSS personalizado' se necessário"

### No OBS (fora do app)

5. Usuário adiciona Browser Source no OBS
6. Cola a URL copiada
7. Define dimensões
8. Overlay aparece com os dados da tomada
9. Se fundo transparente configurado: marcar checkbox "Transparent Background" no OBS

---

## Fluxos Alternativos

### FA-1: Tomada desconectada

- Preview mostra dados de exemplo automaticamente
- Overlay servido pelo sidecar mostra último dado conhecido ou mensagem "Aguardando conexão..."

### FA-2: Tomada desabilitada

- Overlay individual retorna página com mensagem "Dispositivo desabilitado"
- Overlay combinado simplesmente não inclui a tomada desabilitada

### FA-3: Nenhuma tomada conectada no overlay combinado

- Overlay combinado mostra mensagem "Nenhum dispositivo conectado"

---

## Resultado Esperado

- Overlay visualmente personalizado para a estética da stream do usuário
- URL copiada e funcionando como Browser Source no OBS
- Presets salvos para reutilização rápida em novas tomadas
- Overlay combinado funcional com todas as tomadas habilitadas
- Mudanças de estilo refletem em tempo real no overlay (sem recarregar OBS)

---

## Requisitos Relacionados

FR-106, FR-107, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206
