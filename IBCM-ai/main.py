from fastapi import FastAPI, Body, Query, Header, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ai import text_generation, recommend, search, sentiment
from ai import user_analytics, business_analytics
import time
import uuid

app = FastAPI()

API_BASE_URL = "https://api.ibcm.app/api"
API_KEY = "development_key"  # In production, use environment variable

# API key authentication
def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

class DescriptionRequest(BaseModel):
    title: str
    category: str
    context: str = ""

class SentimentRequest(BaseModel):
    text: str

class AutoReplyRequest(BaseModel):
    message: str
    context: dict = {}

class UserAnalyticsRequest(BaseModel):
    user_id: str
    period: str = "month"

class BusinessAnalyticsRequest(BaseModel):
    business_id: str
    period: str = "month"

class CampaignRequest(BaseModel):
    business_id: str
    event_id: str = None
    context: str = ""

class RealTimeAlertsRequest(BaseModel):
    business_id: str = None
    event_id: str = None

class AnomalyDetectionRequest(BaseModel):
    business_id: str = None
    event_id: str = None

class SearchRequest(BaseModel):
    query: str
    user_id: str
    filters: Dict[str, Any] = None
    location: Dict[str, Any] = None
    preferences: Dict[str, Any] = None

class FeedbackRequest(BaseModel):
    user_id: str
    target_id: str
    feedback: float
    comment: Optional[str] = None
    type: str

class GenerateTagsRequest(BaseModel):
    content: str
    count: int = 5

class LocationRecommendationRequest(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    radius: float = 10.0
    category: Optional[str] = None
    limit: int = 10

class UserPreferencesRequest(BaseModel):
    user_id: str
    preferences: Dict[str, Any]

@app.get("/")
def root():
    return {"message": "IBCM-ai microservice is running."}

@app.post("/generate-description", dependencies=[Depends(verify_api_key)])
def generate_description(req: DescriptionRequest):
    desc = text_generation.generate_event_description(req.title, req.category, req.context)
    return {"content": desc}

@app.post("/generate-tags", dependencies=[Depends(verify_api_key)])
def generate_tags(req: GenerateTagsRequest):
    tags = text_generation.generate_tags(req.content, req.count)
    return tags

@app.get("/recommend", dependencies=[Depends(verify_api_key)])
def recommend_events(user_id: str = Query(...), n: int = Query(5)):
    events = recommend.recommend_events_for_user(user_id, n)
    return {"recommended_events": events}

@app.post("/search", dependencies=[Depends(verify_api_key)])
def search_events(req: SearchRequest):
    results = search.enhanced_search(
        req.query, 
        req.user_id,
        req.filters,
        req.location,
        req.preferences
    )
    return results

@app.post("/analyze-sentiment", dependencies=[Depends(verify_api_key)])
def analyze_sentiment(req: SentimentRequest):
    result = sentiment.analyze_sentiment(req.text)
    return result

@app.post("/auto-reply", dependencies=[Depends(verify_api_key)])
def auto_reply(req: AutoReplyRequest):
    # TODO: Replace with real auto-reply logic
    return {
        "reply": f"Auto-reply to: {req.message}",
        "suggestedActions": [],
        "confidence": 1.0
    }

@app.get("/user/insights", dependencies=[Depends(verify_api_key)])
def user_insights(user_id: str = Query(...), period: str = Query("month")):
    result = user_analytics.get_user_insights(user_id, period)
    return result

@app.get("/user/preferences", dependencies=[Depends(verify_api_key)])
def get_user_preferences(user_id: str = Query(...)):
    preferences = user_analytics.get_user_preferences(user_id)
    return preferences

@app.put("/user/preferences", dependencies=[Depends(verify_api_key)])
def update_user_preferences(req: UserPreferencesRequest):
    updated = user_analytics.update_user_preferences(req.user_id, req.preferences)
    return updated

@app.get("/business-analytics", dependencies=[Depends(verify_api_key)])
def business_analytics_endpoint(business_id: str = Query(...), period: str = Query("month")):
    result = business_analytics.get_business_insights(business_id, period)
    return result

@app.post("/generate-campaign", dependencies=[Depends(verify_api_key)])
def generate_campaign(req: CampaignRequest):
    campaign = text_generation.generate_campaign(req.business_id, req.event_id, req.context)
    return campaign

@app.post("/feedback", dependencies=[Depends(verify_api_key)])
def submit_feedback(req: FeedbackRequest):
    # Log feedback for AI learning
    success = user_analytics.log_feedback(
        req.user_id,
        req.target_id,
        req.feedback,
        req.comment,
        req.type
    )
    return {"success": success, "message": "Feedback recorded"}

@app.post("/location-recommendations", dependencies=[Depends(verify_api_key)])
def location_recommendations(req: LocationRecommendationRequest):
    recommendations = recommend.get_location_recommendations(
        req.user_id,
        req.latitude,
        req.longitude,
        req.radius,
        req.category,
        req.limit
    )
    return recommendations

@app.get("/search/history", dependencies=[Depends(verify_api_key)])
def search_history(user_id: str = Query(...), limit: int = Query(10)):
    history = search.get_search_history(user_id, limit)
    return history

@app.get("/search/insights", dependencies=[Depends(verify_api_key)])
def search_insights(user_id: str = Query(...)):
    insights = search.get_search_insights(user_id)
    return insights

@app.post("/search/track", dependencies=[Depends(verify_api_key)])
def track_search(
    user_id: str = Body(...),
    query: str = Body(...),
    filters: Dict[str, Any] = Body(None),
    location: Dict[str, Any] = Body(None)
):
    success = search.track_search(user_id, query, filters, location)
    return {"success": success}

@app.post("/real-time-alerts", dependencies=[Depends(verify_api_key)])
def real_time_alerts(req: RealTimeAlertsRequest):
    # TODO: Implement real-time alert logic
    return {
        "alerts": [
            "Demand spike detected for your event!",
            "Negative feedback received: 'Service was slow.'"
        ]
    }

@app.post("/detect-anomalies", dependencies=[Depends(verify_api_key)])
def detect_anomalies(req: AnomalyDetectionRequest):
    # TODO: Implement anomaly detection logic
    return {
        "anomalies": [
            {"type": "booking_drop", "details": "Bookings dropped 50% this week."},
            {"type": "revenue_spike", "details": "Revenue spiked 2x on Saturday."}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 