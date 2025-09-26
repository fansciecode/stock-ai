#!/bin/bash

# 🚀 PRODUCTION DEPLOYMENT SCRIPT
# Deploy AI Trading System to cloud with auto-scaling and continuous learning

set -e  # Exit on any error

echo "🚀 DEPLOYING PRODUCTION AI TRADING SYSTEM"
echo "=========================================="

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
REGION=${AWS_REGION:-us-east-1}
SERVICE_NAME="ai-trading-system"
CLUSTER_NAME="ai-trading-cluster"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    # Check kubectl (for EKS deployment)
    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl not found. Installing..."
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/
    fi
    
    log_success "Prerequisites check completed"
}

# Build production Docker image
build_image() {
    log_info "Building production Docker image..."
    
    # Clean up previous builds
    docker system prune -f
    
    # Build with optimization
    docker build \
        --file Dockerfile.production \
        --tag ${SERVICE_NAME}:latest \
        --tag ${SERVICE_NAME}:$(date +%Y%m%d-%H%M%S) \
        .
    
    log_success "Docker image built successfully"
}

# Deploy to AWS ECS
deploy_ecs() {
    log_info "Deploying to AWS ECS..."
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names ${SERVICE_NAME} || \
    aws ecr create-repository --repository-name ${SERVICE_NAME}
    
    # Get ECR login
    aws ecr get-login-password --region ${REGION} | \
    docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com
    
    # Tag and push image
    ECR_URI=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${SERVICE_NAME}:latest
    docker tag ${SERVICE_NAME}:latest ${ECR_URI}
    docker push ${ECR_URI}
    
    # Create or update ECS service
    if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} >/dev/null 2>&1; then
        log_info "Updating existing ECS service..."
        aws ecs update-service \
            --cluster ${CLUSTER_NAME} \
            --service ${SERVICE_NAME} \
            --force-new-deployment
    else
        log_info "Creating new ECS service..."
        aws ecs create-service \
            --cluster ${CLUSTER_NAME} \
            --service-name ${SERVICE_NAME} \
            --task-definition ${SERVICE_NAME} \
            --desired-count 2 \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
    fi
    
    log_success "ECS deployment completed"
}

# Deploy to AWS EKS (Kubernetes)
deploy_eks() {
    log_info "Deploying to AWS EKS..."
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/
    
    # Wait for deployment
    kubectl rollout status deployment/${SERVICE_NAME}
    
    # Get service URL
    SERVICE_URL=$(kubectl get service ${SERVICE_NAME} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    log_success "EKS deployment completed. Service URL: http://${SERVICE_URL}"
}

# Deploy to local Docker Compose (for testing)
deploy_local() {
    log_info "Deploying locally with Docker Compose..."
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Check health
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        log_success "Local deployment successful. Access at: http://localhost:8000"
    else
        log_error "Health check failed"
        docker-compose -f docker-compose.production.yml logs
        exit 1
    fi
}

# Setup auto-scaling
setup_autoscaling() {
    log_info "Setting up auto-scaling..."
    
    # Create Application Auto Scaling target
    aws application-autoscaling register-scalable-target \
        --service-namespace ecs \
        --resource-id service/${CLUSTER_NAME}/${SERVICE_NAME} \
        --scalable-dimension ecs:service:DesiredCount \
        --min-capacity 1 \
        --max-capacity 10
    
    # Create scaling policy
    aws application-autoscaling put-scaling-policy \
        --service-namespace ecs \
        --resource-id service/${CLUSTER_NAME}/${SERVICE_NAME} \
        --scalable-dimension ecs:service:DesiredCount \
        --policy-name ${SERVICE_NAME}-scaling-policy \
        --policy-type TargetTrackingScaling \
        --target-tracking-scaling-policy-configuration '{
            "TargetValue": 70.0,
            "PredefinedMetricSpecification": {
                "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
            },
            "ScaleOutCooldown": 300,
            "ScaleInCooldown": 300
        }'
    
    log_success "Auto-scaling configured"
}

# Setup monitoring and alerting
setup_monitoring() {
    log_info "Setting up monitoring and alerting..."
    
    # Create CloudWatch dashboard
    aws cloudwatch put-dashboard \
        --dashboard-name ${SERVICE_NAME}-dashboard \
        --dashboard-body file://monitoring/dashboard.json
    
    # Create alarms
    aws cloudwatch put-metric-alarm \
        --alarm-name ${SERVICE_NAME}-high-cpu \
        --alarm-description "High CPU utilization" \
        --metric-name CPUUtilization \
        --namespace AWS/ECS \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --dimensions Name=ServiceName,Value=${SERVICE_NAME} \
        --evaluation-periods 2
    
    log_success "Monitoring setup completed"
}

# Main deployment function
main() {
    log_info "Starting deployment process..."
    
    # Parse command line arguments
    DEPLOYMENT_TYPE=${1:-local}
    
    case $DEPLOYMENT_TYPE in
        "local")
            check_prerequisites
            build_image
            deploy_local
            ;;
        "ecs")
            check_prerequisites
            build_image
            deploy_ecs
            setup_autoscaling
            setup_monitoring
            ;;
        "eks")
            check_prerequisites
            build_image
            deploy_eks
            setup_monitoring
            ;;
        *)
            log_error "Invalid deployment type. Use: local, ecs, or eks"
            echo "Usage: $0 [local|ecs|eks]"
            exit 1
            ;;
    esac
    
    log_success "🎉 Deployment completed successfully!"
    log_info "📊 System features:"
    log_info "   • 10,258+ instruments across all major exchanges"
    log_info "   • Real-time data feeds and AI training"
    log_info "   • Auto-scaling based on load"
    log_info "   • Continuous learning and retraining"
    log_info "   • Multi-exchange support"
    log_info "   • Production-grade monitoring"
}

# Run main function
main "$@"
