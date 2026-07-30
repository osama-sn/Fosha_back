const mongoose = require('mongoose');
const Trip = require('../models/trip.model');
const Company = require('../models/company.model');
const ApiError = require('../utils/ApiError');
const { getPagination, getPagingData } = require('../utils/pagination.util');

class TripService {
  /**
   * Helper to process uploaded files and format days/activities with ObjectIds and image paths.
   */
  _processTripFilesAndDays(daysInput, files = {}) {
    let days = [];
    if (typeof daysInput === 'string') {
      try {
        days = JSON.parse(daysInput);
      } catch (e) {
        days = [];
      }
    } else if (Array.isArray(daysInput)) {
      days = daysInput;
    }

    const gallerySet = new Set();

    // 1. Process uploaded gallery images
    if (files.gallery && Array.isArray(files.gallery)) {
      files.gallery.forEach((file) => {
        gallerySet.add(`/uploads/trips/${file.filename}`);
      });
    }

    // 2. Map activity images and ensure ObjectIds for nested structures
    const processedDays = days.map((day, dIdx) => {
      const activities = (day.activities || []).map((act, aIdx) => {
        let actImage = act.image || '';

        // If activity image was uploaded in request files
        if (files.activityImages && Array.isArray(files.activityImages)) {
          // Find matching uploaded file if passed by field name or index
          const matchingFile = files.activityImages.find(
            (f) => f.fieldname === `activityImage_${dIdx}_${aIdx}` || f.originalname.includes(`act_${dIdx}_${aIdx}`)
          );
          if (matchingFile) {
            actImage = `/uploads/trips/${matchingFile.filename}`;
          }
        }

        // Auto-add activity image to gallery if present and unique
        if (actImage) {
          gallerySet.add(actImage);
        }

        return {
          _id: act._id || new mongoose.Types.ObjectId(),
          time: act.time || '',
          title: act.title,
          description: act.description || '',
          location: act.location || '',
          image: actImage,
        };
      });

      return {
        _id: day._id || new mongoose.Types.ObjectId(),
        dayNumber: day.dayNumber || dIdx + 1,
        title: day.title,
        activities,
      };
    });

    return {
      processedDays,
      processedGallery: Array.from(gallerySet),
    };
  }

  /**
   * Resolve company ID for trip creation
   */
  async _resolveCompanyId(data, creatorUser) {
    if (creatorUser && creatorUser.role === 'company_admin') {
      const companyId = creatorUser.company._id || creatorUser.company;
      if (!companyId) {
        throw new ApiError(403, 'COMPANY_ACCOUNT_NOT_LINKED');
      }
      return companyId;
    }

    // If specified in data (for Super Admin)
    if (data.company && mongoose.Types.ObjectId.isValid(data.company)) {
      const comp = await Company.findById(data.company);
      if (comp) return comp._id;
    }

    // Fallback to default company
    let defaultCompany = await Company.findOne({ isProtected: true });
    if (!defaultCompany) {
      defaultCompany = await Company.findOne({ status: 'active' });
    }
    if (!defaultCompany) {
      throw new ApiError(400, 'NO_ACTIVE_COMPANY_FOUND');
    }
    return defaultCompany._id;
  }

