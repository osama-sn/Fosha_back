const Settings = require('../models/settings.model');

class SettingsService {
  /**
   * Get global platform settings (public or admin)
   */
  async getSettings() {
    return await Settings.getSettings();
  }

  /**
   * Update global platform settings (Super Admin only)
   */
  async updateSettings(updateData) {
    const settings = await Settings.getSettings();

    const allowedFields = [
      'platformName',
      'logo',
      'contactEmail',
      'contactPhone',
      'whatsAppNumber',
      'defaultCommissionType',
      'defaultCommissionValue',
      'termsAndConditions',
      'privacyPolicy',
      'cancellationPolicy',
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        settings[field] = updateData[field];
      }
    });

    await settings.save();
    return settings;
  }
}

module.exports = new SettingsService();
