import io from 'socket.io-client';

const socket = io('http://localhost:5000', {  // <Direct to backend port
  auth: { token: localStorage.getItem('token') },
  transports: ['websocket', 'polling']  // < Fallback to polling if WS fails
});

export default socket;