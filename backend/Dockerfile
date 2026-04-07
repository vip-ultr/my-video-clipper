# Use official Node.js image with FFmpeg support
FROM node:20-alpine

# Install FFmpeg and other required tools
RUN apk add --no-cache \
    ffmpeg \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create required directories
RUN mkdir -p /tmp/clips /tmp/watermarks

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"]
