import FriendRequest from '../models/FriendRequest.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';

export default (io, socket) => {
  // Join private room for this user
  socket.join(socket.userId.toString());

  // Mark online
  User.findByIdAndUpdate(socket.userId, { online: true });
  io.emit('user-online', socket.userId);

  socket.on('disconnect', async () => {
    await User.findByIdAndUpdate(socket.userId, { online: false });
    io.emit('user-offline', socket.userId);
  });

  /* -------------------------------------------
     CHAT INITIATE
  --------------------------------------------*/
  socket.on('chat-initiate', async ({ targetUserId }) => {
    const me = await User.findById(socket.userId);

    // already friends → open chat immediately
    if (me.friends.includes(targetUserId)) {
      const chatId = [socket.userId, targetUserId].sort().join('_');
      socket.emit('open-chat', { chatId, targetUserId });
      return;
    }

    // check existing request
    let existing = await FriendRequest.findOne({
      from: socket.userId,
      to: targetUserId,
      status: 'pending',
    });

    if (!existing) {
      existing = await FriendRequest.create({
        from: socket.userId,
        to: targetUserId,
      });

      const populated = await existing.populate('from', 'name photo');

      io.to(targetUserId.toString()).emit('friend-request', {
        req: populated,
      });
    }

    socket.emit('friend-req-sent', { targetUserId });
  });

  /* -------------------------------------------
     ACCEPT FRIEND REQUEST
  --------------------------------------------*/
  socket.on('accept-friend', async ({ reqId }) => {
    const req = await FriendRequest.findById(reqId);

    if (!req || req.to.toString() !== socket.userId) return;

    req.status = 'accepted';
    await req.save();

    // add friends
    await User.findByIdAndUpdate(req.to, { $addToSet: { friends: req.from } });
    await User.findByIdAndUpdate(req.from, { $addToSet: { friends: req.to } });

    const chatId = [req.from, req.to].sort().join('_');

    let chat = await Chat.findOne({ chatId });
    if (!chat) {
      chat = await Chat.create({ chatId, users: [req.from, req.to] });
    }

    io.to(req.from.toString()).emit('friend-accepted', {
      chatId,
      otherUser: req.to,
    });

    io.to(req.to.toString()).emit('friend-accepted', {
      chatId,
      otherUser: req.from,
    });
  });

  /* -------------------------------------------
     SEND MESSAGE
  --------------------------------------------*/
  socket.on('send-message', async ({ chatId, text }) => {
    const [u1, u2] = chatId.split('_');

    const otherUser =
      socket.userId.toString() === u1 ? u2 : u1;

    // ensure they are friends
    const me = await User.findById(socket.userId);
    if (!me.friends.includes(otherUser)) return;

    const msg = await Message.create({
      chatId,
      sender: socket.userId,
      text,
    });

    const populated = await msg.populate('sender', 'name photo');

    io.to(u1).emit('new-message', populated);
    io.to(u2).emit('new-message', populated);
  });

  /* -------------------------------------------
     TYPING INDICATOR (NEW)
  --------------------------------------------*/
  socket.on('typing', ({ chatId }) => {
    const [u1, u2] = chatId.split('_');
    const other = socket.userId.toString() === u1 ? u2 : u1;

    socket.to(other).emit('typing', {
      chatId,
      from: socket.userId,
    });
  });

  socket.on('stop-typing', ({ chatId }) => {
    const [u1, u2] = chatId.split('_');
    const other = socket.userId.toString() === u1 ? u2 : u1;

    socket.to(other).emit('stop-typing', {
      chatId,
      from: socket.userId,
    });
  });
};
