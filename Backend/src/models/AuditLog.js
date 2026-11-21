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

