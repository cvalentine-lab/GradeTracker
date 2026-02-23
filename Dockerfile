# Single stage - minimal layers for Railway
FROM node:20-slim

WORKDIR /app

# Backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

COPY backend/ ./

# Frontend build
RUN mkdir -p frontend
COPY frontend/package.json frontend/package-lock.json* ./frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/ ./
RUN npm run build

# Final layout
WORKDIR /app
RUN cp -r frontend/dist public

ENV NODE_ENV=production
ENV CLIENT_PATH=public

EXPOSE 3000
CMD ["node", "server.js"]
