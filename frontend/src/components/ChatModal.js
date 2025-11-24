// import { useState, useEffect, useRef } from 'react';
// import socket from '../services/socket';
// import api from '../services/api';
// import { useAuth } from '../hooks/useAuth';

// const ChatModal = ({ chatId, friend, initialMessages, onClose }) => {
//   const { user } = useAuth();
//   const [messages, setMessages] = useState(initialMessages || []);
//   const [text, setText] = useState('');
//   const [isOnline, setIsOnline] = useState(false);
//   const messagesEndRef = useRef(null);

//   // ----------------------------
//   // Scroll to bottom whenever messages update
//   // ----------------------------
//   const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   useEffect(scrollToBottom, [messages]);

//   // ----------------------------
//   // Fetch messages from API and setup socket listeners
//   // ----------------------------
//   useEffect(() => {
//     // EXIT EARLY if required data not ready
//     if (!chatId || !friend || !user?._id) return;

//     // Fetch existing messages from backend
//     const fetchMessages = async () => {
//       try {
//         const res = await api.get(`/api/chats/${chatId}`);
//         if (res?.data) {
//           const safeMessages = res.data.filter(
//             msg => msg && msg.sender && msg.sender._id && msg.text
//           );
//           setMessages(safeMessages);
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     fetchMessages();

//     // ----------------------------
//     // Socket: handle incoming messages
//     // ----------------------------
//     const newMessageHandler = (msg) => {
//       // FIX FOR DUPLICATES:
//       // Only add messages that are NOT from the current user
//       if (msg?.chatId === chatId && msg.sender?._id !== user._id) {
//         setMessages(prev => [...prev, msg]);
//       }
//     };

//     // Handle friend online/offline events
//     const onlineHandler = (id) => id === friend?._id && setIsOnline(true);
//     const offlineHandler = (id) => id === friend?._id && setIsOnline(false);

//     // Subscribe to socket events
//     socket.on('new-message', newMessageHandler);
//     socket.on('user-online', onlineHandler);
//     socket.on('user-offline', offlineHandler);

//     // Cleanup on unmount or dependency change
//     return () => {
//       socket.off('new-message', newMessageHandler);
//       socket.off('user-online', onlineHandler);
//       socket.off('user-offline', offlineHandler);
//     };
//   }, [chatId, friend, user]); // <-- DEPENDENCY FIX: use `user` instead of `user._id`

//   // ----------------------------
//   // Send message
//   // ----------------------------
//   const sendMessage = () => {
//     if (!text.trim() || !user?._id) return;

//     const msgData = { chatId, text };

//     // Emit message to server
//     socket.emit('send-message', msgData);

//     // ----------------------------
//     // OPTIMISTIC UI:
//     // Immediately add the message for the sender
//     // ----------------------------
//     setMessages(prev => [
//       ...prev,
//       {
//         ...msgData,
//         sender: { _id: user._id, name: user.name },
//         _id: Date.now(), // temporary unique key
//       }
//     ]);

//     setText('');
//   };

//   if (!friend || !user) return null;

//   return (
//     <div style={{
//       border: '1px solid #ddd',
//       padding: '10px',
//       position: 'fixed',
//       bottom: '10px',
//       right: '10px',
//       background: '#fff',
//       width: '300px',
//       zIndex: 1000
//     }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//         <h4>{friend.name} {isOnline ? '🟢' : '⚫'}</h4>
//         <button onClick={onClose}>Close</button>
//       </div>

//       <div style={{
//         height: '200px',
//         overflowY: 'auto',
//         border: '1px solid #eee',
//         margin: '10px 0',
//         padding: '5px'
//       }}>
//         {messages.map(msg => {
//           // DEFENSIVE CHECK: skip invalid messages
//           if (!msg?.sender?._id || !msg.text) return null;

