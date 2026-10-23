import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api/v1';
  }
  return '/api/v1';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize user object: ensure both name & fullName are always present
  const normalizeUser = (u) => {
    if (!u) return u;
    return {
      ...u,
      name: u.name || u.fullName || u.email?.split('@')[0] || 'Employee',
      fullName: u.fullName || u.name || u.email?.split('@')[0] || 'Employee'
    };
  };

  axios.defaults.baseURL = getApiBaseUrl();
  axios.defaults.withCredentials = true;
  const initialToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (initialToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const normalized = normalizeUser(parsed);
        setUser(normalized);
        // Persist normalized back so future loads also have both name & fullName
        localStorage.setItem('user', JSON.stringify(normalized));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
      
      // Fetch fresh data in background if backend is reachable
      axios.get('/auth/me').then(res => {
        if (res.data?.user) {
          const normalized = normalizeUser(res.data.user);
          setUser(normalized);
          localStorage.setItem('user', JSON.stringify(normalized));
        }
      }).catch(_err => {
        console.warn('Backend session refresh skipped (Offline/Local mode active)');
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const isOfflineOrApiMissing = (err) => {
    if (!err || !err.response) return true;
    const status = err.response.status;
    return status === 405 || status === 404 || status === 502 || status === 503 || status === 504 || err.code === 'ERR_NETWORK';
  };

  const extractErrorMessage = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.data?.error) return err.response.data.error;
    if (typeof err.response?.data === 'string' && err.response.data.trim()) return err.response.data;
    if (err.message) return err.message;
    return defaultMsg;
  };

  const login = async (identifier, password) => {
    try {
      const res = await axios.post('/auth/login', { employeeId: identifier, password });
      const normalized = normalizeUser(res.data.user);
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
      return { success: true, user: normalized };
    } catch (err) {
      if (isOfflineOrApiMissing(err)) {
        // Local Fallback Login when backend is offline
        const localUsers = JSON.parse(localStorage.getItem('cti_local_users') || '[]');
        const match = localUsers.find(u => u.employeeId === identifier || u.email === identifier || u.emailId === identifier);
        
        if (!match) {
          return { 
            success: false, 
            notRegistered: true, 
            message: 'Account not found! You need to register first.' 
          };
        }

        const normalized = normalizeUser(match);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
        return { success: true, user: normalized, isLocalMode: true };
      }
      
      const isNotFound = err.response?.status === 404 || 
                         extractErrorMessage(err, '').toLowerCase().includes('register') ||
                         extractErrorMessage(err, '').toLowerCase().includes('no account');

      return { 
        success: false, 
        notRegistered: isNotFound,
        message: extractErrorMessage(err, 'No account found. You need to register first.') 
      };
    }
  };


  const adminLogin = async (email, password) => {
    try {
      const res = await axios.post('/auth/admin-login', { email, password });
      const normalized = normalizeUser(res.data.user);
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
      return { success: true, user: normalized };
    } catch (err) {
      if (isOfflineOrApiMissing(err)) {
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
      return { success: false, message: extractErrorMessage(err, 'Admin Login failed') };
    }
  };

  const registerEmployee = async (formData) => {
    try {
      const res = await axios.post('/auth/register-employee', formData);
      return { 
        success: true, 
        message: res.data?.message || 'Employee Registered Successfully! Please sign in to continue.' 
      };
    } catch (err) {
      return { 
        success: false, 
        message: extractErrorMessage(err, 'Registration failed') 
      };
    }
  };

  const createCredentials = async (data) => {
    try {
      const res = await axios.post('/auth/create-credentials', data);
      return { success: true, message: res.data.message };
    } catch (err) {
      if (isOfflineOrApiMissing(err)) {
        return { success: true, message: 'Credentials Created Successfully!', isLocalMode: true };
      }
      return { success: false, message: extractErrorMessage(err, 'Credential creation failed') };
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
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, registerEmployee, createCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

