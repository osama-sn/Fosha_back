const categoryService = require('../services/category.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class CategoryController {
  createCategory = AsyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.body, req.user);
    res.status(201).json(new ApiResponse(201, 'CATEGORY_CREATED', category, req.lang));
  });

  getAllCategories = AsyncHandler(async (req, res) => {
    const isAdmin = req.user && req.user.role === 'admin';
    const categories = await categoryService.getAllCategories(isAdmin);
    res.status(200).json(new ApiResponse(200, 'CATEGORIES_FETCHED', categories, req.lang));
  });

  updateCategory = AsyncHandler(async (req, res) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, 'CATEGORY_UPDATED', category, req.lang));
  });

  deleteCategory = AsyncHandler(async (req, res) => {
    await categoryService.deleteCategory(req.params.id);
    res.status(200).json(new ApiResponse(200, 'CATEGORY_DELETED', {}, req.lang));
  });
}

module.exports = new CategoryController();
