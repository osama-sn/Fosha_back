const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'instapay', 'vodafone_cash', 'check', 'other'],
      default: 'bank_transfer',
    },
    referenceNumber: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const settlementSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    totalGrossSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCommissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'partially_paid', 'settled'],
      default: 'pending',
      index: true,
    },
    paymentHistory: [paymentLogSchema],
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to enforce one settlement record per company per month/year
settlementSchema.index({ company: 1, month: 1, year: 1 }, { unique: true });

const Settlement = mongoose.model('Settlement', settlementSchema);

module.exports = Settlement;
