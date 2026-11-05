# flashwise-fe — production image (Next.js 15 standalone)
# Stage 1: deps
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* is baked at build time for browser calls.
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
ARG GATEWAY_INTERNAL_URL=http://api-gateway:8080/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID} \
    GATEWAY_INTERNAL_URL=${GATEWAY_INTERNAL_URL} \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Stage 3: runner (standalone output)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 10001 -S appgroup && adduser -u 10001 -S appuser -G appgroup
# standalone server + static assets (public/ holds logos, favicon)
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public
USER appuser
EXPOSE 3000
CMD ["node", "server.js"]
