# Guia de Configuração

Como obter as credenciais do seu dispositivo Tuya e configurar o overlay no OBS.

---

## Pré-requisitos

- Tomada inteligente Tuya configurada e funcionando no app Smart Life/Tuya Smart
- Dispositivo na mesma rede Wi-Fi que o computador
- Node.js 22+ instalado
- OBS Studio instalado

---

## 1. Obter Credenciais

Você precisa de três informações do seu dispositivo:

| Credencial | O que é                          | Onde encontrar          |
| ---------- | -------------------------------- | ----------------------- |
| Device ID  | Identificador único do aparelho  | Tuya IoT Platform       |
| Local Key  | Chave AES para comunicação local | Tuya IoT Platform / API |
| IP Address | IP do dispositivo na rede local  | App do roteador         |

### Opção A: Script automático

```bash
pnpm get-device-info
```

Será solicitado Client ID e Client Secret da [Tuya IoT Platform](https://iot.tuya.com). O script lista todos os dispositivos com suas credenciais.

### Opção B: TinyTuya Wizard

Siga as instruções do [TinyTuya](https://github.com/jasonacox/tinytuya) para obter as credenciais via Python.

---

## 2. Configurar no App

1. Abra o OBS PowerGrid
2. Preencha Device ID, Local Key e IP Address
3. Clique em "Salvar Configuração"
4. Clique em "Conectar"
5. Se os dados aparecerem, a configuração está correta

---

## 3. Adicionar no OBS

1. No OBS, adicione uma fonte **Browser Source**
2. URL: `http://localhost:47531/overlay`
3. Largura: 400 | Altura: 100 (ajuste conforme necessário)
4. Marque "Desabilitar CSS personalizado"
5. Posicione o overlay onde desejar na cena

---

## Solução de Problemas

- **Overlay não carrega:** Verifique se o app está rodando e o sidecar está ativo
- **Dados não aparecem:** Verifique se Local Key está correta e o dispositivo está online
- **Conexão falha:** Confirme que o IP está correto e o dispositivo está na mesma rede
