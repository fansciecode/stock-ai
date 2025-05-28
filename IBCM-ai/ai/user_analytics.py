from config import db
from datetime import datetime, timedelta
import numpy as np
import os
import pickle
from sklearn.linear_model import LogisticRegression

CHURN_MODEL_PATH = 'churn_model.pkl'
_churn_model = None

# Train churn model and save to disk
def train_churn_model():
    now = datetime.utcnow()
    last_month = now - timedelta(days=30)
    users = list(db.users.find())
    X, y = [], []
    for user in users:
        user_id = user['_id']
        interactions = list(db.interactions.find({"user_id": user_id, "timestamp": {"$gte": last_month}}))
        engagement = len(interactions) / 30.0
        bookings = [i for i in interactions if i.get('type') == 'book']
        days_since_last_booking = (now - max([i['timestamp'] for i in bookings], default=last_month)).days if bookings else 30
        # Label: churned if no bookings in 30 days or engagement < 0.5
        label = 1 if not bookings or engagement < 0.5 else 0
        X.append([engagement, days_since_last_booking])
        y.append(label)
    if X:
        model = LogisticRegression()
        model.fit(X, y)
        with open(CHURN_MODEL_PATH, 'wb') as f:
            pickle.dump(model, f)
        global _churn_model
        _churn_model = model

# Load churn model from disk
def load_churn_model():
    global _churn_model
    if os.path.exists(CHURN_MODEL_PATH):
        with open(CHURN_MODEL_PATH, 'rb') as f:
            _churn_model = pickle.load(f)
    else:
        _churn_model = None

# Main analytics function
def get_user_insights(user_id):
    now = datetime.utcnow()
    last_month = now - timedelta(days=30)
    interactions = list(db.interactions.find({
        "user_id": user_id,
        "timestamp": {"$gte": last_month}
    }))
    event_ids = [i["event_id"] for i in interactions if "event_id" in i]
    events = list(db.events.find({"_id": {"$in": event_ids}})) if event_ids else []
    category_counts = {}
    for e in events:
        cat = e.get("category", "other")
        category_counts[cat] = category_counts.get(cat, 0) + 1
    top_categories = sorted(category_counts, key=category_counts.get, reverse=True)[:3]
    recent_searches = [i["query"] for i in interactions if i.get("type") == "search"]
    recent_bookings = [i["event_id"] for i in interactions if i.get("type") == "book"]
    engagement_score = len(interactions) / 30.0
    days_since_last_booking = (now - max([i['timestamp'] for i in interactions if i.get('type') == 'book'], default=last_month)).days if recent_bookings else 30
    # ML-based churn prediction if model is available
    load_churn_model()
    if _churn_model:
        churn_risk = float(_churn_model.predict_proba([[engagement_score, days_since_last_booking]])[0][1])
    else:
        churn_risk = 1.0 if not recent_bookings or engagement_score < 0.5 else 0.1
    if engagement_score > 2:
        segment = "power_user"
    elif engagement_score > 1:
        segment = "active_user"
    else:
        segment = "at_risk"
    return {
        "user_id": user_id,
        "top_categories": top_categories,
        "recent_searches": recent_searches[-5:],
        "recent_bookings": recent_bookings[-5:],
        "engagement_score": engagement_score,
        "churn_risk": churn_risk,
        "segment": segment,
        "suggestions": [
            "Explore more in your favorite categories!",
            "Check out new events in your area."
        ]
    } 