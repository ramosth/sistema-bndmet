# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — bndmet-backend
# Node.js 20 LTS | TypeScript | Prisma | Express
# Build multi-stage: build → produção (imagem final menor)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Instalar OpenSSL 1.1 — necessário para o Prisma engine no Alpine (musl)
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copiar manifests e instalar todas as dependências (incluindo devDependencies)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar schema Prisma e gerar client antes do build TypeScript
COPY prisma ./prisma
RUN npx prisma generate

# Copiar código fonte e compilar
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: produção ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Timezone UTC (alinhado com o docker-compose e o PostgreSQL)
ENV TZ=UTC
ENV NODE_ENV=production

WORKDIR /app

# Instalar OpenSSL 1.1 — necessário para o Prisma engine no Alpine (musl)
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Copiar manifests e instalar apenas dependências de produção
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar schema Prisma e gerar client na imagem de produção
COPY prisma ./prisma
RUN npx prisma generate

# Copiar build compilado do stage anterior
COPY --from=builder /app/dist ./dist

# Expor porta definida no .env (PORT=3001)
EXPOSE 3001

# Aguardar o PostgreSQL estar saudável antes de subir
# (healthcheck garantido pelo depends_on no docker-compose)
CMD ["node", "dist/server.js"]