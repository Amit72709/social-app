import express from 'express';
import auth from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

/* -------------------------------------------
   GET CHAT MESSAGES BY CHAT ID
--------------------------------------------*/
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      chatId: req.params.chatId,
      users: { $in: [req.user.id] },
    });

    if (!chat)
      return res.status(403).json({ msg: 'Not allowed to view this chat' });

    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('sender', 'name photo')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* -------------------------------------------
   GET OR CREATE CHAT WITH FRIEND
   /api/chats/with/:friendId
--------------------------------------------*/
router.get('/with/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    // Check if the friend exists and is in user's friends
    const user = await User.findById(userId);
    if (!user.friends.includes(friendId)) {
      return res.status(403).json({ msg: 'Not friends with this user' });
    }

    // ChatId is deterministic: sorted user IDs
    const chatId = [userId, friendId].sort().join('_');

    // Find or create chat
    let chat = await Chat.findOne({ chatId });
    if (!chat) {
      chat = await Chat.create({ chatId, users: [userId, friendId] });
    }

    // Get messages
    const messages = await Message.find({ chatId }).populate('sender', 'name photo').sort({ createdAt: 1 });

    res.json({ chatId, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});

/* -------------------------------------------
   SEND MESSAGE
--------------------------------------------*/
router.post('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      chatId: req.params.chatId,
      users: { $in: [req.user.id] },
    });

    if (!chat)
      return res.status(403).json({ msg: 'Not allowed to chat' });

    const msg = await Message.create({
      chatId: req.params.chatId,
      sender: req.user.id,
      text: req.body.text,
    });

    const populated = await msg.populate('sender', 'name photo');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
