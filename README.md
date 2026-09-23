# docker-pratico-web

Site do workshop **Docker na Prática**. É a primeira peça do desafio: você vai containerizá-lo, depois a API e banco de dados.

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

## Comandos úteis (debug)

| Comando | Para quê |
|---|---|
| `docker ps` | containers rodando agora |
| `docker ps -a` | todos, inclusive os que pararam ou caíram (veja a coluna `STATUS`) |
| `docker logs site` | saída do site — primeiro lugar para olhar quando algo não sobe |
| `docker logs -f site` | acompanha os logs ao vivo (`Ctrl+C` sai) |
| `docker stop site` | para o container |
| `docker start site` | sobe de novo um container parado, com a mesma configuração |
| `docker rm site` | remove um container parado |
| `docker rm -f site` | para e remove de uma vez |
| `docker exec -it site sh` | abre um terminal dentro do container (`exit` sai) |
| `docker images` | imagens construídas/baixadas |
| `docker network ls` | redes existentes (a `workshop` deve aparecer) |
| `docker compose ps` / `docker compose logs -f` | o mesmo, para os serviços do Compose |
| `docker compose down` | para e remove os containers do Compose |

Erros comuns:

- **`Conflict. The container name "/site" is already in use`**: já existe um container com esse nome, mesmo parado. `docker rm -f site` e rode de novo.
- **`port is already allocated`**: outra coisa já usa a porta 3000 (um container antigo ou o `pnpm dev`). Ache com `docker ps` e remova, ou pare o processo local. Se o `pnpm dev` subir mesmo assim, ele muda sozinho para a próxima porta livre (3001, 3002...) — confira no terminal qual foi.
- **Mudou o código ou o `Dockerfile` e nada mudou**: o container usa a imagem antiga. Rode `docker build -t site .` de novo, `docker rm -f site` e suba outra vez.
- **Antes de subir com Compose**: remova os containers criados à mão (`docker rm -f site api db`), senão o Compose esbarra nas portas 3000 e 3001, que continuam ocupadas por eles.
