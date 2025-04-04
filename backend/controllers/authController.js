import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { UserModel } from '../models/userModel.js';
import crypto from 'crypto';
import { sendResetPasswordEmail, sendVerificationEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';
import expressAsyncHandler from 'express-async-handler';
import AuthService from '../services/authService.js';

// Register user
const register = expressAsyncHandler(async (req, res) => {
  console.log('Registration attempt:', { email: req.body.email, time: new Date().toISOString() });
  
  try {
    const { name, email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      console.log('Registration failed: Missing email or password');
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    let user = await UserModel.findOne({ email });
    
    if (user) {
      console.log('Registration failed: User already exists', { email });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
      
    // Create new user instance with verification token
    user = new UserModel({ 
      name, 
      email, 
      password,
      isVerified: process.env.AUTO_VERIFY === 'true', // Auto-verify if enabled in env
      security: {
        verificationToken: hashedVerificationToken,
        verificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      }
    });
    
    // Let the pre-save hook in the user model handle password hashing
    await user.save();
    console.log('User saved successfully:', { userId: user._id, email });

    // Generate token with both userId and id fields for compatibility
    const token = jwt.sign({ 
      userId: user._id,
      id: user._id // Add id field for backward compatibility
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send verification email if auto-verify is not enabled
    if (process.env.AUTO_VERIFY !== 'true') {
      try {
        await sendVerificationEmail(email, verificationToken);
        console.log('Verification email sent:', { email });
      } catch (error) {
        console.error('Failed to send verification email:', error);
        // Don't fail registration if email fails, just log it
      }
    }

    console.log('Registration successful:', { 
      userId: user._id, 
      email, 
      tokenGenerated: !!token,
      isVerified: user.isVerified
    });

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Email verification
const verifyEmail = expressAsyncHandler(async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    // Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
      
    // Find user with matching token
    const user = await UserModel.findOne({
      'security.verificationToken': hashedToken,
      'security.verificationExpires': { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    // Mark user as verified
    user.isVerified = true;
    user.security.verificationToken = undefined;
    user.security.verificationExpires = undefined;
    user.security.verified = true;
    user.verifiedAt = Date.now();
    
    await user.save();
    
    logger.info('User email verified successfully', { userId: user._id, email: user.email });
    
    // Redirect to frontend with success message
    res.json({ 
      success: true, 
      message: 'Email verification successful. You may now log in.' 
    });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// Login user
const login = expressAsyncHandler(async (req, res) => {
  console.log('Login attempt:', { email: req.body.email, time: new Date().toISOString() });
  
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    const user = await UserModel.findOne({ email });
    
    console.log('User lookup result:', { 
      found: !!user, 
      email, 
      userId: user?._id, 
      isVerified: user?.isVerified 
    });

    if (!user) {
      console.log('Login failed: User not found', { email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match check:', { isMatch, userId: user._id });
    
    if (!isMatch) {
      console.log('Login failed: Invalid password', { email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (user.isVerified === false) {
      console.log('Login failed: User not verified', { email, userId: user._id });
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    // Generate JWT token with both userId and id fields for compatibility
    const token = jwt.sign({ 
      userId: user._id,
      id: user._id // Add id field for backward compatibility
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    console.log('Login successful:', { 
      userId: user._id, 
      email, 
      tokenGenerated: !!token,
      tokenPayload: { userId: user._id, id: user._id }
    });

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password
const forgotPassword = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await AuthService.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { resetToken, hashedToken } = AuthService.generateResetToken();
  
  try {
    await AuthService.setResetToken(user, hashedToken);
    await sendResetPasswordEmail(email, resetToken);
    
    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    await AuthService.setResetToken(user, null);
    throw new Error('Error sending reset email');
  }
});

// Reset password
const resetPassword = expressAsyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      message: 'Token and new password are required'
    });
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await AuthService.findUserByResetToken(hashedToken);
  if (!user) {
    return res.status(400).json({
      message: 'Invalid or expired reset token'
    });
  }

  await AuthService.resetUserPassword(user, newPassword);

  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

// Verify reset token
const verifyResetToken = expressAsyncHandler(async (req, res) => {
  try {
    const { token } = req.params;
    res.json({ message: 'Token is valid' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout user
const logout = expressAsyncHandler(async (req, res) => {
    try {
        // Clear any session data if using sessions
        if (req.session) {
            req.session.destroy();
        }
        
        // Send response indicating successful logout
        res.json({
            success: true,
            message: 'Successfully logged out'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during logout' });
    }
});

// Export all controller functions
export {
  forgotPassword,
  resetPassword,
  login,
  register,
  verifyResetToken,
  logout,
  verifyEmail
};

