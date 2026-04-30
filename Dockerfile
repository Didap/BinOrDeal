###
# Bin or Deal — production image with Playwright + chromium.
#
# Built for Fly.io (info.md §Architettura: "Hono su Fly.io"). Cannot run on
# Vercel serverless functions due to the 250MB function size limit — use this
# image on Fly.io, Railway, Render, or any container host with ≥1GB RAM.
#
# Why this image: Microsoft publishes an official Playwright base that ships
# Chromium + system deps pre-installed, which saves ~400MB vs. installing them
# manually on top of a vanilla Node image.
###

FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS deps

WORKDIR /app

# Some platforms (e.g. Coolify) inject NODE_ENV=production into the build,
# which silently drops dev deps from `npm ci`. Override locally and pass
# --include=dev so typescript is present — Next needs it to read tsconfig
# `paths`, otherwise every `@/*` alias import fails to resolve.
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Skip Playwright download during the build — the base image already has browsers.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# Next.js output standalone = minimal server bundle.
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# The Next standalone output lives at .next/standalone — run node server.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
