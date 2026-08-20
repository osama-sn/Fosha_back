const settingsService = require('../services/settings.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class SettingsController {
  getSettings = AsyncHandler(async (req, res) => {
    const settings = await settingsService.getSettings();
    res.status(200).json(new ApiResponse(200, 'SETTINGS_FETCHED', settings, req.lang));
  });

  updateSettings = AsyncHandler(async (req, res) => {
    const settings = await settingsService.updateSettings(req.body);
    res.status(200).json(new ApiResponse(200, 'SETTINGS_UPDATED', settings, req.lang));
  });
}

module.exports = new SettingsController();
