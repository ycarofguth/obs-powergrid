# Comparação Direta: Plugin C++ vs Browser Source

**Data:** 2026-01-27
**Objetivo:** Comparar as duas abordagens finalistas para decidir a arquitetura

---

## 1. Visão Geral

| Aspecto                | Plugin C++ Nativo                         | Browser Source + Backend                              |
| ---------------------- | ----------------------------------------- | ----------------------------------------------------- |
| **O que é**            | Código compilado que roda dentro do OBS   | Página HTML renderizada pelo Chromium embutido no OBS |
| **Linguagem**          | C/C++                                     | HTML/CSS/JS + Python (backend)                        |
| **Renderização**       | Direta na GPU via OBS                     | CEF (Chromium Embedded Framework)                     |
| **Instalação usuário** | Copiar .dll/.so/.dylib para pasta plugins | Executar app + adicionar Browser Source               |

---

## 2. Como Funciona Cada Um

### 2.1 Plugin C++ Nativo

```
┌─────────────────────────────────────────────────────────────────┐
│                         OBS Studio                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Plugin C++ (tuya-overlay.dll)                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  obs_source_info {                                   │  │  │
│  │  │    .id = "tuya_power_overlay",                       │  │  │
│  │  │    .type = OBS_SOURCE_TYPE_INPUT,                    │  │  │
│  │  │    .video_render = render_overlay,  ← desenha aqui   │  │  │
│  │  │    .get_properties = get_props,     ← UI config      │  │  │
│  │  │  }                                                   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          │                                 │  │
│  │                          ▼                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  TinyTuya (reimplementado em C++)                    │  │  │
│  │  │  ou chamada para libcurl + parsing JSON              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                        ┌─────┴─────┐
                        │ Smart Plug │
                        └───────────┘
```

**Fluxo:**

1. Plugin carrega automaticamente quando OBS inicia
2. Usuário adiciona Source → "Tuya Power Overlay"
3. Abre janela de propriedades para configurar credenciais
4. Plugin faz requisições Tuya em thread separada
5. Renderiza texto/gráficos diretamente via OpenGL/DirectX

### 2.2 Browser Source + Backend

```
┌─────────────────────────────────────────────────────────────────┐
│                         OBS Studio                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Browser Source (CEF/Chromium)                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  URL: http://localhost:8080/overlay                  │  │  │
│  │  │                                                      │  │  │
│  │  │  <div class="power-display">                         │  │  │
│  │  │    <span class="watts">150W</span>                   │  │  │
│  │  │  </div>                                              │  │  │
│  │  │                                                      │  │  │
│  │  │  <script>                                            │  │  │
│  │  │    setInterval(() => fetch('/api/status'), 5000)     │  │  │
│  │  │  </script>                                           │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP localhost
┌─────────────────────────────┼───────────────────────────────────┐
│              App Backend (executável separado)                   │
│              Python + TinyTuya + Flask                           │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                        ┌─────┴─────┐
                        │ Smart Plug │
                        └───────────┘
```

**Fluxo:**

1. Usuário executa o app backend (fica no system tray)
2. No OBS: Add Source → Browser Source → URL localhost
3. Browser Source carrega HTML do backend
4. JavaScript faz fetch periódico para atualizar dados
5. CEF renderiza HTML como se fosse um browser

---

## 3. Customização Visual e Transparência

### 3.1 Browser Source - Fundo Transparente

**Funciona nativamente!** O OBS Browser Source suporta transparência por padrão.

```html
<!-- overlay.html -->
<!DOCTYPE html>
<html>
  <head>
    <style>
      /* IMPORTANTE: body e html sem background = transparente */
      html,
      body {
        margin: 0;
        padding: 0;
        background: transparent !important;
        overflow: hidden;
      }

      .power-display {
        /* Só o conteúdo aparece, resto é transparente */
        font-family: 'Arial', sans-serif;
        font-size: 48px;
        font-weight: bold;
        color: #00ff00;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);

        /* Opcional: fundo semi-transparente só no texto */
        /* background: rgba(0, 0, 0, 0.5); */
        /* padding: 10px 20px; */
        /* border-radius: 8px; */
      }

      .label {
        font-size: 14px;
        color: #ffffff;
        opacity: 0.8;
      }
    </style>
  </head>
  <body>
    <div class="power-display">
      <div class="label">Consumo Atual</div>
      <span id="watts">--</span> W
    </div>

    <script>
      async function update() {
        const res = await fetch('http://localhost:8080/api/status')
        const data = await res.json()
        document.getElementById('watts').textContent = data.power
      }
      setInterval(update, 2000)
      update()
    </script>
  </body>
</html>
```

