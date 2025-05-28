# IBCM-ai Microservice Documentation

---

## Overview: What Does the AI Do?

**IBCM-ai** is a modular, self-hosted AI microservice that powers the intelligence behind your local, dynamic, and business-driven platform. It provides:

- **Semantic search** for events, products, and services (geo/time/context-aware)
- **Personalized recommendations** for users (collaborative + content-based)
- **Sentiment analysis** for reviews and feedback
- **User analytics** (engagement, churn risk, segmentation)
- **Business/event analytics** (performance, demand, geo, pricing)
- **ML-based churn, demand, and geo models** (logistic regression, linear regression, clustering)
- **Campaign generation, real-time alerts, anomaly detection**
- **Continuous learning and retraining** from user/business feedback and actions

---

## Architecture

- **FastAPI** Python microservice
- **MongoDB** for all data (users, events, interactions, feedback, etc.)
- **ML models**: LightFM, scikit-learn, HuggingFace transformers, KMeans, etc.
- **Retraining pipeline** (`retrain.py`) for continuous improvement
- **REST API** endpoints for all features

---

## API Endpoints

### 1. Search & Recommendations

#### `GET /search`
- **Description:** Semantic search for events/products/services.
- **Query Params:** `query`, `location`, `time_window`
- **Response:** List of relevant events with scores.

#### `GET /recommend`
- **Description:** Personalized recommendations for a user.
- **Query Params:** `user_id`, `n`
- **Response:** List of recommended events/products.

---

### 2. Content & Sentiment

#### `POST /generate-description`
- **Description:** Generate event/product description.
- **Body:** `{ "title": "...", "category": "...", "context": "..." }`
- **Response:** `{ "description": "..." }`

#### `POST /analyze-sentiment`
- **Description:** Sentiment analysis for text.
- **Body:** `{ "text": "..." }`
- **Response:** `{ "sentiment": "positive|negative", "confidence": 0.95 }`

---

### 3. Analytics

#### `POST /user-analytics`
- **Description:** User engagement, churn, and segmentation.
- **Body:** `{ "user_id": "..." }`
- **Response:** `{ "churn_risk": 0.1, "segment": "active_user", ... }`

#### `POST /business-analytics`
- **Description:** Business/event performance, demand, geo, pricing.
- **Body:** `{ "business_id": "...", "event_id": "..." }`
- **Response:** `{ "demand_forecast": ..., "geo_clusters": [...], ... }`

---

### 4. Feedback & Learning

#### `POST /feedback` (Backend endpoint)
- **Description:** Log user/business feedback.
- **Body:** `{ "user_id": "...", "target_id": "...", "feedback": 1, "comment": "...", "type": "recommendation" }`
- **Response:** `{ "success": true }`

---

### 5. Advanced Business Tools

#### `POST /generate-campaign`
- **Description:** Generate marketing copy, hashtags, and best posting times.
- **Body:** `{ "business_id": "...", "event_id": "...", "context": "..." }`
- **Response:** `{ "campaign_copy": "...", "hashtags": [...], "best_times": [...] }`

#### `POST /real-time-alerts`
- **Description:** Get real-time business/user alerts.
- **Body:** `{ "business_id": "...", "event_id": "..." }`
- **Response:** `{ "alerts": [...] }`

#### `POST /detect-anomalies`
- **Description:** Detect booking/revenue/user activity anomalies.
- **Body:** `{ "business_id": "...", "event_id": "..." }`
- **Response:** `{ "anomalies": [...] }`

---

## Integration with Backend and Database

- **MongoDB** is the single source of truth for all user, event, interaction, and feedback data.
- **Backend** logs all user/business actions and feedback to MongoDB.
- **AI microservice** reads from MongoDB for analytics, model training, and predictions.
- **Retraining** is triggered via `retrain.py` (can be scheduled).

---

## Retraining and Continuous Learning

- **Run `retrain.py`** to update all ML models (recommendation, churn, demand, geo).
- **Feedback** is used as labels for model improvement.
- **Schedule retraining** (e.g., daily/weekly) for continuous learning.

---

## Extending the AI

- **Add new endpoints** as business needs grow (e.g., campaign generator, anomaly detection).
- **Plug in new models** (AutoML, deep learning, etc.) as your data grows.
- **Integrate with dashboards** for real-time business/user insights.

---

## Monitoring and Best Practices

- **Log all API requests, errors, and latency** for monitoring and debugging.
- **Monitor model performance** and retrain as needed.
- **Collect and use feedback** for continuous improvement.

---

## For Developers

- **All endpoints are RESTful and JSON-based.**
- **Models and retraining logic are modular and easy to extend.**
- **Feedback and analytics are central to all learning and improvement.**

---

## For Business Users

- **Actionable insights** for user engagement, churn, demand, geo, and pricing.
- **Real-time alerts** for business-critical events.
- **Automated campaign and content suggestions** to boost marketing and sales.

---

## How to Get Started

1. **Run the AI microservice** (`uvicorn main:app --reload --host 0.0.0.0 --port 8001`)
2. **Connect your backend** to log all actions and feedback to MongoDB.
3. **Call the AI endpoints** from your backend or dashboards.
4. **Retrain models** regularly with `python retrain.py`.
5. **Iterate and expand** as your business and data grow.

---

**For more details, see the codebase or contact the AI team.** 

