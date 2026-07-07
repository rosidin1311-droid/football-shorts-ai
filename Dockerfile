# Production Dockerfile for Football Shorts AI
FROM node:20-bullseye-slim

# Install ffmpeg and other essential dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy application source
COPY . .

# Build the client-side SPA and bundle the server using esbuild
RUN npm run build

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Expose the single ingress port
EXPOSE 3000

# Start the bundled Express server
CMD ["npm", "start"]
