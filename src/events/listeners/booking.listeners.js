const appEventEmitter = require('../eventEmitter');
const EventTypes = require('../eventTypes');
const notificationService = require('../../services/notification.service');

function initBookingListeners() {
  appEventEmitter.on(EventTypes.BOOKING_CREATED, async ({ booking, trip }) => {
    try {
      await notificationService.createNotification({
        user: booking.user,
        title: 'طلب حجز جديد',
        body: `تم تقديم طلب حجزك لرحلة (${trip.title}) بنجاح.`,
        type: 'booking',
        data: { bookingId: booking._id, tripId: trip._id },
      });
    } catch (err) {
      console.error('[Event Error] BOOKING_CREATED notification failed:', err.message);
    }
  });

  appEventEmitter.on(EventTypes.BOOKING_APPROVED, async ({ booking }) => {
    try {
      const tripTitle = booking.tripSnapshot?.title || booking.trip?.title || '';
      await notificationService.createNotification({
        user: booking.user._id || booking.user,
        title: 'تمت الموافقة على الحجز!',
        body: `تهانينا! تمت الموافقة على حجزك لرحلة (${tripTitle}) بنجاح.`,
        type: 'booking',
        data: { bookingId: booking._id, tripId: booking.trip?._id },
      });
    } catch (err) {
      console.error('[Event Error] BOOKING_APPROVED notification failed:', err.message);
    }
  });

  appEventEmitter.on(EventTypes.BOOKING_REJECTED, async ({ booking, rejectionReason }) => {
    try {
      const tripTitle = booking.tripSnapshot?.title || booking.trip?.title || '';
      await notificationService.createNotification({
        user: booking.user._id || booking.user,
        title: 'تم رفض الحجز',
        body: `نأسف، تم رفض طلب حجزك لرحلة (${tripTitle}).${rejectionReason ? ' السبب: ' + rejectionReason : ''}`,
        type: 'booking',
        data: { bookingId: booking._id, tripId: booking.trip?._id },
      });
    } catch (err) {
      console.error('[Event Error] BOOKING_REJECTED notification failed:', err.message);
    }
  });
}

module.exports = initBookingListeners;
