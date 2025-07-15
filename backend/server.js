import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import eventReviewRoutes from "./routes/eventReviewRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import userActivityRoutes from "./routes/userActivityRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import externalRoutes from "./config/routes.js";
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { requestLogger } from './middleware/requestLogger.js';
import logger from './utils/logger.js';
import { createServer } from 'http';
import { securityMiddleware } from './middleware/security.js';
import cookieParser from 'cookie-parser';
// import { rateLimiter } from './middleware/rateLimiter.js'; // Temporarily disabled
import bookingRoutes from './routes/bookingRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import androidRoutes from './routes/androidRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { Server } from 'socket.io';
import { createLogger, morganStream } from './utils/logger.js';
import adminAIRoutes from './routes/adminAIRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import growthRoutes from './routes/growthRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import aiFeatureRoutes from './routes/aiFeatureRoutes.js';

dotenv.config();
const app = express();

// Middleware
// Configure CORS to allow multiple origins
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'https://ibcm.app',
    'https://www.ibcm.app',
    'https://admin.ibcm.app'
].filter(Boolean); // Remove any undefined values

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined', { stream: morganStream }));
app.use(cookieParser());
app.use(requestLogger);
app.use(securityMiddleware);
// app.use(rateLimiter); // Temporarily disabled

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Connection
connectDB();

// Add before your routes
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Documentation',
      version: '1.0.0',
      description: 'API documentation for your backend services',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:5000',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/events/reviews", eventReviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/user-activity", userActivityRoutes);
app.use("/api/admin-analytics", adminAnalyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin/ai', adminAIRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/business', businessRoutes);
app.use("/api/external", externalRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/android', androidRoutes);
// AI routes
app.use('/api/ai', aiRoutes);
app.use('/api/ai/features', aiFeatureRoutes);

// Serve uploaded files with correct path
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const port = process.env.PORT || 5001;

console.log("JWT_SECRET:", process.env.JWT_SECRET);

const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is busy, trying ${port + 1}`);
    server.listen(port + 1);
  } else {
    console.error('Server error:', err);
  }
});

export default app;