IBCM-ai Microservice Documentation
Overview: What Does the AI Do?
IBCM-ai is a modular, self-hosted AI microservice that powers the intelligence behind your local, dynamic, and business-driven platform. It provides:
Semantic search for events, products, and services (geo/time/context-aware)
Personalized recommendations for users (collaborative + content-based)
Sentiment analysis for reviews and feedback
User analytics (engagement, churn risk, segmentation)
Business/event analytics (performance, demand, geo, pricing)
ML-based churn, demand, and geo models (logistic regression, linear regression, clustering)
Campaign generation, real-time alerts, anomaly detection
Continuous learning and retraining from user/business feedback and actions
Architecture
FastAPI Python microservice
MongoDB for all data (users, events, interactions, feedback, etc.)
ML models: LightFM, scikit-learn, HuggingFace transformers, KMeans, etc.
Retraining pipeline (retrain.py) for continuous improvement
REST API endpoints for all features
API Endpoints
1. Search & Recommendations
GET /search
Description: Semantic search for events/products/services.
Query Params: query, location, time_window
Response: List of relevant events with scores.
GET /recommend
Description: Personalized recommendations for a user.
Query Params: user_id, n
Response: List of recommended events/products.
2. Content & Sentiment
POST /generate-description
Description: Generate event/product description.
Body: { "title": "...", "category": "...", "context": "..." }
Response: { "description": "..." }
POST /analyze-sentiment
Description: Sentiment analysis for text.
Body: { "text": "..." }
Response: { "sentiment": "positive|negative", "confidence": 0.95 }
3. Analytics
POST /user-analytics
Description: User engagement, churn, and segmentation.
Body: { "user_id": "..." }
Response: { "churn_risk": 0.1, "segment": "active_user", ... }
POST /business-analytics
Description: Business/event performance, demand, geo, pricing.
Body: { "business_id": "...", "event_id": "..." }
Response: { "demand_forecast": ..., "geo_clusters": [...], ... }
4. Feedback & Learning
POST /feedback (Backend endpoint)
Description: Log user/business feedback.
Body: { "user_id": "...", "target_id": "...", "feedback": 1, "comment": "...", "type": "recommendation" }
Response: { "success": true }
5. Advanced Business Tools
POST /generate-campaign
Description: Generate marketing copy, hashtags, and best posting times.
Body: { "business_id": "...", "event_id": "...", "context": "..." }
Response: { "campaign_copy": "...", "hashtags": [...], "best_times": [...] }
POST /real-time-alerts
Description: Get real-time business/user alerts.
Body: { "business_id": "...", "event_id": "..." }
Response: { "alerts": [...] }
POST /detect-anomalies
Description: Detect booking/revenue/user activity anomalies.
Body: { "business_id": "...", "event_id": "..." }
Response: { "anomalies": [...] }
Integration with Backend and Database
MongoDB is the single source of truth for all user, event, interaction, and feedback data.
Backend logs all user/business actions and feedback to MongoDB.
AI microservice reads from MongoDB for analytics, model training, and predictions.
Retraining is triggered via retrain.py (can be scheduled).
Retraining and Continuous Learning
Run retrain.py to update all ML models (recommendation, churn, demand, geo).
Feedback is used as labels for model improvement.
Schedule retraining (e.g., daily/weekly) for continuous learning.
Extending the AI
Add new endpoints as business needs grow (e.g., campaign generator, anomaly detection).
Plug in new models (AutoML, deep learning, etc.) as your data grows.
Integrate with dashboards for real-time business/user insights.
Monitoring and Best Practices
Log all API requests, errors, and latency for monitoring and debugging.
Monitor model performance and retrain as needed.
Collect and use feedback for continuous improvement.
For Developers
All endpoints are RESTful and JSON-based.
Models and retraining logic are modular and easy to extend.
Feedback and analytics are central to all learning and improvement.
For Business Users
Actionable insights for user engagement, churn, demand, geo, and pricing.
Real-time alerts for business-critical events.
Automated campaign and content suggestions to boost marketing and sales.
How to Get Started
Run the AI microservice (uvicorn main:app --reload --host 0.0.0.0 --port 8001)
Connect your backend to log all actions and feedback to MongoDB.
Call the AI endpoints from your backend or dashboards.
Retrain models regularly with python retrain.py.
Iterate and expand as your business and data grow.
This documentation can be saved as AI-DOCUMENTATION.md in your repo. If you want a more detailed Swagger/OpenAPI spec, or a developer onboarding guide, just ask

What’s Complete
Comprehensive AI microservice (search, recommend, analytics, feedback, campaign, alerts, anomaly detection)
Open-source, modular, and self-hosted (no OpenAI dependency)
Continuous learning and retraining (with feedback loop)
Real-time and batch analytics for users and businesses
Advanced ML models (churn, demand, geo, pricing)
Production-ready API endpoints (documented in AI-DOCUMENTATION.md)
Backend integration (feedback logging, MongoDB, retraining)
Ready for dashboard integration and business use
Extensible for future business needs
🟢 What’s Optional/Next-Level (if you want to go even further)
Swagger/OpenAPI auto-generated docs for developer onboarding and API testing
AutoML or deep learning models for even smarter predictions
Real-time streaming analytics (Kafka, Spark, etc.) for instant feedback and alerts
Explainable AI (showing “why” a prediction or recommendation was made)
Automated A/B testing for new models and business strategies
User-facing feedback widgets for explicit ratings on recommendations/content
Model monitoring dashboards (Prometheus, Grafana, etc.)
CI/CD for AI retraining and deployment