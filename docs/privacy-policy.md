# Política de Privacidade e Termos de Uso

**Aplicativo:** OBS PowerGrid
**Versão:** 0.1.0
**Última atualização:** 2026-02-02

---

## Resumo

Este aplicativo **não coleta, armazena ou transmite seus dados para servidores externos**. Tudo funciona localmente no seu computador. O código é aberto e verificável.

---

## 1. Dados Armazenados Localmente

O aplicativo armazena os seguintes dados **apenas no seu computador**, em um banco de dados criptografado:

| Dado                                               | Propósito                             | Proteção                        |
| -------------------------------------------------- | ------------------------------------- | ------------------------------- |
| Credenciais Tuya Cloud (Access ID, Access Secret)  | Buscar lista de dispositivos e chaves | Criptografado (AES-256-GCM)     |
| Credenciais de dispositivos (Device ID, Local Key) | Conectar aos seus dispositivos Tuya   | Criptografado (AES-256-GCM)     |
| Configurações de overlay                           | Personalização visual                 | Banco criptografado (SQLCipher) |
| Histórico de leituras                              | Gráficos e cálculo de custo           | Banco criptografado (SQLCipher) |
| Logs de atividade                                  | Troubleshooting                       | Banco criptografado (SQLCipher) |
| Preferências do app                                | Configurações gerais                  | Banco criptografado (SQLCipher) |

**Todos os dados são protegidos por uma senha que você define.** Sem a senha, os dados são inacessíveis. Se você esquecer a senha, os dados não podem ser recuperados.

---

## 2. Comunicações Externas

O aplicativo se comunica apenas com os seguintes serviços externos:

### 2.1 Tuya Cloud API

| Item                 | Detalhe                                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| **Quando:**          | Ao configurar credenciais e buscar dispositivos                             |
| **O que é enviado:** | Suas credenciais do projeto Tuya IoT Platform (Access ID, Access Secret)    |
| **Propósito:**       | Autenticar e obter lista de dispositivos, Local Keys e versões de protocolo |
| **Destino:**         | Servidores da Tuya (openapi.tuyaus.com ou regional)                         |
| **Controle:**        | Você configura essas credenciais voluntariamente no onboarding              |

### 2.2 Dispositivos Tuya (Rede Local)

| Item                 | Detalhe                                           |
| -------------------- | ------------------------------------------------- |
| **Quando:**          | Ao conectar a um dispositivo no modo Local        |
| **O que é enviado:** | Comandos criptografados (protocolo Tuya TCP/AES)  |
| **Propósito:**       | Ler dados de consumo em tempo real                |
| **Destino:**         | Seus dispositivos Tuya na sua rede local          |
| **Controle:**        | Você escolhe quais dispositivos conectar e quando |

### 2.3 GitHub API

| Item                 | Detalhe                                                            |
| -------------------- | ------------------------------------------------------------------ |
| **Quando:**          | Ao abrir o app (máximo 1x por dia) ou manualmente                  |
| **O que é enviado:** | Requisição GET pública (sem dados pessoais)                        |
| **Propósito:**       | Verificar se há atualizações disponíveis                           |
| **Destino:**         | api.github.com                                                     |
| **Controle:**        | Não envia nenhuma informação sua, apenas consulta versões públicas |

---

## 3. O Que NÃO Fazemos

- **Não coletamos telemetria.** Não sabemos quantas pessoas usam o app, de onde, ou como.
- **Não enviamos analytics.** Não há Google Analytics, Mixpanel, ou qualquer serviço similar.
- **Não fazemos crash reporting automático.** Se o app travar, você decide se quer reportar.
- **Não temos servidores próprios.** Não existe backend nosso recebendo seus dados.
- **Não armazenamos seus dados em nuvem.** Tudo fica no seu computador.
- **Não vendemos ou compartilhamos dados.** Não temos dados para vender.

---

## 4. Código Aberto

Este aplicativo é **código aberto** (open source). Você pode:

- Ler todo o código-fonte no GitHub
- Verificar exatamente o que o app faz
- Compilar você mesmo a partir do código-fonte
- Auditar a segurança

Repositório: [github.com/ycaroguth/obs-tuya-smart-plug](https://github.com/ycaroguth/obs-tuya-smart-plug)

---

## 5. Segurança

### 5.1 Criptografia

- **Banco de dados:** Criptografado com SQLCipher (AES-256)
- **Campos sensíveis:** Criptografia adicional com AES-256-GCM
- **Derivação de chave:** Argon2id (resistente a ataques de força bruta)
- **Senha:** Nunca armazenada, apenas usada para derivar chaves de criptografia

### 5.2 Senha Esquecida

Se você esquecer a senha do app, **não há como recuperar seus dados**. A senha é usada para derivar as chaves de criptografia. Sem ela, o banco de dados é inacessível.

A única opção é resetar o app, o que **apaga todos os dados permanentemente**.

### 5.3 Recomendações

- Use uma senha forte e única
- Guarde sua senha em um gerenciador de senhas
- Mantenha seu computador seguro (antivírus, atualizações)
- Não compartilhe suas credenciais Tuya com terceiros

---

## 6. Suas Responsabilidades

Ao usar este aplicativo, você é responsável por:

- **Suas credenciais Tuya:** Você obtém e gerencia suas próprias credenciais da Tuya IoT Platform
- **Segurança do seu computador:** Se seu computador for comprometido, os dados do app podem ser acessados
- **Uso das informações:** O que você faz com os dados de consumo é sua responsabilidade
- **Conformidade:** Garantir que o uso está de acordo com os termos de serviço da Tuya

---

## 7. Isenção de Responsabilidade

Este software é fornecido "como está" (as is), sem garantias de qualquer tipo, expressas ou implícitas.

Os desenvolvedores **não se responsabilizam** por:

- Danos decorrentes do uso ou incapacidade de usar o software
- Perda de dados devido a esquecimento de senha ou falhas
- Uso indevido das credenciais ou informações obtidas
- Problemas de compatibilidade com dispositivos Tuya específicos
- Alterações na API da Tuya que afetem o funcionamento

---

## 8. Alterações nesta Política

Esta política pode ser atualizada ocasionalmente. Mudanças significativas serão comunicadas nas release notes do GitHub.

A data de "Última atualização" no topo indica quando a política foi revisada.

---

## 9. Contato

Para dúvidas, sugestões ou reportar problemas:

- **Issues:** [github.com/ycaroguth/obs-tuya-smart-plug/issues](https://github.com/ycaroguth/obs-tuya-smart-plug/issues)

---

## 10. Aceite

Ao usar este aplicativo, você declara que:

- Leu e compreendeu esta política de privacidade e termos de uso
- Concorda com as práticas descritas
- É responsável por suas credenciais e pelo uso do software
- Entende que não há coleta de dados e que tudo funciona localmente
