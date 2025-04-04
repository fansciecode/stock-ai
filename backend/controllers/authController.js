import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { UserModel } from '../models/userModel.js';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';
import expressAsyncHandler from 'express-async-handler';
import AuthService from '../services/authService.js';

// Register user
const register = expressAsyncHandler(async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await UserModel.findOne({ email });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new UserModel({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
const login = expressAsyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
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

// Single export statement for all functions
export {
  forgotPassword,
  resetPassword,
  login,
  register,
  verifyResetToken,
  logout
};

