// import io from 'socket.io-client';

// const socket = io('http://localhost:5000', {  // <Direct to backend port
//   auth: { token: localStorage.getItem('token') },
//   transports: ['websocket', 'polling']  // < Fallback to polling if WS fails
// });

// export default socket;


// socket.js
import io from 'socket.io-client';

const socket = io('https://social-app-backend-k663.onrender.com', { 
  auth: { token: localStorage.getItem('token') },
  transports: ['websocket', 'polling']
});

export default socket;
