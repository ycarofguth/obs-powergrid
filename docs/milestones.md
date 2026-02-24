# Milestones

**Projeto:** OBS PowerGrid
**Versão:** 0.1.0 (MVP)
**Última atualização:** 2026-02-20

---

Desenvolvimento organizado em milestones incrementais. Cada milestone entrega funcionalidade testável e tem dependências claras.

**Status geral:** M1 a M6 implementados. M7 (Release) pendente.

---

## M1 — Fundação [COMPLETO]

**Foco:** Banco de dados, segurança, multi-device básico

**Requisitos:**

| Requisito | Descrição                                    | Status       |
| --------- | -------------------------------------------- | ------------ |
| FR-101    | Cadastrar tomada                             | Implementado |
| FR-102    | Listar tomadas                               | Implementado |
| FR-103    | Editar tomada                                | Implementado |
| FR-104    | Remover tomada                               | Implementado |
| FR-105    | Habilitar/desabilitar tomada                 | Implementado |
| FR-306    | Armazenamento de histórico (schema do banco) | Implementado |
| FR-501    | Senha do aplicativo                          | Implementado |
| FR-502    | Banco de dados criptografado (SQLCipher)     | Implementado |
| FR-503    | Criptografia de campos sensíveis             | Implementado |
| FR-504    | Zero telemetria                              | Implementado |
| FR-109    | Reset total (senha esquecida)                | Implementado |
| NFR-201   | Criptografia at-rest                         | Implementado |
| NFR-202   | Segurança da senha                           | Implementado |
| NFR-601   | Qualidade de código                          | Implementado |
| NFR-603   | Estrutura de monorepo                        | Implementado |

**Entregável:** App abre com tela de login, CRUD de tomadas em SQLite criptografado. 9 tabelas no banco.

---

## M2 — Cloud Integration [COMPLETO]

**Foco:** Integração com Tuya Cloud API

**Requisitos:**

| Requisito | Descrição                              | Status       |
| --------- | -------------------------------------- | ------------ |
| FR-401    | Configurar credenciais Tuya Cloud      | Implementado |
| FR-402    | Buscar dispositivos automaticamente    | Implementado |
| FR-403    | Buscar Local Key automaticamente       | Implementado |
| FR-404    | Detectar versão de protocolo via Cloud | Implementado |

**Entregável:** Credenciais salvas com AES-256-GCM. Import em massa de devices da Cloud. Refresh de Local Key/protocolo.

---

## M3 — Conexão com Dispositivos [COMPLETO]

**Foco:** Comunicação em tempo real com tomadas Tuya

**Requisitos:**

| Requisito | Descrição                                   | Status                                            |
| --------- | ------------------------------------------- | ------------------------------------------------- |
| FR-405    | Toggle modo de comunicação (Local vs Cloud) | Implementado                                      |
| FR-108    | Retry automático de conexão                 | Implementado (exponential backoff, 10 tentativas) |
| NFR-101   | Latência de leitura local                   | Implementado (<100ms via TCP)                     |
| NFR-102   | Consumo de recursos                         | Implementado                                      |
| NFR-104   | Tempo de inicialização                      | Implementado                                      |
| NFR-203   | Comunicação de rede                         | Implementado                                      |
| NFR-204   | Segurança do sidecar HTTP                   | Implementado (CORS restrito)                      |
| NFR-502   | Feedback do sistema                         | Implementado (status badges, loading states)      |

**Entregável:** Conexão local (TuyAPI TCP/AES) e cloud (polling 2s). Auto-connect no login. Leituras salvas no banco.

---

## M4 — Overlay Customizável [COMPLETO]

**Foco:** Personalização visual do overlay para OBS

**Requisitos:**

| Requisito | Descrição                            | Status                                         |
| --------- | ------------------------------------ | ---------------------------------------------- |
| FR-106    | URL individual por tomada            | Implementado                                   |
| FR-107    | URL unificada (todas as tomadas)     | Implementado                                   |
| FR-201    | Personalizar tamanho da fonte        | Implementado                                   |
| FR-202    | Personalizar cor da fonte            | Implementado                                   |
| FR-203    | Personalizar borda e sombra da fonte | Implementado                                   |
| FR-204    | Layout horizontal e vertical         | Implementado                                   |
| FR-205    | Background do overlay                | Implementado (cor + opacidade)                 |
| FR-206    | Escolher dados exibidos no overlay   | Implementado (power, voltage, current toggles) |
| FR-207    | Presets de overlay                   | Implementado (CRUD completo)                   |
| FR-208    | Overlay combinado com estilo próprio | Implementado                                   |

