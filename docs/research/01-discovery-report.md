# Discovery Report: OBS + Tuya Smart Plug Integration

**Data:** 2026-01-27
**Fase:** Discovery & Research
**Status:** Completo (v2 - atualizado com foco em UX)

---

## Sumário Executivo

Este documento consolida a pesquisa técnica sobre as capacidades do OBS Studio e da API Tuya para definir a melhor arquitetura para o projeto.

**Premissa principal:** A facilidade de instalação e uso pelo usuário final é crítica para adoção.

---

## 1. Capacidades do OBS Studio

### 1.1 Tipos de Extensões Disponíveis

| Tipo               | Descrição          | Custom Sources  | HTTP/Network | Cross-platform    | Setup usuário   |
| ------------------ | ------------------ | --------------- | ------------ | ----------------- | --------------- |
| **Lua Script**     | LuaJIT 2 integrado | ✅ Sim          | ❌ Limitado  | ✅ 100%           | Nenhum          |
| **Python Script**  | Python 3.6-3.12    | ❌ Não          | ✅ Sim       | ✅ Com setup      | Instalar Python |
| **Plugin C/C++**   | Código nativo      | ✅ Sim          | ✅ Sim       | ⚠️ Build separado | Instalar plugin |
| **Browser Source** | HTML/CSS/JS (CEF)  | ✅ HTML         | ✅ fetch/WS  | ✅ 100%           | Nenhum          |
| **obs-urlsource**  | Plugin HTTP/API    | ✅ HTML/CSS     | ✅ Sim       | ✅ Win/Mac/Linux  | Instalar plugin |
| **Text GDI+**      | Texto nativo       | ❌ Texto apenas | ❌ Não       | ✅ 100%           | Nenhum          |

### 1.2 Plugin obs-urlsource (Descoberta Importante)

