const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
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

// One review per user per trip
reviewSchema.index({ trip: 1, user: 1 }, { unique: true });

// Static method to recalculate average rating and review count on Trip
reviewSchema.statics.calcAverageRating = async function (tripId) {
  const stats = await this.aggregate([
    { $match: { trip: tripId, isHidden: { $ne: true } } },
    {
      $group: {
        _id: '$trip',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Trip').findByIdAndUpdate(tripId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewsCount: stats[0].nRating,
    });
  } else {
    await mongoose.model('Trip').findByIdAndUpdate(tripId, {
      averageRating: 0,
      reviewsCount: 0,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.trip);
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.trip);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
