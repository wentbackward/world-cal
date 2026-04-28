# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage — Caddy serves static files
FROM caddy:latest
COPY --from=builder /app/dist /srv
RUN echo ':80 {\n    root * /srv\n    file_server\n    encode gzip\n}' > /etc/caddy/Caddyfile
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
