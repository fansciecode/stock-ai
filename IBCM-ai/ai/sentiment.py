from transformers import pipeline

# Load sentiment analysis pipeline
sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

def analyze_sentiment(text):
    result = sentiment_pipeline(text)[0]
    return {
        "sentiment": result["label"].lower(),
        "confidence": float(result["score"])
    } 