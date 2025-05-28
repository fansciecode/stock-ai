# IBCM-ai Integration Guide

---

## 1. Prerequisites

- **Backend server** is running in Docker (Node.js/Express, etc.)
- **MongoDB** is running (with sample data: users, events, payments, etc.)
- **IBCM-ai microservice** is set up (FastAPI, Python, with all endpoints and retraining scripts)
- **Network:** All services (backend, MongoDB, AI) are on the same Docker network or can reach each other

---

## 2. Architecture Overview

```
[Android App] <-> [Backend API (Docker)] <-> [IBCM-ai Microservice] <-> [MongoDB (Docker)]
```

- **Backend** handles all user/business requests, logs actions/feedback to MongoDB, and calls AI endpoints as needed.
- **IBCM-ai** reads from MongoDB, provides analytics, recommendations, predictions, and more.

---

## 3. Integration Steps

### A. Connect Backend to IBCM-ai

1. **Set AI Service URL in Backend Config**
   - Example: `AI_SERVICE_URL=http://ibcm-ai:8001` (if using Docker Compose service name)
   - Or, if running locally: `http://localhost:8001`

2. **Install HTTP Client in Backend**
   - Example: `npm install axios` (Node.js)

3. **Call AI Endpoints from Backend**
   - Example (Node.js/Express):
     ```js
     import axios from 'axios';
     const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

     // Get recommendations for a user
     async function getRecommendations(userId, n = 5) {
       const res = await axios.get(`${AI_URL}/recommend`, { params: { user_id: userId, n } });
       return res.data.recommended_events;
     }

     // Log feedback from user
     async function logFeedback({ userId, targetId, feedback, comment, type }) {
       await axios.post(`${AI_URL}/feedback`, {
         user_id: userId,
         target_id: targetId,
         feedback,
         comment,
         type
       });
     }
     ```

4. **Update Backend Routes/Controllers**
   - On event creation, call `/generate-description`
   - On user dashboard load, call `/recommend` and `/user-analytics`
   - On business dashboard, call `/business-analytics`, `/real-time-alerts`, etc.
   - On feedback, POST to `/feedback`

---

### B. Logging Actions and Feedback

- **Log every user/business action** (search, click, book, review, feedback) to MongoDB via backend.
- **Example MongoDB schema:**
  ```json
  {
    "user_id": "...",
    "type": "search|book|feedback|...",
    "target_id": "...",
    "details": { "query": "pizza" },
    "timestamp": "2024-05-01T12:34:56Z"
  }
  ```

---

### C. Running and Retraining AI

1. **Start the AI Microservice**
   ```sh
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```
   (Or use Docker Compose for production)

2. **Retrain Models Regularly**
   ```sh
   python retrain.py
   ```
   - Schedule with cron or Airflow for daily/weekly retraining.

---

### D. Android App Integration

- The Android app calls the backend as usual.
- The backend now returns AI-powered results (recommendations, analytics, etc.) by calling the AI microservice.

---

## 4. Example Docker Compose Setup

```yaml
version: '3'
services:
  backend:
    build: ./backend
    environment:
      - MONGO_URL=mongodb://mongo:27017/yourdb
      - AI_SERVICE_URL=http://ibcm-ai:8001
    depends_on:
      - mongo
      - ibcm-ai
    networks:
      - ibcmnet

  ibcm-ai:
    build: ./IBCM-ai
    environment:
      - MONGO_URI=mongodb://mongo:27017/yourdb
    depends_on:
      - mongo
    networks:
      - ibcmnet

  mongo:
    image: mongo:5
    volumes:
      - ./mongo-data:/data/db
    networks:
      - ibcmnet

networks:
  ibcmnet:
```

---

## 5. Scripts and Commands

- **Start all services:**  
  ```sh
  docker-compose up --build
  ```
- **Retrain AI models:**  
  ```sh
  docker-compose exec ibcm-ai python retrain.py
  ```
- **Test AI endpoints:**  
  Use Postman/curl or call from backend as shown above.

---

## 6. Monitoring and Best Practices

- **Log all API calls and errors** in both backend and AI microservice.
- **Monitor MongoDB** for data growth and performance.
- **Schedule retraining** and review analytics regularly.
- **Iterate and expand** AI endpoints as business needs grow.

---

## 7. Developer Notes

- All endpoints are RESTful and JSON-based.
- Feedback and analytics are central to continuous improvement.
- See `AI-DOCUMENTATION.md` for full API reference.

---

**You are now ready to run, integrate, and scale your AI as a core tool for your project! If you need example code for a specific integration, or want a developer onboarding checklist, just ask!** 