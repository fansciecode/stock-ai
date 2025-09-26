#!/bin/bash

# 🚀 MICROSERVICES DEPLOYMENT SCRIPT
# Deploy AI Trading System with separated client, server, and AI model services

set -e

echo "🚀 DEPLOYING AI TRADING MICROSERVICES"
echo "===================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DEPLOYMENT_TYPE=${1:-local}
ENVIRONMENT=${ENVIRONMENT:-production}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "Prerequisites verified"
}

# Build all services
build_services() {
    log_info "Building microservices..."
    
    cd deployment/docker
    
    # Build each service separately for better caching
    log_info "Building AI Model service..."
    docker build -f Dockerfile.ai-model -t ai-trading-ai-model:latest ../../
    
    log_info "Building Server service..."
    docker build -f Dockerfile.server -t ai-trading-server:latest ../../
    
    log_info "Building Client service..."
    docker build -f Dockerfile.client -t ai-trading-client:latest ../../
    
    cd ../..
    
    log_success "All services built successfully"
}

# Deploy locally with Docker Compose
deploy_local() {
    log_info "Deploying microservices locally..."
    
    # Stop any existing services
    docker-compose -f deployment/docker/docker-compose.microservices.yml down || true
    
    # Start services
    docker-compose -f deployment/docker/docker-compose.microservices.yml up -d
    
    log_info "Waiting for services to start..."
    sleep 30
    
    # Verify services
    verify_deployment
}

# Deploy to cloud (AWS ECS)
deploy_cloud() {
    log_info "Deploying microservices to cloud..."
    
    # Tag images for ECR
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=${AWS_REGION:-us-east-1}
    
    ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    
    # Tag and push images
    for service in ai-model server client; do
        log_info "Pushing ${service} to ECR..."
        
        docker tag ai-trading-${service}:latest ${ECR_BASE}/ai-trading-${service}:latest
        docker push ${ECR_BASE}/ai-trading-${service}:latest
    done
    
    # Deploy with ECS
    log_info "Deploying to ECS..."
    
    # Create/update ECS services
    for service in ai-model server client; do
        aws ecs update-service \
            --cluster ai-trading-cluster \
            --service ai-trading-${service} \
            --force-new-deployment || \
        aws ecs create-service \
            --cluster ai-trading-cluster \
            --service-name ai-trading-${service} \
            --task-definition ai-trading-${service} \
            --desired-count 1 \
            --launch-type FARGATE
    done
    
    log_success "Cloud deployment completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    services=("client:8000" "server:8001" "ai-model:8002")
    
    for service_port in "${services[@]}"; do
        service_name=${service_port%:*}
        port=${service_port#*:}
        
        log_info "Checking ${service_name} service..."
        
        # Wait for service to be ready
        max_attempts=30
        attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            if curl -f http://localhost:${port}/health >/dev/null 2>&1; then
                log_success "${service_name} service is healthy"
                break
            else
                attempt=$((attempt + 1))
                sleep 2
            fi
        done
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "${service_name} service failed to start"
            show_logs ${service_name}
            exit 1
        fi
    done
}

# Show service logs
show_logs() {
    local service_name=$1
    log_info "Showing logs for ${service_name}..."
    
    docker-compose -f deployment/docker/docker-compose.microservices.yml logs --tail=50 ${service_name}
}

# Show deployment status
show_status() {
    echo ""
    echo "🎉 MICROSERVICES DEPLOYMENT COMPLETE!"
    echo "===================================="
    echo ""
    echo "📊 SERVICE ENDPOINTS:"
    echo "  🌐 Client (Frontend):  http://localhost:8000"
    echo "  🔧 Server (Backend):   http://localhost:8001"
    echo "  🤖 AI Model:           http://localhost:8002"
    echo ""
    echo "🔍 HEALTH CHECKS:"
    echo "  curl http://localhost:8000/health  # Client"
    echo "  curl http://localhost:8001/health  # Server"
    echo "  curl http://localhost:8002/health  # AI Model"
    echo ""
    echo "📊 ARCHITECTURE:"
    echo "  Client -> Server -> AI Model"
    echo "  │         │         └─ ML Inference (Isolated)"
    echo "  │         └─ Business Logic & Trading"
    echo "  └─ Frontend & Dashboard"
    echo ""
    echo "🎯 BENEFITS:"
    echo "  ✅ Separated AI model for dedicated ML processing"
    echo "  ✅ Independent scaling of each service"
    echo "  ✅ Fault isolation between components"
    echo "  ✅ Technology-specific optimizations"
    echo ""
    echo "🔧 MANAGEMENT:"
    echo "  ./deployment/scripts/manage-services.sh status"
    echo "  ./deployment/scripts/manage-services.sh logs [service]"
    echo "  ./deployment/scripts/manage-services.sh restart [service]"
    echo ""
}

# Main deployment flow
main() {
    log_info "Starting microservices deployment..."
    
    check_prerequisites
    build_services
    
    case $DEPLOYMENT_TYPE in
        "local")
            deploy_local
            ;;
        "cloud"|"aws")
            deploy_cloud
            ;;
        *)
            log_error "Invalid deployment type: $DEPLOYMENT_TYPE"
            echo "Usage: $0 [local|cloud]"
            exit 1
            ;;
    esac
    
    show_status
    
    log_success "🎊 Microservices deployment completed successfully!"
}

# Run main function
main "$@"