**Resultado no OBS:**

```
┌─────────────────────────────────────────┐
│         Sua cena de stream              │
│                                         │
│   ┌─────────────────┐                   │
│   │ Consumo Atual   │  ← Só isso        │
│   │    150 W        │    aparece!       │
│   └─────────────────┘                   │
│                                         │
│   [webcam, jogo, etc - tudo visível     │
│    através do fundo transparente]       │
└─────────────────────────────────────────┘
```

**Configuração no OBS:**

1. Add Source → Browser Source
2. URL: `http://localhost:8080/overlay`
3. Width: 400, Height: 200 (ajustável)
4. ✅ "Custom CSS" pode ficar vazio ou adicionar overrides
5. Posicionar onde quiser na cena

### 3.2 Plugin C++ - Fundo Transparente

Também suporta, mas requer implementação manual:

```cpp
// No callback video_render do plugin
static void render_overlay(void *data, gs_effect_t *effect) {
    struct tuya_source *context = data;

    // Não desenha background = transparente automaticamente
    // OBS usa alpha blending por padrão

    // Desenhar texto
    gs_effect_set_texture(effect, context->font_texture);
    gs_draw_sprite(context->font_texture, 0,
                   context->width, context->height);
}
```

**Diferença:** No C++ você controla pixel por pixel. Se não desenhar nada, é transparente. Mas precisa implementar toda a lógica de renderização de texto, fontes, etc.

---

## 4. Exemplos Visuais de Interface

### 4.1 Browser Source - Possibilidades

**Exemplo 1: Minimalista**

```css
.overlay {
  font-family: 'Roboto Mono', monospace;
  font-size: 24px;
  color: #fff;
  text-shadow: 1px 1px 2px #000;
}
```

```
  ⚡ 145W
```

**Exemplo 2: Com fundo semi-transparente**

```css
.overlay {
  background: rgba(0, 0, 0, 0.6);
  padding: 15px 25px;
  border-radius: 10px;
  border-left: 4px solid #00ff00;
}
```

```
┌────────────────────┐
│ ⚡ Consumo: 145W   │
│ 📊 Hoje: 2.3 kWh  │
└────────────────────┘
```

**Exemplo 3: Com gráfico animado**

```css
.bar {
  height: 20px;
  background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
  width: var(--power-percent);
  transition: width 0.5s ease;
}
```

```
Consumo: 145W
[███████████░░░░░░░░░] 72%
```

**Exemplo 4: Estilo gaming/streamer**

```css
.overlay {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #0f3460;
  box-shadow: 0 0 20px rgba(0, 100, 255, 0.3);
  animation: pulse 2s infinite;
}
```

### 4.2 Plugin C++ - Possibilidades

Mesmas possibilidades visualmente, MAS:

- Precisa implementar cada efeito manualmente
- Gradientes = shader customizado
- Animações = loop de renderização
- Fontes = carregar e renderizar TTF
- Muito mais código para o mesmo resultado

---

## 5. Experiência do Usuário - Configuração de Estilo

### 5.1 Browser Source

**Como o usuário customiza:**

**Opção A: Editar CSS no próprio OBS**

```
Browser Source → Properties → Custom CSS

body { font-size: 32px !important; }
.power-display { color: #ff0000 !important; }
```

**Opção B: Parâmetros na URL**

```
http://localhost:8080/overlay?theme=dark&size=large&color=red
```

**Opção C: UI no App Backend**

```
┌─────────────────────────────────────────┐
│  Tuya OBS Overlay - Configurações       │
├─────────────────────────────────────────┤
│  Tema: [Dark ▼]                         │
│  Tamanho: [Grande ▼]                    │
│  Cor do texto: [██] #00ff00             │
│  Mostrar: ☑ Watts ☑ Voltagem ☐ Corrente │
│  Posição: [Canto inferior direito ▼]    │
│                                         │
│  [Preview]  [Aplicar]                   │
└─────────────────────────────────────────┘
```

**Opção D: Temas pré-definidos**

