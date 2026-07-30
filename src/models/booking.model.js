const mongoose = require('mongoose');

const tripSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    coverImage: { type: String, default: '' },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pricePerSeat: { type: Number, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    numberOfSeats: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionValue: {
      type: Number,
      default: 0,
    },
    adminCommissionAmount: {
      type: Number,
      default: 0,
    },
    companyNetAmount: {
      type: Number,
      default: 0,
    },
    tripSnapshot: {
      type: tripSnapshotSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ['user', 'admin'],
    },
    approvedAt: Date,
    rejectedAt: Date,
    cancelledAt: Date,
    isProtected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
