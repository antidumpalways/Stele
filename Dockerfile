# STELE — Production Dockerfile
# Build: docker build -t stele .
#       (untuk production, set VITE_* via --build-arg atau pastikan .env.production ada)
# Run:   docker run -p 3001:3001 -e WORLD_ID_APP_ID=... -e STORACHA_KEY=... stele
#       atau: docker run -p 3001:3001 --env-file server/.env stele

FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# Build frontend — VITE_* dari .env.production atau ARG
ARG VITE_WORLD_ID_APP_ID
ARG VITE_WORLD_ID_RP_ID
ARG VITE_WORLD_ID_ACTION
ARG VITE_WORLD_ID_ENV=production
ARG VITE_API_URL=/api
ENV VITE_WORLD_ID_APP_ID=$VITE_WORLD_ID_APP_ID
ENV VITE_WORLD_ID_RP_ID=$VITE_WORLD_ID_RP_ID
ENV VITE_WORLD_ID_ACTION=$VITE_WORLD_ID_ACTION
ENV VITE_WORLD_ID_ENV=$VITE_WORLD_ID_ENV
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Copy server + deps
COPY --from=server /app/server/dist ./server/dist
COPY --from=server /app/server/node_modules ./server/node_modules
COPY --from=server /app/server/package.json ./server/
# Copy frontend dist (server serves from ../../dist)
COPY --from=frontend /app/dist ./dist
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
CMD ["node", "server/dist/index.js"]
