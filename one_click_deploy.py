#!/usr/bin/env python3
"""
🚀 ONE-CLICK AUTO DEPLOYMENT
Complete system deployment with auto-detection and optimization
"""

import os
import sys
import json
import psutil
import subprocess
import platform
import yaml
from datetime import datetime
from typing import Dict, List, Any
import logging

class OneClickDeploy:
    """One-click deployment system with auto-detection and optimization"""
    
    def __init__(self):
        self.setup_logging()
        self.system_info = self.detect_system_resources()
        self.deployment_config = self.auto_configure_deployment()
        
    def setup_logging(self):
        """Setup deployment logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def detect_system_resources(self) -> Dict[str, Any]:
        """Auto-detect system resources and capabilities"""
        self.logger.info("🔍 Detecting system resources...")
        
        # CPU information
        cpu_count = psutil.cpu_count(logical=False)  # Physical cores
        cpu_count_logical = psutil.cpu_count(logical=True)  # Logical cores
        cpu_freq = psutil.cpu_freq()
        
        # Memory information
        memory = psutil.virtual_memory()
        memory_gb = memory.total / (1024**3)
        
        # Disk information
        disk = psutil.disk_usage('.')
        disk_free_gb = disk.free / (1024**3)
        disk_total_gb = disk.total / (1024**3)
        
        # System information
        system_info = {
            'platform': platform.platform(),
            'system': platform.system(),
            'machine': platform.machine(),
            'processor': platform.processor(),
            'cpu_cores_physical': cpu_count,
            'cpu_cores_logical': cpu_count_logical,
            'cpu_frequency_mhz': cpu_freq.current if cpu_freq else 0,
            'memory_total_gb': round(memory_gb, 2),
            'memory_available_gb': round(memory.available / (1024**3), 2),
            'disk_total_gb': round(disk_total_gb, 2),
            'disk_free_gb': round(disk_free_gb, 2),
            'python_version': platform.python_version()
        }
        
        # Performance classification
        if memory_gb >= 32 and cpu_count >= 8:
            performance_tier = 'HIGH_PERFORMANCE'
        elif memory_gb >= 16 and cpu_count >= 4:
            performance_tier = 'MEDIUM_PERFORMANCE'
        elif memory_gb >= 8 and cpu_count >= 2:
            performance_tier = 'STANDARD'
        else:
            performance_tier = 'LOW_RESOURCE'
        
        system_info['performance_tier'] = performance_tier
        
        self.logger.info(f"🖥️  System: {system_info['system']} {system_info['machine']}")
        self.logger.info(f"🧠 CPU: {cpu_count} cores @ {cpu_freq.current if cpu_freq else 'Unknown'} MHz")
        self.logger.info(f"💾 Memory: {memory_gb:.1f} GB total, {memory.available / (1024**3):.1f} GB available")
        self.logger.info(f"💿 Disk: {disk_free_gb:.1f} GB free of {disk_total_gb:.1f} GB")
        self.logger.info(f"📊 Performance Tier: {performance_tier}")
        
        return system_info
    
    def auto_configure_deployment(self) -> Dict[str, Any]:
        """Auto-configure deployment based on system resources"""
        self.logger.info("⚙️  Auto-configuring deployment...")
        
        config = {
            'services': {},
            'optimization': {},
            'ai_training': {},
            'monitoring': {},
            'scaling': {}
        }
        
        performance_tier = self.system_info['performance_tier']
        memory_gb = self.system_info['memory_total_gb']
        cpu_cores = self.system_info['cpu_cores_physical']
        
        # Configure services based on performance tier
        if performance_tier == 'HIGH_PERFORMANCE':
            config['services'] = {
                'frontend_port': 8000,
                'backend_port': 8001,
                'ai_service_port': 8002,
                'mongodb_port': 27017,
                'redis_port': 6379,
                'workers': min(cpu_cores, 8),
                'enable_caching': True,
                'enable_monitoring': True
            }
            config['ai_training'] = {
                'batch_size': 1024,
                'max_epochs': 100,
                'early_stopping': True,
                'model_complexity': 'high',
                'ensemble_models': True,
                'parallel_training': True,
                'auto_retrain_hours': 24
            }
        elif performance_tier == 'MEDIUM_PERFORMANCE':
            config['services'] = {
                'frontend_port': 8000,
                'backend_port': 8001,
                'ai_service_port': 8002,
                'mongodb_port': 27017,
                'workers': min(cpu_cores, 4),
                'enable_caching': True,
                'enable_monitoring': False
            }
            config['ai_training'] = {
                'batch_size': 512,
                'max_epochs': 50,
                'early_stopping': True,
                'model_complexity': 'medium',
                'ensemble_models': False,
                'parallel_training': True,
                'auto_retrain_hours': 48
            }
        elif performance_tier == 'STANDARD':
            config['services'] = {
                'frontend_port': 8000,
                'backend_port': 8001,
                'ai_service_port': 8002,
                'mongodb_port': 27017,
                'workers': 2,
                'enable_caching': False,
                'enable_monitoring': False
            }
            config['ai_training'] = {
                'batch_size': 256,
                'max_epochs': 25,
                'early_stopping': True,
                'model_complexity': 'low',
                'ensemble_models': False,
                'parallel_training': False,
                'auto_retrain_hours': 72
            }
        else:  # LOW_RESOURCE
            config['services'] = {
                'frontend_port': 8000,
                'backend_port': 8001,
                'mongodb_port': 27017,
                'workers': 1,
                'enable_caching': False,
                'enable_monitoring': False
            }
            config['ai_training'] = {
                'batch_size': 128,
                'max_epochs': 10,
                'early_stopping': True,
                'model_complexity': 'minimal',
                'ensemble_models': False,
                'parallel_training': False,
                'auto_retrain_hours': 168  # Weekly
            }
        
        # Database configuration
        config['database'] = {
            'sqlite_path': 'data/',
            'mongodb_enabled': memory_gb >= 8,
            'redis_enabled': memory_gb >= 16,
            'connection_pool_size': min(cpu_cores * 2, 20)
        }
        
        # Optimization settings
        config['optimization'] = {
            'data_collection_parallel': cpu_cores >= 4,
            'feature_engineering_batch': max(100, min(1000, memory_gb * 50)),
            'model_prediction_cache': memory_gb >= 8,
            'background_data_update': True,
            'cleanup_old_data_days': 30 if self.system_info['disk_free_gb'] < 50 else 90
        }
        
        self.logger.info(f"⚙️  Configuration optimized for {performance_tier}")
        return config
    
    def create_deployment_configs(self):
        """Create all necessary deployment configuration files"""
        self.logger.info("📝 Creating deployment configurations...")
        
        # Create directories
        os.makedirs('deployment/configs', exist_ok=True)
        os.makedirs('deployment/scripts', exist_ok=True)
        os.makedirs('deployment/docker', exist_ok=True)
        
        # Docker Compose configuration
        docker_compose = {
            'version': '3.8',
            'services': {
                'frontend': {
                    'build': {
                        'context': '.',
                        'dockerfile': 'deployment/docker/Dockerfile.frontend'
                    },
                    'ports': [f"{self.deployment_config['services']['frontend_port']}:8000"],
                    'environment': [
                        'BACKEND_URL=http://backend:8001',
                        'AI_SERVICE_URL=http://ai-service:8002'
                    ],
                    'volumes': ['./data:/app/data'],
                    'depends_on': ['backend', 'ai-service']
                },
                'backend': {
                    'build': {
                        'context': '.',
                        'dockerfile': 'deployment/docker/Dockerfile.backend'
                    },
                    'ports': [f"{self.deployment_config['services']['backend_port']}:8001"],
                    'environment': [
                        'AI_SERVICE_URL=http://ai-service:8002',
                        f"WORKERS={self.deployment_config['services']['workers']}"
                    ],
                    'volumes': ['./data:/app/data', './models:/app/models'],
                    'depends_on': ['ai-service']
                },
                'ai-service': {
                    'build': {
                        'context': '.',
                        'dockerfile': 'deployment/docker/Dockerfile.ai'
                    },
                    'ports': [f"{self.deployment_config['services']['ai_service_port']}:8002"],
                    'environment': [
                        f"AUTO_LEARNING_ENABLED=true",
                        f"AUTO_RETRAIN_HOURS={self.deployment_config['ai_training']['auto_retrain_hours']}",
                        f"BATCH_SIZE={self.deployment_config['ai_training']['batch_size']}",
                        f"MAX_EPOCHS={self.deployment_config['ai_training']['max_epochs']}",
                        f"MODEL_COMPLEXITY={self.deployment_config['ai_training']['model_complexity']}"
                    ],
                    'volumes': ['./data:/app/data', './models:/app/models']
                }
            },
            'volumes': {
                'data_volume': {},
                'models_volume': {}
            }
        }
        
        # Add MongoDB if enabled
        if self.deployment_config['database']['mongodb_enabled']:
            docker_compose['services']['mongodb'] = {
                'image': 'mongo:latest',
                'ports': [f"{self.deployment_config['services']['mongodb_port']}:27017"],
                'environment': [
                    'MONGO_INITDB_ROOT_USERNAME=admin',
                    'MONGO_INITDB_ROOT_PASSWORD=trading_ai_2024'
                ],
                'volumes': ['mongodb_data:/data/db']
            }
            docker_compose['volumes']['mongodb_data'] = {}
        
        # Add Redis if enabled
        if self.deployment_config['database'].get('redis_enabled'):
            docker_compose['services']['redis'] = {
                'image': 'redis:alpine',
                'ports': [f"{self.deployment_config['services']['redis_port']}:6379"],
                'volumes': ['redis_data:/data']
            }
            docker_compose['volumes']['redis_data'] = {}
        
        with open('deployment/docker/docker-compose.yml', 'w') as f:
            yaml.dump(docker_compose, f, indent=2)
        
        # Create Dockerfiles
        self.create_dockerfiles()
        
        # Create startup scripts
        self.create_startup_scripts()
        
        # Create systemd service files for production
        self.create_systemd_services()
    
    def create_dockerfiles(self):
        """Create optimized Dockerfiles for each service"""
        
        # Frontend Dockerfile
        frontend_dockerfile = f"""FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY data/ ./data/
