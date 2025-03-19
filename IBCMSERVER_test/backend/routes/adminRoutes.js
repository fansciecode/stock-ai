import express from 'express';
import { getRateLimitStats } from '../middleware/rateLimiter.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/rate-limit-stats', isAdmin, async (req, res) => {
  try {
    const stats = await getRateLimitStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rate limit stats' });
  }
});

export default router; 