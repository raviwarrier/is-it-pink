# Multi-stage Docker build for Is it Pink?
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build Vite frontend and bundled CommonJS server
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy package config and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose web port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
