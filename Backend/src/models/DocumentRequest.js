import mongoose from 'mongoose';
import { REQUEST_TYPES, REQUEST_STATUSES } from '../constants/index.js';

const documentRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  requestType: {
    type: String,
    enum: Object.values(REQUEST_TYPES),
    required: true,
    index: true
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  purpose: {
    type: String,
    default: 'Operational Reference',
    trim: true
  },
  urgency: {
    type: String,
    enum: ['Low', 'Normal', 'Urgent'],
    default: 'Normal'
  },
  copiesRequested: {
    type: Number,
    default: 1
  },
  expectedReturnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: Object.values(REQUEST_STATUSES),
    default: REQUEST_STATUSES.PENDING,
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalDate: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('DocumentRequest', documentRequestSchema);

