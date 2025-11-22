import { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';

const FriendRequests = ({ onClose }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.get('/api/friends/requests').then(res => setRequests(res.data));

    socket.on('friend-request', ({ req }) =>
      setRequests(prev => [...prev, req])
    );

    return () => socket.off('friend-request');
  }, []);

  const handleAccept = async (reqId) => {
    try {
      await api.post(`/api/friends/accept/${reqId}`);
      socket.emit("accept-friend", { reqId });

      setRequests(prev => prev.filter(r => r._id !== reqId));
    } catch (err) {
      console.error(err);
      alert('Error accepting request');
    }
  };

  const handleReject = (reqId) => {
    setRequests(prev => prev.filter(r => r._id !== reqId));
  };

  return (
    <div style={{ position: 'fixed', top: 50, right: 50, background: '#fff', padding: 10, border: '1px solid #ddd' }}>
      <h3>Friend Requests</h3>

      {requests.length === 0 && <p>No requests.</p>}

      {requests.map(req => (
        <div key={req._id} style={{ padding: 10, borderBottom: '1px solid #eee' }}>
          <p>{req.from.name} wants to connect</p>
          <button onClick={() => handleAccept(req._id)}>Accept</button>
          <button onClick={() => handleReject(req._id)}>Reject</button>
        </div>
      ))}

      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default FriendRequests;
