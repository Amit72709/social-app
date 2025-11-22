import express from 'express';
import auth from '../middleware/auth.js';
import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';

const router = express.Router();

// GET pending friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      to: req.user.id,
      status: 'pending',
    }).populate('from', 'name photo');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET all friends of logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'name photo online');
    res.json(user?.friends || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});



// DELETE friend
router.delete('/remove/:friendId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    res.json({ msg: 'Friend removed successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ACCEPT friend request
router.post('/accept/:reqId', auth, async (req, res) => {
  try {
    const reqDoc = await FriendRequest.findById(req.params.reqId).populate('from');

    if (!reqDoc || reqDoc.to.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Invalid request' });

    if (reqDoc.status !== 'pending')
      return res.status(400).json({ msg: 'Already handled' });

    reqDoc.status = 'accepted';
    await reqDoc.save();

    // Add each other as friends
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { friends: reqDoc.from._id } });
    await User.findByIdAndUpdate(reqDoc.from._id, { $addToSet: { friends: req.user.id } });

    // Create chat
    const chatId = [req.user.id, reqDoc.from._id].sort().join('_');
    await Chat.create({ chatId, users: [req.user.id, reqDoc.from._id] });

    res.json({ msg: 'Friend request accepted', chatId });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
