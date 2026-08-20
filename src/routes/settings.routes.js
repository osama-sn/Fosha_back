const express = require('express');
const settingsController = require('../controllers/settings.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public: Get platform settings (Contact, Logo, Terms, Privacy, Cancellation Policy)
router.get('/', settingsController.getSettings);

// Super Admin: Update platform settings
router.put('/', protect, authorize('super_admin', 'admin'), settingsController.updateSettings);

module.exports = router;
