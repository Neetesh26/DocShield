import mongoose from 'mongoose';

const physicalAuditItemSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  expectedLocation: {
    type: String,
    required: true
  },
  actualLocation: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Found', 'Missing', 'Misplaced'],
    default: 'Pending'
  },
  qrVerified: {
    type: Boolean,
    default: false
  },
  condition: {
    type: String,
    enum: ['Good', 'Damaged', 'Illegible', 'Missing Pages', 'Not Assessed'],
    default: 'Not Assessed'
  },
  notes: {
    type: String,
    default: ''
  }
});

const physicalAuditSchema = new mongoose.Schema({
  auditNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  conductedDate: {
    type: Date,
    default: null
  },
  auditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storageLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StorageLocation',
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Discrepancy Found'],
    default: 'Scheduled',
    index: true
  },
  summary: {
    expectedCount: { type: Number, default: 0 },
    foundCount: { type: Number, default: 0 },
    missingCount: { type: Number, default: 0 },
    misplacedCount: { type: Number, default: 0 }
  },
  items: [physicalAuditItemSchema],
  findings: {
    type: String,
    default: ''
  },
  correctiveActions: {
    type: String,
    default: ''
  },
  signOff: {
    signedBy: { type: String, default: '' },
    signedAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

export default mongoose.model('PhysicalAudit', physicalAuditSchema);

