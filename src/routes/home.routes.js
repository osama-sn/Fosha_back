const express = require('express');
const homeController = require('../controllers/home.controller');
const { optionalProtect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public / Optional Protected Home Endpoint
router.get('/', optionalProtect, homeController.getHomeData);

module.exports = router;
