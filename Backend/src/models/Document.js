import mongoose from 'mongoose';
import { DOCUMENT_STATUSES, PHYSICAL_STATUSES } from '../constants/index.js';

const documentSchema = new mongoose.Schema({
  documentNumber: {
    type: String,
    required: [true, 'Document number is required'],
    unique: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    index: true
  },
  version: {
    type: String,
    required: [true, 'Version is required'],
    default: '1.0',
    trim: true
  },
  documentType: {
    type: String,
    required: [true, 'Document type is required'],
    trim: true,
    index: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    index: true
  },
  product: {
    type: String,
    trim: true,
    default: ''
  },
  batchNumber: {
    type: String,
    trim: true,
    default: ''
  },
  effectiveDate: {
    type: Date,
    default: null
  },
  reviewDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: Object.values(DOCUMENT_STATUSES),
    default: DOCUMENT_STATUSES.EFFECTIVE,
    index: true
  },
  physicalStatus: {
    type: String,
    enum: Object.values(PHYSICAL_STATUSES),
    default: PHYSICAL_STATUSES.STORED,
    index: true
  },
  preparedBy: {
    type: String,
    trim: true,
    default: ''
  },
  reviewedBy: {
    type: String,
    trim: true,
    default: ''
  },
  approvedBy: {
    type: String,
    trim: true,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentCustodian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storageLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StorageLocation',
    required: true
  },
  boxNumber: {
    type: String,
    trim: true,
    default: 'BX-01'
  },
  fileNumber: {
    type: String,
    trim: true,
    default: ''
  },
  physicalCopiesCount: {
    type: Number,
    default: 1,
    min: 1
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileMimeType: {
    type: String,
    default: 'application/pdf'
  },
  fileHash: {
    type: String,
    trim: true
  },
  extractedMetadata: {
    rawValues: { type: mongoose.Schema.Types.Mixed, default: {} },
    confidenceScores: { type: mongoose.Schema.Types.Mixed, default: {} },
    confirmedValues: { type: mongoose.Schema.Types.Mixed, default: {} },
    extractionSource: { type: String, default: 'pdf-parse' }
  },
  tags: [{
    type: String,
    trim: true
  }],
  folder: {
    type: String,
    trim: true,
    default: 'Standard Procedures'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  qrCodeData: {
    type: String,
    required: true
  },
  qrCodeImage: {
    type: String,
    default: ''
  },
  legalHold: {
    type: Boolean,
    default: false
  },
  retentionYears: {
    type: Number,
    default: 5
  },
  retentionDestruction: {
    isDestroyed: { type: Boolean, default: false },
    destroyedAt: { type: Date, default: null },
    destroyedBy: { type: String, default: '' },
    witness: { type: String, default: '' },
    reason: { type: String, default: '' },
    method: { type: String, default: '' },
    certificateNumber: { type: String, default: '' }
  },
  archiveDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound and text indexes for fast search
documentSchema.index({ documentNumber: 'text', title: 'text', product: 'text', batchNumber: 'text', tags: 'text' });

export default mongoose.model('Document', documentSchema);

