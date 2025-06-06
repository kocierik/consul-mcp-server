# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
# Stage 1: build
FROM node:lts-alpine AS build
WORKDIR /app

# Install dependencies without running scripts
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source files and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: runtime
FROM node:lts-alpine AS runtime
WORKDIR /app

# Copy built artifacts
COPY --from=build /app/build ./build

# Copy manifest for production install
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Default environment variables (override with config)
ENV CONSUL_HOST=localhost
ENV CONSUL_PORT=8500

# Start the MCP server
CMD ["node", "build/index.js"]
