const AsyncHandler = require('../utils/AsyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const chatService = require('../services/chat.service');

class ChatController {
  startOrGetChat = AsyncHandler(async (req, res) => {
    const { companyId, tripId, bookingId, type } = req.body;
    const userId = req.user._id;
    const chat = await chatService.getOrCreateChat({
      userId,
      companyId,
      tripId,
      bookingId,
      type,
    });
    res.status(200).json(new ApiResponse(200, 'CHAT_RETRIEVED_SUCCESSFULLY', chat, req.lang));
  });

  getChats = AsyncHandler(async (req, res) => {
    const result = await chatService.getChats(req.user, req.query);
    res.status(200).json(new ApiResponse(200, 'CHATS_FETCHED', result, req.lang));
  });

  getMessages = AsyncHandler(async (req, res) => {
    const result = await chatService.getMessages(req.params.id, req.user, req.query);
    res.status(200).json(new ApiResponse(200, 'MESSAGES_FETCHED', result, req.lang));
  });

  sendMessage = AsyncHandler(async (req, res) => {
    const message = await chatService.sendMessage(
      req.params.id,
      req.user,
      req.body,
      req.file
    );
    res.status(201).json(new ApiResponse(201, 'MESSAGE_SENT_SUCCESSFULLY', message, req.lang));
  });
}

module.exports = new ChatController();
