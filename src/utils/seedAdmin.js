require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'osamaessamkhalifa@gmail.com';
    const adminPhone = '01062059515';
    const adminPassword = 'AdminPassword123';

    let user = await User.findOne({ email: adminEmail });

    if (user) {
      user.role = 'admin';
      user.phone = adminPhone;
      user.password = adminPassword;
      user.isProtected = true;
      await user.save();
      console.log(`✅ User ${adminEmail} updated to ADMIN role and PROTECTED successfully.`);
    } else {
      user = await User.create({
        fullName: 'Osama Essam (Admin)',
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: 'admin',
        authProvider: 'local',
        isProtected: true,
      });
      console.log(`✅ Admin user created and PROTECTED successfully: ${adminEmail}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
