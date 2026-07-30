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
    } catch (error) {
      console.error('⚠️ Migration error:', error.message);
    }
  }
}

module.exports = new MigrationService();