  /**
   * Create a new trip
   */
  async createTrip(data, files = {}, creatorUser = null) {
    let {
      title,
      description,
      origin,
      destination,
      price,
      capacity,
      startDate,
      endDate,
      status,
      included,
      excluded,
      cancelPolicy,
      category,
      isFeatured,
      featuredUntil,
    } = data;

    // Resolve target company
    const companyId = await this._resolveCompanyId(data, creatorUser);

    // Parse array fields if passed as JSON string in multipart/form-data
    if (typeof included === 'string') {
      try { included = JSON.parse(included); } catch (e) { included = []; }
    }
    if (typeof excluded === 'string') {
      try { excluded = JSON.parse(excluded); } catch (e) { excluded = []; }
    }

    const { processedDays, processedGallery } = this._processTripFilesAndDays(data.days, files);

    let coverImage = '';
    if (files.coverImage && files.coverImage[0]) {
      coverImage = `/uploads/trips/${files.coverImage[0].filename}`;
      processedGallery.unshift(coverImage);
    }

    const uniqueGallery = Array.from(new Set(processedGallery));

    const isProtected = (creatorUser && (creatorUser.isProtected || creatorUser.role === 'super_admin' || creatorUser.role === 'admin'))
      ? true
      : (data.isProtected === true || data.isProtected === 'true');

    const trip = await Trip.create({
      title,
      description,
      origin,
      destination,
      price: Number(price),
      capacity: Number(capacity),
      availableSeats: Number(capacity),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || 'draft',
      createdBySystem: false,
      isDeleted: false,
      coverImage,
      gallery: uniqueGallery,
      included: Array.isArray(included) ? included : [],
      excluded: Array.isArray(excluded) ? excluded : [],
      cancelPolicy: cancelPolicy || '',
      category: category || null,
      company: companyId,
      isFeatured: isFeatured === true || isFeatured === 'true',
      featuredUntil: featuredUntil || null,
      days: processedDays,
      isProtected,
    });

    return trip;
  }

  /**
   * Get all trips with pagination, search, filter, sort
   */
  async getAllTrips(query, user = null) {
    const { page, limit, skip } = getPagination(query);

    const filter = { isDeleted: false };
    const isAdmin = user && ['super_admin', 'admin'].includes(user.role);
    const isCompanyAdmin = user && user.role === 'company_admin';

    // Role-based visibility
    if (isCompanyAdmin) {
      const companyId = user.company._id || user.company;
      filter.company = companyId;
      if (query.status) {
        filter.status = query.status;
      }
    } else if (!isAdmin) {
      // Public users only see published trips
      filter.status = 'published';

      // Only include trips from active companies
      const activeCompanyIds = await Company.find({ status: 'active', isDeleted: false }).distinct('_id');
      filter.company = { $in: activeCompanyIds };
    } else if (query.status) {
      if (query.status === 'unpublished') {
        filter.status = { $ne: 'published' };
      } else if (query.status.includes(',')) {
        filter.status = { $in: query.status.split(',').map((s) => s.trim()) };
      } else {
        filter.status = query.status;
      }
    }

    // Filter by company explicitly if provided
    if (query.company && mongoose.Types.ObjectId.isValid(query.company)) {
      filter.company = query.company;
    }

    // Filter by featured trips
    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured === 'true';
    }

