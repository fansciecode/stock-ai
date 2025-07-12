FROM node:18-alpine

# Install dependencies needed for node-gyp
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve globally to serve the built files
RUN npm install -g serve

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Expose the port
EXPOSE 5000

# Health check (using wget instead of curl for Alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000 || exit 1

# Start the application
CMD ["serve", "-s", "build", "-l", "5000"] 
