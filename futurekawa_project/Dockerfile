# ── Étape 1 : build Vite ─────────────────────────────────────
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ARG VITE_HQ_BASE_URL=http://localhost:8090
ENV VITE_HQ_BASE_URL=$VITE_HQ_BASE_URL

RUN npm run build

# ── Étape 2 : serveur Nginx léger ────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80