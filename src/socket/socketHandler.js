const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const notificationService = require('../services/notification.service');

let io = null;

/**
 * Initialize Socket.io server with authentication and event listeners
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('AUTHENTICATION_ERROR_NO_TOKEN'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('AUTHENTICATION_ERROR_USER_NOT_FOUND'));
      }

      if (user.isBlocked) {
        return next(new Error('AUTHENTICATION_ERROR_USER_BLOCKED'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('AUTHENTICATION_ERROR_INVALID_TOKEN'));
    }
  });

  // Socket Connection Event
  io.on('connection', (socket) => {
    const user = socket.user;
    const userId = user._id.toString();
    console.log(`🔌 User connected to Socket: ${user.fullName} (${userId})`);

    // Join personal user room for direct live notifications
    socket.join(`user_${userId}`);

    // If company admin, join company room
    if (user.role === 'company_admin' && user.company) {
      const companyId = (user.company._id || user.company).toString();
      socket.join(`company_${companyId}`);
      console.log(`🏢 Company Admin joined company room: company_${companyId}`);
    }

    // 1. Join Chat Room
    socket.on('join_chat', async (data) => {
      const { chatId } = data || {};
      if (!chatId) return;

      const chat = await Chat.findById(chatId);
      if (!chat) return;

      // Verify membership
      const isUserOwner = chat.user.toString() === userId;
      const isCompanyAdmin =
        user.role === 'company_admin' &&
        user.company &&
        chat.company.toString() === (user.company._id || user.company).toString();

      if (isUserOwner || isCompanyAdmin) {
        socket.join(`chat_${chatId}`);
        console.log(`💬 User ${user.fullName} joined room: chat_${chatId}`);

        // Reset unread count when joining
        if (isCompanyAdmin) {
          chat.unreadCountCompany = 0;
        } else {
          chat.unreadCountUser = 0;
        }
        await chat.save();

        socket.to(`chat_${chatId}`).emit('user_joined_chat', {
          chatId,
          userId,
          fullName: user.fullName,
        });
      }
    });

    // 2. Leave Chat Room
    socket.on('leave_chat', (data) => {
      const { chatId } = data || {};
      if (chatId) {
        socket.leave(`chat_${chatId}`);
        console.log(`🚪 User ${user.fullName} left room: chat_${chatId}`);
      }
    });

    // 3. Send Live Real-time Message
    socket.on('send_message', async (data, callback) => {
      try {
        const { chatId, text, image } = data || {};
        if (!chatId || (!text && !image)) {
          if (callback) callback({ success: false, message: 'TEXT_OR_IMAGE_REQUIRED' });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          if (callback) callback({ success: false, message: 'CHAT_NOT_FOUND' });
          return;
        }

        const senderRole = user.role === 'company_admin' ? 'company_admin' : 'user';

        // Save message to MongoDB
        const message = await Message.create({
          chat: chatId,
          sender: user._id,
          senderRole,
          text: text || '',
          image: image || '',
        });

        // Update Chat metadata
        chat.lastMessage = text || (image ? '[صورة]' : '');
        chat.lastMessageAt = new Date();

        if (senderRole === 'company_admin') {
          chat.unreadCountUser += 1;
        } else {
          chat.unreadCountCompany += 1;
        }
        await chat.save();

        await message.populate('sender', 'fullName profileImage role');

        const messagePayload = {
          _id: message._id,
          chat: chatId,
          sender: message.sender,
          senderRole: message.senderRole,
          text: message.text,
          image: message.image,
          createdAt: message.createdAt,
        };

        // Broadcast live message to all participants in chat room
        io.to(`chat_${chatId}`).emit('new_message', messagePayload);

        // Notify recipient on company/user socket rooms
        if (senderRole === 'user') {
          io.to(`company_${chat.company.toString()}`).emit('chat_updated', {
            chatId,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            unreadCountCompany: chat.unreadCountCompany,
          });
        } else {
          io.to(`user_${chat.user.toString()}`).emit('chat_updated', {
            chatId,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            unreadCountUser: chat.unreadCountUser,
          });
        }

        // Send push notification if recipient is offline
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
        } catch (e) {}

        if (callback) callback({ success: true, data: messagePayload });
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // 4. Typing Indicator
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data || {};
      if (chatId) {
        socket.to(`chat_${chatId}`).emit('user_typing', {
          chatId,
          userId,
          fullName: user.fullName,
          isTyping: Boolean(isTyping),
        });
      }
    });

    // 5. Mark Messages as Read
    socket.on('mark_read', async (data) => {
      const { chatId } = data || {};
      if (!chatId) return;

      const chat = await Chat.findById(chatId);
      if (!chat) return;

      if (user.role === 'company_admin') {
        chat.unreadCountCompany = 0;
      } else {
        chat.unreadCountUser = 0;
      }
      await chat.save();

      io.to(`chat_${chatId}`).emit('messages_read', { chatId, readBy: userId });
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected from Socket: ${user.fullName}`);
    });
  });

  return io;
};

/**
 * Get initialized Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
