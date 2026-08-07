import mongoose from 'mongoose';

const sharedCollectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['Admin', 'Manager', 'Employee'], default: 'Employee' },
        encryptedCollectionKey: { type: String }, // Symmetric collection key encrypted with user's RSA Public Key
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('SharedCollection', sharedCollectionSchema);
