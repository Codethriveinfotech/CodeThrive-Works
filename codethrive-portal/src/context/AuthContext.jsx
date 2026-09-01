import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.baseURL = 'http://localhost:5000/api/v1';
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      // Set initially for fast render
      setUser(JSON.parse(storedUser));
      
      // Fetch fresh data in background
      axios.get('/auth/me').then(res => {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }).catch(err => {
        console.warn('Failed to refresh user session', err);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await axios.post('/auth/login', { employeeId: identifier, password });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const res = await axios.post('/auth/admin-login', { email, password });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Admin Login failed' };
    }
  };

  const registerEmployee = async (formData) => {
    try {
      const res = await axios.post('/auth/register-employee', formData);
      return { success: true, message: res.data.message };
    } catch (err) {
      if (!err.response) {
         return { success: false, message: 'Network Error: Backend server is offline (Database is down).' };
      }
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const createCredentials = async (data) => {
    try {
      const res = await axios.post('/auth/create-credentials', data);
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Credential creation failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.get('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, registerEmployee, createCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
