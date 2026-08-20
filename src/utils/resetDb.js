require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/user.model');
const Trip = require('../models/trip.model');
const Booking = require('../models/booking.model');
const Company = require('../models/company.model');
const Category = require('../models/category.model');
const Coupon = require('../models/coupon.model');
const Offer = require('../models/offer.model');
const Favorite = require('../models/favorite.model');
const Notification = require('../models/notification.model');
const Review = require('../models/review.model');
const CompanyReview = require('../models/companyReview.model');
const Settlement = require('../models/settlement.model');
const Activity = require('../models/activity.model');

const resetDatabase = async () => {
  try {
    console.log('⏳ Connecting to Database...');
    await connectDB();

    console.log('🧹 Clearing all collections...');

    const bookingsDeleted = await Booking.deleteMany({});
    console.log(`- Deleted Bookings: ${bookingsDeleted.deletedCount}`);

    const tripsDeleted = await Trip.deleteMany({});
    console.log(`- Deleted Trips: ${tripsDeleted.deletedCount}`);

    const companiesDeleted = await Company.deleteMany({});
    console.log(`- Deleted Companies: ${companiesDeleted.deletedCount}`);

    const categoriesDeleted = await Category.deleteMany({});
    console.log(`- Deleted Categories: ${categoriesDeleted.deletedCount}`);

    const couponsDeleted = await Coupon.deleteMany({});
    console.log(`- Deleted Coupons: ${couponsDeleted.deletedCount}`);

    const offersDeleted = await Offer.deleteMany({});
    console.log(`- Deleted Offers: ${offersDeleted.deletedCount}`);

    const favoritesDeleted = await Favorite.deleteMany({});
    console.log(`- Deleted Favorites: ${favoritesDeleted.deletedCount}`);

    const notificationsDeleted = await Notification.deleteMany({});
    console.log(`- Deleted Notifications: ${notificationsDeleted.deletedCount}`);

    const reviewsDeleted = await Review.deleteMany({});
    console.log(`- Deleted Reviews: ${reviewsDeleted.deletedCount}`);

    const companyReviewsDeleted = await CompanyReview.deleteMany({});
    console.log(`- Deleted Company Reviews: ${companyReviewsDeleted.deletedCount}`);

    const settlementsDeleted = await Settlement.deleteMany({});
    console.log(`- Deleted Settlements: ${settlementsDeleted.deletedCount}`);

    const activitiesDeleted = await Activity.deleteMany({});
    console.log(`- Deleted Activity Logs: ${activitiesDeleted.deletedCount}`);

    // Delete all regular users & company admins, preserve ONLY super_admin / admin accounts
    const nonAdminUsersDeleted = await User.deleteMany({
      role: { $nin: ['admin', 'super_admin'] },
    });
    console.log(`- Deleted Non-Admin Users: ${nonAdminUsersDeleted.deletedCount}`);

    // Ensure at least one Admin / Super Admin exists
    let adminCount = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } });

    if (adminCount === 0) {
      console.log('⚠️ No admin account found. Creating default Super Admin account...');
      const adminEmail = 'osamaessamkhalifa@gmail.com';
      const adminPhone = '01062059515';
      const adminPassword = 'AdminPassword123';

      await User.create({
        fullName: 'Osama Essam (Super Admin)',
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: 'super_admin',
        authProvider: 'local',
        isProtected: true,
      });
      console.log(`✅ Default Super Admin created:\n  Email: ${adminEmail}\n  Password: ${adminPassword}`);
    } else {
      const remainingAdmins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('fullName email role');
      console.log(`✅ Preserved Admin Accounts (${remainingAdmins.length}):`);
      remainingAdmins.forEach((a) => {
        console.log(`  - ${a.fullName} (${a.email}) [${a.role}]`);
      });
    }

    console.log('🎉 Database successfully reset! All data zeroed out except Admin account(s).');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();
