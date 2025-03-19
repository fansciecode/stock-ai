const getEnhancedRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;
        const userData = await UserService.getUserData(userId);
        
        // Combine multiple AI insights
        const [
            behaviorInsights,
            predictedInterests,
            contentSuggestions
        ] = await Promise.all([
            OpenAIService.analyzeUserBehavior(userData),
            PredictiveService.predictUserInterests(userData),
            ContentAIService.generateContentSuggestions(userData)
        ]);

        // Create personalized recommendations
        const recommendations = await RecommendationEngine
            .generatePersonalizedRecommendations({
                behaviorInsights,
                predictedInterests,
                contentSuggestions
            });

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        handleError(error, res);
    }
};