**Repositório:** [github.com/royshil/obs-urlsource](https://github.com/royshil/obs-urlsource)

Plugin que adiciona uma fonte de vídeo capaz de:

- Fazer requisições HTTP (GET/POST)
- Parsear JSON, XML, HTML, Regex
- Exibir resultado como texto formatado (HTML4/CSS)
- Timer de refresh configurável
- Suporte a headers customizados (API keys, tokens)
- Output mapping para múltiplas fontes

**Limitações identificadas:**

- ⚠️ **OAuth não implementado** (apenas headers simples)
- ⚠️ Alguns usuários reportam problemas no OBS 32.0.1
- PUT/DELETE/PATCH não suportados
- Subset de HTML4/CSS (não é HTML5 completo)

**Implicação:** Não pode autenticar diretamente com Tuya Cloud API (usa OAuth 2.0).
Pode funcionar com um backend que exponha endpoint simples.

### 1.3 Text (GDI+) - Read from File

O OBS tem fonte de texto nativa que pode ler de arquivo:

- **Refresh:** 1 segundo (fixo, não configurável sem modificar código)
- **Visual:** Apenas texto, customização limitada (fonte, cor, sombra)
- **Setup:** Zero - funcionalidade nativa

**Uso potencial:** Backend escreve arquivo `.txt`, OBS lê automaticamente.

### 1.4 Limitações Críticas Identificadas

| Extensão       | Limitação               | Impacto                          |
| -------------- | ----------------------- | -------------------------------- |
| Python Script  | Não cria custom sources | Visual limitado a Text Source    |
| Python Script  | Requer Python instalado | Barreira de entrada alta         |
| Lua Script     | Sem HTTP nativo         | Precisa de backend/arquivo       |
| obs-urlsource  | Sem OAuth               | Não conecta direto na Tuya Cloud |
| Browser Source | CORS em APIs externas   | Precisa de backend local         |

---

## 2. Capacidades da API Tuya

### 2.1 Tipos de APIs

| API           | Latência  | Offline | Auth                | Rate Limits |
| ------------- | --------- | ------- | ------------------- | ----------- |
| **Local API** | <100ms    | ✅ Sim  | AES-128 (local key) | ❌ Não      |
| **Cloud API** | 250-600ms | ❌ Não  | OAuth 2.0           | ✅ Sim      |

### 2.2 Requisitos de Autenticação

**Local API:**

- Device ID
- IP do dispositivo na rede
- Local Key (obtida via Tuya IoT Platform)
- Protocolo versão (3.1 a 3.5)

**Cloud API:**

- Access ID e Access Secret
- OAuth 2.0 token (expira em 2h)
- Refresh token automático

### 2.3 Dados Disponíveis (Smart Plugs)

| DPS | Dado          | Unidade    |
| --- | ------------- | ---------- |
| 1   | On/Off        | boolean    |
| 4   | Corrente      | mA         |
| 5   | Potência      | W          |
| 6   | Voltagem      | V          |
| 7   | Consumo total | kWh × 1000 |

### 2.4 Biblioteca Recomendada: TinyTuya

- Suporta Local API E Cloud API
- Python puro, fácil de empacotar
- Comunidade ativa
- [github.com/jasonacox/tinytuya](https://github.com/jasonacox/tinytuya)

---

## 3. Opções Arquiteturais (Atualizado)

### 3.1 Matriz Completa

| #   | Arquitetura                     | O que usuário instala | Setup necessário                  |
| --- | ------------------------------- | --------------------- | --------------------------------- |
| A   | App standalone + Browser Source | 1 executável          | Rodar app, add Browser Source     |
| B   | obs-urlsource + Backend         | Plugin + executável   | Instalar plugin, rodar backend    |
| C   | Backend + Text GDI+ (read file) | 1 executável          | Rodar app, add Text Source        |
| D   | Python Script OBS + TinyTuya    | Python + deps         | Instalar Python, pip, config path |
| E   | Lua Script + Backend (arquivo)  | 1 executável + script | Rodar app, add script             |
| F   | Plugin C++ nativo               | 1 plugin              | Instalar plugin                   |

### 3.2 Análise Detalhada

---

#### Opção A: App Standalone + Browser Source ⭐

```
┌────────────────────────────────────────────────────────────┐
│                        OBS Studio                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Browser Source                           │  │
│  │         URL: http://localhost:8080/overlay            │  │
│  └────────────────────────┬─────────────────────────────┘  │
└───────────────────────────┼────────────────────────────────┘
                            │ HTTP (localhost)
┌───────────────────────────┼────────────────────────────────┐
│        App Standalone (executável único)                    │
│  ┌────────────────────────┴─────────────────────────────┐  │
│  │  Servidor HTTP embutido (porta 8080)                  │  │
│  │  ├── GET /overlay → HTML/CSS/JS da interface         │  │
│  │  └── GET /api/status → JSON com dados do plug        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  TinyTuya (Local API) ←→ Smart Plug                  │  │
│  │  + Fallback Cloud API se local falhar                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  UI de Configuração (systray ou janela)              │  │
│  │  - Configurar credenciais Tuya                        │  │
│  │  - Selecionar dispositivo                             │  │
│  │  - Customizar visual do overlay                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                            │ TCP/AES (LAN)
                      ┌─────┴─────┐
                      │ Smart Plug │
                      └───────────┘
```

**Fluxo do usuário:**

1. Baixar e executar o app (1 arquivo)
2. Configurar credenciais Tuya na UI do app
3. No OBS: Add Source → Browser Source → URL: `http://localhost:8080/overlay`
4. Pronto!

**Tecnologias possíveis para o app:**

- **Python + PyInstaller**: Familiar, TinyTuya nativo, ~50-80MB
- **Go + embed**: Muito leve (~10-15MB), mas requer reimplementar Tuya
- **Tauri (Rust + Web)**: Leve (~10-20MB), UI moderna, mais complexo
- **Electron**: Pesado (~150MB+), descartado

**Prós:**

- Usuário instala apenas 1 coisa
- Visual totalmente customizável (HTML/CSS/JS)
- UI para configuração (não precisa editar arquivos)
- Backend gerencia auth, cache, reconexão
- Funciona offline (Local API)

**Contras:**

- Desenvolvimento mais complexo
- App precisa estar rodando em background

---

#### Opção B: obs-urlsource + Backend

```
┌────────────────────────────────────────────────────────────┐
│                        OBS Studio                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              obs-urlsource (plugin)                   │  │
│  │         URL: http://localhost:8080/api/status         │  │
│  │         Refresh: 5 segundos                           │  │
│  │         Output: HTML template                         │  │
│  └────────────────────────┬─────────────────────────────┘  │
└───────────────────────────┼────────────────────────────────┘
                            │ HTTP
┌───────────────────────────┼────────────────────────────────┐
│              Backend (executável)                           │
│              TinyTuya → JSON response                       │
└───────────────────────────┼────────────────────────────────┘
                            │
                      ┌─────┴─────┐
                      │ Smart Plug │
                      └───────────┘
```

**Fluxo do usuário:**

1. Instalar plugin obs-urlsource
2. Baixar e executar o backend
3. No OBS: Add Source → URL/API Source → configurar URL e template

**Prós:**

- obs-urlsource faz o fetch automaticamente
- Template engine do plugin para formatação

**Contras:**

- Usuário instala 2 coisas (plugin + backend)
- Plugin pode ter incompatibilidades com versões do OBS
- Configuração menos intuitiva

---

#### Opção C: Backend + Text GDI+ (Read from File)

```
┌────────────────────────────────────────────────────────────┐
│                        OBS Studio                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Text (GDI+)                              │  │
│  │         Read from file: tuya_status.txt              │  │
│  │         Refresh: 1 segundo (automático)              │  │
│  └──────────────────────────┬───────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────┘
                              │ Filesystem
┌─────────────────────────────┼──────────────────────────────┐
│              Backend (executável)                           │
│              TinyTuya → escreve tuya_status.txt            │
└─────────────────────────────┼──────────────────────────────┘
                              │
                        ┌─────┴─────┐
                        │ Smart Plug │
                        └───────────┘
```

**Fluxo do usuário:**

1. Baixar e executar o backend
2. No OBS: Add Source → Text (GDI+) → Read from file → selecionar arquivo

**Prós:**

- Mais simples de implementar
- Usa funcionalidade nativa do OBS
- Apenas 1 coisa para instalar

**Contras:**

- Visual muito limitado (apenas texto)
- Refresh fixo em 1 segundo
- Sem customização visual rica

---

#### Opção D: Python Script OBS + TinyTuya

**Fluxo do usuário:**

1. Instalar Python 3.x
2. `pip install tinytuya`
3. Configurar path do Python no OBS
4. Adicionar script no OBS
5. Configurar credenciais no script
6. Criar Text Source manualmente

**Prós:**

- Tudo dentro do OBS
- Sem serviço externo rodando

**Contras:**

- Setup muito complexo para usuário comum
- Muitos passos manuais
- Visual limitado (não pode criar custom source)
- Problemas de dependências

---

#### Opção E: Lua Script + Backend (Arquivo)

Similar à Opção C, mas com Lua renderizando.

**Prós:**

- Lua pode criar custom source com visual
- Zero dependências no OBS

**Contras:**

- Comunicação via arquivo (indireta)
- Duas peças para gerenciar
- Mais complexo

---

#### Opção F: Plugin C++ Nativo

**Prós:**

- Melhor UX possível (tudo no OBS)
- Performance máxima

**Contras:**

- Desenvolvimento muito complexo
- Build separado por plataforma
- Manutenção trabalhosa
- Overkill para este projeto

**Veredicto:** Descartada.

---

## 4. Critérios de Avaliação (Atualizados)

| Critério                       | Peso | Descrição                                      |
| ------------------------------ | ---- | ---------------------------------------------- |
| **Facilidade de instalação**   | 30%  | Quantos passos e ferramentas o usuário precisa |
| **Facilidade de configuração** | 15%  | Quão intuitivo é configurar                    |
| **Flexibilidade visual**       | 15%  | Capacidade de customização do overlay          |
| **Confiabilidade**             | 15%  | Funciona offline, reconexão, fallbacks         |
| **Manutenibilidade**           | 10%  | Facilidade de manter o código                  |
| **Performance**                | 10%  | Latência, impacto no streaming                 |
| **Segurança**                  | 5%   | Proteção de credenciais                        |

---

## 5. Scoring das Opções

### 5.1 Detalhamento dos Scores

| Critério              | Peso | A (App+Browser) | B (urlsource+Backend) | C (Backend+Text) | D (Python Script) |
| --------------------- | ---- | --------------- | --------------------- | ---------------- | ----------------- |
| Facilidade instalação | 30%  | 8               | 5                     | 8                | 2                 |
| Facilidade config     | 15%  | 9               | 6                     | 7                | 3                 |
| Flexibilidade visual  | 15%  | 10              | 7                     | 3                | 4                 |
| Confiabilidade        | 15%  | 9               | 7                     | 8                | 7                 |
| Manutenibilidade      | 10%  | 7               | 7                     | 8                | 8                 |
| Performance           | 10%  | 8               | 8                     | 9                | 9                 |
| Segurança             | 5%   | 9               | 8                     | 8                | 6                 |

### 5.2 Totais Ponderados

| Opção                                   | Score    | Ranking |
| --------------------------------------- | -------- | ------- |
| **A - App Standalone + Browser Source** | **8.35** | 🥇 1º   |
| **C - Backend + Text GDI+**             | **7.15** | 🥈 2º   |
| **B - obs-urlsource + Backend**         | **6.45** | 🥉 3º   |
| **D - Python Script OBS**               | **4.70** | 4º      |

---

## 6. Análise de Facilidade de Uso

### 6.1 Comparativo de Setup do Usuário

| Opção | Passos | Ferramentas externas | Configuração       |
| ----- | ------ | -------------------- | ------------------ |
| A     | 3      | Nenhuma              | UI gráfica         |
| B     | 5      | Plugin OBS           | Campos no OBS      |
| C     | 3      | Nenhuma              | Arquivo .env ou UI |
| D     | 7+     | Python, pip          | Editar código      |

### 6.2 Jornada do Usuário - Opção A (Recomendada)

```
1. Baixar executável (1 arquivo)
         ↓
2. Executar → Janela de configuração abre
         ↓
3. Inserir credenciais Tuya (Device ID, Local Key, IP)
   [Opção: Wizard que descobre dispositivos na rede]
         ↓
4. Clicar "Testar conexão" → Ver preview do overlay
         ↓
5. No OBS: Sources → Add → Browser Source
         ↓
6. URL: http://localhost:8080/overlay
         ↓
7. Pronto! Overlay funcionando
```

### 6.3 Jornada do Usuário - Opção D (Pior caso)

```
1. Baixar e instalar Python 3.x
         ↓
2. Abrir terminal/cmd
         ↓
3. pip install tinytuya
         ↓
4. Baixar script .py
         ↓
5. Editar script com credenciais (editar código!)
         ↓
6. OBS → Tools → Scripts → Python Settings → Configurar path
         ↓
7. OBS → Tools → Scripts → Add script
         ↓
8. Criar Text Source manualmente
         ↓
9. Configurar propriedades do script
         ↓
10. Torcer para funcionar
```

---

## 7. Recomendação Final

### Opção Recomendada: **A - App Standalone + Browser Source**

**Justificativa:**

1. **Melhor score** (8.35) com peso forte em UX
2. **Instalação simples**: Usuário baixa 1 arquivo e executa
3. **Configuração visual**: UI para inserir credenciais, sem editar código
4. **Visual rico**: HTML/CSS/JS permite overlays profissionais
5. **Auto-contido**: Tudo em um pacote
6. **Escalável**: Fácil adicionar features (múltiplos plugs, temas, etc.)

### Tecnologia Recomendada para o App

**Python + PyInstaller** (para MVP/POC):

- TinyTuya já em Python
- Flask/FastAPI para servidor HTTP
- Tkinter ou PyQt para UI simples
- PyInstaller para gerar executável
- Tamanho estimado: 50-80MB

**Evolução futura (se necessário):**

- Migrar para Tauri (Rust + Web) para app mais leve e moderno

---

## 8. POCs Recomendadas

### POC-01: Validar Arquitetura A (Prioridade Alta)

**Objetivo:** Provar que a arquitetura funciona end-to-end

**Escopo:**

1. Backend Python mínimo com TinyTuya
2. Endpoint `/api/status` retornando JSON
3. Endpoint `/overlay` servindo HTML simples
4. Testar no OBS com Browser Source
5. Medir latência real

**Critérios de sucesso:**

- [ ] Dados do plug aparecem no overlay
- [ ] Refresh a cada 5 segundos funciona
- [ ] Latência < 500ms
- [ ] Funciona em Windows e Mac

### POC-02: Testar Opção C como Fallback (Prioridade Baixa)

**Objetivo:** Ter plano B se Browser Source tiver problemas

**Escopo:**

1. Backend escreve arquivo .txt
2. Text GDI+ lê arquivo
3. Validar refresh de 1 segundo

---

## 9. Próximos Passos

1. [ ] Revisar e aprovar este documento
2. [ ] Aprovar arquitetura A
3. [ ] Executar POC-01
4. [ ] Documentar resultados da POC
5. [ ] Definir escopo do MVP
6. [ ] Criar ADR (Architecture Decision Record)

---

## 10. Referências

### OBS Studio

- [Documentação Scripting](https://docs.obsproject.com/scripting)
- [obs-urlsource](https://github.com/royshil/obs-urlsource)
- [obs-browser](https://github.com/obsproject/obs-browser)
- [Text GDI+ Refresh Rate](https://obsproject.com/forum/threads/way-to-change-the-read-from-file-text-refresh-rate-of-text-gdi-sources-in-the-ui.97044/)

### Tuya

- [TinyTuya](https://github.com/jasonacox/tinytuya)
- [Tuya Developer Platform](https://developer.tuya.com/)
- [Tuya Cloud API](https://developer.tuya.com/en/docs/cloud)

### Empacotamento

- [PyInstaller](https://pyinstaller.org/)
- [Tauri](https://tauri.app/)
