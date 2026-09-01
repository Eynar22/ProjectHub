# Multi-stage production Dockerfile for Vite Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# .npmrc trae legacy-peer-deps=true; sin él, npm install falla con ERESOLVE
# por el conflicto @eslint/js@10 vs eslint@9 (dev-only, no afecta al build).
COPY package*.json .npmrc ./
RUN npm install

COPY . .
RUN npm run build

# Nginx web server stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