**Entregável:** Editor visual com preview, presets, overlays individuais + combinado + timer + counter.

---

## M5 — Dashboard e Histórico [COMPLETO]

**Foco:** Visualização de dados, histórico e custos

**Requisitos:**

| Requisito | Descrição                         | Status                                      |
| --------- | --------------------------------- | ------------------------------------------- |
| FR-301    | Dashboard unificado               | Implementado                                |
| FR-302    | Dashboard detalhado por tomada    | Implementado                                |
| FR-303    | Mini-dashboard por source         | Implementado                                |
| FR-304    | Preço do kWh                      | Implementado                                |
| FR-305    | Seleção de período para histórico | Implementado (1h, 6h, 24h, 7d, 30d, custom) |
| FR-703    | Logs de atividade                 | Implementado (5 tipos, filtros, CSV export) |

**Entregável:** Dashboard com gráficos (potência, custo), comparação multi-device, rankings, cálculo de custo.

---

## M6 — UX e Onboarding [COMPLETO]

**Foco:** Experiência do usuário, onboarding, navegação

**Requisitos:**

| Requisito | Descrição                            | Status                                                 |
| --------- | ------------------------------------ | ------------------------------------------------------ |
| FR-601    | Wizard de primeiro uso               | Implementado (5 etapas)                                |
| FR-602    | Guia para criar conta Tuya Developer | Implementado (TuyaSetupGuide accordion)                |
| FR-603    | Guia de primeiro dispositivo         | Implementado (passo a passo no wizard)                 |
| FR-701    | Changelog e informações de versão    | Implementado (AboutPage)                               |
| FR-702    | Verificação de atualização           | Implementado (GitHub API, cache 24h)                   |
| FR-704    | Menu centralizado                    | Implementado (Sidebar com seções)                      |
| FR-705    | Configurações gerais                 | Implementado (SettingsPage)                            |
| NFR-501   | Onboarding guiado                    | Implementado                                           |
| NFR-503   | Acessibilidade básica                | Implementado (focus states, reduced motion, contraste) |

**Entregável:** Wizard de setup, help page, sidebar com navegação por seções, system tray, menu nativo.

**Extras implementados (além dos requisitos):**

- Timer e counter para streams (com overlays)
- System tray com show/hide e quit
- Menu nativo Edit (undo, redo, cut, copy, paste, select all)
- Página de segurança (trocar senha, reset, logout)

---

## M7 — Release e Distribuição [PENDENTE]

**Foco:** Build multi-plataforma, CI/CD, documentação final

**Requisitos:**

| Requisito | Descrição                               | Status                                |
| --------- | --------------------------------------- | ------------------------------------- |
| FR-801    | Build multi-plataforma                  | Pendente                              |
| FR-802    | GitHub Releases                         | Pendente                              |
| FR-803    | Build manual pelo usuário               | Parcial (script `pnpm dist` existe)   |
| FR-804    | CI/CD pipeline                          | Pendente                              |
| FR-805    | Política de privacidade e termos de uso | Implementado (docs/privacy-policy.md) |
| NFR-103   | Tamanho do binário                      | A verificar                           |
| NFR-301   | Zero coleta de dados                    | Implementado                          |
| NFR-302   | Política de privacidade clara           | Implementado                          |
| NFR-401   | Suporte multi-plataforma                | Pendente (builds automatizados)       |
| NFR-402   | Independência de instalação             | Pendente                              |
| NFR-602   | Documentação técnica                    | Em progresso                          |

**Entregável:** Release v1.0 publicada no GitHub com binários para Win/Linux/Mac, CI/CD pipeline.

---

## Diagrama de Dependências

```
M1 (Fundação) ✅
 ├── M2 (Cloud) ✅
 │    └── M3 (Conexão) ✅ ← depende de M1 + M2
 │         ├── M4 (Overlay) ✅ ← depende de M3
 │         └── M5 (Dashboard) ✅ ← depende de M3
 │              └── M6 (UX) ✅ ← depende de M1–M5
 │                   └── M7 (Release) ⏳ ← depende de M1–M6
```

**Caminho crítico:** M1 → M2 → M3 → M4/M5 (paralelo) → M6 → M7
