import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentRequest',
    default: null
  },
  handover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Handover',
    default: null
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  type: {
    type: String,
    enum: ['Print Request', 'Download Request', 'Controlled-Copy', 'Checkout Request', 'Return Verification', 'Custody Transfer', 'Document Release'],
    required: true
  },
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  comments: {
    type: String,
    default: ''
  },
  electronicSignature: {
    signedBy: { type: String, default: '' },
    signedAt: { type: Date, default: null },
    meaning: { type: String, default: 'I approve this record in compliance with 21 CFR Part 11 requirements.' }
  },
  actionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Approval', approvalSchema);

