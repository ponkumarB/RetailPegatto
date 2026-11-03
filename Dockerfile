# Build Stage
FROM node:20.17.0-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build

# Production Stage
FROM node:20.17.0-alpine

WORKDIR /app

# Copy public assets and static/standalone build files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3011

ENV PORT=3011
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]