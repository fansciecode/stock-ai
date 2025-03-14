import mongoose from "mongoose";
import { createLogger } from '../utils/logger.js';

const logger = createLogger('database');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        
        // Add event listeners for database connection
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected successfully');
        });

    } catch (error) {
        logger.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
