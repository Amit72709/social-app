import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // Handle auth redirect token (already in your code)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Clean URL: Remove ?token=... but stay on /dashboard
      window.history.replaceState({}, document.title, '/dashboard');
    }
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} /> 
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;