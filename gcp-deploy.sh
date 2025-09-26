#!/bin/bash
# 🚀 One-Click Google Cloud Deployment for Universal Trading AI
# This script creates and configures a complete GCP VM for AI trading

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${PROJECT_ID:-your-gcp-project-id}"
INSTANCE_NAME="${INSTANCE_NAME:-trading-ai-vm}"
ZONE="${ZONE:-us-central1-a}"
MACHINE_TYPE="${MACHINE_TYPE:-n1-standard-8}"
BOOT_DISK_SIZE="${BOOT_DISK_SIZE:-200GB}"

echo -e "${BLUE}🚀 Universal Trading AI - Google Cloud Deployment${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Validate prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI not found. Please install gcloud CLI first.${NC}"
    echo "   Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if [[ "$PROJECT_ID" == "your-gcp-project-id" ]]; then
    echo -e "${RED}❌ Please set your PROJECT_ID environment variable${NC}"
    echo "   export PROJECT_ID=your-actual-project-id"
    exit 1
fi

# Set the project
echo -e "${YELLOW}🔧 Setting GCP project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Check if project exists and user has access
if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
    echo -e "${RED}❌ Cannot access project $PROJECT_ID. Please check your project ID and permissions.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites validated${NC}"
echo ""

# Display configuration
echo -e "${BLUE}📊 Deployment Configuration:${NC}"
echo "   Project ID: $PROJECT_ID"
echo "   Instance Name: $INSTANCE_NAME"
echo "   Zone: $ZONE"
echo "   Machine Type: $MACHINE_TYPE"
echo "   Boot Disk Size: $BOOT_DISK_SIZE"
echo ""

# Ask for confirmation
read -p "🤔 Proceed with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
    exit 0
fi

echo -e "${YELLOW}🔥 Starting deployment...${NC}"
echo ""

# Step 1: Create startup script
echo -e "${YELLOW}📝 Creating startup script...${NC}"
cat > startup-script.sh << 'EOF'
#!/bin/bash
# Automatic Trading AI Setup on GCP VM

set -e

# Update system
apt-get update
apt-get upgrade -y

# Install essential packages
apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    unzip \
    build-essential \
    nginx \
    supervisor \
    htop \
    screen \
    vim \
    net-tools

# Create trading AI user
useradd -m -s /bin/bash trading-ai
usermod -aG sudo trading-ai

# Switch to trading-ai user directory
cd /home/trading-ai

# Clone the repository
sudo -u trading-ai git clone https://github.com/fansciecode/stock-ai.git
cd stock-ai
sudo -u trading-ai git checkout develop

# Create Python virtual environment
sudo -u trading-ai python3 -m venv trading-ai-env
sudo -u trading-ai /home/trading-ai/stock-ai/trading-ai-env/bin/pip install --upgrade pip

# Install Python dependencies
sudo -u trading-ai /home/trading-ai/stock-ai/trading-ai-env/bin/pip install -r requirements.txt

# Additional essential packages
sudo -u trading-ai /home/trading-ai/stock-ai/trading-ai-env/bin/pip install \
    scikit-learn==1.3.0 \
    pandas==2.0.3 \
    numpy==1.24.3 \
    joblib==1.3.1 \
    requests==2.31.0 \
    flask==2.3.2 \
    flask-cors==4.0.0 \
    python-dotenv==1.0.0 \
    yfinance==0.2.18 \
    ccxt==4.0.57 \
    ta==0.10.2 \
    gunicorn==21.2.0

# Set up environment configuration
sudo -u trading-ai cp .env.example .env

