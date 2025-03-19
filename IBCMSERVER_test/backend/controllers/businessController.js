// backend/controllers/businessController.js
const { BusinessAIService } = require('../services/businessAiService');
const { ContentAIService } = require('../services/contentAiService');

const getBusinessInsights = async (req, res) => {
    try {
        const businessId = req.params.businessId;
        const businessData = await Business.findById(businessId);

        // Get AI-powered insights
        const [marketAnalysis, contentSuggestions] = await Promise.all([
            BusinessAIService.analyzeMarketTrends(businessData),
            ContentAIService.generateContentSuggestions(businessData)
        ]);

        res.json({
            success: true,
            data: {
                marketAnalysis,
                contentSuggestions
            }
        });
    } catch (error) {
        handleError(error, res);
    }
};