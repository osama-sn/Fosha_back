const express = require('express');
const categoryController = require('../controllers/category.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public route: Get all categories
router.get('/', categoryController.getAllCategories);

// Admin routes
router.post('/', protect, authorize('admin'), categoryController.createCategory);
router.put('/:id', protect, authorize('admin'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router;
