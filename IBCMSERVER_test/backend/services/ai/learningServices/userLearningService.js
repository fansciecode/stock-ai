export const UserLearningService = {
    trackBehavior: async (userId, action) => {
        try {
            const behaviorData = {
                userId,
                action,
                timestamp: new Date(),
                context: {
                    location: action.location,
                    timeOfDay: new Date().getHours(),
                    dayOfWeek: new Date().getDay()
                }
            };
            await UserBehavior.create(behaviorData);
            return true;
        } catch (error) {
            console.error('Error tracking behavior:', error);
            return false;
        }
    },

    updateUserModel: async (userId) => {
        try {
            const behaviors = await UserBehavior.find({ userId })
                .sort({ timestamp: -1 })
                .limit(100);
            
            // Analyze patterns and update user preferences
            const patterns = await analyzePatterns(behaviors);
            await User.findByIdAndUpdate(userId, {
                $set: {
                    'preferences.learned': patterns
                }
            });
        } catch (error) {
            console.error('Error updating user model:', error);
        }
    }
};

export const EventLearningService = {
    analyzeEventSuccess: async (eventId) => {
        try {
            const event = await Event.findById(eventId).populate('attendees');
            const metrics = {
                attendanceRate: event.attendees.length / event.capacity,
                engagementScore: await calculateEngagementScore(event),
                timeBasedPopularity: await analyzeTimePatterns(event)
            };
            return metrics;
        } catch (error) {
            console.error('Error analyzing event:', error);
            return null;
        }
    }
};

export const SearchLearningService = {
    improveResults: async (userId, query, selectedResult) => {
        try {
            await SearchPattern.create({
                userId,
                query,
                selectedResult,
                timestamp: new Date()
            });
            
            // Update search weights based on selection
            await updateSearchWeights(query, selectedResult);
        } catch (error) {
            console.error('Error improving search:', error);
        }
    },

    getOptimizedResults: async (userId, query) => {
        try {
            const userContext = await getUserContext(userId);
            const timeOptimized = await optimizeForTime(query, userContext);
            const locationOptimized = await optimizeForLocation(query, userContext);
            const priceOptimized = await optimizeForPrice(query, userContext);

            return {
                timeBasedResults: timeOptimized,
                locationBasedResults: locationOptimized,
                priceBasedResults: priceOptimized
            };
        } catch (error) {
            console.error('Error getting optimized results:', error);
            return null;
        }
    }
};
