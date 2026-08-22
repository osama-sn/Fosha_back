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
  async updateCompany(id, updateData, user, files = {}) {
    const company = await Company.findById(id);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    const isSuperAdmin = ['super_admin', 'admin'].includes(user.role);
    const isOwner = company.owner.toString() === user._id.toString();

    if (!isSuperAdmin && !isOwner) {
      throw new ApiError(403, 'FORBIDDEN_NOT_COMPANY_OWNER');
    }

    // Process uploaded logo and cover image files
    if (files && files.logo && files.logo[0]) {
      company.logo = `/uploads/companies/${files.logo[0].filename}`;
    }
    if (files && files.coverImage && files.coverImage[0]) {
      company.coverImage = `/uploads/companies/${files.coverImage[0].filename}`;
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
      'whatsapp',
      'paymentMethods',
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
        if (field === 'paymentMethods' && typeof updateData[field] === 'string') {
          try {
            company[field] = JSON.parse(updateData[field]);
          } catch (e) {
            // Keep existing if JSON parse fails
          }
        } else {
          company[field] = updateData[field];
        }
      }
    });

    if (updateData.socialMedia) {
      let social = updateData.socialMedia;
      if (typeof social === 'string') {
        try { social = JSON.parse(social); } catch (e) { social = {}; }
      }
      company.socialMedia = {
        ...(company.socialMedia || {}),
        ...social,
      };
    }

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
   * Add or update review for a company (Requires at least one completed booking with company)
   */
  async addCompanyReview(companyId, userId, { rating, comment }) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    // Verify user has completed booking with this company
    const Booking = require('../models/booking.model');
    const completedBooking = await Booking.findOne({
      user: userId,
      company: companyId,
      $or: [
        { status: 'completed' },
        { status: 'approved', 'tripSnapshot.endDate': { $lte: new Date() } },
      ],
    });

    if (!completedBooking) {
      throw new ApiError(400, 'COMPLETED_BOOKING_REQUIRED_FOR_COMPANY_REVIEW');
    }

    let review = await CompanyReview.findOne({ company: companyId, user: userId });
    if (review) {
      review.rating = Number(rating);
      review.comment = comment || '';
      await review.save();
    } else {
      review = await CompanyReview.create({
        company: companyId,
        user: userId,
        rating: Number(rating),
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

  /**
   * Helper to verify if user has permission to manage company
   */
  _checkCompanyPermission(company, user) {
    const isSuperAdmin = user && ['super_admin', 'admin'].includes(user.role);
    const isOwner = user && company.owner.toString() === user._id.toString();
    const isCompanyAdminOfThisCompany = user && user.role === 'company_admin' && (
      (user.company && (user.company._id ? user.company._id.toString() : user.company.toString())) === company._id.toString()
    );

    if (!isSuperAdmin && !isOwner && !isCompanyAdminOfThisCompany) {
      throw new ApiError(403, 'FORBIDDEN_NOT_COMPANY_OWNER');
    }
  }

  /**
   * Get payment accounts for a company
   */
  async getPaymentAccounts(companyId, user = null) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    const isPrivileged = user && (
      ['super_admin', 'admin'].includes(user.role) ||
      company.owner.toString() === user._id.toString() ||
      (user.role === 'company_admin' && user.company && (user.company._id ? user.company._id.toString() : user.company.toString()) === company._id.toString())
    );

    if (!isPrivileged) {
      return (company.paymentAccounts || []).filter((acc) => acc.isActive);
    }

    return company.paymentAccounts || [];
  }

  /**
   * Add a payment account for a company
   */
  async addPaymentAccount(companyId, user, payload) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    this._checkCompanyPermission(company, user);

    const { provider, title, number, handle, accountHolder, bankName, iban, instructions, isActive } = payload;

    if (!provider) {
      throw new ApiError(400, 'PROVIDER_REQUIRED');
    }

    const newAccount = {
      provider,
      title: title || '',
      number: number || '',
      handle: handle || '',
      accountHolder: accountHolder || '',
      bankName: bankName || '',
      iban: iban || '',
      instructions: instructions || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    };

    company.paymentAccounts.push(newAccount);
    await company.save();

    return company.paymentAccounts;
  }

  /**
   * Update an existing payment account
   */
  async updatePaymentAccount(companyId, accountId, user, payload) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    this._checkCompanyPermission(company, user);

    const account = company.paymentAccounts.id(accountId);
    if (!account) {
      throw new ApiError(404, 'PAYMENT_ACCOUNT_NOT_FOUND');
    }

    const allowedFields = ['provider', 'title', 'number', 'handle', 'accountHolder', 'bankName', 'iban', 'instructions', 'isActive'];
    allowedFields.forEach((field) => {
      if (payload[field] !== undefined) {
        account[field] = payload[field];
      }
    });

    await company.save();
    return account;
  }

  /**
   * Toggle isActive status of a payment account
   */
  async togglePaymentAccount(companyId, accountId, user) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    this._checkCompanyPermission(company, user);

    const account = company.paymentAccounts.id(accountId);
    if (!account) {
      throw new ApiError(404, 'PAYMENT_ACCOUNT_NOT_FOUND');
    }

    account.isActive = !account.isActive;
    await company.save();

    return account;
  }

  /**
   * Delete a payment account
   */
  async deletePaymentAccount(companyId, accountId, user) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'COMPANY_NOT_FOUND');
    }

    this._checkCompanyPermission(company, user);

    const accountIndex = company.paymentAccounts.findIndex((acc) => acc._id.toString() === accountId.toString());
    if (accountIndex === -1) {
      throw new ApiError(404, 'PAYMENT_ACCOUNT_NOT_FOUND');
    }

    company.paymentAccounts.splice(accountIndex, 1);
    await company.save();

    return true;
  }
}

module.exports = new CompanyService();
