from config import db
from bson import ObjectId
from datetime import datetime, timedelta
import numpy as np
import os
import pickle
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans

DEMAND_MODEL_PATH = 'demand_model.pkl'
GEO_CLUSTERS_PATH = 'geo_clusters.pkl'
_demand_model = None
_geo_clusters = None

# Train demand forecasting model (linear regression)
def train_demand_model():
    events = list(db.events.find())
    X, y = [], []
    for e in events:
        if 'bookings_history' in e and 'start_date' in e:
            weeks = list(range(len(e['bookings_history'])))
            for i, b in enumerate(e['bookings_history']):
                X.append([weeks[i]])
                y.append(b)
    if X:
        model = LinearRegression()
        model.fit(X, y)
        with open(DEMAND_MODEL_PATH, 'wb') as f:
            pickle.dump(model, f)
        global _demand_model
        _demand_model = model

# Load demand model
def load_demand_model():
    global _demand_model
    if os.path.exists(DEMAND_MODEL_PATH):
        with open(DEMAND_MODEL_PATH, 'rb') as f:
            _demand_model = pickle.load(f)
    else:
        _demand_model = None

# Train geo clusters (KMeans)
def train_geo_clusters():
    events = list(db.events.find())
    coords = []
    for e in events:
        loc = e.get('location', {})
        if 'lat' in loc and 'lng' in loc:
            coords.append([loc['lat'], loc['lng']])
    if coords:
        kmeans = KMeans(n_clusters=min(5, len(coords)))
        kmeans.fit(coords)
        with open(GEO_CLUSTERS_PATH, 'wb') as f:
            pickle.dump(kmeans, f)
        global _geo_clusters
        _geo_clusters = kmeans

# Load geo clusters
def load_geo_clusters():
    global _geo_clusters
    if os.path.exists(GEO_CLUSTERS_PATH):
        with open(GEO_CLUSTERS_PATH, 'rb') as f:
            _geo_clusters = pickle.load(f)
    else:
        _geo_clusters = None

# Main analytics function
def get_business_insights(business_id=None, event_id=None):
    now = datetime.utcnow()
    last_month = now - timedelta(days=30)
    load_demand_model()
    load_geo_clusters()
    if event_id:
        event = db.events.find_one({"_id": ObjectId(event_id)})
        views = event.get("views", 0) if event else 0
        bookings = event.get("bookings", 0) if event else 0
        revenue = event.get("revenue", 0.0) if event else 0.0
        feedback = list(db.feedback.find({"event_id": event_id}))
        top_feedback = [f.get("text", "") for f in feedback[-3:]]
        # Demand forecasting: use ML model if available
        forecast = bookings
        if 'bookings_history' in event:
            weeks = np.array([[i] for i in range(len(event['bookings_history']))])
            if _demand_model:
                forecast = float(_demand_model.predict([[len(event['bookings_history'])]])[0])
            else:
                forecast = np.mean(event['bookings_history'][-4:])
        # TODO: Add geo/pricing optimization
        return {
            "event_id": event_id,
            "performance": {
                "views": views,
                "bookings": bookings,
                "revenue": revenue
            },
            "demand_forecast": forecast,
            "top_feedback": top_feedback,
            "optimization_tips": [
                "Promote your event on weekends for higher turnout.",
                "Offer group discounts to boost bookings."
            ]
        }
    elif business_id:
        events = list(db.events.find({"business_id": business_id}))
        total_views = sum(e.get("views", 0) for e in events)
        total_bookings = sum(e.get("bookings", 0) for e in events)
        total_revenue = sum(e.get("revenue", 0.0) for e in events)
        feedback = list(db.feedback.find({"business_id": business_id}))
        top_feedback = [f.get("text", "") for f in feedback[-3:]]
        # Demand forecasting: use ML model if available
        all_bookings = []
        for e in events:
            if "bookings_history" in e:
                all_bookings.extend(e["bookings_history"][-4:])
        forecast = np.mean(all_bookings) if all_bookings else total_bookings
        if _demand_model and all_bookings:
            forecast = float(_demand_model.predict([[len(all_bookings)]])[0])
        # Geo-optimization: use clusters if available
        coords = []
        for e in events:
            loc = e.get("location", {})
            if 'lat' in loc and 'lng' in loc:
                coords.append([loc['lat'], loc['lng']])
        cluster_centers = []
        if _geo_clusters and coords:
            labels = _geo_clusters.predict(coords)
            for i in range(_geo_clusters.n_clusters):
                cluster_points = np.array(coords)[labels == i]
                if len(cluster_points) > 0:
                    center = cluster_points.mean(axis=0).tolist()
                    cluster_centers.append(center)
        # Pricing optimization: best price by booking rate
        price_bookings = [(e.get("price", 0), e.get("bookings", 0)) for e in events if e.get("price")]
        if price_bookings:
            best_price = max(price_bookings, key=lambda x: x[1])[0]
        else:
            best_price = None
        return {
            "business_id": business_id,
            "performance": {
                "views": total_views,
                "bookings": total_bookings,
                "revenue": total_revenue
            },
            "demand_forecast": forecast,
            "geo_clusters": cluster_centers,
            "best_price": best_price,
            "top_feedback": top_feedback,
            "optimization_tips": [
                f"Host more events near {cluster_centers[0]} for higher demand." if cluster_centers else "Host more events in high-demand locations.",
                f"Try pricing around {best_price} for optimal bookings." if best_price else "Experiment with dynamic pricing for better revenue."
            ]
        }
    else:
        return {"error": "Provide either business_id or event_id"} 