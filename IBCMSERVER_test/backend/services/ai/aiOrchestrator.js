import { AnalyticsServices } from './analytics/index.js';
import { ChatbotServices } from './chatbot/index.js';
import { ContentServices } from './content/index.js';
import { LocationServices } from './location/index.js';
import { NLPServices } from './nlp/index.js';
import { RecommendationServices } from './recommendation/index.js';
import { SecurityServices } from './security/index.js';

export class AIOrchestrator {
    constructor() {
        // Initialize all AI services
        this.analytics = {
            demandPredictor: AnalyticsServices.DemandPredictor,
            sentimentAnalyzer: AnalyticsServices.SentimentAnalyzer,
            trendAnalyzer: AnalyticsServices.TrendAnalyzer
        };

        this.chatbot = {
            autoReply: ChatbotServices.AutoReply
        };

        this.content = {
            descriptionGenerator: ContentServices.DescriptionGenerator,
            imageRecognition: ContentServices.ImageRecognition,
            videoProcessor: ContentServices.VideoProcessor
        };

        this.location = {
            geoOptimizer: LocationServices.GeoOptimizer,
            proximityAnalyzer: LocationServices.ProximityAnalyzer
        };

        this.nlp = {
            textAnalyzer: NLPServices.TextAnalyzer,
            voiceProcessor: NLPServices.VoiceProcessor
        };

        this.recommendation = {
            collaborativeFilter: RecommendationServices.CollaborativeFilter,
            contentFilter: RecommendationServices.ContentFilter
        };

        this.security = {
            fraudDetector: SecurityServices.FraudDetector,
            spamFilter: SecurityServices.SpamFilter,
            verificationService: SecurityServices.VerificationService
        };
    }

    // Integration methods for different application flows
    async processNewEvent(eventData) {
        try {
            // Parallel processing of event data
            const [
                demandPrediction,
                locationOptimization,
                contentAnalysis,
                securityCheck
            ] = await Promise.all([
                this.analytics.demandPredictor.predictEventDemand(eventData),
                this.location.geoOptimizer.optimizeEventLocation(eventData),
                this.content.descriptionGenerator.generateEventDescription(eventData),
                this.security.fraudDetector.analyzeEventCreation(eventData)
            ]);

            return {
                event: eventData,
                ai: {
                    demand: demandPrediction,
                    location: locationOptimization,
                    content: contentAnalysis,
                    security: securityCheck
                }
            };
        } catch (error) {
            console.error('Event processing error:', error);
            throw error;
        }
    }

    async processUserInteraction(userData, interactionType) {
        try {
            const [
                sentimentAnalysis,
                userVerification,
                recommendations
            ] = await Promise.all([
                this.analytics.sentimentAnalyzer.analyzeSentiment(userData),
                this.security.verificationService.verifyUserActivity(userData),
                this.recommendation.collaborativeFilter.generateRecommendations(userData)
            ]);

            return {
                user: userData,
                interaction: interactionType,
                ai: {
                    sentiment: sentimentAnalysis,
                    security: userVerification,
                    recommendations: recommendations
                }
            };
        } catch (error) {
            console.error('User interaction processing error:', error);
            throw error;
        }
    }

    async processContentUpload(contentData) {
        try {
            const [
                spamCheck,
                contentAnalysis,
                mediaProcessing
            ] = await Promise.all([
                this.security.spamFilter.analyzeContent(contentData),
                this.nlp.textAnalyzer.analyzeContent(contentData),
                this.processMediaContent(contentData)
            ]);

            return {
                content: contentData,
                ai: {
                    security: spamCheck,
                    analysis: contentAnalysis,
                    media: mediaProcessing
                }
            };
        } catch (error) {
            console.error('Content upload processing error:', error);
            throw error;
        }
    }

    async processMediaContent(mediaData) {
        if (mediaData.type === 'image') {
            return this.content.imageRecognition.analyzeImage(mediaData);
        } else if (mediaData.type === 'video') {
            return this.content.videoProcessor.analyzeVideo(mediaData);
        }
        return null;
    }

    async processChatInteraction(chatData) {
        try {
            const [
                autoReply,
                sentimentAnalysis,
                spamCheck
            ] = await Promise.all([
                this.chatbot.autoReply.generateResponse(chatData),
                this.analytics.sentimentAnalyzer.analyzeSentiment(chatData),
                this.security.spamFilter.analyzeContent(chatData)
            ]);

            return {
                chat: chatData,
                ai: {
                    reply: autoReply,
                    sentiment: sentimentAnalysis,
                    security: spamCheck
                }
            };
        } catch (error) {
            console.error('Chat interaction processing error:', error);
            throw error;
        }
    }
} 