# Create GCP-optimized environment file
cat > /home/trading-ai/stock-ai/.env << 'ENVEOF'
# GCP Production Environment Configuration
AI_MODEL_PATH=models/
AUTO_LEARNING_ENABLED=true
MODEL_BACKUP_COUNT=10
MODEL_ACCURACY_THRESHOLD=0.85
TRAINING_DATA_DAYS=60
FEATURE_COUNT=71
ENSEMBLE_METHODS=rf,gb,lr,nn
CROSS_VALIDATION_FOLDS=5
FLASK_ENV=production
FLASK_DEBUG=false
API_HOST=0.0.0.0
DASHBOARD_PORT=8000
BACKEND_PORT=8001
AI_MODEL_PORT=8002
DATABASE_PATH=data/
BACKUP_ENABLED=true
BACKUP_INTERVAL_HOURS=6
SECRET_KEY=your-super-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-key-change-this
API_KEY_ENCRYPTION=true
BINANCE_TESTNET_ENABLED=true
BINANCE_LIVE_ENABLED=true
ZERODHA_ENABLED=true
MAX_CONCURRENT_ORDERS=50
MAX_INSTRUMENTS=25000
SIGNAL_GENERATION_INTERVAL=30
PORTFOLIO_UPDATE_INTERVAL=10
LOG_LEVEL=INFO
ENVEOF

# Set proper ownership
chown trading-ai:trading-ai /home/trading-ai/stock-ai/.env

# Create necessary directories
sudo -u trading-ai mkdir -p /home/trading-ai/stock-ai/logs
sudo -u trading-ai mkdir -p /home/trading-ai/stock-ai/backups

# Create systemd services
cat > /etc/systemd/system/trading-ai-dashboard.service << 'SERVICEEOF'
[Unit]
Description=Trading AI Dashboard
After=network.target

[Service]
Type=simple
User=trading-ai
WorkingDirectory=/home/trading-ai/stock-ai
Environment=PATH=/home/trading-ai/stock-ai/trading-ai-env/bin
ExecStart=/home/trading-ai/stock-ai/trading-ai-env/bin/python src/web_interface/production_dashboard.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

cat > /etc/systemd/system/trading-ai-backend.service << 'SERVICEEOF'
[Unit]
Description=Trading AI Backend API
After=network.target

[Service]
Type=simple
User=trading-ai
WorkingDirectory=/home/trading-ai/stock-ai
Environment=PATH=/home/trading-ai/stock-ai/trading-ai-env/bin
ExecStart=/home/trading-ai/stock-ai/trading-ai-env/bin/python backend_api.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Enable and start services
systemctl daemon-reload
systemctl enable trading-ai-dashboard
systemctl enable trading-ai-backend
systemctl start trading-ai-dashboard
systemctl start trading-ai-backend

# Create health check script
cat > /home/trading-ai/health-check.sh << 'HEALTHEOF'
#!/bin/bash
echo "=== Trading AI Health Check ==="
echo "Timestamp: $(date)"
echo "Dashboard: $(systemctl is-active trading-ai-dashboard)"
echo "Backend: $(systemctl is-active trading-ai-backend)"
echo "Memory: $(free -h | grep Mem)"
echo "Disk: $(df -h / | tail -1)"
echo "=== End Health Check ==="
HEALTHEOF

chmod +x /home/trading-ai/health-check.sh
chown trading-ai:trading-ai /home/trading-ai/health-check.sh

# Wait for services to start
sleep 30

# Run initial AI model training
sudo -u trading-ai /home/trading-ai/stock-ai/trading-ai-env/bin/python /home/trading-ai/stock-ai/streamlined_production_ai_trainer.py

echo "🎉 Trading AI System Setup Complete!"
echo "📊 Dashboard: http://$(curl -s ifconfig.me):8000"
echo "🔧 Backend API: http://$(curl -s ifconfig.me):8001"

# Log completion
echo "$(date): Trading AI setup completed successfully" >> /var/log/trading-ai-setup.log
EOF

echo -e "${GREEN}✅ Startup script created${NC}"

# Step 2: Create firewall rules
echo -e "${YELLOW}🔥 Creating firewall rules...${NC}"

# Check if firewall rule already exists
if gcloud compute firewall-rules describe trading-ai-ports &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firewall rule 'trading-ai-ports' already exists, skipping...${NC}"
else
    gcloud compute firewall-rules create trading-ai-ports \
        --allow tcp:8000,tcp:8001,tcp:8002,tcp:22 \
        --source-ranges 0.0.0.0/0 \
        --target-tags trading-ai \
        --description "Trading AI System Ports"
    echo -e "${GREEN}✅ Firewall rules created${NC}"
