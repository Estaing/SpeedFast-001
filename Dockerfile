# --- Stage 1: dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && cp -R node_modules /tmp/prod_node_modules
RUN npm ci

# --- Stage 2: build (prisma generate) ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY . .
RUN npx prisma generate

# --- Stage 3: production runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

# Run as non-root for defense in depth
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs vinfast

ENV NODE_ENV=production

COPY --from=deps /tmp/prod_node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY src ./src
COPY package.json ./

USER vinfast

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
