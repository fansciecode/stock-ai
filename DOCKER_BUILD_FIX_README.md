# IBCM Stack Web App Docker Build Fix

This document explains the fixes applied to resolve the Docker build issues for the web-app in the IBCM stack.

## Issues Fixed

### 1. CORS and API Payload Issues
**Problem:** The web app was getting network errors due to two issues:
1. CORS restrictions - backend only allowed requests from a single origin
2. Payload mismatch - frontend sent `firstName` and `lastName` but backend expected single `name` field

**Solution:** 
1. Updated backend CORS configuration to allow multiple origins:
   - `http://localhost:3000` and `http://localhost:5000` (development)
   - `http://127.0.0.1:3000` and `http://127.0.0.1:5000` (alternative localhost)
   - `https://ibcm.app` and `https://www.ibcm.app` (production domains)
2. Fixed frontend authService to transform data before sending to backend:
   - Combines `firstName` and `lastName` into single `name` field
   - Only sends required fields: `name`, `email`, `password`
   - Added validation for required fields

### 2. Missing .dockerignore File
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

1. **backend/server.js** - Fixed CORS configuration to allow multiple origins
2. **web-app/src/services/api.js** - Enhanced error handling and debugging
3. **web-app/.dockerignore** - Created to exclude unnecessary files
4. **web-app/Dockerfile** - Optimized for reliable builds
5. **web-app/.env.development** - Created for development environment
6. **web-app/.env.production** - Created for production environment
7. **docker-compose.yml** - Updated backend and web-app service configuration
8. **build-web-app.sh** - Created helper script for building
9. **test-api-connection.js** - Created test script for API connectivity

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

### 1. Test API Connection (Optional)
```bash
# Install axios if not already installed
npm install axios

# Run the API connection test
node test-api-connection.js
```

### 2. Build and Run
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
   docker-compose logs backend
   ```

### 3. Test Signup Functionality
1. Open your browser and go to `http://localhost:5000`
2. Navigate to the signup page
3. Try creating a new account
4. Check the browser console for any errors
5. Check the backend logs for CORS messages

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