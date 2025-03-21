import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const PredictiveService = {
    predictUserInterests: async (userData) => {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: "Predict user interests based on behavior patterns"
                }, {
                    role: "user",
                    content: JSON.stringify(userData)
                }]
            });

            return {
                predictedInterests: completion.choices[0].message.content,
                confidence: completion.choices[0].finish_reason === 'stop' ? 1 : 0
            };
        } catch (error) {
            console.error('Prediction failed:', error);
            return null;
        }
    },

    forecastDemand: async (historicalData) => {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: "Forecast demand based on historical data"
                }, {
                    role: "user",
                    content: JSON.stringify(historicalData)
                }]
            });

            return {
                forecast: completion.choices[0].message.content,
                confidence: completion.choices[0].finish_reason === 'stop' ? 1 : 0
            };
        } catch (error) {
            console.error('Forecast failed:', error);
            return null;
        }
    }
};
