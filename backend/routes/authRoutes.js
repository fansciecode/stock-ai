import pkg from 'express-async-handler';
const asyncHandler = pkg;
import express from "express";
import { check } from 'express-validator';
import { 
    register, 
    login, 
    forgotPassword, 
    resetPassword, 
    verifyResetToken,
    logout,
    verifyEmail
} from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { body } from 'express-validator';
import { sendResetPasswordEmail, testEmailConfig } from '../services/emailService.js';
// import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js'; // Temporarily disabled
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Basic auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Validation routes
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
  ],
  validateRequest,
  forgotPassword
);

router.post('/reset-password', asyncHandler(async (req, res) => {
  console.log('Reset password route hit');
  await resetPassword(req, res);
}));

router.post('/test-email', asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    await sendResetPasswordEmail(email, 'test-token');
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}));

router.get('/test-email-config', async (req, res) => {
  try {
    const result = await testEmailConfig();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

router.get('/verify-reset-token/:token', verifyResetToken);

export default router;
