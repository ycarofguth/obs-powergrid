# Browser Source: Arquitetura e Análise de Hospedagem

**Data:** 2026-01-27
**Foco:** Entender como funciona e avaliar opção de página hospedada

---

## 1. Como Funciona o Browser Source Atualmente (Proposta Original)

### Arquitetura com App Local

```
┌─────────────────────────────────────────────────────────────────┐
│                          SEU PC                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      OBS Studio                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              Browser Source (CEF)                     │  │ │
│  │  │         URL: http://localhost:8080/overlay            │  │ │
│  │  │                                                       │  │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │  │ │
│  │  │  │              overlay.html                        │ │  │ │
│  │  │  │  <script>                                        │ │  │ │
│  │  │  │    fetch('http://localhost:8080/api/status')     │ │  │ │
│  │  │  │      .then(r => r.json())                        │ │  │ │
│  │  │  │      .then(data => updateUI(data))               │ │  │ │
│  │  │  │  </script>                                       │ │  │ │
│  │  │  └─────────────────────────────────────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ HTTP localhost:8080               │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              App Local (TuyaOverlay.exe)                    │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Flask Server (porta 8080)                            │  │ │
│  │  │  ├── GET /overlay    → Serve HTML/CSS/JS              │  │ │
│  │  │  └── GET /api/status → Retorna JSON com dados         │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  TinyTuya Client                                      │  │ │
│  │  │  └── Comunica com Smart Plug via TCP (Local API)      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  config.json (credenciais salvas localmente)          │  │ │
│  │  │  {                                                    │  │ │
│  │  │    "device_id": "xxx",                                │  │ │
│  │  │    "local_key": "xxx",  ← CRIPTOGRAFADO               │  │ │
│  │  │    "device_ip": "192.168.1.x"                         │  │ │
│  │  │  }                                                    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ TCP/AES (rede local)              │
│                              ▼                                   │
│                        ┌───────────┐                             │
│                        │Smart Plug │ (192.168.1.x)               │
│                        └───────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### Onde é salvo o token/credenciais?

**Na arquitetura local:**

- Arquivo `config.json` no diretório do app
- Local Key criptografada (AES com chave derivada de machine ID)
- Nunca sai do PC do usuário

```
%APPDATA%/TuyaOBSOverlay/
├── config.json      ← credenciais criptografadas
├── settings.json    ← preferências visuais
└── overlay/
    ├── index.html
    └── styles.css
```

### Como a página é gerada?

**Opção A: Arquivos estáticos servidos pelo app**

```python
# app.py
from flask import Flask, send_from_directory

app = Flask(__name__)

@app.route('/overlay')
def overlay():
    return send_from_directory('overlay', 'index.html')

@app.route('/api/status')
def status():
    data = tuya_client.get_status()
    return jsonify(data)
```

**Opção B: Template dinâmico**

```python
@app.route('/overlay')
def overlay():
    settings = load_user_settings()
    return render_template('overlay.html',
                           theme=settings['theme'],
                           color=settings['color'])
```

---

## 2. Sua Proposta: Página Hospedada (Client-Side)

### O que você está propondo:

```
┌─────────────────────────────────────────────────────────────────┐
│                          SEU PC                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      OBS Studio                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              Browser Source (CEF)                     │  │ │
│  │  │    URL: https://tuya-overlay.vercel.app/overlay       │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (internet)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Servidor Web (Vercel/etc)                     │
│                                                                  │
│  overlay.html carrega no browser do usuário                      │
│  JavaScript tenta fazer fetch para Tuya Cloud API                │
│                                                                  │
│  <script>                                                        │
│    fetch('https://openapi.tuyaus.com/v1.0/devices/xxx/status',  │
│          { headers: { 'client_id': xxx, ... }})                 │
│  </script>                                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
                    ┌─────────────────┐
                    │   Tuya Cloud    │
                    │      API        │
                    └─────────────────┘
```

### Vantagens (se funcionasse):

- ✅ Zero instalação para o usuário
- ✅ Atualizações automáticas (só atualizar o servidor)
- ✅ Funciona em qualquer PC instantaneamente

---

## 3. Por Que NÃO Funciona Direto (Client-Side Puro)

### Problema 1: CORS Bloqueado

A Tuya Cloud API **NÃO permite chamadas diretas do browser**.

```javascript
// No browser do OBS (CEF)
fetch('https://openapi.tuyaus.com/v1.0/token?grant_type=1', {
  headers: { client_id: 'xxx' },
})

// ERRO:
// Access to fetch at 'https://openapi.tuyaus.com/...' from origin
// 'https://tuya-overlay.vercel.app' has been blocked by CORS policy:
// No 'Access-Control-Allow-Origin' header is present
```

**Por que Tuya não habilita CORS?**

- APIs de IoT são server-to-server por design
- Segurança: evitar que qualquer site malicioso acesse dispositivos
- Todos os SDKs oficiais são para Node.js/Python (server-side)

Fonte: [Desenvolvedores tentando no fórum Tuya](https://www.tuyaos.com/viewtopic.php?t=2604)

### Problema 2: Segurança - Secret Exposto

A autenticação Tuya requer **client_id** e **secret** para assinar requests.

```javascript
// Se colocar no JavaScript client-side:
const CLIENT_SECRET = 'abc123...' // ⚠️ QUALQUER PESSOA VÊ ISSO

