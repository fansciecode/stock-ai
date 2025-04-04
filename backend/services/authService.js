import crypto from 'crypto';
import { UserModel } from '../models/userModel.js';
import { sendResetPasswordEmail } from './emailService.js';

class AuthService {
  static generateResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    return { resetToken, hashedToken };
  }

  static async findUserByEmail(email) {
    return await UserModel.findOne({ email });
  }

  static async findUserByResetToken(hashedToken) {
    return await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
  }

  static async setResetToken(user, hashedToken) {
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
  }

  static async resetUserPassword(user, newPassword) {
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }
}

export default AuthService;


