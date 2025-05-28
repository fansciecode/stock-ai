from config import db
from lightfm import LightFM
from lightfm.data import Dataset
import numpy as np

# Cache model and data for MVP
_model = None
_dataset = None
_user_id_map = None
_event_id_map = None
_event_id_reverse_map = None

# Helper to fetch and prepare data
def _prepare_data():
    global _model, _dataset, _user_id_map, _event_id_map, _event_id_reverse_map
    users = list(db.users.find())
    events = list(db.events.find())
    interactions = list(db.interactions.find())
    user_ids = [str(u['_id']) for u in users]
    event_ids = [str(e['_id']) for e in events]
    # Build LightFM dataset
    dataset = Dataset()
    dataset.fit(user_ids, event_ids)
    # Build interactions list
    interactions_list = []
    for inter in interactions:
        uid = str(inter['user_id'])
        eid = str(inter['event_id'])
        interactions_list.append((uid, eid))
    (interactions_matrix, _) = dataset.build_interactions(interactions_list)
    # Train model
    model = LightFM(loss='warp')
    model.fit(interactions_matrix, epochs=10, num_threads=2)
    # Build id maps
    user_id_map, user_id_reverse_map, event_id_map, event_id_reverse_map = dataset.mapping()[0], dataset.mapping()[2], dataset.mapping()[1], dataset.mapping()[3]
    # Cache
    _model = model
    _dataset = dataset
    _user_id_map = user_id_map
    _event_id_map = event_id_map
    _event_id_reverse_map = event_id_reverse_map
    return users, events

# Recommend top-N events for a user
def recommend_events_for_user(user_id, n=5):
    global _model, _dataset, _user_id_map, _event_id_map, _event_id_reverse_map
    if _model is None or _dataset is None:
        users, events = _prepare_data()
    if user_id not in _user_id_map:
        return []
    user_x = _user_id_map[user_id]
    scores = _model.predict(user_x, np.arange(len(_event_id_map)))
    top_items = np.argsort(scores)[::-1][:n]
    # Map back to event IDs
    event_ids = list(_event_id_map.keys())
    recommended = [event_ids[i] for i in top_items]
    # Fetch event details
    events = list(db.events.find({"_id": {"$in": [e for e in recommended]}}))
    return events

# Example: Fetch user and event data from MongoDB
def fetch_user_event_data():
    users = list(db.users.find())
    events = list(db.events.find())
    interactions = list(db.interactions.find())
    return users, events, interactions

# Placeholder for retraining logic
def retrain_recommendation_model():
    _prepare_data() 