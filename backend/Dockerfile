# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/
RUN npm ci
COPY src ./src
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production Runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl dumb-init && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 ncole

COPY --from=deps    --chown=ncole:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ncole:nodejs /app/dist        ./dist
COPY --from=builder --chown=ncole:nodejs /app/prisma      ./prisma
COPY --from=builder --chown=ncole:nodejs /app/package.json ./package.json

RUN mkdir -p logs && chown ncole:nodejs logs

USER ncole

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', r => { process.exit(r.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
