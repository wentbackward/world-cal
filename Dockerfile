# Build stage
ARG RELEASE_DATE=
FROM node:20-alpine AS builder
ENV RELEASE_DATE=$RELEASE_DATE
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage — Caddy serves static files
FROM caddy:latest
COPY --from=builder /app/dist /srv
COPY <<'EOF' /etc/caddy/Caddyfile
:80 {
    root * /srv
    file_server
    encode gzip
}
EOF
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