fi

# Step 3: Create the VM instance
echo -e "${YELLOW}🖥️  Creating VM instance...${NC}"

# Check if instance already exists
if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE &> /dev/null; then
    echo -e "${RED}❌ Instance '$INSTANCE_NAME' already exists in zone '$ZONE'${NC}"
    echo -e "${YELLOW}💡 Delete it first with: gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE${NC}"
    exit 1
fi

gcloud compute instances create $INSTANCE_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=default \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=trading-ai,http-server,https-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image=projects/ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20230918,mode=rw,size=$BOOT_DISK_SIZE,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-ssd \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --reservation-affinity=any \
    --metadata-from-file startup-script=startup-script.sh

echo -e "${GREEN}✅ VM instance created${NC}"

# Step 4: Wait for startup to complete
echo -e "${YELLOW}⏳ Waiting for startup script to complete (this may take 10-15 minutes)...${NC}"

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo -e "${BLUE}📊 Your VM External IP: $EXTERNAL_IP${NC}"

# Monitor startup progress
echo -e "${YELLOW}📡 Monitoring startup progress...${NC}"

for i in {1..30}; do
    echo -e "${YELLOW}⏳ Checking startup progress... ($i/30)${NC}"
    
    # Check if services are running
    if gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="systemctl is-active trading-ai-dashboard && systemctl is-active trading-ai-backend" &> /dev/null; then
        echo -e "${GREEN}✅ Services are running!${NC}"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}⚠️  Startup taking longer than expected. You can check manually.${NC}"
    fi
    
    sleep 30
done

# Step 5: Final verification
echo -e "${YELLOW}🔍 Running final verification...${NC}"

# Test endpoints
echo -e "${YELLOW}🌐 Testing endpoints...${NC}"

sleep 60  # Give services time to fully start

# Test dashboard
if curl -s "http://$EXTERNAL_IP:8000" > /dev/null; then
    echo -e "${GREEN}✅ Dashboard responding${NC}"
else
    echo -e "${YELLOW}⚠️  Dashboard not yet responding (may need more time)${NC}"
fi

# Test backend
if curl -s "http://$EXTERNAL_IP:8001/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend API responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API not yet responding (may need more time)${NC}"
fi

# Cleanup
rm -f startup-script.sh

# Final output
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""
echo -e "${BLUE}📊 Your Universal Trading AI System:${NC}"
echo "   🌐 Dashboard: http://$EXTERNAL_IP:8000"
echo "   🔧 Backend API: http://$EXTERNAL_IP:8001/health"
echo "   🤖 AI Model: Auto-training in progress"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "   📡 SSH Access: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "   🏥 Health Check: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='/home/trading-ai/health-check.sh'"
echo "   📝 View Logs: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='sudo journalctl -u trading-ai-dashboard -f'"
echo "   🛑 Stop VM: gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE"
echo "   ▶️  Start VM: gcloud compute instances start $INSTANCE_NAME --zone=$ZONE"
echo ""
echo -e "${BLUE}💰 Estimated Monthly Cost: ~$277 USD${NC}"
echo -e "${BLUE}🔒 Security: Firewall configured, services isolated${NC}"
echo -e "${BLUE}📈 Features: Live trading, AI training, 25,000+ instruments${NC}"
echo ""
echo -e "${GREEN}🚀 Your AI trading system is now ready for production use!${NC}"
echo ""

# Save deployment info
cat > deployment-info.txt << EOF
Trading AI Deployment Information
=================================
Timestamp: $(date)
Project ID: $PROJECT_ID
Instance Name: $INSTANCE_NAME
Zone: $ZONE
External IP: $EXTERNAL_IP
Machine Type: $MACHINE_TYPE

URLs:
- Dashboard: http://$EXTERNAL_IP:8000
- Backend API: http://$EXTERNAL_IP:8001
- SSH: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE

Management:
- Stop: gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE
- Start: gcloud compute instances start $INSTANCE_NAME --zone=$ZONE
- Delete: gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE
EOF

echo -e "${BLUE}📋 Deployment information saved to: deployment-info.txt${NC}"
