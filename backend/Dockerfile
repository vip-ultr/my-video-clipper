# Use latest Node.js 22 LTS on Alpine 3.21 (fewer CVEs than node:20-alpine)
FROM node:22-alpine3.21

# Install FFmpeg and fonts (required for subtitle rendering via libass)
RUN apk add --no-cache ffmpeg curl font-dejavu fontconfig && fc-cache -f

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Build TypeScript
RUN npm run build

# Create required directories
RUN mkdir -p /tmp/clips /tmp/watermarks

# Set environment
ENV NODE_ENV=production
ENV PORT=3001
# Tell libass (via ffmpeg-static) where to find fonts on Alpine
ENV FONTCONFIG_PATH=/etc/fonts

# Expose port1
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"]
