const Category = require('../models/category.model');
const ApiError = require('../utils/ApiError');

class CategoryService {
  async createCategory(data, creatorUser = null) {
    let { nameEn, nameAr, slug, image } = data;
    if (!slug) {
      slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new ApiError(400, 'CATEGORY_ALREADY_EXISTS');
    }

    const isProtected = (creatorUser && (creatorUser.isProtected || creatorUser.role === 'admin'))
      ? true
      : (data.isProtected === true || data.isProtected === 'true');

    return await Category.create({
      nameEn,
      nameAr,
      slug,
      image,
      isProtected,
    });
  }

  async getAllCategories(isAdmin = false) {
    const filter = isAdmin ? {} : { isActive: true };
    return await Category.find(filter).sort({ nameEn: 1 });
  }

  async updateCategory(categoryId, data) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new ApiError(404, 'CATEGORY_NOT_FOUND');
    }

    ['nameEn', 'nameAr', 'slug', 'image', 'isActive', 'isProtected'].forEach((field) => {
      if (data[field] !== undefined) category[field] = data[field];
    });

    await category.save();
    return category;
  }

  async deleteCategory(categoryId) {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      throw new ApiError(404, 'CATEGORY_NOT_FOUND');
    }
    return true;
  }
}

module.exports = new CategoryService();
