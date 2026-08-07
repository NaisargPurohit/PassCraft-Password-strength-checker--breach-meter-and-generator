import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['VIEW', 'COPY', 'AUTOFILL', 'CREATE', 'UPDATE', 'DELETE', 'SHARE'],
      required: true,
    },
    vaultItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VaultItem',
    },
    itemTitle: {
      type: String,
      default: 'Unknown Item',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Browser',
    },
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
