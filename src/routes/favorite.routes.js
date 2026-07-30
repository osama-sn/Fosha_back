const express = require('express');
const favoriteController = require('../controllers/favorite.controller');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All favorite routes require authentication
router.use(protect);

router.post('/toggle/:tripId', favoriteController.toggleFavorite);
router.post('/:tripId', favoriteController.addFavorite);
router.delete('/:tripId', favoriteController.removeFavorite);
router.get('/', favoriteController.getUserFavorites);
router.get('/check/:tripId', favoriteController.checkIsFavorite);

module.exports = router;
