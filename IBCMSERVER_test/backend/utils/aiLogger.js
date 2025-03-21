const logger = require('./logger');

const aiLogger = {
    logPrediction: async (type, input, output) => {
        await logger.info('AI Prediction', {
            type,
            input: JSON.stringify(input),
            output: JSON.stringify(output),
            timestamp: new Date()
        });
    }
};
