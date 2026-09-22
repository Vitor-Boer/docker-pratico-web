# docker-pratico-web

Site do workshop **Docker na Prática**. É a primeira peça do desafio: você vai containerizá-lo, depois a API e o banco, e no fim juntar tudo com Docker Compose.

O site funciona sozinho. Sem API, ele mostra só a casca; conforme você sobe a API e o banco, mais partes ficam habilitadas — e, no painel do workshop, mais bloquinhos do seu cartão acendem.

## Rodar localmente (sem Docker)

```bash
pnpm install
pnpm run dev
```

Abre em http://localhost:3000.

## O painel

O site manda um ping ao hub do workshop a cada 5 segundos dizendo quais das suas três peças estão no ar. Seu cartão aparece no quadro assim que você abre o site, com os bloquinhos **Site**, **API** e **Banco** — apagados até cada peça subir.

Você é identificado por um id guardado no seu navegador, criado na primeira visita. Não há login nem token: pode reconstruir seus containers à vontade que o cartão continua sendo o seu. Se você parar de pingar (fechar a aba, por exemplo), o cartão some do painel em 30 segundos.

## Configuração

Copie `.env.example` para `.env`. Todas as variáveis são opcionais para o site iniciar.

`NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_HUB_URL` são embutidas no build. Se mudar, é preciso rebuildar a imagem.

## Desafio

O `Dockerfile` e o `docker-compose.yml` têm lacunas marcadas com `TODO(workshop)`. Complete-as seguindo as etapas do workshop.

Os repositórios do desafio são independentes: clone cada um onde preferir. No `docker-compose.yml`, o serviço `api` só precisa apontar para o caminho (ou a URL git) do repositório da API.

## Docker

Depois de completar o `Dockerfile`:

```bash
docker network create workshop
docker build -t site .
docker run -d --name site -p 3000:3000 site
```

Abre em http://localhost:3000. A rede `workshop` só precisa ser criada uma vez — é o que deixa `site`, `api` e `db` se acharem pelo nome nos próximos passos (`docker-pratico-user-api`). Se já existir, pule esse comando (ele dá erro em rede duplicada, sem problema).
