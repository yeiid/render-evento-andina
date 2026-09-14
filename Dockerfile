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
ENV NODE_ENV=production
ENV PORT=3010

EXPOSE 3010

CMD ["node", "backend/server.js"]
