FROM node:22-slim AS builder

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build frontend production bundle
RUN npm run build

# Serve stage using lightweight web server
FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
