FROM node:22-slim

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install dependencies across workspaces
RUN npm install

# Copy source directories
COPY shared/ ./shared/
COPY server/ ./server/

# Build production bundle for server
RUN npm --workspace=@rechersion/server run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["npm", "--workspace=@rechersion/server", "run", "start"]
