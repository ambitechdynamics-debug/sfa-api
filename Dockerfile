# Multi-stage build for the STUDIO FLYER AI Express backend.
# This root-level file supports hosts that build from the repository root.

FROM node:20-alpine AS builder
WORKDIR /app

# Prisma uses libssl to load its query engine; install OpenSSL explicitly so
# `prisma generate` picks the correct binary target (Alpine 3.18+ ships
# OpenSSL 3, but the detection logic looks for libssl.so.* in known paths).
RUN apk add --no-cache openssl

# Copy the backend manifest first for better Docker layer caching.
COPY apps/SFA-API/package.json apps/SFA-API/package-lock.json ./
COPY apps/SFA-API/prisma ./prisma

# Install all deps because TypeScript and Prisma are needed during build.
RUN npm ci
RUN npx prisma generate

COPY apps/SFA-API/tsconfig.json ./
COPY apps/SFA-API/src ./src
RUN npx tsc

# Keep only production dependencies for the runtime image.
RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Same OpenSSL on the runtime so the engine binary baked at build time loads
# without falling back to "openssl-1.1.x" and trying to redownload.
RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
