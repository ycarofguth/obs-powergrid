# Politica de Seguranca

## Versoes Suportadas

| Versao | Suporte |
| ------ | ------- |
| 0.1.x  | Sim     |

## Reportando Vulnerabilidades

Se voce encontrou uma vulnerabilidade de seguranca, **NAO abra uma Issue publica.**

Use o [GitHub Security Advisory](https://github.com/ycarofguth/obs-powergrid/security/advisories/new) para reportar de forma privada.

Responderemos dentro de 72 horas.

## Arquitetura de Seguranca

O OBS PowerGrid foi projetado com seguranca em mente:

- **Banco de dados:** SQLCipher (AES-256-CBC) — todo o arquivo .db e criptografado
- **Campos sensiveis:** AES-256-GCM como segunda camada (Local Key, Access ID, Access Secret)
- **Derivacao de chaves:** Argon2id (64MB, 3 iteracoes) + HKDF para chaves separadas
- **Zero telemetria:** nenhum dado enviado para servidores externos
- **Sidecar HTTP:** restrito a localhost (127.0.0.1:47531)
- **CORS:** configurado para aceitar apenas origens locais
- **Comunicacao local:** TCP/AES criptografado (protocolo Tuya)

Leia a [Politica de Privacidade](docs/privacy-policy.md) para mais detalhes.
