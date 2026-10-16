import mongoose from 'mongoose';

const systemStatusSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      default: 'DocuGuard AI Forensic Engine'
    },
    status: {
      type: String,
      required: true,
      default: 'active'
    },
    connectedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const SystemStatus = mongoose.model('SystemStatus', systemStatusSchema);
