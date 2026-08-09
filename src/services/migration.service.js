const User = require('../models/user.model');
const Company = require('../models/company.model');
const Trip = require('../models/trip.model');
const Booking = require('../models/booking.model');

class MigrationService {
  /**
   * Ensures default Super Admin user and Default Company exist,
   * and links any existing legacy trips/bookings to the default company.
   */
  async ensureDefaultCompanyAndMigrate() {
    try {
      // 1. Ensure at least one Super Admin user exists
      let admin = await User.findOne({ role: { $in: ['super_admin', 'admin'] } });
      if (!admin) {
        admin = await User.create({
          fullName: 'Super Admin',
          email: 'admin@fosha.com',
          phone: '+201000000000',
          password: 'AdminPassword123!',
          role: 'super_admin',
          isProtected: true,
        });
        console.log('👑 Default Super Admin user created: admin@fosha.com');
      } else if (admin.role === 'admin') {
        admin.role = 'super_admin';
        await admin.save();
      }

      // 2. Ensure Default Company exists
      let defaultCompany = await Company.findOne({ name: 'شركة فسحة للسياحة' });
      if (!defaultCompany) {
        defaultCompany = await Company.create({
          name: 'شركة فسحة للسياحة',
          description: 'الشركة الافتراضية لمنصة فسحة للرحلات',
          contactPhone: admin.phone || '+201000000000',
          contactEmail: admin.email || 'admin@fosha.com',
          owner: admin._id,
          status: 'active',
          commissionType: 'percentage',
          commissionValue: 10,
          monthlySubscriptionFee: 0,
          isProtected: true,
        });
        console.log('🏢 Default Company created:', defaultCompany.name);
      }

      // Update admin user to link to default company if needed
      if (!admin.company) {
        admin.company = defaultCompany._id;
        await admin.save();
      }

      // 3. Migrate legacy Trips that do not have a company field
      const unlinkedTripsCount = await Trip.countDocuments({ company: { $exists: false } });
      if (unlinkedTripsCount > 0) {
        await Trip.updateMany(
          { company: { $exists: false } },
          { $set: { company: defaultCompany._id } }
        );
        console.log(`🔄 Migrated ${unlinkedTripsCount} legacy trips to default company.`);
      }

      // 4. Migrate legacy Bookings that do not have a company field
      const unlinkedBookingsCount = await Booking.countDocuments({ company: { $exists: false } });
      if (unlinkedBookingsCount > 0) {
        await Booking.updateMany(
          { company: { $exists: false } },
          { $set: { company: defaultCompany._id } }
        );
        console.log(`🔄 Migrated ${unlinkedBookingsCount} legacy bookings to default company.`);
      }

      // 5. Ensure Default Categories exist
      const Category = require('../models/category.model');
      let defaultCategory = await Category.findOne({ slug: 'sea' });
      if (!defaultCategory) {
        defaultCategory = await Category.create({
          nameEn: 'Sea Trips',
          nameAr: 'رحلات بحرية',
          slug: 'sea',
          isProtected: true,
        });
        console.log('🏷️ Default Category created: رحلات بحرية');
      }

      const defaultCategories = [
        { nameEn: 'Safari & Adventures', nameAr: 'سفاري ومغامرات', slug: 'safari' },
        { nameEn: 'Cultural & Historical', nameAr: 'رحلات ثقافية وتاريخية', slug: 'cultural' },
        { nameEn: 'Entertainment', nameAr: 'رحلات ترفيهية', slug: 'entertainment' },
      ];

      for (const catData of defaultCategories) {
        const existingCat = await Category.findOne({ slug: catData.slug });
        if (!existingCat) {
          await Category.create({
            ...catData,
            isProtected: true,
          });
        }
      }

      // 6. Migrate Trips without category
      const tripsWithoutCategoryCount = await Trip.countDocuments({
        $or: [{ category: null }, { category: { $exists: false } }],
      });
      if (tripsWithoutCategoryCount > 0) {
        await Trip.updateMany(
          { $or: [{ category: null }, { category: { $exists: false } }] },
          { $set: { category: defaultCategory._id } }
        );
        console.log(`🔄 Migrated ${tripsWithoutCategoryCount} trips without category to default category.`);
      }

      // 7. Migrate legacy bookings with zero commission
      const zeroCommissionBookings = await Booking.find({
        $or: [{ adminCommissionAmount: 0 }, { adminCommissionAmount: { $exists: false } }],
      }).populate('company');

      let updatedCommissionsCount = 0;
      for (const booking of zeroCommissionBookings) {
        if (booking.totalPrice > 0 && booking.company) {
          const comp = booking.company;
          const type = comp.commissionType || 'percentage';
          const value = comp.commissionValue !== undefined ? comp.commissionValue : 10;
          let comm = 0;
          if (type === 'percentage') {
            comm = Number(((booking.totalPrice * value) / 100).toFixed(2));
          } else {
            comm = Number((value * (booking.numberOfSeats || 1)).toFixed(2));
          }
          booking.commissionType = type;
          booking.commissionValue = value;
          booking.adminCommissionAmount = comm;
          booking.companyNetAmount = Number((booking.totalPrice - comm).toFixed(2));
          await booking.save();
          updatedCommissionsCount++;
        }
      }
      if (updatedCommissionsCount > 0) {
        console.log(`🔄 Calculated commissions for ${updatedCommissionsCount} legacy bookings.`);
      }
    } catch (error) {
      console.error('⚠️ Migration error:', error.message);
    }
  }
}

module.exports = new MigrationService();
