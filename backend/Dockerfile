# Use secure Debian-based Node.js image
FROM node:20-bookworm-slim

# Install FFmpeg and update system packages for security
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

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
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
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
