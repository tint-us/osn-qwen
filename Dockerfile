# ============================================================
# SoaLatihan — Production Dockerfile
# Multi-stage build: deps → builder → runner
# ============================================================

# ------------------------------------------------------------
# Stage 1: deps — install all dependencies
# ------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# ------------------------------------------------------------
# Stage 2: builder — build the Next.js application
# ------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# ------------------------------------------------------------
# Stage 3: runner — minimal production image
# ------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

RUN npm install -g prisma tsx && \
    chown -R nextjs:nodejs /app

RUN mkdir -p /app/public/uploads/questions && \
    chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "prisma migrate deploy 2>/dev/null || prisma db push; exec node server.js"]
