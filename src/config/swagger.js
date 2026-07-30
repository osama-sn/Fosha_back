const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rahala API Documentation',
      version: '1.0.0',
      description:
        'رحالة - Travel Booking Platform API. Complete REST API documentation for authentication, trips, bookings, reviews, favorites, notifications, categories, coupons, and admin analytics.',
      contact: {
        name: 'Rahala Team',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      parameters: {
        AcceptLanguage: {
          in: 'header',
          name: 'Accept-Language',
          schema: {
            type: 'string',
            enum: ['en', 'ar'],
            default: 'en',
          },
          description: 'Language for response messages (en / ar)',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 200 },
            success: { type: 'boolean', example: true },
            code: { type: 'string', example: 'OPERATION_SUCCESS' },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 400 },
            success: { type: 'boolean', example: false },
            code: { type: 'string', example: 'ERROR_CODE' },
            message: { type: 'string', example: 'Error description' },
            data: { type: 'object' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            fullName: { type: 'string', example: 'Ahmed Ali' },
            email: { type: 'string', example: 'ahmed@example.com' },
            phone: { type: 'string', example: '01012345678' },
            profileImage: { type: 'string', example: '/uploads/profiles/avatar.jpg' },
            authProvider: { type: 'string', enum: ['local', 'google'], example: 'local' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Trip: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            title: { type: 'string', example: 'رحلة إلى شرم الشيخ' },
            description: { type: 'string', example: 'رحلة ممتعة لمدة 3 أيام' },
            origin: { type: 'string', example: 'القاهرة' },
            destination: { type: 'string', example: 'شرم الشيخ' },
            price: { type: 'number', example: 2500 },
            capacity: { type: 'integer', example: 30 },
            availableSeats: { type: 'integer', example: 25 },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            category: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            status: { type: 'string', enum: ['draft', 'published', 'cancelled', 'completed'], example: 'published' },
            coverImage: { type: 'string', example: '/uploads/trips/cover.jpg' },
            gallery: { type: 'array', items: { type: 'string' } },
            included: { type: 'array', items: { type: 'string' }, example: ['إفطار', 'مواصلات'] },
            excluded: { type: 'array', items: { type: 'string' }, example: ['غداء'] },
            cancelPolicy: { type: 'string', example: 'إلغاء مجاني قبل 48 ساعة' },
            averageRating: { type: 'number', example: 4.5 },
            reviewsCount: { type: 'integer', example: 12 },
            days: {
              type: 'array',
              items: { $ref: '#/components/schemas/Day' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Day: {
          type: 'object',
          properties: {
            dayNumber: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'يوم الوصول' },
            activities: {
              type: 'array',
              items: { $ref: '#/components/schemas/Activity' },
            },
          },
        },
        Activity: {
          type: 'object',
          properties: {
            time: { type: 'string', example: '09:00' },
            title: { type: 'string', example: 'زيارة الأهرامات' },
            description: { type: 'string', example: 'جولة مع مرشد سياحي' },
            location: { type: 'string', example: 'الجيزة' },
            image: { type: 'string', example: '/uploads/trips/activity.jpg' },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            user: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            trip: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            numberOfSeats: { type: 'integer', example: 2 },
            totalPrice: { type: 'number', example: 5000 },
            tripSnapshot: { $ref: '#/components/schemas/TripSnapshot' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'], example: 'pending' },
            notes: { type: 'string', example: 'نحتاج مقاعد بجانب النافذة' },
            rejectionReason: { type: 'string' },
            cancellationReason: { type: 'string' },
            cancelledBy: { type: 'string', enum: ['user', 'admin'] },
            approvedAt: { type: 'string', format: 'date-time' },
            rejectedAt: { type: 'string', format: 'date-time' },
            cancelledAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TripSnapshot: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'رحلة إلى شرم الشيخ' },
            coverImage: { type: 'string' },
            origin: { type: 'string', example: 'القاهرة' },
            destination: { type: 'string', example: 'شرم الشيخ' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            pricePerSeat: { type: 'number', example: 2500 },
          },
        },
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            trip: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            user: { $ref: '#/components/schemas/User' },
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            comment: { type: 'string', example: 'رحلة رائعة!' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            nameEn: { type: 'string', example: 'Adventure' },
            nameAr: { type: 'string', example: 'مغامرات' },
            slug: { type: 'string', example: 'adventure' },
            image: { type: 'string' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Coupon: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            code: { type: 'string', example: 'SUMMER25' },
            discountPercentage: { type: 'number', minimum: 1, maximum: 100, example: 25 },
            maxDiscountAmount: { type: 'number', example: 500 },
            minTripPrice: { type: 'number', example: 1000 },
            validUntil: { type: 'string', format: 'date-time' },
            usageLimit: { type: 'integer', example: 100 },
            usedCount: { type: 'integer', example: 5 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Offer: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            titleEn: { type: 'string', example: 'Summer Special Discount' },
            titleAr: { type: 'string', example: 'عرض الصيف الخاص' },
            descriptionEn: { type: 'string', example: 'Get 20% off all beach trips this summer!' },
            descriptionAr: { type: 'string', example: 'احصل على خصم 20% على جميع الرحلات الشاطئية!' },
            image: { type: 'string', example: '/uploads/offers/offer-123456.jpg' },
            trip: { $ref: '#/components/schemas/Trip' },
            discountPercentage: { type: 'number', example: 20 },
            promoCode: { type: 'string', example: 'SUMMER20' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            priority: { type: 'integer', example: 10 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Favorite: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            user: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            trip: { $ref: '#/components/schemas/Trip' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            user: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            title: { type: 'string', example: 'تم قبول حجزك' },
            body: { type: 'string', example: 'تم الموافقة على حجزك لرحلة شرم الشيخ' },
            type: { type: 'string', enum: ['booking', 'trip', 'promo', 'system', 'general'], example: 'booking' },
            data: { type: 'object' },
            isRead: { type: 'boolean', example: false },
            readAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 5 },
            totalItems: { type: 'integer', example: 50 },
            limit: { type: 'integer', example: 10 },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoint' },
      { name: 'Auth', description: 'Authentication & user management' },
      { name: 'Trips', description: 'Trip browsing & management' },
      { name: 'Reviews', description: 'Trip reviews' },
      { name: 'Bookings', description: 'Booking operations' },
      { name: 'Favorites', description: 'User favorite trips' },
      { name: 'Notifications', description: 'Push notifications & FCM' },
      { name: 'Categories', description: 'Trip categories' },
      { name: 'Coupons', description: 'Promo coupon codes' },
      { name: 'Offers', description: 'Promotional offers & banners' },
      { name: 'Admin', description: 'Admin dashboard & analytics' },
    ],
  },
  apis: ['./src/docs/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #2d6a4f; }
      `,
      customSiteTitle: 'Rahala API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
      },
    })
  );
};

module.exports = setupSwagger;
