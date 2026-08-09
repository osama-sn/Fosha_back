const Company = require('../models/company.model');
const User = require('../models/user.model');
const CompanyReview = require('../models/companyReview.model');
const ApiError = require('../utils/ApiError');

class CompanyService {
  /**
   * Create a new company along with its company_admin account (Super Admin only)
   */
  async createCompany(payload) {
    const {
      name,
      description,
      logo,
      coverImage,
      contactPhone,
      contactEmail,
      address,
      governorate,
      commissionType,
      commissionValue,
      monthlySubscriptionFee,
      isFeatured,
      featuredUntil,
      // Admin account credentials
      adminFullName,
      adminEmail,
      adminPhone,
      adminPassword,
    } = payload;

    // Check if email or phone already exists
    const existingUser = await User.findOne({
      $or: [{ email: adminEmail.toLowerCase() }, { phone: adminPhone }],
    });
    if (existingUser) {
      throw new ApiError(400, 'ADMIN_EMAIL_OR_PHONE_ALREADY_EXISTS');
    }

    // 1. Create company admin user
    const companyAdminUser = await User.create({
      fullName: adminFullName || `${name} Admin`,
      email: adminEmail.toLowerCase(),
      phone: adminPhone,
      password: adminPassword,
      role: 'company_admin',
    });

    // 2. Create Company
    const company = await Company.create({
      name,
      description,
      logo,
      coverImage,
      contactPhone,
      contactEmail,
      address,
      governorate: governorate || '',
      owner: companyAdminUser._id,
      commissionType: commissionType || 'percentage',
      commissionValue: commissionValue !== undefined ? commissionValue : 10,
      monthlySubscriptionFee: monthlySubscriptionFee || 0,
      isFeatured: Boolean(isFeatured),
      featuredUntil: featuredUntil || null,
    });

    // 3. Link company to company admin user
    companyAdminUser.company = company._id;
    await companyAdminUser.save();

    return {
      company,
      companyAdmin: {
        id: companyAdminUser._id,
        fullName: companyAdminUser.fullName,
        email: companyAdminUser.email,
        phone: companyAdminUser.phone,
        role: companyAdminUser.role,
      },
    };
  }

  /**
   * Get list of companies (Public / Admin)
   */
  async getCompanies(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      governorate = '',
      minRating,
      status = 'active',
      isFeatured,
      sortBy = 'featured',
    } = query;

    const filter = { isDeleted: false };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
        { governorate: searchRegex },
      ];
    }

    if (governorate) {
      const govRegex = new RegExp(governorate, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ governorate: govRegex }, { address: govRegex }],
      });
    }

    if (minRating) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true';
    }

    let sortOptions = {};
    if (sortBy === 'featured') {
      sortOptions = { isFeatured: -1, averageRating: -1, createdAt: -1 };
    } else if (sortBy === 'rating') {
      sortOptions = { averageRating: -1, reviewsCount: -1 };
    } else if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else {
      sortOptions = { isFeatured: -1, createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .populate('owner', 'fullName email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Company.countDocuments(filter),
    ]);

    const Trip = require('../models/trip.model');
    const Booking = require('../models/booking.model');

    const companiesWithStats = await Promise.all(
      companies.map(async (comp) => {
        const compObj = comp.toObject();
        const activeTripsCount = await Trip.countDocuments({
          company: comp._id,
          status: 'published',
          isDeleted: false,
        });
        const totalTripsCount = await Trip.countDocuments({
          company: comp._id,
          isDeleted: false,
        });
        const salesAgg = await Booking.aggregate([
          { $match: { company: comp._id, status: 'approved' } },
          { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } },
        ]);
        compObj.activeTripsCount = activeTripsCount;
        compObj.totalTripsCount = totalTripsCount;
        compObj.totalSales = salesAgg.length > 0 ? salesAgg[0].totalSales : 0;
        return compObj;
      })
    );

    return {
      companies: companiesWithStats,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get single company by ID
   */
  async getCompanyById(id) {
    const company = await Company.findById(id).populate('owner', 'fullName email phone profileImage');
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }
    return company;
  }

  /**
   * Update company profile (Company Admin or Super Admin)
   */
  async updateCompany(id, updateData, user) {
    const company = await Company.findById(id);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    const isSuperAdmin = ['super_admin', 'admin'].includes(user.role);
    const isOwner = company.owner.toString() === user._id.toString();

    if (!isSuperAdmin && !isOwner) {
      throw new ApiError(403, 'FORBIDDEN_NOT_COMPANY_OWNER');
    }

    // Company Admin allowed updates
    const allowedCompanyAdminFields = [
      'name',
      'description',
      'logo',
      'coverImage',
      'contactPhone',
      'contactEmail',
      'address',
      'governorate',
    ];

    // Super Admin additional updates
    const allowedSuperAdminFields = [
      ...allowedCompanyAdminFields,
      'status',
      'commissionType',
      'commissionValue',
      'monthlySubscriptionFee',
      'subscriptionStatus',
      'subscriptionEndDate',
      'isFeatured',
      'featuredUntil',
    ];

    const fieldsToUpdate = isSuperAdmin ? allowedSuperAdminFields : allowedCompanyAdminFields;

    fieldsToUpdate.forEach((field) => {
      if (updateData[field] !== undefined) {
        company[field] = updateData[field];
      }
    });

    await company.save();
    return company;
  }

  /**
   * Soft delete company (Super Admin only)
   */
  async deleteCompany(id) {
    const company = await Company.findById(id);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    company.isDeleted = true;
    await company.save();
    return true;
  }

  /**
   * Add or update review for a company
   */
  async addCompanyReview(companyId, userId, { rating, comment }) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    let review = await CompanyReview.findOne({ company: companyId, user: userId });
    if (review) {
      review.rating = rating;
      review.comment = comment || '';
      await review.save();
    } else {
      review = await CompanyReview.create({
        company: companyId,
        user: userId,
        rating,
        comment: comment || '',
      });
    }

    // Recalculate average rating & reviews count
    const stats = await CompanyReview.aggregate([
      { $match: { company: company._id } },
      {
        $group: {
          _id: '$company',
          averageRating: { $avg: '$rating' },
          reviewsCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      company.averageRating = Number(stats[0].averageRating.toFixed(1));
      company.reviewsCount = stats[0].reviewsCount;
      await company.save();
    }

    return review;
  }

  /**
   * Get reviews for a company
   */
  async getCompanyReviews(companyId, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      CompanyReview.find({ company: companyId })
        .populate('user', 'fullName profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      CompanyReview.countDocuments({ company: companyId }),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }
}

module.exports = new CompanyService();
