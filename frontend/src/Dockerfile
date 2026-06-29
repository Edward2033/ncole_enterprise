# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Stage 2: Production (nginx) ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

RUN addgroup --system --gid 1001 ncole && \
    adduser --system --uid 1001 --ingroup ncole ncole

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R ncole:ncole /usr/share/nginx/html && \
    chown -R ncole:ncole /var/cache/nginx && \
    chown -R ncole:ncole /var/log/nginx && \
    touch /var/run/nginx.pid && chown ncole:ncole /var/run/nginx.pid

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
