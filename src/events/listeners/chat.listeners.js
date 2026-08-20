const appEventEmitter = require('../eventEmitter');
const EventTypes = require('../eventTypes');
const notificationService = require('../../services/notification.service');

function initChatListeners() {
  appEventEmitter.on(EventTypes.MESSAGE_SENT, async ({ message, chat, senderRole, text }) => {
    // 1. Live WebSocket Emission
    try {
      const { getIO } = require('../../socket/socketHandler');
      const io = getIO();
      if (io) {
        const messagePayload = {
          _id: message._id,
          chat: chat._id,
          sender: message.sender,
          senderRole: message.senderRole,
          text: message.text,
          image: message.image,
          createdAt: message.createdAt,
        };
        io.to(`chat_${chat._id}`).emit('new_message', messagePayload);

        if (senderRole === 'user') {
          io.to(`company_${chat.company.toString()}`).emit('chat_updated', {
            chatId: chat._id,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            unreadCountCompany: chat.unreadCountCompany,
          });
        } else {
          io.to(`user_${chat.user.toString()}`).emit('chat_updated', {
            chatId: chat._id,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            unreadCountUser: chat.unreadCountUser,
          });
        }
      }
    } catch (err) {
      console.error('[Event Error] MESSAGE_SENT socket emission failed:', err.message);
    }

    // 2. Push Notification to User if sent by Company Admin
    try {
      if (senderRole === 'company_admin') {
        await notificationService.createNotification({
          user: chat.user,
          title: 'رسالة جديدة من الشركة',
          body: text || 'أرسلت الشركة صورة جديدة في المحادثة',
          type: 'chat',
          data: { chatId: chat._id },
        });
      }
    } catch (err) {
      console.error('[Event Error] MESSAGE_SENT notification failed:', err.message);
    }
  });
}

module.exports = initChatListeners;
