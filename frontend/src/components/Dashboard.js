import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import PostForm from './PostForm';
import PostList from './PostList';
import ChatModal from './ChatModal';
import FriendRequests from './FriendRequests';
import FriendsList from './FriendsList';
import socket from '../services/socket';
import api from '../services/api';
import Login from './Login';

const Dashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { posts, loading: postsLoading, createPost, updatePost, deletePost } = usePosts();

  const [selectedChat, setSelectedChat] = useState(null);
  const [showRequests, setShowRequests] = useState(false);
  const [friends, setFriends] = useState([]);

  // SOCKET LISTENERS
  useEffect(() => {
    if (!user) return;

    const openChatHandler = async ({ chatId, targetUserId }) => {
      try {
        const friendRes = await api.get(`/auth/me/friends/${targetUserId}`);
        const chatRes = await api.get(`/api/chats/${chatId}`);
        setSelectedChat({ chatId, friend: friendRes.data, messages: chatRes.data });
      } catch (err) {
        console.error(err);
      }
    };

    const friendAcceptedHandler = async ({ chatId, otherUser }) => {
      try {
        const friendRes = await api.get(`/auth/me/friends/${otherUser}`);
        const chatRes = await api.get(`/api/chats/${chatId}`);
        setSelectedChat({ chatId, friend: friendRes.data, messages: chatRes.data });
        // Refresh friends list after new friend
        loadFriends();
      } catch (err) {
        console.error(err);
      }
    };

    socket.on('open-chat', openChatHandler);
    socket.on('friend-accepted', friendAcceptedHandler);

    return () => {
      socket.off('open-chat', openChatHandler);
      socket.off('friend-accepted', friendAcceptedHandler);
    };
  }, [user]);

  // Load friends from backend
  const loadFriends = async () => {
    try {
      const res = await api.get('/auth/me'); // me endpoint returns friends array
      setFriends(res.data.friends || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) loadFriends();
  }, [user]);

  if (authLoading || postsLoading) return <div>Loading...</div>;
  if (!user) return <Login />;

  const handleChatClick = async (friendId) => {
    try {
      const chatId = [user._id, friendId].sort().join('_');
      const chatRes = await api.get(`/api/chats/${chatId}`);
      const friendRes = await api.get(`/auth/me/friends/${friendId}`);
      setSelectedChat({ chatId, friend: friendRes.data, messages: chatRes.data });
    } catch (err) {
      console.error(err);
      alert('Could not open chat');
    }
  };

  return (
    <div>
      <header style={{ padding: '10px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <h1>{user.name}'s Feed</h1>
        <button onClick={logout}>Logout</button>
      </header>

      {/* Post Form */}
      <PostForm onSubmit={createPost} />

      {/* Posts List */}
      <PostList
        posts={posts}
        onUpdate={updatePost}
        onDelete={deletePost}
        onChat={(friendId, postId) => socket.emit('chat-initiate', { targetUserId: friendId, postId })}
      />

      {/* Friends List */}
      <h2>Friends</h2>
      <FriendsList friends={friends} onOpenChat={handleChatClick} />

      {/* Chat Modal */}
      {selectedChat && (
        <ChatModal
          chatId={selectedChat.chatId}
          friend={selectedChat.friend}
          initialMessages={selectedChat.messages}
          onClose={() => setSelectedChat(null)}
        />
      )}

      {/* Friend Requests */}
      <button onClick={() => setShowRequests(true)}>Friend Requests</button>
      {showRequests && <FriendRequests onClose={() => setShowRequests(false)} />}
    </div>
  );
};

export default Dashboard;
