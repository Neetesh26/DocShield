import mongoose from 'mongoose';

const handoverSchema = new mongoose.Schema({
  handoverNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  }],
  previousCustodian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  newCustodian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending Acceptance', 'Accepted', 'Rejected', 'Cancelled'],
    default: 'Pending Acceptance',
    index: true
  },
  acceptedDate: {
    type: Date,
    default: null
  },
  rejectedDate: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Handover', handoverSchema);

