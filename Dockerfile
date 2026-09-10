# Single-service production deployment:
# React storefront is built first, then Express serves both the API and the storefront.
FROM node:20-bookworm-slim AS web-build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --omit=dev

COPY backend/ ./
COPY --from=web-build /app/web/dist /app/web/dist

RUN mkdir -p /app/backend/data /app/backend/uploads
EXPOSE 5000
CMD ["node", "src/server.js"]
