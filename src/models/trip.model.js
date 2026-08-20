const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  time: { type: String, default: '' },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  image: { type: String, default: '' },
});

const daySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  activities: [activitySchema],
});

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    origin: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    durationDays: {
      type: Number,
      default: 1,
      min: 1,
      index: true,
    },
    durationNights: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    featuredUntil: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'hidden', 'cancelled', 'completed'],
      default: 'draft',
      index: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBySystem: {
      type: Boolean,
      default: false,
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
    coverImage: {
      type: String,
      default: '',
    },
    gallery: {
      type: [String],
      default: [],
    },
    included: {
      type: [String],
      default: [],
    },
    excluded: {
      type: [String],
      default: [],
    },
    cancelPolicy: {
      type: String,
      default: '',
    },
    pickupPoints: [
      {
        location: { type: String, required: true },
        time: { type: String, default: '' },
      },
    ],
    pickupTimes: {
      type: [String],
      default: [],
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
    days: [daySchema],
  },
  {
    timestamps: true,
  }
);

// Calculate duration in days and nights prior to saving
tripSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(new Date(this.endDate) - new Date(this.startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.durationDays = diffDays > 0 ? diffDays : 1;
    this.durationNights = diffDays > 1 ? diffDays - 1 : 0;
  }
  if (typeof next === 'function') next();
});

// Filter out soft-deleted documents by default in find queries
tripSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
