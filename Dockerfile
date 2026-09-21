# Dockerfile do site (Next.js). Complete as lacunas marcadas com TODO(workshop).

# ---- Estágio 1: build ----
# TODO(workshop): escolha a imagem base do Node (dica: uma tag alpine, ex. node:22-alpine)
FROM ??? AS build
WORKDIR /app

# O pnpm vem pelo corepack, na versão indicada no package.json.
RUN corepack enable

# Copiar só os manifestos primeiro aproveita o cache de camadas: se as dependências
# não mudaram, o install não roda de novo.
COPY package.json pnpm-lock.yaml .npmrc ./
# TODO(workshop): instale as dependências (dica: pnpm install --frozen-lockfile)

COPY . .
RUN pnpm run build

# ---- Estágio 2: runtime (imagem final enxuta) ----
# TODO(workshop): use a mesma imagem base do estágio de build
FROM ??? AS runtime
WORKDIR /app
ENV NODE_ENV=production

# O output "standalone" do Next já traz só o necessário para rodar.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# TODO(workshop): documente a porta em que o site escuta
CMD ["node", "server.js"]
