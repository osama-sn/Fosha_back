const mongoose = require('mongoose');

const companyReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    isProtected: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    hideReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per company
companyReviewSchema.index({ user: 1, company: 1 }, { unique: true });

const CompanyReview = mongoose.model('CompanyReview', companyReviewSchema);

module.exports = CompanyReview;
