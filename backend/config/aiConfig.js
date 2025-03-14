require('dotenv').config();

module.exports = {
    openAiKey: process.env.OPENAI_API_KEY,
    modelConfig: {
        defaultModel: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
    }
};
