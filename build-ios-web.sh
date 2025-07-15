#!/bin/bash

# Build iOS and Web App Script
# This script builds both the iOS and web app after the alignment changes

# Set error handling
set -e

# Print header
echo "========================================"
echo "Building iOS and Web App"
echo "========================================"

# Set directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
IOS_DIR="$SCRIPT_DIR/IBCM-ios/IBCM"
WEB_DIR="$SCRIPT_DIR/web-app"

# Function to build iOS app
build_ios_app() {
  echo ""
  echo "========================================"
  echo "Building iOS App"
  echo "========================================"
  
  cd "$IOS_DIR"
  
  # Check if xcodebuild is available
  if ! command -v xcodebuild &> /dev/null; then
    echo "Error: xcodebuild not found. Make sure Xcode is installed."
    return 1
  fi
  
  # Check if pod is available
  if command -v pod &> /dev/null; then
    echo "Installing CocoaPods dependencies..."
    pod install || echo "Warning: pod install failed. Continuing with build..."
  else
    echo "Warning: CocoaPods not found. Skipping pod install."
  fi
  
  # Build iOS app
  echo "Building iOS app..."
  xcodebuild -project IBCM.xcodeproj -scheme IBCM -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 14' build || {
    echo "Error: iOS build failed."
    return 1
  }
  
  echo "iOS app build successful!"
  return 0
}

# Function to build web app
build_web_app() {
  echo ""
  echo "========================================"
  echo "Building Web App"
  echo "========================================"
  
  cd "$WEB_DIR"
  
  # Check if package.json exists
  if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in $WEB_DIR"
    return 1
  fi
  
  # Check if npm is available
  if ! command -v npm &> /dev/null; then
    echo "Error: npm not found. Make sure Node.js is installed."
    return 1
  fi
  
  # Install dependencies
  echo "Installing npm dependencies..."
  npm install || {
    echo "Error: npm install failed."
    return 1
  }
  
  # Build web app
  echo "Building web app..."
  npm run build || {
    echo "Error: web app build failed."
    return 1
  }
  
  echo "Web app build successful!"
  return 0
}

# Main execution
echo "Starting build process..."

# Build iOS app
if build_ios_app; then
  IOS_SUCCESS=true
else
  IOS_SUCCESS=false
  echo "iOS build encountered errors."
fi

# Build web app
if build_web_app; then
  WEB_SUCCESS=true
else
  WEB_SUCCESS=false
  echo "Web app build encountered errors."
fi

# Print summary
echo ""
echo "========================================"
echo "Build Summary"
echo "========================================"
echo "iOS App: $([ "$IOS_SUCCESS" = true ] && echo "SUCCESS" || echo "FAILED")"
echo "Web App: $([ "$WEB_SUCCESS" = true ] && echo "SUCCESS" || echo "FAILED")"
echo "========================================"

# Exit with appropriate code
if [ "$IOS_SUCCESS" = true ] && [ "$WEB_SUCCESS" = true ]; then
  echo "All builds completed successfully!"
  exit 0
else
  echo "Some builds failed. Check the logs above for details."
  exit 1
fi 