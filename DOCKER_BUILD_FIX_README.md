# IBCM Stack Web App Docker Build Fix

This document explains the fixes applied to resolve the Docker build issues for the web-app in the IBCM stack.

## Issues Fixed

### 1. Missing .dockerignore File
**Problem:** The Docker build context was including unnecessary files like `node_modules`, build artifacts, and other files that could cause conflicts or slow down the build process.

**Solution:** Created a comprehensive `.dockerignore` file in the `web-app` directory to exclude:
- `node_modules` (will be installed fresh in container)
- Build artifacts and logs
- Development files and directories
- Version control files

### 2. Dockerfile Optimization
**Problem:** The original Dockerfile had several issues that could cause build failures:
- Missing build dependencies for native modules
- Memory limitations during npm install and build
- Security concerns (running as root)
- Missing development dependencies needed for React build

**Solution:** Updated the Dockerfile with:
- Added build dependencies (`python3`, `make`, `g++`) for native modules
- Increased Node.js memory allocation (`--max-old-space-size=4096`)
- Install all dependencies (including dev dependencies) needed for building
- Added non-root user for security
- Improved health check using `wget` instead of `curl`

### 3. Docker Compose Configuration
**Problem:** The docker-compose.yml had development-oriented configuration that could interfere with production builds.

**Solution:** Updated the web-app service configuration:
- Explicitly specified build context and dockerfile
- Added `NODE_ENV=production` environment variable
- Removed volume mounts for production builds
- Added restart policy

## Files Modified

1. **web-app/.dockerignore** - Created to exclude unnecessary files
2. **web-app/Dockerfile** - Optimized for reliable builds
3. **docker-compose.yml** - Updated web-app service configuration
4. **build-web-app.sh** - Created helper script for building

## How to Use

### Option 1: Using the Build Script
```bash
./build-web-app.sh
```

### Option 2: Manual Build
```bash
# Build only the web-app
docker-compose build web-app

# Run the entire stack
docker-compose up -d

# Run only the web-app with dependencies
docker-compose up web-app backend mongo
```

## Troubleshooting

### Build Fails with Memory Issues
If you encounter memory issues during build:
1. Increase Docker's memory allocation in Docker settings
2. The Dockerfile already includes `NODE_OPTIONS=--max-old-space-size=4096`
3. Consider closing other applications to free up memory

### Build Fails with Permission Issues
If you encounter permission issues:
1. Make sure Docker has proper permissions on your system
2. The Dockerfile creates a non-root user to avoid permission conflicts
3. Check if your host OS is blocking Docker operations

### Build Fails with Network Issues
If npm install fails due to network issues:
1. Check your internet connection
2. Try building with: `docker-compose build --no-cache web-app`
3. Consider using a different npm registry if corporate firewall is blocking

### React Build Errors
If the React build (`npm run build`) fails:
1. Check the build logs: `docker-compose logs web-app`
2. Ensure all required environment variables are set
3. Check for any missing dependencies in package.json

### Port Conflicts
If port 5000 is already in use:
1. Change the port mapping in docker-compose.yml
2. Or stop the service using port 5000
3. The app will be available at `http://localhost:5000`

## Testing the Fix

1. **Build the image:**
   ```bash
   ./build-web-app.sh
   ```

2. **Run the stack:**
   ```bash
   docker-compose up -d
   ```

3. **Check the web-app is running:**
   ```bash
   curl http://localhost:5000
   ```

4. **View logs if needed:**
   ```bash
   docker-compose logs web-app
   ```

## Environment Variables

The web-app uses these environment variables:
- `REACT_APP_API_URL` - Backend API URL
- `PORT` - Port to run the app on (default: 5000)
- `NODE_ENV` - Node environment (set to production for builds)

## Security Considerations

The updated Dockerfile includes security improvements:
- Runs as non-root user (`nextjs:nodejs`)
- Only installs necessary dependencies
- Uses Alpine Linux for smaller attack surface
- Includes health checks for monitoring

## Performance Optimizations

- Uses `npm ci` instead of `npm install` for faster, reproducible builds
- Leverages Docker layer caching
- Excludes unnecessary files via `.dockerignore`
- Serves pre-built static files with `serve`

## Next Steps

After applying these fixes, the web-app should build successfully in Docker. If you encounter any issues:

1. Check the build logs for specific error messages
2. Ensure all dependencies are properly installed
3. Verify the React app builds correctly outside of Docker first
4. Check Docker and Docker Compose versions are compatible

For further assistance, please check the error logs and compare with the troubleshooting section above.