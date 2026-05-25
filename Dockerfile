# Multi-stage build for the STUDIO FLYER AI Express backend.
# This root-level file supports hosts that build from the repository root.

FROM node:20-alpine AS builder
WORKDIR /app

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

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
