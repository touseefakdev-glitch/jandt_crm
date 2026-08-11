# Production Dockerfile for JT Supplies WhatsApp Connector Worker
FROM node:22-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy worker application code
COPY . .

# Set node environment
ENV NODE_ENV=production

# Run persistent worker
CMD ["node", "index.js"]
