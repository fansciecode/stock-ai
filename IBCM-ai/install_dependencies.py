#!/usr/bin/env python3
"""
IBCM AI - Clean Dependency Installer
Installs all required dependencies without creating duplicate files
"""

import subprocess
import sys
import os
import logging
import importlib.util
from typing import Dict, List, Any

logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

class DependencyInstaller:
    """Clean dependency installer for IBCM AI"""
    
    def __init__(self):
        self.required_packages = {
            # Core AI packages
            "torch": "torch>=2.0.0",
            "transformers": "transformers>=4.30.0", 
            "sentence-transformers": "sentence-transformers>=2.2.0",
            "datasets": "datasets>=2.10.0",
            "peft": "peft>=0.4.0",
            
            # Vector search and ML
            "faiss-cpu": "faiss-cpu>=1.7.0",
            "scikit-learn": "scikit-learn>=1.3.0",
            "numpy": "numpy>=1.24.0",
            
            # API and web
            "fastapi": "fastapi>=0.100.0",
            "uvicorn": "uvicorn[standard]>=0.22.0",
            
            # Database and cache
            "pymongo": "pymongo>=4.4.0",
            "redis": "redis>=4.5.0",
            "motor": "motor>=3.2.0",
            
            # Content generation
            "diffusers": "diffusers>=0.18.0",
            "accelerate": "accelerate>=0.20.0",
            
            # Web scraping
            "beautifulsoup4": "beautifulsoup4>=4.12.0",
            "aiohttp": "aiohttp>=3.8.0",
            "feedparser": "feedparser>=6.0.0",
            "requests": "requests>=2.31.0",
            
            # Streaming
            "kafka-python": "kafka-python>=2.0.0",
            "websockets": "websockets>=11.0.0",
            
            # Development tools
            "pytest": "pytest>=7.4.0",
            "black": "black>=23.0.0",
            "flake8": "flake8>=6.0.0"
        }
        
        self.optional_packages = {
            # GPU acceleration (optional)
            "bitsandbytes": "bitsandbytes>=0.41.0",
            "xformers": "xformers>=0.0.20",
            
            # Audio processing (optional)
            "torchaudio": "torchaudio>=2.0.0",
            "torchvision": "torchvision>=0.15.0",
            
            # Monitoring (optional)
            "prometheus-client": "prometheus-client>=0.17.0"
        }
    
    def check_package_installed(self, package_name: str) -> bool:
        """Check if a package is already installed"""
        try:
            importlib.import_module(package_name.replace('-', '_'))
            return True
        except ImportError:
            return False
    
    def install_package(self, package_spec: str, is_optional: bool = False) -> bool:
        """Install a single package"""
        package_name = package_spec.split('>')[0].split('<')[0].split('=')[0]
        
        # Check if already installed
        if self.check_package_installed(package_name):
            logger.info(f"✅ {package_name} already installed")
            return True
        
        logger.info(f"📦 Installing {package_spec}...")
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", package_spec],
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode == 0:
                logger.info(f"✅ {package_name} installed successfully")
                return True
            else:
                if is_optional:
                    logger.warning(f"⚠️ Optional package {package_name} failed: {result.stderr}")
                    return False
                else:
                    logger.error(f"❌ Required package {package_name} failed: {result.stderr}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Error installing {package_name}: {e}")
            return False
    
    def install_all_dependencies(self) -> Dict[str, Any]:
        """Install all dependencies"""
        logger.info("🚀 Starting IBCM AI dependency installation...")
        
        results = {
            "required_success": 0,
            "required_failed": 0,
            "optional_success": 0,
            "optional_failed": 0,
            "failures": []
        }
        
        # Update pip first
        logger.info("🔧 Updating pip...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], 
                         capture_output=True, check=False)
        except Exception:
            logger.warning("⚠️ Could not update pip")
        
        # Install required packages
        logger.info("📦 Installing required packages...")
        for package_name, package_spec in self.required_packages.items():
            success = self.install_package(package_spec, is_optional=False)
            if success:
                results["required_success"] += 1
            else:
                results["required_failed"] += 1
                results["failures"].append(package_name)
        
        # Install optional packages
        logger.info("🔮 Installing optional packages...")
        for package_name, package_spec in self.optional_packages.items():
            success = self.install_package(package_spec, is_optional=True)
            if success:
                results["optional_success"] += 1
            else:
                results["optional_failed"] += 1
        
        return results
    
    def verify_installation(self) -> Dict[str, bool]:
        """Verify critical packages can be imported"""
        logger.info("🔍 Verifying installation...")
        
        critical_packages = [
            "torch", "transformers", "fastapi", "pymongo", "redis", 
            "sentence_transformers", "datasets", "peft", "numpy"
        ]
        
        verification = {}
        for package in critical_packages:
            try:
                importlib.import_module(package.replace('-', '_'))
                verification[package] = True
                logger.info(f"✅ {package} verified")
            except ImportError as e:
                verification[package] = False
                logger.error(f"❌ {package} verification failed: {e}")
        
        return verification
    
    def check_env_file(self) -> bool:
        """Check if .env.example exists"""
        if os.path.exists(".env.example"):
            logger.info("✅ .env.example file found")
            return True
        else:
            logger.warning("⚠️ .env.example file not found")
            return False
    
    def print_summary(self, results: Dict, verification: Dict) -> None:
        """Print installation summary"""
        logger.info("\n" + "="*60)
        logger.info("📊 INSTALLATION SUMMARY")
        logger.info("="*60)
        
        total_required = len(self.required_packages)
        total_optional = len(self.optional_packages)
        
        logger.info(f"📦 Required packages: {results['required_success']}/{total_required} successful")
        logger.info(f"🔮 Optional packages: {results['optional_success']}/{total_optional} successful")
        
        # Critical verification
        critical_ok = all(verification.values())
        if critical_ok:
            logger.info("✅ All critical packages verified successfully!")
        else:
            failed = [pkg for pkg, ok in verification.items() if not ok]
            logger.error(f"❌ Critical packages failed: {failed}")
        
        if results["failures"]:
            logger.warning(f"⚠️ Failed packages: {results['failures']}")
        
        logger.info("="*60)
        logger.info("\n🚀 NEXT STEPS:")
        logger.info("1. Copy .env.example to .env and configure your settings")
        logger.info("2. Start your database services (MongoDB, Redis)")
        logger.info("3. Run training: python3 train_ibcm_model.py")
        logger.info("4. Start AI service: python3 main.py")
        logger.info("\n✅ IBCM AI setup complete!")

def main():
    """Main installation function"""
    try:
        installer = DependencyInstaller()
        
        # Install dependencies
        results = installer.install_all_dependencies()
        
        # Verify installation
        verification = installer.verify_installation()
        
        # Check environment file
        installer.check_env_file()
        
        # Print summary
        installer.print_summary(results, verification)
        
        # Check if installation was successful
        all_critical_ok = all(verification.values())
        if all_critical_ok and results["required_failed"] == 0:
            logger.info("🎉 Installation completed successfully!")
            return True
        else:
            logger.error("❌ Installation completed with errors")
            return False
            
    except Exception as e:
        logger.error(f"❌ Installation failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