```
http://localhost:8080/overlay?theme=minimal
http://localhost:8080/overlay?theme=gaming
http://localhost:8080/overlay?theme=professional
```

### 5.2 Plugin C++

**Como o usuário customiza:**

```
OBS → Sources → Tuya Overlay → Properties

┌─────────────────────────────────────────┐
│  Tuya Power Overlay                     │
├─────────────────────────────────────────┤
│  Device ID: [___________________]       │
│  Local Key: [___________________]       │
│  IP Address: [___________________]      │
│                                         │
│  -- Aparência --                        │
│  Font: [Arial ▼]                        │
│  Size: [24 ▼]                           │
│  Color: [██] (color picker)             │
│  Background: ☐ Mostrar fundo            │
│  Bg Color: [██]                         │
│  Bg Opacity: [====●====] 50%            │
│                                         │
│  [OK]  [Cancel]  [Defaults]             │
└─────────────────────────────────────────┘
```

**Diferença:** Customização limitada ao que foi programado no plugin. Adicionar nova opção = recompilar plugin.

---

## 6. Comparação de Desenvolvimento

### 6.1 Browser Source + Backend

**Estrutura do projeto:**

```
obs-tuya-overlay/
├── backend/
│   ├── app.py              # Flask server (~100 linhas)
│   ├── tuya_client.py      # TinyTuya wrapper (~50 linhas)
│   └── requirements.txt    # tinytuya, flask
├── overlay/
│   ├── index.html          # UI principal (~50 linhas)
│   ├── styles.css          # Estilos (~100 linhas)
│   └── app.js              # Lógica JS (~50 linhas)
└── build/
    └── TuyaOverlay.exe     # PyInstaller output
```

**Total estimado:** ~350 linhas de código
**Tempo de desenvolvimento:** 1-2 dias para MVP

**Tecnologias que o dev precisa saber:**

- Python básico
- HTML/CSS
- JavaScript básico
- Flask (simples)

### 6.2 Plugin C++

**Estrutura do projeto:**

```
obs-tuya-plugin/
├── src/
│   ├── plugin-main.cpp     # Entry point (~100 linhas)
│   ├── tuya-source.cpp     # Source implementation (~500 linhas)
│   ├── tuya-source.h       # Header
│   ├── tuya-client.cpp     # Comunicação Tuya (~400 linhas)
│   ├── tuya-client.h
│   ├── text-renderer.cpp   # Renderização texto (~300 linhas)
│   └── text-renderer.h
├── CMakeLists.txt          # Build config
├── .github/
│   └── workflows/
│       └── build.yml       # CI para Win/Mac/Linux
└── data/
    └── locale/
        └── en-US.ini       # Traduções
```

**Total estimado:** ~1500+ linhas de código
**Tempo de desenvolvimento:** 2-4 semanas para MVP

**Tecnologias que o dev precisa saber:**

- C++ moderno (C++17)
- OBS Plugin API
- CMake
- OpenGL/DirectX básico
- Criptografia AES (para Tuya local)
- Multithreading
- Build systems (Visual Studio, Xcode, GCC)

---

## 7. Comparação de Manutenção

| Aspecto             | Browser Source               | Plugin C++                     |
| ------------------- | ---------------------------- | ------------------------------ |
| Atualizar visual    | Editar HTML/CSS, sem rebuild | Recompilar e redistribuir      |
| Adicionar feature   | Editar Python/JS             | Recompilar 3 plataformas       |
| Bug no OBS update   | Provavelmente funciona       | Pode quebrar, precisa testar   |
| Distribuição        | 1 executável (PyInstaller)   | 3 binários (.dll, .so, .dylib) |
| Atualização usuário | Baixar novo .exe             | Substituir arquivo na pasta    |

---

## 8. Comparação de Performance

| Métrica           | Browser Source           | Plugin C++        |
| ----------------- | ------------------------ | ----------------- |
| Uso de RAM        | ~50-100MB (CEF overhead) | ~5-10MB           |
| Uso de CPU        | Baixo (página estática)  | Muito baixo       |
| Latência visual   | Imperceptível            | Imperceptível     |
| Impacto no stream | Nenhum mensurável        | Nenhum mensurável |

**Nota:** O OBS já carrega o CEF para outras funcionalidades (chat, alerts, etc.), então o overhead adicional de mais um Browser Source é mínimo.

