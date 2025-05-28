from ai import recommend, search
from ai.user_analytics import train_churn_model
from ai.business_analytics import train_demand_model, train_geo_clusters

if __name__ == "__main__":
    print("Retraining recommendation model...")
    recommend.retrain_recommendation_model()
    print("Retraining search model...")
    search.retrain_search_model()
    print("Retraining churn model...")
    train_churn_model()
    print("Retraining demand forecasting model...")
    train_demand_model()
    print("Retraining geo clusters...")
    train_geo_clusters()
    print("Retraining complete.") 