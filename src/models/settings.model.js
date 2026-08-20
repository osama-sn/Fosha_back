const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: 'Rehala - رحالة',
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: 'support@rehala.com',
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      default: '+201000000000',
      trim: true,
    },
    whatsAppNumber: {
      type: String,
      default: '+201000000000',
      trim: true,
    },
    defaultCommissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    defaultCommissionValue: {
      type: Number,
      default: 10,
      min: 0,
    },
    termsAndConditions: {
      type: String,
      default: 'الشروط والأحكام الخاصة بالمنصة.',
    },
    privacyPolicy: {
      type: String,
      default: 'سياسة الخصوصية الخاصة بالمنصة.',
    },
    cancellationPolicy: {
      type: String,
      default: 'سياسة إلغاء الحجوزات واسترداد المبالغ.',
    },
    isSingleton: {
      type: Boolean,
      default: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get or create default settings singleton instance
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isSingleton: true });
  if (!settings) {
    settings = await this.create({ isSingleton: true });
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
