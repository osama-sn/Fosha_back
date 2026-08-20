const initBookingListeners = require('./listeners/booking.listeners');
const initChatListeners = require('./listeners/chat.listeners');

function initEvents() {
  initBookingListeners();
  initChatListeners();
  console.log('✅ Event Listeners initialized successfully.');
}

module.exports = initEvents;
