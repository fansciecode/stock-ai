import { UserLearningService } from '../services/ai/learningServices/userLearningService.js';

export const trackUserActivity = async (req, res, next) => {
    try {
        if (req.user) {
            await UserLearningService.trackBehavior(req.user._id, {
                path: req.path,
                method: req.method,
                timestamp: new Date()
            });
        }
        next();
    } catch (error) {
        console.error('Error tracking activity:', error);
        next();
    }
};
