const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const ApiError = require('../utils/ApiError');
const appEventEmitter = require('../events/eventEmitter');
const EventTypes = require('../events/eventTypes');
const { ChatType, UserRole } = require('../constants/enums');

class ChatService {
  /**
   * Start or get an existing chat room between a User and a Company
   */
  async getOrCreateChat({ userId, companyId, tripId, bookingId, type = ChatType.PRE_BOOKING }) {
    if (!companyId) {
      throw new ApiError(400, 'COMPANY_ID_REQUIRED');
    }

    let filter = { user: userId, company: companyId };
    if (tripId) filter.trip = tripId;

    let chat = await Chat.findOne(filter);

    if (!chat) {
      chat = await Chat.create({
        type,
        user: userId,
        company: companyId,
        trip: tripId || null,
        booking: bookingId || null,
      });
    }

    await chat.populate([
      { path: 'user', select: 'fullName email phone profileImage' },
      { path: 'company', select: 'name logo contactPhone contactEmail' },
      { path: 'trip', select: 'title coverImage origin destination startDate' },
    ]);

    const chatObj = chat.toObject();
    if (chatObj.trip && userId) {
      const tripService = require('./trip.service');
      const [tripWithFlags] = await tripService._attachUserFlags([chatObj.trip], { _id: userId });
      chatObj.trip = tripWithFlags;
    }

    return chatObj;
  }

  /**
   * List chats for a user or for a company admin
   */
  async getChats(user, query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};

    if (user.role === UserRole.COMPANY_ADMIN) {
      const companyId = user.company ? (user.company._id || user.company) : null;
      if (!companyId) throw new ApiError(400, 'COMPANY_NOT_LINKED');
      filter.company = companyId;
    } else {
      filter.user = user._id;
    }

    const [chats, total] = await Promise.all([
      Chat.find(filter)
        .populate('user', 'fullName email phone profileImage')
        .populate('company', 'name logo contactPhone contactEmail')
        .populate('trip', 'title coverImage origin destination')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Chat.countDocuments(filter),
    ]);

    const tripService = require('./trip.service');
    const rawTrips = chats.map((c) => c.trip).filter((t) => t !== null && t !== undefined);
    const tripsWithFlags = await tripService._attachUserFlags(rawTrips, user);
    const tripMap = new Map(tripsWithFlags.map((t) => [t._id.toString(), t]));

    const chatsWithTripFlags = chats.map((c) => {
      const cObj = c.toObject();
      if (cObj.trip && cObj.trip._id) {
        cObj.trip = tripMap.get(cObj.trip._id.toString()) || cObj.trip;
      }
      return cObj;
    });

    return {
      chats: chatsWithTripFlags,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get chat messages
   */
  async getMessages(chatId, user, query = {}) {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ApiError(404, 'CHAT_NOT_FOUND');
    }

    const isCompanyAdmin = user.role === UserRole.COMPANY_ADMIN;
    const isUserOwner = chat.user.toString() === user._id.toString();
    const companyIdStr = user.company ? (user.company._id || user.company).toString() : '';

    if (!isUserOwner && (!isCompanyAdmin || chat.company.toString() !== companyIdStr)) {
      throw new ApiError(403, 'FORBIDDEN');
    }

    // Reset unread count
    if (isCompanyAdmin) {
      chat.unreadCountCompany = 0;
    } else {
      chat.unreadCountUser = 0;
    }
    await chat.save();

    const { page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ chat: chatId })
        .populate('sender', 'fullName profileImage role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({ chat: chatId }),
    ]);

    return {
      messages: messages.reverse(),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Send a text or image message in chat
   */
  async sendMessage(chatId, senderUser, { text }, file = null) {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ApiError(404, 'CHAT_NOT_FOUND');
    }

    let image = '';
    if (file) {
      image = `/uploads/chat/${file.filename}`;
    }

    if (!text && !image) {
      throw new ApiError(400, 'MESSAGE_TEXT_OR_IMAGE_REQUIRED');
    }

    const senderRole = senderUser.role === UserRole.COMPANY_ADMIN ? UserRole.COMPANY_ADMIN : UserRole.USER;

    const message = await Message.create({
      chat: chatId,
      sender: senderUser._id,
      senderRole,
      text: text || '',
      image,
    });

    chat.lastMessage = text || (image ? '[صورة]' : '');
    chat.lastMessageAt = new Date();

    if (senderRole === UserRole.COMPANY_ADMIN) {
      chat.unreadCountUser += 1;
    } else {
      chat.unreadCountCompany += 1;
    }
    await chat.save();

    await message.populate('sender', 'fullName profileImage role');

    // Emit MESSAGE_SENT domain event for socket emissions & notifications
    appEventEmitter.emit(EventTypes.MESSAGE_SENT, {
      message,
      chat,
      senderRole,
      text: text || '',
    });

    return message;
  }
}

module.exports = new ChatService();
