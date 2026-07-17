# ============================================================
# Stage 1 — deps
# Install ALL dependencies (including devDeps) so we can build
# and generate the Prisma client.
# ============================================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copy manifests first — layer-cache npm install until they change.
COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts

# ============================================================
# Stage 2 — builder
# Compile TypeScript and generate the Prisma client.
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Bring in all node_modules (includes devDeps for tsc / prisma CLI).
COPY --from=deps /app/node_modules ./node_modules

# Copy source tree.
COPY . .

# Generate Prisma client into src/generated/prisma (as configured in schema).
# DATABASE_URL is not needed at generate time; pass a placeholder so the
# config validator does not reject the build environment.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    REDIS_URL="redis://localhost:6379" \
    RABBITMQ_URL="amqp://localhost:5672" \
    JWT_ACCESS_SECRET="build-placeholder-secret-min-32-chars" \
    JWT_REFRESH_SECRET="build-placeholder-secret-min-32-chars" \
    npx prisma generate --schema=prisma/schema.prisma

# Compile TypeScript → dist/
RUN npm run build

# ============================================================
# Stage 3 — production
# Slim final image: only production deps + compiled output.
# ============================================================
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled application from builder.
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client (runtime artefacts — not regenerated here).
COPY --from=builder /app/src/generated ./src/generated

# Copy Prisma schema (needed by migrate deploy at container start if used).
COPY --from=builder /app/prisma ./prisma

# Drop root: run as the built-in non-root "node" user.
USER node

# Auth service listens on 3001 by default (see config/env.ts).
EXPOSE 3001

CMD ["node", "dist/server.js"]
