import express from 'express';
import externalEventRoutes from '../routes/external/eventRoutes.js';

const router = express.Router();

// External Events Module Routes
router.use('/api/external', externalEventRoutes);

export default router; 