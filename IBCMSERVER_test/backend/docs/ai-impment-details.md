graph TD
    A[User Action] --> B{Action Type}
    B -->|Search| C[SearchLearningService]
    B -->|General Activity| D[UserLearningService]
    
    C --> E[Optimize Search Results]
    C --> F[Track Search Patterns]
    
    D --> G[Update User Preferences]
    D --> H[Track Behavior Patterns]
    
    E --> I[Return Enhanced Results]
    F --> J[Update Search Model]
    
    G --> K[Personalize Experience]
    H --> L[Update User Model]
