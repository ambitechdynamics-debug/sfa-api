# ─── Multi-stage build for the STUDIO FLYER AI Express backend ─────────────
# Designed for long-running PaaS hosts (Render, Fly.io, Railway).

# Stage 1 — install deps + build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifest first for better Docker layer caching
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install ALL deps (devDeps included, needed for tsc + prisma generate)
RUN npm ci

# Generate Prisma client (needs DATABASE_URL at runtime, not build time)
RUN npx prisma generate

# Copy the rest of the source and build
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Prune dev dependencies for the runtime image
RUN npm prune --omit=dev

# Stage 2 — minimal runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what we need to run
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Run as non-root for safety
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 5000

# Apply pending Prisma migrations before serving the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
