from config import db
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Load a pre-trained sentence transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Cache event embeddings in memory for MVP
_event_cache = None
_event_embeddings = None

# Helper to load and embed events
def _load_and_embed_events():
    global _event_cache, _event_embeddings
    _event_cache = list(db.events.find())
    texts = [f"{e.get('title', '')} {e.get('description', '')} {e.get('category', '')}" for e in _event_cache]
    _event_embeddings = model.encode(texts, show_progress_bar=False)

# Semantic search implementation
def search_events(query, location=None, time_window=None, top_k=10):
    global _event_cache, _event_embeddings
    if _event_cache is None or _event_embeddings is None:
        _load_and_embed_events()
    # Embed the query
    query_emb = model.encode([query])[0].reshape(1, -1)
    # Compute cosine similarity
    sims = cosine_similarity(query_emb, _event_embeddings)[0]
    # Get top_k indices
    top_idx = np.argsort(sims)[::-1][:top_k]
    # Optionally filter by location/time here
    results = []
    for idx in top_idx:
        event = _event_cache[idx]
        event['score'] = float(sims[idx])
        results.append(event)
    return results

# Example: Fetch events from MongoDB
def fetch_events():
    return list(db.events.find())

# Placeholder for retraining logic
def retrain_search_model():
    events = fetch_events()
    # TODO: Use this data to retrain search model (e.g., vectorizer, embedding index)
    pass 