COPY models/ ./models/

# Set environment variables
ENV PYTHONPATH=/app
ENV WORKERS={self.deployment_config['services']['workers']}

# Expose port
EXPOSE 8000

# Run frontend service
CMD ["python", "src/web_interface/production_dashboard.py"]
"""
        
        # Backend Dockerfile
        backend_dockerfile = f"""FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY data/ ./data/
COPY models/ ./models/
COPY backend_api.py .

# Set environment variables
ENV PYTHONPATH=/app
ENV WORKERS={self.deployment_config['services']['workers']}

# Expose port
EXPOSE 8001

# Run backend API
CMD ["python", "backend_api.py"]
"""
        
        # AI Service Dockerfile
        ai_dockerfile = f"""FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for ML
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    gfortran \\
    libopenblas-dev \\
    liblapack-dev \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install additional ML dependencies based on performance tier
{self._get_ml_dependencies()}

# Copy application code
COPY src/ ./src/
COPY data/ ./data/
COPY models/ ./models/

# Set environment variables
ENV PYTHONPATH=/app
ENV AUTO_LEARNING_ENABLED=true
ENV BATCH_SIZE={self.deployment_config['ai_training']['batch_size']}
ENV MAX_EPOCHS={self.deployment_config['ai_training']['max_epochs']}

