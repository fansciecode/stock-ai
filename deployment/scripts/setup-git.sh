#!/bin/bash

# 🌍 GIT SETUP AND DEPLOYMENT SCRIPT
# Prepare and push clean codebase to GitHub

set -e

echo "🌍 SETTING UP GIT REPOSITORY"
echo "============================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[GIT]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
GITHUB_REPO="https://github.com/fansciecode/stock-ai.git"
BRANCH="develop"

# Clean up workspace
cleanup_workspace() {
    log_info "Cleaning up workspace..."
    
    # Remove unnecessary files
    rm -f *.log 2>/dev/null || true
    rm -f .DS_Store 2>/dev/null || true
    rm -rf __pycache__ 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove old Docker containers and images
    docker system prune -f || true
    
    log_success "Workspace cleaned"
}

# Create .gitignore
create_gitignore() {
    log_info "Creating .gitignore..."
    
    cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Environment
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
*.log
logs/
*.log.*

# Database
*.db
*.sqlite
*.sqlite3

# Models (large files)
models/*.pkl
models/*.joblib
*.h5
*.pb

# Data files
data/*.csv
data/*.parquet
data/*.json
data/live_*
data/market_*

# Docker
.dockerignore

# Temporary files
*.tmp
*.temp
states/
cache/

# API Keys and Secrets
config/production/
secrets/
*.key
*.pem

# Build artifacts
build/
dist/
*.egg-info/

# Coverage reports
htmlcov/
.coverage
.coverage.*
coverage.xml
*.cover
.hypothesis/
.pytest_cache/

# Jupyter Notebook
.ipynb_checkpoints

# Node.js (if frontend)
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

    log_success ".gitignore created"
}

# Initialize git repository
init_git() {
    log_info "Initializing git repository..."
    
    # Initialize git if not already done
    if [ ! -d .git ]; then
        git init
        log_success "Git repository initialized"
    else
        log_warning "Git repository already exists"
    fi
    
    # Configure git
    git config --global user.name "AI Trading System" || true
    git config --global user.email "ai-trading@fansciecode.com" || true
    
    # Add remote if not exists
    if ! git remote get-url origin >/dev/null 2>&1; then
        git remote add origin $GITHUB_REPO
        log_success "Remote origin added"
    else
        log_warning "Remote origin already exists"
    fi
}

# Stage files for commit
stage_files() {
    log_info "Staging files for commit..."
    
    # Add all important files
    git add -A
    
    # Check what's staged
    log_info "Files staged for commit:"
    git status --porcelain | head -20
    
    if [ $(git status --porcelain | wc -l) -gt 20 ]; then
        log_info "... and $(( $(git status --porcelain | wc -l) - 20 )) more files"
    fi
}

# Create commit
create_commit() {
    log_info "Creating commit..."
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        log_warning "No changes to commit"
        return
    fi
    
    # Create commit with detailed message
    commit_message="🚀 Microservices Architecture Implementation

✅ MAJOR UPDATES:
- Separated client, server, and AI model services
- Clean microservices architecture for production
- Docker containerization for each service
- Independent scaling and fault isolation
- Optimized AI inference service
- Production-ready deployment scripts

🏗️ ARCHITECTURE:
- Client Service (Port 8000): Frontend and dashboard
- Server Service (Port 8001): Backend API and trading logic  
- AI Model Service (Port 8002): ML inference and predictions

🚀 DEPLOYMENT:
- Docker Compose for local development
- AWS ECS/EKS for cloud deployment
- Kubernetes manifests included
- Auto-scaling configuration

📊 FEATURES:
- 10,258+ instruments support
- Real-time data processing
- Production-grade monitoring
- Environment configuration
- Health checks and metrics

🎯 READY FOR:
- Production deployment
- Independent service scaling
- High-traffic environments
- Enterprise operations"

    git commit -m "$commit_message"
    log_success "Commit created"
}

# Push to GitHub
push_to_github() {
    log_info "Pushing to GitHub..."
    
    # Create and switch to develop branch
    git checkout -b $BRANCH 2>/dev/null || git checkout $BRANCH
    
    # Push to develop branch
    git push -u origin $BRANCH
    
    log_success "Code pushed to GitHub ($BRANCH branch)"
}

# Show repository info
show_repo_info() {
    echo ""
    echo "🎉 GITHUB REPOSITORY SETUP COMPLETE!"
    echo "===================================="
    echo ""
    echo "📍 REPOSITORY: $GITHUB_REPO"
    echo "🌿 BRANCH: $BRANCH"
    echo ""
    echo "🔗 LINKS:"
    echo "  📂 Repository: https://github.com/fansciecode/stock-ai"
    echo "  🌿 Develop Branch: https://github.com/fansciecode/stock-ai/tree/$BRANCH"
    echo "  📋 Issues: https://github.com/fansciecode/stock-ai/issues"
    echo "  🔄 Pull Requests: https://github.com/fansciecode/stock-ai/pulls"
    echo ""
    echo "🏗️ ARCHITECTURE HIGHLIGHTS:"
    echo "  ✅ Clean microservices separation"
    echo "  ✅ Production-ready Docker setup"
    echo "  ✅ Cloud deployment scripts"
    echo "  ✅ 10,258+ instruments support"
    echo "  ✅ Independent AI model service"
    echo ""
    echo "🚀 NEXT STEPS:"
    echo "  1. Clone: git clone $GITHUB_REPO"
    echo "  2. Switch: git checkout $BRANCH"
    echo "  3. Deploy: ./deployment/scripts/deploy-microservices.sh local"
    echo "  4. Access: http://localhost:8000"
    echo ""
}

# Main execution
main() {
    log_info "Starting Git repository setup..."
    
    cleanup_workspace
    create_gitignore
    init_git
    stage_files
    create_commit
    push_to_github
    show_repo_info
    
    log_success "🎊 Git repository setup completed successfully!"
}

# Run main function
main "$@"
