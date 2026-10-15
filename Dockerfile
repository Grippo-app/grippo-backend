FROM node:20-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build \
    && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:20-bookworm-slim AS runtime

ARG APP_PORT=3010
ARG RELEASE_SHA=unversioned
LABEL org.opencontainers.image.revision=${RELEASE_SHA}
ENV NODE_ENV=production \
    BACKEND_PORT=${APP_PORT} \
    PORT=${APP_PORT} \
    POSTGRES_SYNC=false \
    POSTGRES_MIGRATIONS=false

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER node

EXPOSE ${APP_PORT}

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=6 \
    CMD ["node", "-e", "const http=require('node:http'); const port=Number(process.env.BACKEND_PORT); if(!Number.isInteger(port)||port<1||port>65535)process.exit(1); const req=http.get({host:'127.0.0.1',port,path:'/health',timeout:4000},res=>{res.resume();process.exit(res.statusCode===200?0:1)}); req.on('timeout',()=>req.destroy(new Error('timeout'))); req.on('error',()=>process.exit(1));"]

CMD ["node", "dist/main"]
