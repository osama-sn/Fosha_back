const { getPagination, getPagingData } = require('../utils/pagination.util');

/**
 * Generic Base Repository providing standard CRUD and pagination abstractions.
 * Decouples Domain Services from direct Mongoose query details for clean maintenance & testing.
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findById(id, populate = []) {
    return this.model.findById(id).populate(populate);
  }

  async findOne(filter = {}, populate = []) {
    return this.model.findOne(filter).populate(populate);
  }

  async find(filter = {}, options = {}) {
    const { sort = { createdAt: -1 }, populate = [], select = '' } = options;
    return this.model.find(filter).select(select).sort(sort).populate(populate);
  }

  async findPaginated(filter = {}, query = {}, options = {}) {
    const { page, limit, skip } = getPagination(query);
    const { sort = { createdAt: -1 }, populate = [], select = '', dataKey = 'items' } = options;

    const [items, total] = await Promise.all([
      this.model.find(filter).select(select).sort(sort).skip(skip).limit(limit).populate(populate),
      this.model.countDocuments(filter),
    ]);

    return getPagingData(items, total, page, limit, dataKey);
  }

  async updateById(id, updateData, options = { new: true }) {
    return this.model.findByIdAndUpdate(id, updateData, options);
  }

  async softDelete(id) {
    return this.model.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async exists(filter = {}) {
    const doc = await this.model.exists(filter);
    return !!doc;
  }
}

module.exports = BaseRepository;
