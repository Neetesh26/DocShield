import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global_compliance'
    },
    sessionTimeoutMin: {
      type: String,
      default: '30'
    },
    maxPasswordAgeDays: {
      type: String,
      default: '90'
    },
    electronicSignatureStatement: {
      type: String,
      default: 'I certify that this record has been reviewed and executed in compliance with 21 CFR Part 11 and current Good Manufacturing Practices (cGMP).'
    },
    autoArchiveExpiredYears: {
      type: String,
      default: '7'
    },
    requireDualSignOffForDestruction: {
      type: Boolean,
      default: true
    },
    enforceBarcodeScanOnReturn: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('SystemSetting', systemSettingSchema);

