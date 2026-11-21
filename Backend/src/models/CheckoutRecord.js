import mongoose from 'mongoose';

const checkoutRecordSchema = new mongoose.Schema({
  checkoutNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  department: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  checkoutDate: {
    type: Date,
    default: Date.now
  },
  expectedReturnDate: {
    type: Date,
    required: true
  },
  actualReturnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Returned', 'Overdue', 'Extension Requested'],
    default: 'Active',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conditionOnCheckout: {
    type: String,
    enum: ['Good', 'Intact', 'Slight Wear', 'Flagged'],
    default: 'Good'
  },
  conditionOnReturn: {
    type: String,
    enum: ['Good', 'Intact', 'Slight Wear', 'Damaged', 'Pending Inspection'],
    default: 'Pending Inspection'
  },
  returnVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('CheckoutRecord', checkoutRecordSchema);

