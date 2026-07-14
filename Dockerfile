# Multi-stage build for the Astro SSR site (node-standalone server).
# Deployed by Coolify, which rebuilds this image on every push to main
# (GitHub webhook -> Coolify auto-deploy).
# The build runs the OG prebuild render, which needs a chromium binary and its
# system libs, so the builder is a full bookworm-slim base with Playwright's
# --with-deps. The runtime never launches chromium, so it ships without one.

# --- Builder ---------------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
# Provision chromium plus its system libraries for the OG prebuild render.
RUN npx playwright install --with-deps chromium

COPY . .
# npm runs the prebuild OG render, then astro build -> dist/server/entry.mjs
RUN npm run build

# --- Runtime ---------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
# The runtime server never launches chromium; skip the browser download.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
