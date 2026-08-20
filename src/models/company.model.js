const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    whatsapp: {
      type: String,
      default: '',
      trim: true,
    },
    socialMedia: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      youtube: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    paymentMethods: {
      vodafoneCash: {
        number: { type: String, default: '' },
        instructions: { type: String, default: '' },
      },
      orangeCash: {
        number: { type: String, default: '' },
        instructions: { type: String, default: '' },
      },
      etisalatCash: {
        number: { type: String, default: '' },
        instructions: { type: String, default: '' },
      },
      bankTransfer: {
        bankName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        iban: { type: String, default: '' },
        accountHolder: { type: String, default: '' },
        instructions: { type: String, default: '' },
      },
      cash: {
        instructions: { type: String, default: '' },
      },
    },
    governorate: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
      index: true,
    },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionValue: {
      type: Number,
      default: 10,
      min: 0,
    },
    monthlySubscriptionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'expired', 'grace_period'],
      default: 'active',
    },
    subscriptionEndDate: {
      type: Date,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    featuredUntil: {
      type: Date,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isProtected: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Filter out soft-deleted companies by default in find queries
companySchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
