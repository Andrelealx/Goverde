FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/portal/ ./apps/portal/
RUN npm ci --workspace=apps/portal
RUN npm run build --workspace=apps/portal

FROM nginx:alpine
COPY --from=builder /app/apps/portal/dist /usr/share/nginx/html
COPY apps/portal/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
