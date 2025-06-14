# ─────────────────────────────
# 🏗 Stage 1: Build
# ─────────────────────────────
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────
# 🚀 Stage 2: Production
# ─────────────────────────────
FROM node:20-slim

ARG PORT=3010
ENV NODE_ENV=production
ENV PORT=${PORT}

WORKDIR /app

RUN adduser --system --group appuser

COPY --from=builder --chown=appuser:appuser /app/dist ./dist
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/package.json ./

USER appuser

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
CMD curl --fail http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/main"]
