# ──────────────────────────────────────────────────────────
# PGMentor Backend — Cloud Run Dockerfile
# ──────────────────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app
COPY package.json package-lock.json ./

# Install only what server.ts needs at runtime.
# Frontend/React packages (vite, react, lucide, etc.) are intentionally excluded.
# tsx + typescript are devDeps but required to run server.ts at runtime.
RUN npm install \
      express \
      dotenv \
      @supabase/supabase-js \
      resend \
    && npm install --no-save tsx typescript

# ── Final image ─────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Non-root user for least-privilege execution
RUN groupadd --system nodejs && \
    useradd --system --gid nodejs --no-create-home appuser && \
    chown appuser:nodejs /app

COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --chown=appuser:nodejs server.ts tsconfig.json ./

USER appuser

# Cloud Run injects PORT automatically; default 8080
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node_modules/.bin/tsx", "server.ts"]
