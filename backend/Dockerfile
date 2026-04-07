# Use stable Alpine Node.js image
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg curl

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

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"]
