import OpenAI from 'openai';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Check if API key exists
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set in environment variables');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const OpenAIService = {
    analyzeUserBehavior: async (userData) => {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: "Analyze user behavior patterns and preferences"
                }, {
                    role: "user",
                    content: JSON.stringify(userData)
                }]
            });
            
            return {
                insights: completion.choices[0].message.content,
                confidence: completion.choices[0].finish_reason === 'stop' ? 1 : 0
            };
        } catch (error) {
            console.error('OpenAI analysis failed:', error);
            return null;
        }
    },

    generatePersonalizedSuggestions: async (userProfile, history) => {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: `Generate personalized suggestions based on:
                             Profile: ${JSON.stringify(userProfile)}
                             History: ${JSON.stringify(history)}`
                }]
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI suggestions failed:', error);
            return null;
        }
    }
};