// View Source → Copia secret → Controla seus dispositivos
```

**Risco:** Qualquer pessoa com o secret pode:

- Ligar/desligar seus dispositivos
- Acessar dados de consumo
- Potencialmente acessar toda sua conta Tuya

Fonte: [Tuya Authentication Method](https://developer.tuya.com/en/docs/iot/authentication-method?id=Ka49gbaxjygox)

### Problema 3: Local API Não é HTTP

A **Local API** (mais rápida, sem rate limits) usa protocolo TCP próprio:

```
Local API: TCP na porta 6668 com criptografia AES-128
           Protocolo binário proprietário Tuya

Cloud API: HTTPS REST padrão
```

**Browsers não podem:**

- Abrir conexões TCP arbitrárias
- Executar criptografia AES no protocolo Tuya
- Descobrir dispositivos via UDP broadcast

---

## 4. Soluções Possíveis para Página Hospedada

### Solução A: Página Hospedada + Backend Serverless (Proxy)

```
┌─────────────────────────────────────────────────────────────────┐
│                          SEU PC                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  OBS Browser Source                                         │ │
│  │  URL: https://tuya-overlay.vercel.app/?token=USER_TOKEN     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            Servidor (Vercel/Cloudflare Workers)                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Frontend (overlay.html)                                   │  │
│  │  fetch('/api/tuya-status?token=USER_TOKEN')               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Backend Serverless (API Route / Worker)                   │  │
│  │                                                            │  │
│  │  // Credenciais do SERVIDOR (não do usuário)               │  │
│  │  const TUYA_CLIENT_ID = process.env.TUYA_CLIENT_ID;       │  │
│  │  const TUYA_SECRET = process.env.TUYA_SECRET;             │  │
│  │                                                            │  │
│  │  // Valida token do usuário                                │  │
│  │  // Faz request para Tuya Cloud API                        │  │
│  │  // Retorna dados para o frontend                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (server-to-server, sem CORS)
                              ▼
                    ┌─────────────────┐
                    │   Tuya Cloud    │
                    └─────────────────┘
```

**Fluxo:**

1. Usuário acessa página de setup
2. Faz login/OAuth com Tuya (você implementa)
3. Recebe token único do SEU sistema
4. Usa URL com token no OBS: `https://tuya-overlay.app/?token=abc123`

**Prós:**

- ✅ Zero instalação
- ✅ Funciona em qualquer PC
- ✅ Atualizações automáticas

**Contras:**

- ❌ Requer servidor rodando (custos)
- ❌ Dependência de terceiros (Vercel, etc.)
- ❌ **Não funciona offline** (precisa internet sempre)
- ❌ Latência maior (seu servidor → Tuya → seu servidor → usuário)
- ❌ **Rate limits compartilhados** entre todos os usuários
- ❌ Você armazena dados de dispositivos dos usuários (LGPD/privacidade)

### Solução B: WebSocket para Comunicação Local (Complexo)

Teoricamente possível criar um "bridge" local:

```
OBS Browser → WebSocket → App Local Mínimo → Tuya Local API
```

Mas isso ainda requer um app local, anulando a vantagem.

---

## 5. Comparação Direta

| Aspecto                 | App Local           | Página Hospedada + Backend     |
| ----------------------- | ------------------- | ------------------------------ |
| **Instalação usuário**  | Baixar 1 executável | Nada (só URL)                  |
| **Funciona offline**    | ✅ Sim (Local API)  | ❌ Não                         |
| **Latência**            | <100ms (local)      | 500ms+ (cloud)                 |
| **Rate limits**         | Sem limite (local)  | Compartilhado                  |
| **Custos operacionais** | Zero                | Servidor + Tuya quotas         |
| **Privacidade**         | Dados ficam no PC   | Dados passam pelo seu servidor |
| **Manutenção**          | Release por update  | Deploy contínuo                |
| **Dependência externa** | Nenhuma             | Vercel/Cloud + Tuya Cloud      |

---

## 6. Análise de Viabilidade

### Página Hospedada Client-Side Puro

❌ **Inviável** - CORS + Segurança

### Página Hospedada + Backend Serverless

✅ **Viável tecnicamente**, mas com trade-offs:

- Você passa a ser um "serviço" com responsabilidades
- Custos operacionais contínuos
- Dependência de múltiplos terceiros
- Não funciona se sua infra cair
- Questões de privacidade (dados passam por você)

### App Local

✅ **Viável e mais simples**:

- Zero custos operacionais
- Funciona offline
- Dados nunca saem do PC do usuário
- Independente de terceiros

---

## 7. Recomendação

### Se o objetivo é MAXIMIZAR facilidade para o usuário:

**Página Hospedada + Backend Serverless** pode ser interessante se:

- Você está disposto a manter infraestrutura
- Aceita os custos (Vercel free tier pode ser suficiente inicialmente)
- Aceita a responsabilidade sobre dados dos usuários

### Se o objetivo é MINIMIZAR complexidade e custos:

**App Local** é mais adequado:

- Uma vez distribuído, funciona sem você
- Zero custos operacionais
- Usuário tem controle total

### Opção Híbrida (Melhor dos dois mundos):

```
1. MVP: App Local (mais rápido de desenvolver, sem custos)
2. Futuro: Adicionar opção de página hospedada para quem preferir
```

---

## 8. Perguntas para Decisão

1. **Você quer manter um serviço web?**
   - Se sim → Página hospedada viável
   - Se não → App local

2. **Público-alvo sabe instalar um .exe?**
   - Se são streamers técnicos → App local OK
   - Se são totalmente leigos → Página hospedada melhor

3. **Funcionar offline é importante?**
   - Se sim → App local (Local API)
   - Se não → Página hospedada OK

4. **Você quer responsabilidade sobre dados de terceiros?**
   - Se não → App local
   - Se aceita → Página hospedada OK
