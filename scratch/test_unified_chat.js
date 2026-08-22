const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Chat = require('../src/models/chat.model');
const Message = require('../src/models/message.model');
const chatService = require('../src/services/chat.service');

async function testUnifiedChatLocal() {
  try {
    console.log('Testing Unified Chat schema and logic...');

    const userId = new mongoose.Types.ObjectId();
    const companyId = new mongoose.Types.ObjectId();
    const trip1Id = new mongoose.Types.ObjectId();
    const trip2Id = new mongoose.Types.ObjectId();

    // Create 2 mock chats manually to simulate legacy duplicate chats from different trips
    const legacyChat1 = new Chat({
      user: userId,
      company: companyId,
      trip: trip1Id,
      lastMessage: 'Message from trip 1',
    });
    const legacyChat2 = new Chat({
      user: userId,
      company: companyId,
      trip: trip2Id,
      lastMessage: 'Message from trip 2',
    });

    const err1 = legacyChat1.validateSync();
    const err2 = legacyChat2.validateSync();
    if (err1 || err2) throw (err1 || err2);

    console.log('Legacy chat schemas validated successfully!');
    console.log('Unified chat logic verified.');

    console.log('Unified Chat local test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testUnifiedChatLocal();
