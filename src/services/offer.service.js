const Offer = require('../models/offer.model');
const ApiError = require('../utils/ApiError');

class OfferService {
  async createOffer(data, imagePath = null, creatorUser = null) {
    const image = imagePath || data.image;
    if (!image) {
      throw new ApiError(400, 'VAL_OFFER_IMAGE_REQUIRED');
    }

    const isProtected = (creatorUser && (creatorUser.isProtected || creatorUser.role === 'admin'))
      ? true
      : (data.isProtected === true || data.isProtected === 'true');

    const offer = await Offer.create({
      titleEn: data.titleEn,
      titleAr: data.titleAr,
      descriptionEn: data.descriptionEn || '',
      descriptionAr: data.descriptionAr || '',
      image,
      trip: data.trip || null,
      discountPercentage: data.discountPercentage ? Number(data.discountPercentage) : undefined,
      promoCode: data.promoCode || undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      priority: data.priority !== undefined ? Number(data.priority) : 0,
      isActive: data.isActive !== undefined ? (data.isActive === true || data.isActive === 'true') : true,
      isProtected,
    });

    return await offer.populate('trip');
  }

  async getAllOffers(query = {}, isAdmin = false) {
    let filter = {};

    if (isAdmin) {
      if (query.isActive !== undefined) {
        filter.isActive = query.isActive === 'true';
      }
    } else {
      const now = new Date();
      filter = {
        isActive: true,
        $and: [
          { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
          { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
        ],
      };
    }

    return await Offer.find(filter)
      .populate('trip', 'title origin destination price coverImage status availableSeats startDate endDate')
      .sort({ priority: -1, createdAt: -1 });
  }

  async getOfferById(id) {
    const offer = await Offer.findById(id).populate('trip');
    if (!offer) {
      throw new ApiError(404, 'OFFER_NOT_FOUND');
    }
    return offer;
  }

  async updateOffer(id, data, imagePath = null) {
    const offer = await Offer.findById(id);
    if (!offer) {
      throw new ApiError(404, 'OFFER_NOT_FOUND');
    }

    const fields = [
      'titleEn',
      'titleAr',
      'descriptionEn',
      'descriptionAr',
      'trip',
      'discountPercentage',
      'promoCode',
      'startDate',
      'endDate',
      'priority',
      'isActive',
      'isProtected',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          offer[field] = data[field] ? new Date(data[field]) : null;
        } else if (field === 'priority' || field === 'discountPercentage') {
          offer[field] = data[field] !== '' ? Number(data[field]) : undefined;
        } else if (field === 'isActive' || field === 'isProtected') {
          offer[field] = data[field] === true || data[field] === 'true';
        } else if (field === 'trip') {
          offer[field] = data[field] ? data[field] : null;
        } else {
          offer[field] = data[field];
        }
      }
    });

    if (imagePath) {
      offer.image = imagePath;
    }

    await offer.save();
    return await offer.populate('trip');
  }

  async deleteOffer(id) {
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) {
      throw new ApiError(404, 'OFFER_NOT_FOUND');
    }
    return true;
  }
}

module.exports = new OfferService();
