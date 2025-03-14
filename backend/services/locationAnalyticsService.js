const LocationAnalytics = {
    trackUserLocation: async (userId, location) => {
        await LocationLog.create({
            userId,
            coordinates: location,
            timestamp: new Date()
        });
    },

    getLocationBasedInsights: async () => {
        return await LocationLog.aggregate([
            {
                $group: {
                    _id: {
                        lat: { $round: ["$coordinates.latitude", 2] },
                        lng: { $round: ["$coordinates.longitude", 2] }
                    },
                    userCount: { $sum: 1 }
                }
            }
        ]);
    }
};
