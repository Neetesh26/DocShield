import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../constants/index.js';

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userName: {
    type: String,
    required: true,
    default: 'System'
  },
  userRole: {
    type: String,
    default: 'System'
  },
  action: {
    type: String,
    enum: Object.values(AUDIT_ACTIONS),
    required: true,
    index: true
  },
  entity: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    required: true
  },
  // 21 CFR Part 11 ALCOA+ Fields: Previous Value, New Value & Reason for Change
  previousValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  reason: {
    type: String,
    default: ''
  },
  signature: {
    signerName: { type: String, default: '' },
    signerRole: { type: String, default: '' },
    meaning: { type: String, default: '' },
    signedAt: { type: Date, default: null }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true,
    index: true
  }
}, {
  timestamps: false // GxP audit logs should never have updatedAt modified!
});

export default mongoose.model('AuditLog', auditLogSchema);

