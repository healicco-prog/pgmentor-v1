# ──────────────────────────────────────────────────────────
# MediMentr Backend — Cloud Run Dockerfile
# ──────────────────────────────────────────────────────────
FROM node:20-slim AS base

WORKDIR /app

# Copy package files and install ALL deps (we need tsx to run server.ts)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm install tsx

# Copy only backend-related files
COPY server.ts ./
COPY tsconfig.json ./

# Cloud Run sets PORT automatically; default to 8080
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Start the Express server directly (no Vite in production)
CMD ["npx", "tsx", "server.ts"]
