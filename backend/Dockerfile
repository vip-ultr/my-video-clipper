# Use Alpine-based Node.js image (minimal attack surface, fewer vulnerabilities)
FROM node:22-alpine

# Install FFmpeg and update system packages for security
RUN apk update && apk upgrade && apk add --no-cache \
    ffmpeg \
    curl \
    ca-certificates

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create required directories with proper permissions
RUN mkdir -p /tmp/clips /tmp/watermarks && chmod 755 /tmp/clips /tmp/watermarks

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S -u 1000 -G appgroup appuser && chown -R appuser:appgroup /app
USER appuser

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
