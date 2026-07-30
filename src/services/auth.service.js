const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.util');
const { generateOTP, hashOTP } = require('../utils/otp.util');
const { sendOTPEmail } = require('../utils/emailService');
const { verifyGoogleToken } = require('../config/firebase');

class AuthService {
  /**
   * Register a new user (Email + Phone + Password)
   */
  async register(userData, file) {
    const { fullName, email, phone, password } = userData;

    // Check existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new ApiError(409, 'EMAIL_ALREADY_EXISTS');
    }

    // Check existing phone
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new ApiError(409, 'PHONE_ALREADY_EXISTS');
    }

    let profileImage = '';
    if (file) {
      profileImage = `/uploads/profiles/${file.filename}`;
    }

    const isProtected = userData.isProtected === true || userData.isProtected === 'true';

    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      profileImage,
      authProvider: 'local',
      isProtected,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return {
      user: userObj,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login with Email + Password
   */
  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return {
      user: userObj,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login ONLY via Google ID Token (Requires pre-existing registered user)
   */
  async googleLogin({ idToken }) {
    const googleData = await verifyGoogleToken(idToken);
    const { email } = googleData;

    let user = await User.findOne({ email }).select('+refreshToken');

    if (!user) {
      throw new ApiError(404, 'ACCOUNT_NOT_FOUND_PLEASE_REGISTER_FIRST');
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return {
      user: userObj,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh Tokens
   */
  async refreshToken(token) {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw new ApiError(401, 'TOKEN_EXPIRED');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, 'INVALID_TOKEN');
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user and invalidate stored refresh token
   */
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return true;
  }

  /**
   * Forgot Password - Send OTP to email
   */
  async forgotPassword({ email }) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND');
    }

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.passwordResetOTP = hashedOTP;
    user.passwordResetExpires = otpExpires;
    await user.save();

    await sendOTPEmail(email, otp);
    return true;
  }

  /**
   * Reset Password via OTP
   */
  async resetPassword({ email, otp, newPassword }) {
    const hashedOTP = hashOTP(otp);
    const user = await User.findOne({
      email,
      passwordResetOTP: hashedOTP,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetOTP +passwordResetExpires');

    if (!user) {
      throw new ApiError(400, 'INVALID_OR_EXPIRED_OTP');
    }

    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return true;
  }

  /**
   * Change Password (Protected)
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(400, 'INVALID_CURRENT_PASSWORD');
    }

    user.password = newPassword;
    await user.save();

    return true;
  }

  /**
   * Get Current User Profile
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND');
    }
    return user;
  }

  /**
   * Update Profile (FullName, Phone, ProfileImage) - Email & AuthProvider cannot be changed
   */
  async updateProfile(userId, { fullName, phone }, file) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND');
    }

    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingPhone) {
        throw new ApiError(409, 'PHONE_ALREADY_EXISTS');
      }
      user.phone = phone;
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (file) {
      user.profileImage = `/uploads/profiles/${file.filename}`;
    }

    await user.save();
    return user;
  }
}

module.exports = new AuthService();
