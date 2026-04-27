# ─────────────────────────────────────────────────────────
# Multi-stage Dockerfile for world-cal
# ─────────────────────────────────────────────────────────
#
# Stage 1: Build the React app
# Stage 2: Serve with Caddy (auto-HTTPS)
# ─────────────────────────────────────────────────────────

# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM caddy:latest

# Copy built assets
COPY --from=builder /app/dist /srv

# Caddy config for internal serving (no domain - handled by reverse proxy)
RUN echo ':80 {\n    root * /srv\n    file_server\n    encode gzip\n}' > /etc/caddy/Caddyfile

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
