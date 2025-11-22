import { useEffect, useState } from 'react';
import api from '../services/api';

const FriendsList = ({ onOpenChat }) => {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get('/api/friends');
        setFriends(res.data);
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    };

    fetchFriends();
  }, []);

  if (!friends.length) return <p>No friends yet.</p>;

  return (
    <div style={{ border: '1px solid #ddd', padding: '10px', margin: '10px 0' }}>
      <h3>Friends</h3>
      {friends.map(f => (
        <div key={f._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <img 
            src={f.photo} 
            alt={f.name || "Friend"} 
            width="30" 
            height="30" 
            style={{ borderRadius: '50%', marginRight: '10px' }} 
          />
          <span>{f.name}</span>
          <button 
            style={{ marginLeft: 'auto' }} 
            onClick={() => onOpenChat(f._id)}
          >
            Chat
          </button>
        </div>
      ))}
    </div>
  );
};

export default FriendsList;
