const SearchAnalytics = {
    trackSearchQuery: async (userId, query, filters, results) => {
        const searchData = {
            userId,
            query,
            filters,
            resultCount: results.length,
            timestamp: new Date(),
            location: filters.location,
            category: filters.category
        };
        await SearchLog.create(searchData);
    },

    aggregateSearchTrends: async (timeframe) => {
        // Aggregate popular searches, categories, locations
        return await SearchLog.aggregate([
            { $match: { timestamp: { $gte: timeframe } } },
            { $group: {
                _id: "$query",
                count: { $sum: 1 },
                categories: { $addToSet: "$category" },
                locations: { $addToSet: "$location" }
            }}
        ]);
    }
};

export default SearchAnalytics;
