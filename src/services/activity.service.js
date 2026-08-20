const Activity = require('../models/activity.model');

class ActivityService {
  /**
   * Log a system/user activity
   */
  async logActivity({ user, userRole, action, targetType = 'System', targetId = null, details = {}, ipAddress = '' }) {
    try {
      return await Activity.create({
        user: user ? (user._id || user) : null,
        userRole: userRole || (user ? user.role : 'system'),
        action,
        targetType,
        targetId,
        details,
        ipAddress,
      });
    } catch (err) {
      // Non-blocking log failure
      console.error('Failed to record activity log:', err.message);
      return null;
    }
  }

  /**
   * Get recent activities for Super Admin dashboard
   */
  async getRecentActivities({ limit = 10 } = {}) {
    return await Activity.find()
      .populate('user', 'fullName email role profileImage')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }
}

module.exports = new ActivityService();
