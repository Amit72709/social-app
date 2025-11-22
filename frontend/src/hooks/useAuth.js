import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me').then((res) => {
        setUser(res.data);
        setLoading(false);
      }).catch(() => {
        localStorage.removeItem('token');
        setLoading(false);
        navigate('/login');
      });
    } else {
      setLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  // const login = () => {
  //   window.location.href = '/auth/google';  // Backend auth
  // };

  const login = () => {
  window.location.href = 'https://social-app-backend-k663.onrender.com/auth/google';  // Backend auth
};

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return { user, loading, login, logout };
};