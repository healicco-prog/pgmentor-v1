# ──────────────────────────────────────────────────────────
# PGMentor Backend — Cloud Run Dockerfile
# ──────────────────────────────────────────────────────────
FROM node:20-slim AS base

WORKDIR /app

# Copy package files and install ONLY the deps needed by server.ts
COPY package.json package-lock.json* ./
RUN npm install --production \
    express \
    dotenv \
    @supabase/supabase-js \
    @google/genai \
    resend \
    tsx \
    typescript

# Copy only backend-related files — NO src/, NO .env, NO secrets
COPY server.ts ./
COPY tsconfig.json ./

# Cloud Run sets PORT automatically → default 8080
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Run server.ts with tsx (TypeScript executor)
CMD ["npx", "tsx", "server.ts"]
