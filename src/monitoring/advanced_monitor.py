#!/usr/bin/env python3
"""
Advanced Monitoring System for Stock AI Trading
Real-time performance monitoring, alerting, and health checks
"""

import asyncio
import time
import json
import logging
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
import psutil
import requests
import sqlite3
from pathlib import Path
import yaml

class AlertLevel:
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    EMERGENCY = "EMERGENCY"

class AdvancedMonitor:
    """Advanced monitoring system with alerting capabilities"""
    
    def __init__(self, config_file="configs/monitoring.yaml"):
        self.config_file = config_file
        self.config = self._load_config()
        self.is_running = False
        self.metrics_history = []
        self.alert_history = []
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Monitoring thresholds
        self.thresholds = {
            'cpu_usage': 80,           # %
            'memory_usage': 85,        # %
            'disk_usage': 90,          # %
            'api_response_time': 5.0,  # seconds
            'error_rate': 10,          # %
            'signal_generation_rate': 0.1,  # signals per minute
            'data_freshness': 300,     # seconds
            'model_accuracy': 0.6,     # minimum accuracy
            'consecutive_losses': 10,   # trading losses
            'max_drawdown': 20         # %
        }
        
        # Initialize database
        self.setup_monitoring_db()
        
    def _load_config(self):
        """Load monitoring configuration"""
        try:
            with open(self.config_file, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            self.logger.warning("Monitoring config not found, using defaults")
            return {
                'alerts': {
                    'email': {
                        'enabled': False,
                        'smtp_server': 'smtp.gmail.com',
                        'smtp_port': 587,
                        'username': '',
                        'password': '',
                        'recipients': []
                    },
                    'webhook': {
                        'enabled': False,
                        'url': ''
                    }
                },
                'monitoring': {
                    'interval': 60,
                    'api_url': 'http://localhost:8000'
                }
            }
    
    def setup_monitoring_db(self):
        """Setup monitoring database"""
        db_dir = Path("data/monitoring")
        db_dir.mkdir(parents=True, exist_ok=True)
        
        self.db_path = db_dir / "monitoring.db"
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # System metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    cpu_usage REAL,
                    memory_usage REAL,
                    disk_usage REAL,
                    network_io TEXT,
                    process_count INTEGER
                )
            ''')
            
            # Trading metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS trading_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    active_positions INTEGER,
                    total_pnl REAL,
                    win_rate REAL,
                    signal_count INTEGER,
                    api_response_time REAL,
                    error_count INTEGER
                )
            ''')
            
            # Alerts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    level TEXT,
                    category TEXT,
                    message TEXT,
                    details TEXT,
                    acknowledged BOOLEAN DEFAULT 0
                )
            ''')
            
            # Model performance table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS model_performance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    model_name TEXT,
                    accuracy REAL,
                    precision_score REAL,
                    recall REAL,
                    f1_score REAL,
                    prediction_count INTEGER
                )
            ''')
            
            conn.commit()
    
    async def start_monitoring(self):
        """Start the monitoring system"""
        self.logger.info("🔍 Starting advanced monitoring system...")
        self.is_running = True
        
        # Start monitoring tasks
        tasks = [
            self.system_monitoring_loop(),
            self.trading_monitoring_loop(),
            self.model_monitoring_loop(),
            self.health_check_loop(),
            self.alert_processing_loop()
        ]
        
        await asyncio.gather(*tasks)
    
    async def system_monitoring_loop(self):
        """Monitor system resources"""
        while self.is_running:
            try:
                # Get system metrics
                cpu_usage = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                network = psutil.net_io_counters()
                process_count = len(psutil.pids())
                
                metrics = {
                    'cpu_usage': cpu_usage,
                    'memory_usage': memory.percent,
                    'disk_usage': (disk.used / disk.total) * 100,
                    'network_io': json.dumps({
                        'bytes_sent': network.bytes_sent,
                        'bytes_recv': network.bytes_recv
                    }),
                    'process_count': process_count
                }
                
                # Store metrics
                self._store_system_metrics(metrics)
                
                # Check thresholds
                await self._check_system_thresholds(metrics)
                
                await asyncio.sleep(60)  # 1-minute intervals
                
            except Exception as e:
                self.logger.error(f"System monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def trading_monitoring_loop(self):
        """Monitor trading system performance"""
        while self.is_running:
            try:
                api_url = self.config.get('monitoring', {}).get('api_url', 'http://localhost:8000')
                
                # Test API response time
                start_time = time.time()
                try:
                    response = requests.get(f"{api_url}/health", timeout=10)
                    api_response_time = time.time() - start_time
                    api_healthy = response.status_code == 200
                except Exception:
                    api_response_time = 10.0
                    api_healthy = False
                
                # Get trading metrics
                trading_metrics = await self._get_trading_metrics(api_url)
                trading_metrics['api_response_time'] = api_response_time
                
                # Store metrics
                self._store_trading_metrics(trading_metrics)
                
                # Check trading thresholds
                await self._check_trading_thresholds(trading_metrics, api_healthy)
                
                await asyncio.sleep(60)  # 1-minute intervals
                
            except Exception as e:
                self.logger.error(f"Trading monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def model_monitoring_loop(self):
        """Monitor ML model performance"""
        while self.is_running:
            try:
                # Get model performance metrics
                model_metrics = await self._get_model_metrics()
                
                if model_metrics:
                    # Store metrics
                    self._store_model_metrics(model_metrics)
                    
                    # Check model thresholds
                    await self._check_model_thresholds(model_metrics)
                
                await asyncio.sleep(300)  # 5-minute intervals
                
            except Exception as e:
                self.logger.error(f"Model monitoring error: {e}")
                await asyncio.sleep(300)
    
    async def health_check_loop(self):
        """Comprehensive health checks"""
        while self.is_running:
            try:
                health_status = await self._comprehensive_health_check()
                
                # Log health status
                if health_status['overall_health'] < 0.8:
                    await self._trigger_alert(
                        AlertLevel.WARNING,
                        "SYSTEM_HEALTH",
                        f"System health degraded: {health_status['overall_health']:.2%}",
                        health_status
                    )
                
                await asyncio.sleep(180)  # 3-minute intervals
                
            except Exception as e:
                self.logger.error(f"Health check error: {e}")
                await asyncio.sleep(180)
    
    async def alert_processing_loop(self):
        """Process and send alerts"""
        while self.is_running:
            try:
                # Check for unacknowledged critical alerts
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        SELECT * FROM alerts 
                        WHERE level IN ('CRITICAL', 'EMERGENCY') 
                        AND acknowledged = 0 
                        AND timestamp > datetime('now', '-1 hour')
                        ORDER BY timestamp DESC
                    ''')
                    
                    critical_alerts = cursor.fetchall()
                
                if critical_alerts:
                    await self._send_alert_notifications(critical_alerts)
                
                await asyncio.sleep(300)  # 5-minute intervals
                
            except Exception as e:
                self.logger.error(f"Alert processing error: {e}")
                await asyncio.sleep(300)
    
    async def _get_trading_metrics(self, api_url: str) -> Dict:
        """Get trading metrics from API"""
        metrics = {
            'active_positions': 0,
            'total_pnl': 0.0,
            'win_rate': 0.0,
            'signal_count': 0,
            'error_count': 0
        }
        
        try:
            # Get positions
            positions_response = requests.get(f"{api_url}/trading/positions", timeout=5)
            if positions_response.status_code == 200:
                positions = positions_response.json()
                metrics['active_positions'] = positions.get('count', 0)
            
            # Get performance metrics
            perf_response = requests.get(f"{api_url}/performance/metrics", timeout=5)
            if perf_response.status_code == 200:
                perf = perf_response.json()
                metrics['total_pnl'] = perf.get('total_pnl', 0.0)
                metrics['win_rate'] = perf.get('win_rate', 0.0)
            
            # Get recent signals
            signals_response = requests.get(f"{api_url}/realtime/signals", timeout=5)
            if signals_response.status_code == 200:
                signals = signals_response.json()
                metrics['signal_count'] = signals.get('count', 0)
            
        except Exception as e:
            self.logger.error(f"Error getting trading metrics: {e}")
            metrics['error_count'] = 1
        
        return metrics
    
    async def _get_model_metrics(self) -> Optional[Dict]:
        """Get ML model performance metrics"""
        try:
            # Try to load recent backtest results
            backtest_file = "reports/backtest_results.json"
            if Path(backtest_file).exists():
                with open(backtest_file, 'r') as f:
                    backtest = json.load(f)
                
                summary = backtest.get("backtest_summary", {})
                return {
                    'model_name': 'trading_model',
                    'accuracy': summary.get('win_rate', 0),
                    'precision_score': summary.get('win_rate', 0),  # Simplified
                    'recall': summary.get('win_rate', 0),
                    'f1_score': summary.get('win_rate', 0),
                    'prediction_count': summary.get('total_trades', 0)
                }
            
        except Exception as e:
            self.logger.error(f"Error getting model metrics: {e}")
        
        return None
    
    async def _comprehensive_health_check(self) -> Dict:
        """Perform comprehensive health check"""
        health_scores = []
        details = {}
        
        # System health
        cpu_usage = psutil.cpu_percent()
        memory_usage = psutil.virtual_memory().percent
        disk_usage = psutil.disk_usage('/').percent
        
        system_score = 1.0
        if cpu_usage > 80:
            system_score -= 0.3
        if memory_usage > 85:
            system_score -= 0.3
        if disk_usage > 90:
            system_score -= 0.4
        
        health_scores.append(max(0, system_score))
        details['system'] = {
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'disk_usage': disk_usage,
            'score': system_score
        }
        
        # API health
        api_score = 1.0
        try:
            api_url = self.config.get('monitoring', {}).get('api_url', 'http://localhost:8000')
            response = requests.get(f"{api_url}/health", timeout=5)
            if response.status_code != 200:
                api_score = 0.0
        except Exception:
            api_score = 0.0
        
        health_scores.append(api_score)
        details['api'] = {'score': api_score}
        
        # Data freshness
        data_score = 1.0
        try:
            # Check if we have recent data
            market_data_file = "data/sample_5m.parquet"
            if Path(market_data_file).exists():
                mod_time = Path(market_data_file).stat().st_mtime
                age = time.time() - mod_time
                if age > 3600:  # 1 hour
                    data_score = max(0, 1.0 - (age - 3600) / 3600)
            else:
                data_score = 0.0
        except Exception:
            data_score = 0.0
        
        health_scores.append(data_score)
        details['data'] = {'score': data_score}
        
        # Model health
        model_score = 1.0
        try:
            model_file = "models/trading_model.joblib"
            if not Path(model_file).exists():
                model_score = 0.0
        except Exception:
            model_score = 0.0
        
        health_scores.append(model_score)
        details['model'] = {'score': model_score}
        
        overall_health = np.mean(health_scores)
        
        return {
            'overall_health': overall_health,
            'components': details,
            'timestamp': datetime.now().isoformat()
        }
    
    async def _check_system_thresholds(self, metrics: Dict):
        """Check system metric thresholds"""
        
        if metrics['cpu_usage'] > self.thresholds['cpu_usage']:
            await self._trigger_alert(
                AlertLevel.WARNING,
                "SYSTEM_RESOURCES",
                f"High CPU usage: {metrics['cpu_usage']:.1f}%",
                metrics
            )
        
        if metrics['memory_usage'] > self.thresholds['memory_usage']:
            await self._trigger_alert(
                AlertLevel.CRITICAL,
                "SYSTEM_RESOURCES",
                f"High memory usage: {metrics['memory_usage']:.1f}%",
                metrics
            )
        
        if metrics['disk_usage'] > self.thresholds['disk_usage']:
            await self._trigger_alert(
                AlertLevel.CRITICAL,
                "SYSTEM_RESOURCES",
                f"High disk usage: {metrics['disk_usage']:.1f}%",
                metrics
            )
    
    async def _check_trading_thresholds(self, metrics: Dict, api_healthy: bool):
        """Check trading metric thresholds"""
        
        if not api_healthy:
            await self._trigger_alert(
                AlertLevel.EMERGENCY,
                "API_HEALTH",
                "Trading API is not responding",
                metrics
            )
        
        if metrics['api_response_time'] > self.thresholds['api_response_time']:
            await self._trigger_alert(
                AlertLevel.WARNING,
                "API_PERFORMANCE",
                f"Slow API response: {metrics['api_response_time']:.2f}s",
                metrics
            )
        
        if metrics['error_count'] > 0:
            await self._trigger_alert(
                AlertLevel.WARNING,
                "TRADING_ERRORS",
                f"Trading errors detected: {metrics['error_count']}",
                metrics
            )
    
    async def _check_model_thresholds(self, metrics: Dict):
        """Check model performance thresholds"""
        
        if metrics['accuracy'] < self.thresholds['model_accuracy']:
            await self._trigger_alert(
                AlertLevel.WARNING,
                "MODEL_PERFORMANCE",
                f"Low model accuracy: {metrics['accuracy']:.2%}",
                metrics
            )
    
    async def _trigger_alert(self, level: str, category: str, message: str, details: Dict):
        """Trigger an alert"""
        
        alert = {
            'timestamp': datetime.now(),
            'level': level,
            'category': category,
            'message': message,
            'details': json.dumps(details, default=str)
        }
        
        # Store alert in database
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO alerts (timestamp, level, category, message, details)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                alert['timestamp'],
                alert['level'],
                alert['category'],
                alert['message'],
                alert['details']
            ))
            conn.commit()
        
        # Log alert
        self.logger.warning(f"🚨 ALERT [{level}] {category}: {message}")
        
        # Add to history
        self.alert_history.append(alert)
        
        # Keep only recent alerts in memory
        if len(self.alert_history) > 1000:
            self.alert_history = self.alert_history[-1000:]
    
    async def _send_alert_notifications(self, alerts: List):
        """Send alert notifications via email/webhook"""
        
        try:
            email_config = self.config.get('alerts', {}).get('email', {})
            webhook_config = self.config.get('alerts', {}).get('webhook', {})
            
            # Email notifications
            if email_config.get('enabled', False):
                await self._send_email_alerts(alerts, email_config)
            
            # Webhook notifications
            if webhook_config.get('enabled', False):
                await self._send_webhook_alerts(alerts, webhook_config)
                
        except Exception as e:
            self.logger.error(f"Error sending alert notifications: {e}")
    
    async def _send_email_alerts(self, alerts: List, config: Dict):
        """Send email alerts"""
        
        try:
            msg = MimeMultipart()
            msg['From'] = config['username']
            msg['To'] = ', '.join(config['recipients'])
            msg['Subject'] = f"Stock AI Trading System - {len(alerts)} Critical Alert(s)"
            
            body = "Critical alerts from Stock AI Trading System:\n\n"
            for alert in alerts:
                body += f"[{alert[3]}] {alert[2]}: {alert[4]}\n"
                body += f"Time: {alert[1]}\n\n"
            
            msg.attach(MimeText(body, 'plain'))
            
            server = smtplib.SMTP(config['smtp_server'], config['smtp_port'])
            server.starttls()
            server.login(config['username'], config['password'])
            server.sendmail(config['username'], config['recipients'], msg.as_string())
            server.quit()
            
            self.logger.info(f"Email alerts sent to {len(config['recipients'])} recipients")
            
        except Exception as e:
            self.logger.error(f"Failed to send email alerts: {e}")
    
    async def _send_webhook_alerts(self, alerts: List, config: Dict):
        """Send webhook alerts"""
        
        try:
            payload = {
                'timestamp': datetime.now().isoformat(),
                'system': 'Stock AI Trading System',
                'alert_count': len(alerts),
                'alerts': [
                    {
                        'level': alert[3],
                        'category': alert[2],
                        'message': alert[4],
                        'timestamp': alert[1]
                    }
                    for alert in alerts
                ]
            }
            
            response = requests.post(config['url'], json=payload, timeout=10)
            if response.status_code == 200:
                self.logger.info("Webhook alerts sent successfully")
            else:
                self.logger.error(f"Webhook alert failed: {response.status_code}")
                
        except Exception as e:
            self.logger.error(f"Failed to send webhook alerts: {e}")
    
    def _store_system_metrics(self, metrics: Dict):
        """Store system metrics in database"""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO system_metrics 
                    (cpu_usage, memory_usage, disk_usage, network_io, process_count)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    metrics['cpu_usage'],
                    metrics['memory_usage'],
                    metrics['disk_usage'],
                    metrics['network_io'],
                    metrics['process_count']
                ))
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing system metrics: {e}")
    
    def _store_trading_metrics(self, metrics: Dict):
        """Store trading metrics in database"""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO trading_metrics 
                    (active_positions, total_pnl, win_rate, signal_count, api_response_time, error_count)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    metrics['active_positions'],
                    metrics['total_pnl'],
                    metrics['win_rate'],
                    metrics['signal_count'],
                    metrics['api_response_time'],
                    metrics['error_count']
                ))
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing trading metrics: {e}")
    
    def _store_model_metrics(self, metrics: Dict):
        """Store model metrics in database"""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO model_performance 
                    (model_name, accuracy, precision_score, recall, f1_score, prediction_count)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    metrics['model_name'],
                    metrics['accuracy'],
                    metrics['precision_score'],
                    metrics['recall'],
                    metrics['f1_score'],
                    metrics['prediction_count']
                ))
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing model metrics: {e}")
    
    def get_monitoring_dashboard(self) -> Dict:
        """Get data for monitoring dashboard"""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Recent system metrics
                system_df = pd.read_sql_query('''
                    SELECT * FROM system_metrics 
                    WHERE timestamp > datetime('now', '-24 hours')
                    ORDER BY timestamp DESC
                ''', conn)
                
                # Recent trading metrics
                trading_df = pd.read_sql_query('''
                    SELECT * FROM trading_metrics 
                    WHERE timestamp > datetime('now', '-24 hours')
                    ORDER BY timestamp DESC
                ''', conn)
                
                # Recent alerts
                alerts_df = pd.read_sql_query('''
                    SELECT * FROM alerts 
                    WHERE timestamp > datetime('now', '-24 hours')
                    ORDER BY timestamp DESC
                    LIMIT 50
                ''', conn)
                
                return {
                    'system_metrics': system_df.to_dict('records'),
                    'trading_metrics': trading_df.to_dict('records'),
                    'recent_alerts': alerts_df.to_dict('records'),
                    'summary': {
                        'total_alerts_24h': len(alerts_df),
                        'critical_alerts_24h': len(alerts_df[alerts_df['level'].isin(['CRITICAL', 'EMERGENCY'])]),
                        'avg_cpu_24h': system_df['cpu_usage'].mean() if not system_df.empty else 0,
                        'avg_memory_24h': system_df['memory_usage'].mean() if not system_df.empty else 0,
                        'current_positions': trading_df['active_positions'].iloc[0] if not trading_df.empty else 0,
                        'total_pnl': trading_df['total_pnl'].iloc[0] if not trading_df.empty else 0
                    }
                }
                
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            return {}
    
    def stop_monitoring(self):
        """Stop the monitoring system"""
        self.logger.info("🛑 Stopping monitoring system...")
        self.is_running = False

async def main():
    """Test the monitoring system"""
    
    monitor = AdvancedMonitor()
    
    try:
        await monitor.start_monitoring()
    except KeyboardInterrupt:
        print("\n🛑 Received interrupt signal, shutting down...")
        monitor.stop_monitoring()

if __name__ == "__main__":
    asyncio.run(main())
