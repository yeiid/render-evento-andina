# Dockerfile - Multi-stage build for Render Evento Andina
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root dependency files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# Copy application source code
COPY . .

# Build Vite frontend production distribution
RUN pnpm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built frontend static assets and backend server source
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/imagen1.png* ./
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "backend/server.js"]
