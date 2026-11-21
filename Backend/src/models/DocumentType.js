import mongoose from 'mongoose';

const documentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  prefix: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  retentionYears: {
    type: Number,
    default: 5
  },
  reviewIntervalMonths: {
    type: Number,
    default: 12
  },
  requiresPhysicalTracking: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('DocumentType', documentTypeSchema);

