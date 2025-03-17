import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['password_reset', 'email_verification'],
  },
  expires: {
    type: Date,
    required: true,
    default: () => Date.now() + 3600000 // 1 hour from now
  }
});

// Automatically remove expired tokens
tokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Token', tokenSchema); 