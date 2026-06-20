# Stage 1: Install dependencies
FROM node:alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --legacy-peer-deps

# Stage 2: Build the application
FROM node:alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Transpile the TypeScript seed script to JavaScript for production execution
RUN npx tsc prisma/seed.ts --esModuleInterop --module commonjs --outDir prisma --ignoreConfig

# Build the Next.js application in standalone mode
RUN npm run build

# Stage 3: Runtime runner
FROM node:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/dev.db"
ENV IMAGE_STORAGE_PATH="/app/data/donations"

# Set up runtime user and directories for security/permissions
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data && \
    chown -R nextjs:nodejs /app/data

# Copy Next.js standalone server and static assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema, migrations, seed CSV, and compiled seed script
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy Prisma CLI, engines, and CSV parsing modules to run migrations and seeding inside the container
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/csv-parse ./node_modules/csv-parse

USER nextjs

EXPOSE 3000

# Run migrations and seeding on container boot, then start the server
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma && node prisma/seed.js && node server.js"]
