from fastapi import FastAPI, Body, Query
from pydantic import BaseModel
from ai import text_generation, recommend, search, sentiment
from ai import user_analytics, business_analytics

app = FastAPI()

API_BASE_URL = "https://api.ibcm.app/api"

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

class BusinessAnalyticsRequest(BaseModel):
    business_id: str = None
    event_id: str = None

class CampaignRequest(BaseModel):
    business_id: str = None
    event_id: str = None
    context: str = ""

class RealTimeAlertsRequest(BaseModel):
    business_id: str = None
    event_id: str = None

class AnomalyDetectionRequest(BaseModel):
    business_id: str = None
    event_id: str = None

@app.get("/")
def root():
    return {"message": "IBCM-ai microservice is running."}

@app.post("/generate-description")
def generate_description(req: DescriptionRequest):
    desc = text_generation.generate_event_description(req.title, req.category, req.context)
    return {"description": desc}

@app.get("/recommend")
def recommend_events(user_id: str = Query(...), n: int = Query(5)):
    events = recommend.recommend_events_for_user(user_id, n)
    return {"recommended_events": events}

@app.get("/search")
def search_events(
    query: str = Query(...),
    location: str = Query(None),
    time_window: str = Query(None)
):
    results = search.search_events(query, location, time_window)
    return {"results": results}

@app.post("/analyze-sentiment")
def analyze_sentiment(req: SentimentRequest):
    result = sentiment.analyze_sentiment(req.text)
    return result

@app.post("/auto-reply")
def auto_reply(req: AutoReplyRequest):
    # TODO: Replace with real auto-reply logic
    return {
        "reply": f"Auto-reply to: {req.message}",
        "suggestedActions": [],
        "confidence": 1.0
    }

@app.post("/user-analytics")
def user_analytics_endpoint(req: UserAnalyticsRequest):
    result = user_analytics.get_user_insights(req.user_id)
    return result

@app.post("/business-analytics")
def business_analytics_endpoint(req: BusinessAnalyticsRequest):
    result = business_analytics.get_business_insights(req.business_id, req.event_id)
    return result

@app.post("/generate-campaign")
def generate_campaign(req: CampaignRequest):
    # TODO: Implement real campaign generation logic
    return {
        "campaign_copy": f"Promote your event/business with: {req.context}",
        "hashtags": ["#trending", "#local", "#event"],
        "best_times": ["Friday 6pm", "Saturday 11am"]
    }

@app.post("/real-time-alerts")
def real_time_alerts(req: RealTimeAlertsRequest):
    # TODO: Implement real-time alert logic
    return {
        "alerts": [
            "Demand spike detected for your event!",
            "Negative feedback received: 'Service was slow.'"
        ]
    }

@app.post("/detect-anomalies")
def detect_anomalies(req: AnomalyDetectionRequest):
    # TODO: Implement anomaly detection logic
    return {
        "anomalies": [
            {"type": "booking_drop", "details": "Bookings dropped 50% this week."},
            {"type": "revenue_spike", "details": "Revenue spiked 2x on Saturday."}
        ]
    }

# TODO: Implement /generate-description endpoint
# TODO: Implement /recommend endpoint
# TODO: Implement /search endpoint 