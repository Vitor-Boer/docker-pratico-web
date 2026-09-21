# docker-pratico-web

Site do workshop **Docker na Prática**. É a primeira peça do desafio: você vai containerizá-lo, depois a API e o banco, e no fim juntar tudo com Docker Compose.

O site funciona sozinho. Sem API, ele mostra só a casca; conforme você sobe a API e o banco, mais partes ficam habilitadas.

## Rodar localmente (sem Docker)

```bash
pnpm install
pnpm run dev
```

Abre em http://localhost:3000.

## Configuração

Copie `.env.example` para `.env`. Todas as variáveis são opcionais para o site iniciar.

`NEXT_PUBLIC_API_URL` é embutida no build. Se mudar, é preciso rebuildar a imagem.

## Desafio

O `Dockerfile` e o `docker-compose.yml` têm lacunas marcadas com `TODO(workshop)`. Complete-as seguindo as etapas do workshop.

Os repositórios do desafio são independentes: clone cada um onde preferir. No `docker-compose.yml`, o serviço `api` só precisa apontar para o caminho (ou a URL git) do repositório da API.
