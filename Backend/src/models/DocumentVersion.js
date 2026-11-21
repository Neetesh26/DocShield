import mongoose from 'mongoose';
import { DOCUMENT_STATUSES } from '../constants/index.js';

const documentVersionSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  version: {
    type: String,
    required: true,
    trim: true
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
  fileHash: {
    type: String,
    default: ''
  },
  changesDescription: {
    type: String,
    default: 'Initial effective version'
  },
  status: {
    type: String,
    enum: Object.values(DOCUMENT_STATUSES),
    default: DOCUMENT_STATUSES.EFFECTIVE
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('DocumentVersion', documentVersionSchema);

