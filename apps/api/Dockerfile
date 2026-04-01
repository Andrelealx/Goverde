FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN npm ci --workspace=apps/api
RUN npm run build --workspace=apps/api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate
RUN mkdir -p uploads
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
