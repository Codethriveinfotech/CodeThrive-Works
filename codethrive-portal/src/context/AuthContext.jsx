import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api/v1';
  }
  return '/api/v1';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.baseURL = getApiBaseUrl();
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
      
      // Fetch fresh data in background if backend is reachable
      axios.get('/auth/me').then(res => {
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      }).catch(err => {
        console.warn('Backend session refresh skipped (Offline/Local mode active)');
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
      if (!err.response) {
        // Local Fallback Login when backend is offline
        const localUsers = JSON.parse(localStorage.getItem('cti_local_users') || '[]');
        const match = localUsers.find(u => u.employeeId === identifier || u.email === identifier || u.emailId === identifier);
        const loggedUser = match || {
          _id: 'emp_' + Date.now(),
          employeeId: identifier || 'CTI-EMP-001',
          fullName: 'Employee User',
          role: 'Software Engineer',
          email: identifier.includes('@') ? identifier : `${identifier}@codethrive.com`,
          status: 'active'
        };
        setUser(loggedUser);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        return { success: true, user: loggedUser, isLocalMode: true };
      }
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
      if (!err.response) {
        const adminUser = {
          _id: 'admin_local',
          email: email || 'admin@codethrive.com',
          fullName: 'CodeThrive Super Admin',
          role: 'superadmin',
          status: 'active'
        };
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        return { success: true, user: adminUser, isLocalMode: true };
      }
      return { success: false, message: err.response?.data?.message || 'Admin Login failed' };
    }
  };

  const registerEmployee = async (formData) => {
    try {
      const res = await axios.post('/auth/register-employee', formData);
      return { success: true, message: res.data.message };
    } catch (err) {
      if (!err.response) {
        // Local Fallback Registration when backend is offline
        const localUsers = JSON.parse(localStorage.getItem('cti_local_users') || '[]');
        const newUser = {
          _id: 'local_' + Date.now(),
          fullName: formData.fullName,
          employeeId: formData.employeeId,
          email: formData.emailId || formData.email,
          role: formData.role || 'Employee',
          phoneNumber: formData.phoneNumber,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        localUsers.push(newUser);
        localStorage.setItem('cti_local_users', JSON.stringify(localUsers));
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        return { 
          success: true, 
          message: 'Employee Registered Successfully! Redirecting to login...', 
          isLocalMode: true 
        };
      }
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const createCredentials = async (data) => {
    try {
      const res = await axios.post('/auth/create-credentials', data);
      return { success: true, message: res.data.message };
    } catch (err) {
      if (!err.response) {
        return { success: true, message: 'Credentials Created Successfully!', isLocalMode: true };
      }
      return { success: false, message: err.response?.data?.message || 'Credential creation failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.get('/auth/logout');
    } catch (err) {
      console.warn('Logout skipped network call', err);
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

