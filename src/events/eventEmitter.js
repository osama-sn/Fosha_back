const EventEmitter = require('events');

class AppEventEmitter extends EventEmitter {}

const appEventEmitter = new AppEventEmitter();
// Increase max listeners for scale
appEventEmitter.setMaxListeners(30);

module.exports = appEventEmitter;
