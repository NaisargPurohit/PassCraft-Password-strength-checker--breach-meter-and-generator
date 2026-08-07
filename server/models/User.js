import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Employee'],
    default: 'Admin',
  },
  publicKey: {
    type: String, // RSA-OAEP SPKI Public Key in Base64
  },
  encryptedPrivateKey: {
    type: String, // User's RSA Private Key encrypted with Master Key
  },
  isBreached: {
    type: Boolean,
    default: false,
  },
  breaches: [
    {
      title: { type: String },
      breachDate: { type: String },
      description: { type: String },
      detectedAt: { type: Date, default: Date.now },
    },
  ],
  lastThreatCheck: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('User', userSchema);
