const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['pre_booking', 'booking_related'],
      default: 'pre_booking',
      index: true,
    },
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
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCountUser: {
      type: Number,
      default: 0,
    },
    unreadCountCompany: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ user: 1, company: 1 }, { unique: true });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