# Expose port
EXPOSE 8002

# Run AI service
CMD ["python", "src/ai/ai_service.py"]
"""
        
        # Write Dockerfiles
        with open('deployment/docker/Dockerfile.frontend', 'w') as f:
            f.write(frontend_dockerfile)
        
        with open('deployment/docker/Dockerfile.backend', 'w') as f:
            f.write(backend_dockerfile)
        
        with open('deployment/docker/Dockerfile.ai', 'w') as f:
            f.write(ai_dockerfile)
    
    def _get_ml_dependencies(self) -> str:
        """Get ML dependencies based on performance tier"""
        performance_tier = self.system_info['performance_tier']
        
        if performance_tier == 'HIGH_PERFORMANCE':
            return """
# Install GPU support if available
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir xgboost lightgbm catboost
"""
        elif performance_tier in ['MEDIUM_PERFORMANCE', 'STANDARD']:
            return """
# Install standard ML libraries
RUN pip install --no-cache-dir xgboost lightgbm
"""
        else:
            return """
# Minimal ML setup for low-resource systems
RUN pip install --no-cache-dir scikit-learn==1.3.0
"""
    
    def create_startup_scripts(self):
        """Create startup scripts for different deployment scenarios"""
        
        # Local development startup
        local_start = f"""#!/bin/bash

echo "🚀 Starting AI Trading System - Local Development"
echo "Performance Tier: {self.system_info['performance_tier']}"
echo "System: {self.system_info['cpu_cores_physical']} cores, {self.system_info['memory_total_gb']:.1f}GB RAM"

# Check dependencies
echo "🔍 Checking dependencies..."
python -c "import numpy, pandas, sklearn, joblib; print('✅ Core dependencies OK')" || {{
    echo "❌ Missing dependencies. Installing..."
    pip install -r requirements.txt
}}

# Create necessary directories
mkdir -p data logs models reports

