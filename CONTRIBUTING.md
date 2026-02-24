# Guia de Contribuicao

Obrigado pelo interesse em contribuir com o OBS PowerGrid! Este guia explica como participar do projeto.

---

## Pre-requisitos

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+
- [Git](https://git-scm.com/)

---

## Setup do Ambiente

```bash
# 1. Fork o repositorio no GitHub

# 2. Clone seu fork
git clone https://github.com/SEU_USUARIO/obs-tuya-smart-plug.git
cd obs-tuya-smart-plug

# 3. Instale dependencias
pnpm install

# 4. Verifique que tudo funciona
pnpm build
pnpm test

# 5. Inicie o desenvolvimento
pnpm dev
```

---

## Estrutura do Projeto

```
apps/desktop/    # Frontend React (Neutralino) — @obs-tuya/desktop
apps/sidecar/    # Backend Node.js (Express) — @obs-tuya/sidecar
packages/shared/ # Tipos e constantes — @obs-tuya/shared
scripts/         # Scripts de dev e build
docs/            # Documentacao
```

---

## Comandos Uteis

| Comando | Descricao |
|---------|-----------|
| `pnpm dev` | Frontend + sidecar em paralelo |
| `pnpm dev:neu` | Modo desktop com Neutralino |
| `pnpm build` | Build completo |
| `pnpm test` | Executar testes |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm format` | Formatar codigo (Prettier) |
| `pnpm format:check` | Verificar formatacao |
| `pnpm lint` | Verificar lint (ESLint) |

---

## Convencoes de Codigo

- **TypeScript** com strict mode
- **Prettier** para formatacao (semi: false, singleQuote: true, printWidth: 100)
- **ESLint** para linting
- Componentes React funcionais com hooks
- Codigo-fonte em ingles, documentacao em portugues
- Tipos compartilhados em `@obs-tuya/shared`
- Cores de UI: sempre usar tokens semanticos (ex: `text-success`, nunca `text-emerald-400`)
- Icones: Phosphor Icons (`@phosphor-icons/react`)

---

## Workflow de Contribuicao

1. **Fork** o repositorio
2. Crie uma **branch** a partir de `main`:
   ```bash
   git checkout -b minha-feature
   ```
3. Faca suas alteracoes
4. Garanta que testes e formatacao passam:
   ```bash
   pnpm format
   pnpm lint
   pnpm test
   ```
5. **Commit** suas alteracoes com mensagem descritiva
6. **Push** para seu fork:
   ```bash
   git push origin minha-feature
   ```
7. Abra um **Pull Request** para `main`

---

## Reportando Bugs

Use o [template de bug report](https://github.com/ycaroguth/obs-tuya-smart-plug/issues/new?template=bug_report.yml) para reportar problemas.

## Sugerindo Funcionalidades

Use o [template de feature request](https://github.com/ycaroguth/obs-tuya-smart-plug/issues/new?template=feature_request.yml) para sugerir melhorias.

---

## Licenca

Ao contribuir, voce concorda que suas contribuicoes serao licenciadas sob a [GPL v3](LICENSE).
