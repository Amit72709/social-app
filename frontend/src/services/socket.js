import io from 'socket.io-client';

const socket = io('https://social-app-backend-5l4i.onrender.com', { 
  auth: { token: localStorage.getItem('token') },
  transports: ['websocket', 'polling']
});

export default socket;
