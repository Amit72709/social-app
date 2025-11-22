import { useState, useEffect } from 'react';
import api from '../services/api';

export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/api/posts');
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (formData) => {
  try {
    console.log('Creating post with:', formData.get('text'));  // <-- ADD debug
    const res = await api.post('/api/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setPosts([res.data, ...posts]);
  } catch (err) {
    console.error('Create post error:', err.response?.data || err.message);  // <-- ADD detailed log
  }
};
  const updatePost = async (id, formData) => {
    try {
      console.log('user id:',id);
      const res = await api.put(`/api/posts/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPosts(posts.map(p => p._id === id ? res.data : p));
    } catch (err) {
      console.error('Error updating post:', err);
    }
  };

  const deletePost = async (id) => {
  try {

    // 🔥 WARNING POPUP — Ask user before deleting
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    await api.delete(`/api/posts/${id}`);
    setPosts(posts.filter(p => p._id !== id));

  } catch (err) {
    console.error('Error deleting post:', err);
  }
};


  return { posts, loading, createPost, updatePost, deletePost, refetch: fetchPosts };
};