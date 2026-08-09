const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    titleEn: {
      type: String,
      required: true,
      trim: true,
    },
    titleAr: {
      type: String,
      required: true,
      trim: true,
    },
    descriptionEn: {
      type: String,
      trim: true,
    },
    descriptionAr: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isProtected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