---

## 9. Comparação de Experiência do Usuário Final

### 9.1 Instalação

**Browser Source:**

```
1. Baixar TuyaOverlay.exe (50-80MB)
2. Executar
3. Pronto para usar
```

**Plugin C++:**

```
1. Baixar tuya-overlay-plugin-windows.zip
2. Extrair para C:\Program Files\obs-studio\obs-plugins\64bit\
3. Reiniciar OBS
4. Pronto para usar
```

**Veredicto:** Similar, mas Browser Source não requer mexer em pastas do sistema.

### 9.2 Configuração Inicial

**Browser Source:**

```
1. Executar app → UI de configuração abre
2. Inserir credenciais Tuya
3. Testar conexão
4. No OBS: Add Browser Source → colar URL
```

**Plugin C++:**

```
1. No OBS: Add Source → Tuya Overlay
2. Preencher credenciais na janela de propriedades
3. OK
```

**Veredicto:** Plugin C++ tem menos passos, mas ambos são simples.

### 9.3 Customização Visual

**Browser Source:**

- Infinitas possibilidades com CSS
- Temas pré-definidos
- Custom CSS no próprio OBS
- Pode usar Google Fonts, animações CSS, SVG, etc.

**Plugin C++:**

- Limitado às opções programadas
- Adicionar opção = nova versão do plugin
- Fontes do sistema apenas
- Animações complexas = muito código

**Veredicto:** Browser Source muito mais flexível.

---

## 10. Casos de Uso Específicos

### 10.1 "Quero só texto simples com fundo transparente"

**Browser Source:**

```html
<body style="background: transparent">
  <span style="color: white; font-size: 24px; text-shadow: 1px 1px black"> 150W </span>
</body>
```

✅ Funciona perfeitamente

**Plugin C++:**

```cpp
// Não desenhar background
// Usar obs_source_draw_text() ou implementar
```

✅ Funciona, mas mais código

### 10.2 "Quero um visual elaborado com gradientes e animações"

**Browser Source:**

```css
.overlay {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: glow 2s ease-in-out infinite;
}
@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 5px #667eea;
  }
  50% {
    box-shadow: 0 0 20px #667eea;
  }
}
```

✅ CSS padrão, fácil

**Plugin C++:**

```cpp
// Implementar shader para gradiente
// Implementar sistema de animação
// ~200 linhas de código adicional
```

⚠️ Possível, mas trabalhoso

### 10.3 "Quero que funcione 100% dentro do OBS, sem app externo"

**Browser Source:**
❌ Requer app backend rodando

**Plugin C++:**
✅ Tudo dentro do OBS

---

## 11. Tabela de Decisão Final

| Critério                   | Peso | Browser Source | Plugin C++ |
| -------------------------- | ---- | -------------- | ---------- |
| Facilidade de instalação   | 20%  | 9              | 7          |
| Facilidade de configuração | 15%  | 8              | 9          |
| Flexibilidade visual       | 20%  | 10             | 6          |
| Tempo de desenvolvimento   | 15%  | 10             | 3          |
| Manutenibilidade           | 10%  | 9              | 5          |
| Performance                | 5%   | 7              | 10         |
| Experiência "nativa"       | 10%  | 6              | 10         |
| Cross-platform             | 5%   | 10             | 7          |
| **TOTAL**                  | 100% | **8.70**       | **6.55**   |

---

## 12. Recomendação

### Para este projeto: **Browser Source + Backend**

**Razões:**

1. **Desenvolvimento 5-10x mais rápido**
2. **Customização visual ilimitada** com CSS
3. **Manutenção simples** - editar HTML/CSS sem recompilar
4. **Fundo transparente** funciona nativamente
5. **Uma única build** funciona em Win/Mac/Linux

### Quando usar Plugin C++ seria melhor:

- Se o overlay precisasse de **processamento de vídeo em tempo real**
- Se fosse **integração profunda** com outras partes do OBS
- Se **performance extrema** fosse crítica (não é o caso)
- Se quisesse **zero dependências externas** (app rodando)

---

## 13. Próximo Passo Recomendado

Executar **POC** com Browser Source para validar:

1. Transparência funciona como esperado
2. Refresh de dados é suave
3. Latência aceitável
4. Visual atende expectativas

Posso criar a POC agora se aprovar esta arquitetura.
