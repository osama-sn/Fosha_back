const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const AsyncHandler = require('../utils/AsyncHandler');

class AuthController {
  register = AsyncHandler(async (req, res) => {
    const data = await authService.register(req.body, req.file);
    res.status(201).json(new ApiResponse(201, 'REGISTER_SUCCESS', data, req.lang));
  });

  login = AsyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    res.status(200).json(new ApiResponse(200, 'LOGIN_SUCCESS', data, req.lang));
  });

  googleLogin = AsyncHandler(async (req, res) => {
    const data = await authService.googleLogin(req.body);
    res.status(200).json(new ApiResponse(200, 'GOOGLE_LOGIN_SUCCESS', data, req.lang));
  });

  refreshToken = AsyncHandler(async (req, res) => {
    const data = await authService.refreshToken(req.body.refreshToken);
    res.status(200).json(new ApiResponse(200, 'TOKEN_REFRESH_SUCCESS', data, req.lang));
  });

  logout = AsyncHandler(async (req, res) => {
    await authService.logout(req.user._id);
    res.status(200).json(new ApiResponse(200, 'LOGOUT_SUCCESS', {}, req.lang));
  });

  forgotPassword = AsyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body);
    res.status(200).json(new ApiResponse(200, 'OTP_SENT_SUCCESS', {}, req.lang));
  });

  resetPassword = AsyncHandler(async (req, res) => {
    await authService.resetPassword(req.body);
    res.status(200).json(new ApiResponse(200, 'PASSWORD_RESET_SUCCESS', {}, req.lang));
  });

  changePassword = AsyncHandler(async (req, res) => {
    await authService.changePassword(req.user._id, req.body);
    res.status(200).json(new ApiResponse(200, 'PASSWORD_CHANGE_SUCCESS', {}, req.lang));
  });

  getMe = AsyncHandler(async (req, res) => {
    const data = await authService.getMe(req.user._id);
    res.status(200).json(new ApiResponse(200, 'PROFILE_FETCH_SUCCESS', data, req.lang));
  });

  updateProfile = AsyncHandler(async (req, res) => {
    const data = await authService.updateProfile(req.user._id, req.body, req.file);
    res.status(200).json(new ApiResponse(200, 'PROFILE_UPDATE_SUCCESS', data, req.lang));
  });
}

module.exports = new AuthController();
