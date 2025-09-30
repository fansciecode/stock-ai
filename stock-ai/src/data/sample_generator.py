import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import yaml

class SyntheticDataGenerator:
    def __init__(self, config_path="configs/data_sources.yaml"):
        try:
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)
        except FileNotFoundError:
            # Default config if file not found
            self.config = {
                'sample': {
                    'instruments': ['SAMPLE_STOCK', 'SAMPLE_CRYPTO']
                }
            }
        os.makedirs("data", exist_ok=True)

    def generate_random_walk(self, n_points=2000, start_price=100.0, freq_minutes=5, seed=42, instrument="SAMPLE"):
        """Generate synthetic OHLCV data with realistic patterns"""
        np.random.seed(seed)
        
        # Create time index
        start_time = datetime.utcnow() - timedelta(minutes=freq_minutes * n_points)
        times = [start_time + timedelta(minutes=freq_minutes * i) for i in range(n_points)]
        
        # Generate price with trend and volatility clustering
        trend = 0.0001  # slight upward bias
        volatility = 0.002
        returns = np.random.normal(loc=trend, scale=volatility, size=n_points)
        
        # Add volatility clustering
        garch_vol = np.zeros(n_points)
        garch_vol[0] = volatility
        for i in range(1, n_points):
            garch_vol[i] = 0.1 * volatility + 0.85 * garch_vol[i-1] + 0.05 * returns[i-1]**2
            returns[i] = np.random.normal(0, garch_vol[i])
        
        # Calculate prices
        prices = start_price * np.exp(np.cumsum(returns))
        
        # Generate volumes with correlation to volatility
        volumes = (np.random.lognormal(mean=3.5, sigma=0.8, size=n_points) * 
                  (1 + 2 * garch_vol / volatility) * 100).astype(int)
        
        # Create OHLC data
        df = pd.DataFrame({
            "ts": times,
            "close": prices,
            "volume": volumes
        })
        
        # Generate open, high, low with realistic relationships
        df["open"] = df["close"].shift(1).fillna(df["close"].iloc[0])
        
        # High and low based on intrabar volatility
        intrabar_vol = np.random.uniform(0.001, 0.003, size=n_points)
        df["high"] = df[["open", "close"]].max(axis=1) * (1 + intrabar_vol)
        df["low"] = df[["open", "close"]].min(axis=1) * (1 - intrabar_vol)
        
        # Ensure OHLC consistency
        df["high"] = df[["open", "high", "low", "close"]].max(axis=1)
        df["low"] = df[["open", "high", "low", "close"]].min(axis=1)
        
        df = df[["ts", "open", "high", "low", "close", "volume"]].copy()
        df["instrument"] = instrument
        
        return df

    def generate_multiple_instruments(self, instruments=None, **kwargs):
        """Generate data for multiple instruments"""
        if instruments is None:
            instruments = self.config.get('sample', {}).get('instruments', ['SAMPLE_STOCK'])
        
        all_data = []
        for i, instrument in enumerate(instruments):
            df = self.generate_random_walk(seed=42+i, instrument=instrument, **kwargs)
            all_data.append(df)
        
        combined = pd.concat(all_data, ignore_index=True)
        output_path = "data/sample_5m.parquet"
        combined.to_parquet(output_path, index=False)
        print(f"Generated data for {len(instruments)} instruments: {len(combined)} rows")
        print(f"Saved to: {output_path}")
        return combined

    def generate_market_scenarios(self):
        """Generate different market scenarios for testing"""
        scenarios = {
            'trending_up': {'trend': 0.0005, 'volatility': 0.002},
            'trending_down': {'trend': -0.0005, 'volatility': 0.002},
            'sideways': {'trend': 0.0, 'volatility': 0.001},
            'high_volatility': {'trend': 0.0, 'volatility': 0.005}
        }
        
        for scenario_name, params in scenarios.items():
            # Modify the generator to use these parameters
            df = self.generate_random_walk(
                n_points=1000, 
                instrument=f"SCENARIO_{scenario_name.upper()}",
                seed=hash(scenario_name) % 1000
            )
            output_path = f"data/scenario_{scenario_name}.parquet"
            df.to_parquet(output_path, index=False)
            print(f"Generated {scenario_name} scenario: {output_path}")

def main():
    generator = SyntheticDataGenerator()
    
    # Generate main sample data
    generator.generate_multiple_instruments()
    
    # Generate market scenarios
    generator.generate_market_scenarios()

if __name__ == "__main__":
    main()
