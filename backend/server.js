// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import passport from 'passport';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import dotenv from 'dotenv';

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//   cors: { origin: 'http://localhost:3000', credentials: true },
// });

// // Middleware
// app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
// app.use(express.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(passport.initialize());

// // DB Connect
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // START SERVER
// async function start() {
//   const authRoutes = (await import('./routes/auth.js')).default;
//   const postRoutes = (await import('./routes/posts.js')).default;
//   const friendRoutes = (await import('./routes/friends.js')).default;
//   const chatRoutes = (await import('./routes/chats.js')).default;

//   app.use('/auth', authRoutes);
//   app.use('/api/posts', postRoutes);
//   app.use('/api/friends', friendRoutes);
//   app.use('/api/chats', chatRoutes);

//   // Debug: list mounted routes
//   console.log('Routes mounted:');
//   app._router.stack.forEach(r => {
//     if (r.route && r.route.path) {
//       console.log(`${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
//     }
//   });

//   // Socket authentication
//   io.use(async (socket, next) => {
//     try {
//       const { token } = socket.handshake.auth;
//       const { default: jwt } = await import('jsonwebtoken');
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       socket.userId = decoded.id;

//       // Join user-specific room
//       socket.join(socket.userId.toString());

//       next();
//     } catch (err) {
//       next(new Error('Authentication error'));
//     }
//   });

//   io.on('connection', async (socket) => {
//     console.log(`User ${socket.userId} connected`);
//     const { default: initHandlers } = await import('./socket/handlers.js');
//     initHandlers(io, socket);
//   });

//   const PORT = process.env.PORT || 5000;
//   server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// }

// start();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Use frontend URL from environment variable
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const io = new Server(server, {
  cors: { origin: FRONTEND_URL, credentials: true },
});

// Middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(passport.initialize());

// DB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes and Socket.IO
async function start() {
  const authRoutes = (await import('./routes/auth.js')).default;
  const postRoutes = (await import('./routes/posts.js')).default;
  const friendRoutes = (await import('./routes/friends.js')).default;
  const chatRoutes = (await import('./routes/chats.js')).default;
 
  app.get('/healthz', (req, res) => res.send('OK'));

  app.use('/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/chats', chatRoutes);

  // Socket authentication
  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth;
      const { default: jwt } = await import('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(socket.userId.toString());
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected`);
    const { default: initHandlers } = await import('./socket/handlers.js');
    initHandlers(io, socket);
  });

  const PORT = process.env.PORT || 10000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