    // Search by keyword (title, destination, origin, description)
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { destination: searchRegex },
        { origin: searchRegex },
        { description: searchRegex },
      ];
    }

    // Search specifically by city (matches either destination or origin)
    if (query.city) {
      const cityRegex = new RegExp(query.city, 'i');
      filter.$or = [{ destination: cityRegex }, { origin: cityRegex }];
    }

    if (query.destination) {
      filter.destination = new RegExp(query.destination, 'i');
    }

    if (query.origin) {
      filter.origin = new RegExp(query.origin, 'i');
    }

    if (query.category) {
      if (mongoose.Types.ObjectId.isValid(query.category)) {
        filter.category = query.category;
      } else {
        const Category = require('../models/category.model');
        const cat = await Category.findOne({ slug: query.category.toLowerCase() });
        if (cat) filter.category = cat._id;
      }
    }

    // Sorting options (Prioritize featured trips first by default)
    let sort = { isFeatured: -1, createdAt: -1 };
    if (query.sort === 'price_asc') sort = { isFeatured: -1, price: 1 };
    else if (query.sort === 'price_desc') sort = { isFeatured: -1, price: -1 };
    else if (query.sort === 'date_asc') sort = { isFeatured: -1, startDate: 1 };
    else if (query.sort === 'date_desc') sort = { isFeatured: -1, startDate: -1 };
    else if (query.sort === 'rating_desc') sort = { isFeatured: -1, averageRating: -1 };

    const trips = await Trip.find(filter)
      .populate('category', 'nameEn nameAr slug image')
      .populate('company', 'name logo averageRating reviewsCount isFeatured')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalItems = await Trip.countDocuments(filter);

    return getPagingData(trips, totalItems, page, limit, 'trips');
  }

  /**
   * Get featured trips list
   */
  async getFeaturedTrips(limit = 10) {
    const activeCompanyIds = await Company.find({ status: 'active', isDeleted: false }).distinct('_id');

    const trips = await Trip.find({
      status: 'published',
      isDeleted: false,
      isFeatured: true,
      company: { $in: activeCompanyIds },
    })
      .populate('category', 'nameEn nameAr slug image')
      .populate('company', 'name logo averageRating reviewsCount isFeatured')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return trips;
  }

  /**
   * Get single trip by ID
   */
  async getTripById(tripId, user = null) {
    const filter = { _id: tripId, isDeleted: false };
    const isAdmin = user && ['super_admin', 'admin'].includes(user.role);
    const isCompanyAdmin = user && user.role === 'company_admin';

    if (isCompanyAdmin) {
      filter.company = user.company._id || user.company;
    } else if (!isAdmin) {
      filter.status = 'published';
    }

    const trip = await Trip.findOne(filter)
      .populate('category', 'nameEn nameAr slug image')
      .populate('company', 'name description logo coverImage contactPhone contactEmail averageRating reviewsCount isFeatured');

    if (!trip) {
      throw new ApiError(404, 'TRIP_NOT_FOUND');
    }

    return trip;
  }

  /**
   * Update existing trip
   */
  async updateTrip(tripId, data, files = {}, user = null) {
    const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
    if (!trip) {
      throw new ApiError(404, 'TRIP_NOT_FOUND');
    }

    // Authorization check
    if (user && user.role === 'company_admin') {
      const userCompanyId = user.company._id ? user.company._id.toString() : user.company.toString();
      if (trip.company.toString() !== userCompanyId) {
        throw new ApiError(403, 'FORBIDDEN_NOT_TRIP_OWNER');
      }
    }

    // Process cover image upload
    if (files.coverImage && files.coverImage[0]) {
      data.coverImage = `/uploads/trips/${files.coverImage[0].filename}`;
    }

    // Process days and gallery if provided
    if (data.days || (files.gallery && files.gallery.length > 0)) {
      const { processedDays, processedGallery } = this._processTripFilesAndDays(
        data.days || trip.days,
        files
      );
      if (data.days) data.days = processedDays;

      if (processedGallery.length > 0) {
        const existingGallery = trip.gallery || [];
        data.gallery = Array.from(new Set([...existingGallery, ...processedGallery]));
      }
    }

    // Parse array fields if needed
    if (typeof data.included === 'string') {
      try { data.included = JSON.parse(data.included); } catch (e) {}
    }
    if (typeof data.excluded === 'string') {
      try { data.excluded = JSON.parse(data.excluded); } catch (e) {}
    }

    // Handle capacity update vs availableSeats
    if (data.capacity !== undefined) {
      const newCapacity = Number(data.capacity);
      const bookedSeats = trip.capacity - trip.availableSeats;
      if (newCapacity < bookedSeats) {
        throw new ApiError(400, 'CAPACITY_CANNOT_BE_LESS_THAN_BOOKED_SEATS');
      }
      data.availableSeats = newCapacity - bookedSeats;
    }

    Object.assign(trip, data);
    await trip.save();

    return trip;
  }

  /**
   * Delete trip (Soft delete)
   */
  async deleteTrip(tripId, user = null) {
    const trip = await Trip.findOne({ _id: tripId, isDeleted: false });
    if (!trip) {
      throw new ApiError(404, 'TRIP_NOT_FOUND');
    }

    if (user && user.role === 'company_admin') {
      const userCompanyId = user.company._id ? user.company._id.toString() : user.company.toString();
      if (trip.company.toString() !== userCompanyId) {
        throw new ApiError(403, 'FORBIDDEN_NOT_TRIP_OWNER');
      }
    }

    if (trip.isProtected) {
      throw new ApiError(400, 'PROTECTED_TRIP_CANNOT_BE_DELETED');
    }

    trip.isDeleted = true;
    await trip.save();

    return true;
  }
}

module.exports = new TripService();
