const AsyncHandler = require('../utils/AsyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt.util');
const User = require('../models/user.model');

const protect = AsyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'UNAUTHORIZED');
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).populate('company');

    if (!user) {
      throw new ApiError(401, 'USER_NOT_FOUND');
    }

    if (user.isBlocked) {
      throw new ApiError(403, 'FORBIDDEN_USER_BLOCKED');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'TOKEN_EXPIRED');
    }
    throw new ApiError(401, 'INVALID_TOKEN');
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const isAllowed = roles.some((role) => {
      if ((role === 'super_admin' || role === 'admin') && (userRole === 'super_admin' || userRole === 'admin')) {
        return true;
      }
      return userRole === role;
    });

    if (!isAllowed) {
      throw new ApiError(403, 'FORBIDDEN');
    }
    next();
  };
};

const requireCompany = AsyncHandler(async (req, res, next) => {
  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'company_admin') {
    if (!req.user.company) {
      throw new ApiError(403, 'COMPANY_ACCOUNT_NOT_LINKED');
    }
    req.companyId = req.user.company._id ? req.user.company._id : req.user.company;
    return next();
  }

  throw new ApiError(403, 'FORBIDDEN');
});

const optionalProtect = AsyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).populate('company');
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // If token invalid/expired, continue without user attached
  }

  next();
});

module.exports = {
  protect,
  optionalProtect,
  authorize,
  requireCompany,
};