//           return (
//             <div
//               key={msg._id || Date.now()} // fallback key if _id missing
//               style={{
//                 textAlign: msg.sender._id === user._id ? 'right' : 'left',
//                 marginBottom: '5px'
//               }}
//             >
//               <small>{msg.sender.name || 'Unknown'}: </small>
//               {msg.text}
//             </div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       <div>
//         <input
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//           placeholder="Type..."
//           style={{ width: '70%', marginRight: '5px' }}
//         />
//         <button onClick={sendMessage}>Send</button>
//       </div>
//     </div>
//   );
// };

// export default ChatModal;


import { useState, useEffect, useRef } from 'react';
import socket from '../services/socket';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ChatModal = ({ chatId, friend, initialMessages, onClose }) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState(initialMessages || []);
  const [text, setText] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(scrollToBottom, [messages]);

  /* ----------------------------------------
     LOAD MESSAGES + SOCKET LISTENERS
  -----------------------------------------*/
  useEffect(() => {
    if (!chatId || !friend || !user?._id) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/api/chats/${chatId}`);
        if (res?.data) {
          const safe = res.data.filter(
            (msg) => msg && msg.sender && msg.sender._id && msg.text
          );
          setMessages(safe);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();

    /* SOCKET HANDLERS */
    const newMessageHandler = (msg) => {
      if (msg.chatId === chatId && msg.sender._id !== user._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const onlineHandler = (id) => id === friend._id && setIsOnline(true);
    const offlineHandler = (id) => id === friend._id && setIsOnline(false);

    const typingHandler = (data) => {
      if (data.chatId === chatId && data.from === friend._id) {
        setIsFriendTyping(true);
      }
    };

    const stopTypingHandler = (data) => {
      if (data.chatId === chatId && data.from === friend._id) {
        setIsFriendTyping(false);
      }
    };

    /* SOCKET SUBSCRIPTIONS */
    socket.on('new-message', newMessageHandler);
    socket.on('user-online', onlineHandler);
    socket.on('user-offline', offlineHandler);
    socket.on('typing', typingHandler);
    socket.on('stop-typing', stopTypingHandler);

    return () => {
      socket.off('new-message', newMessageHandler);
      socket.off('user-online', onlineHandler);
      socket.off('user-offline', offlineHandler);
      socket.off('typing', typingHandler);
      socket.off('stop-typing', stopTypingHandler);
    };
  }, [chatId, friend, user]);

  /* ----------------------------------------
     SEND MESSAGE
  -----------------------------------------*/
  const sendMessage = () => {
    if (!text.trim() || !user?._id) return;

    const msgData = { chatId, text };

    // Emit to server
    socket.emit('send-message', msgData);

    // Optimistic UI
    setMessages((prev) => [
      ...prev,
      {
        ...msgData,
        sender: { _id: user._id, name: user.name },
        _id: Date.now(),
      },
    ]);

    setText('');

    // Stop typing
    socket.emit('stop-typing', { chatId });
  };

  /* ----------------------------------------
     RENDER UI
  -----------------------------------------*/
  if (!friend || !user) return null;

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '10px',
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: '#fff',
        width: '300px',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h4>
          {friend.name} {isOnline ? '🟢' : '⚫'}
        </h4>
        <button onClick={onClose}>Close</button>
      </div>

      {/* TYPING INDICATOR */}
      {isFriendTyping && (
        <div style={{ color: 'green', fontStyle: 'italic', marginBottom: 5 }}>
          {friend.name} is typing...
        </div>
      )}

      <div
        style={{
          height: '200px',
          overflowY: 'auto',
          border: '1px solid #eee',
          margin: '10px 0',
          padding: '5px',
        }}
      >
        {messages.map((msg) => {
          if (!msg?.sender?._id || !msg.text) return null;

          return (
            <div
              key={msg._id}
              style={{
                textAlign: msg.sender._id === user._id ? 'right' : 'left',
                marginBottom: '5px',
              }}
            >
              <small>{msg.sender.name}: </small>
              {msg.text}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            socket.emit('typing', { chatId });

            if (typingTimeoutRef.current)
              clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
              socket.emit('stop-typing', { chatId });
            }, 1200);
          }}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type..."
          style={{ width: '70%', marginRight: '5px' }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatModal;