# Start services based on system resources
if [ "{self.system_info['performance_tier']}" = "HIGH_PERFORMANCE" ] || [ "{self.system_info['performance_tier']}" = "MEDIUM_PERFORMANCE" ]; then
    echo "🚀 Starting high-performance configuration..."
    
    # Start AI service
    echo "🤖 Starting AI Service..."
    python -c "import sys; sys.path.append('src'); from ai.ai_service import start_ai_service; start_ai_service()" &
    AI_PID=$!
    
    # Start backend
    echo "🔧 Starting Backend API..."
    python backend_api.py &
    BACKEND_PID=$!
    
    # Start frontend
    echo "🌐 Starting Frontend Dashboard..."
    python src/web_interface/production_dashboard.py &
    FRONTEND_PID=$!
    
else
    echo "🚀 Starting standard configuration..."
    
    # Start backend
    echo "🔧 Starting Backend API..."
    python backend_api.py &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    echo "🌐 Starting Frontend Dashboard..."
    python src/web_interface/production_dashboard.py &
    FRONTEND_PID=$!
fi

echo "✅ All services started!"
echo "📱 Dashboard: http://localhost:{self.deployment_config['services']['frontend_port']}"
if [ ! -z "${{BACKEND_PID}}" ]; then
    echo "🔧 Backend API: http://localhost:{self.deployment_config['services']['backend_port']}"
fi
if [ ! -z "${{AI_PID}}" ]; then
    echo "🤖 AI Service: http://localhost:{self.deployment_config['services']['ai_service_port']}"
fi

# Save PIDs for cleanup
echo "${{FRONTEND_PID}}" > .frontend.pid
echo "${{BACKEND_PID}}" > .backend.pid
if [ ! -z "${{AI_PID}}" ]; then
    echo "${{AI_PID}}" > .ai.pid
fi

echo "💡 To stop all services, run: ./deployment/scripts/stop.sh"
"""
        
        # Stop script
        stop_script = """#!/bin/bash

echo "🛑 Stopping AI Trading System..."

# Stop services by PID files
for pidfile in .frontend.pid .backend.pid .ai.pid; do
    if [ -f "$pidfile" ]; then
        PID=$(cat "$pidfile")
        if kill -0 "$PID" 2>/dev/null; then
            echo "🛑 Stopping process $PID..."
            kill "$PID"
        fi
        rm -f "$pidfile"
    fi
done

# Kill any remaining processes
pkill -f "production_dashboard.py"
pkill -f "backend_api.py"
pkill -f "ai_service.py"

echo "✅ All services stopped"
"""
        
        # Docker startup
        docker_start = f"""#!/bin/bash

echo "🐳 Starting AI Trading System - Docker"
echo "Performance Tier: {self.system_info['performance_tier']}"

# Build and start with Docker Compose
cd deployment/docker
docker-compose up --build -d

echo "✅ Docker services started!"
echo "📱 Dashboard: http://localhost:{self.deployment_config['services']['frontend_port']}"
echo "🔧 Backend API: http://localhost:{self.deployment_config['services']['backend_port']}"
echo "🤖 AI Service: http://localhost:{self.deployment_config['services']['ai_service_port']}"

echo "💡 To view logs: docker-compose logs -f"
echo "💡 To stop: docker-compose down"
"""
        
        # Write startup scripts
        scripts = {
            'deployment/scripts/start-local.sh': local_start,
            'deployment/scripts/stop.sh': stop_script,
            'deployment/scripts/start-docker.sh': docker_start
        }
        
        for script_path, content in scripts.items():
            with open(script_path, 'w') as f:
                f.write(content)
            os.chmod(script_path, 0o755)  # Make executable
    
    def create_systemd_services(self):
        """Create systemd service files for production deployment"""
        
        service_template = f"""[Unit]
Description=AI Trading System - {{service_name}}
After=network.target

