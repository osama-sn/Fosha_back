const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { uploadChatImage } = require('../middlewares/chatUploadMiddleware');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

router.use(protect);

router.post('/', chatController.startOrGetChat);
router.get('/', chatController.getChats);
router.get('/:id/messages', chatController.getMessages);
router.post('/:id/messages', uploadChatImage, chatController.sendMessage);

module.exports = router;
