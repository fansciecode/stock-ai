import { AIOrchestrator } from '../services/ai/aiOrchestrator.js';

const aiOrchestrator = new AIOrchestrator();

export const aiMiddleware = {
    processEvent: async (req, res, next) => {
        try {
            req.aiContext = await aiOrchestrator.processNewEvent(req.body);
            next();
        } catch (error) {
            next(error);
        }
    },

    processUser: async (req, res, next) => {
        try {
            req.aiContext = await aiOrchestrator.processUserInteraction(
                req.user,
                req.body.interactionType
            );
            next();
        } catch (error) {
            next(error);
        }
    },

    processContent: async (req, res, next) => {
        try {
            req.aiContext = await aiOrchestrator.processContentUpload(req.body);
            next();
        } catch (error) {
            next(error);
        }
    },

    processChat: async (req, res, next) => {
        try {
            req.aiContext = await aiOrchestrator.processChatInteraction(req.body);
            next();
        } catch (error) {
            next(error);
        }
    }
}; 