[Service]
Type=simple
User=trading
Group=trading
WorkingDirectory=/opt/ai-trading
Environment=PYTHONPATH=/opt/ai-trading
ExecStart={{exec_command}}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
        
        services = {
            'ai-trading-frontend': 'python src/web_interface/production_dashboard.py',
            'ai-trading-backend': 'python backend_api.py',
            'ai-trading-ai': 'python src/ai/ai_service.py'
        }
        
        # Create systemd directory first
        os.makedirs('deployment/systemd', exist_ok=True)
        
        for service_name, command in services.items():
            service_content = service_template.format(
                service_name=service_name.replace('ai-trading-', '').title(),
                exec_command=command
            )
            
            with open(f'deployment/systemd/{service_name}.service', 'w') as f:
                f.write(service_content)
        
        install_script = """#!/bin/bash

echo "📦 Installing AI Trading System as systemd services..."

# Create user and directories
sudo useradd -r -s /bin/false trading
sudo mkdir -p /opt/ai-trading
sudo cp -r . /opt/ai-trading/
sudo chown -R trading:trading /opt/ai-trading

# Install service files
sudo cp deployment/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable ai-trading-frontend
sudo systemctl enable ai-trading-backend
sudo systemctl enable ai-trading-ai

# Start services
sudo systemctl start ai-trading-frontend
sudo systemctl start ai-trading-backend
sudo systemctl start ai-trading-ai

echo "✅ AI Trading System installed and started!"
echo "📱 Dashboard: http://localhost:8000"
echo "💡 Check status: sudo systemctl status ai-trading-*"
"""
        
        with open('deployment/scripts/install-systemd.sh', 'w') as f:
            f.write(install_script)
        os.chmod('deployment/scripts/install-systemd.sh', 0o755)
    
    def create_auto_learning_config(self):
        """Create auto-learning configuration based on system capabilities"""
        
        auto_learning_config = {
            'enabled': True,
            'system_optimization': {
                'performance_tier': self.system_info['performance_tier'],
                'cpu_cores': self.system_info['cpu_cores_physical'],
                'memory_gb': self.system_info['memory_total_gb'],
                'auto_detected': True
            },
            'training_schedule': {
                'interval_hours': self.deployment_config['ai_training']['auto_retrain_hours'],
                'batch_size': self.deployment_config['ai_training']['batch_size'],
                'max_epochs': self.deployment_config['ai_training']['max_epochs'],
                'early_stopping': self.deployment_config['ai_training']['early_stopping']
            },
            'data_collection': {
                'parallel_enabled': self.deployment_config['optimization']['data_collection_parallel'],
                'batch_processing': self.deployment_config['optimization']['feature_engineering_batch'],
                'cleanup_old_data_days': self.deployment_config['optimization']['cleanup_old_data_days']
            },
            'model_optimization': {
                'complexity': self.deployment_config['ai_training']['model_complexity'],
                'ensemble_enabled': self.deployment_config['ai_training']['ensemble_models'],
                'parallel_training': self.deployment_config['ai_training']['parallel_training'],
                'prediction_cache': self.deployment_config['optimization']['model_prediction_cache']
            }
        }
        
        with open('configs/auto_learning.yaml', 'w') as f:
            yaml.dump(auto_learning_config, f, indent=2)
        
        return auto_learning_config
    
    def deploy_system(self):
        """Execute the complete deployment"""
        self.logger.info("🚀 Starting one-click deployment...")
        
        try:
            # Create deployment configurations
            self.create_deployment_configs()
            
            # Create auto-learning configuration
            auto_learning_config = self.create_auto_learning_config()
            
            # Save deployment summary
            deployment_summary = {
                'deployment_time': datetime.now().isoformat(),
                'system_info': self.system_info,
                'deployment_config': self.deployment_config,
                'auto_learning_config': auto_learning_config,
                'deployment_status': 'READY'
            }
            
            with open('deployment/deployment_summary.json', 'w') as f:
                json.dump(deployment_summary, f, indent=2)
            
            self.logger.info("✅ Deployment configuration complete!")
            self.logger.info("📋 Available deployment options:")
            self.logger.info("   1. Local Development: ./deployment/scripts/start-local.sh")
            self.logger.info("   2. Docker: ./deployment/scripts/start-docker.sh")
            self.logger.info("   3. Production: ./deployment/scripts/install-systemd.sh")
            
            self.logger.info(f"\n🎯 Optimized for {self.system_info['performance_tier']} system:")
            self.logger.info(f"   - CPU: {self.system_info['cpu_cores_physical']} cores")
            self.logger.info(f"   - Memory: {self.system_info['memory_total_gb']:.1f} GB")
            self.logger.info(f"   - AI Training: {self.deployment_config['ai_training']['model_complexity']} complexity")
            self.logger.info(f"   - Auto-retrain: Every {self.deployment_config['ai_training']['auto_retrain_hours']} hours")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Deployment failed: {e}")
            return False

def main():
    """Main deployment function"""
    print("🚀 AI Trading System - One-Click Deployment")
    print("=" * 50)
    
    deployer = OneClickDeploy()
    success = deployer.deploy_system()
    
    if success:
        print("\n🎉 DEPLOYMENT READY!")
        print("Choose your deployment method and run the appropriate script.")
    else:
        print("\n❌ DEPLOYMENT FAILED!")
        print("Check the logs above for details.")

if __name__ == "__main__":
    main()
