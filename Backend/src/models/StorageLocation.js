import mongoose from 'mongoose';

const storageLocationSchema = new mongoose.Schema({
  building: {
    type: String,
    required: true,
    trim: true
  },
  area: {
    type: String,
    required: true,
    trim: true
  },
  room: {
    type: String,
    required: true,
    trim: true
  },
  rack: {
    type: String,
    required: true,
    trim: true
  },
  shelf: {
    type: String,
    required: true,
    trim: true
  },
  bin: {
    type: String,
    required: true,
    trim: true
  },
  box: {
    type: String,
    trim: true,
    default: 'BX-01'
  },
  code: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 50
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  department: {
    type: String,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['Available', 'Near Full', 'Full', 'Maintenance'],
    default: 'Available'
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Update status based on occupancy vs capacity
storageLocationSchema.pre('save', function (next) {
  if (this.currentOccupancy >= this.capacity) {
    this.status = 'Full';
  } else if (this.currentOccupancy >= this.capacity * 0.8) {
    this.status = 'Near Full';
  } else if (this.status !== 'Maintenance') {
    this.status = 'Available';
  }
  next();
});

export default mongoose.model('StorageLocation', storageLocationSchema);

