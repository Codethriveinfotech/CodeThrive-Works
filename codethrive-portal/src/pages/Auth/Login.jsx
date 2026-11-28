import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoginGreetingSplash from '../../components/LoginGreetingSplash';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', password: '' });
  const [error, setError] = useState('');
  const [isWifiError, setIsWifiError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [greetingSplashData, setGreetingSplashData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setIsWifiError(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsWifiError(false);
    
    if (!formData.employeeId.trim()) {
      setError('Employee ID is required');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    const result = await login(formData.employeeId, formData.password);
    setIsLoading(false);

    if (result.success) {
      const userObj = result.user;
      const empIdClean = (userObj?.employeeId || formData.employeeId.trim()).toUpperCase();
      const newRegKey = `cti_newly_registered_${empIdClean}`;

      // Welcome To CTI is ONLY for newly registered users on their first login
      const isNewRegistered = Boolean(
        localStorage.getItem(newRegKey) === 'true' || 
        userObj?.isNewRegisteredUser
      );

      if (isNewRegistered) {
        try {
          localStorage.removeItem(newRegKey);
          sessionStorage.setItem('cti_just_first_login', 'true');
        } catch (err) {}
      } else {
        try {
          sessionStorage.removeItem('cti_just_first_login');
        } catch (err) {}
      }

      // Trigger animated greeting splash: "Welcome To CTI" if new user, or Good Morning/Afternoon/Evening if existing user
      setGreetingSplashData({
        user: userObj,
        isFirstLogin: isNewRegistered
      });
    } else {
      if (result.wifiRestricted) {
        setIsWifiError(true);
        setError(result.message || '🔒 CodeThrive Infotech Office Wi-Fi connect panuga. Office Wi-Fi connect panna mattum thaan Employee Portal login aagum.');
      } else if (result.notRegistered) {
        setIsWifiError(false);
        setError('No registered account found! You need to register first. Redirecting to Registration page...');
        setTimeout(() => {
          navigate('/employee/register');
        }, 1800);
      } else {
        setIsWifiError(false);
        setError(result.message || 'Login failed.');
      }
    }
  };

  return (
    <div className="auth-page">
      {greetingSplashData && (
        <LoginGreetingSplash 
          user={greetingSplashData.user}
          isFirstLogin={greetingSplashData.isFirstLogin}
          onFinish={() => navigate('/employee/dashboard')}
        />
      )}
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo-circle" style={{ width: '65px', height: '65px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <img src="/logo.png" alt="CodeThrive Infotech Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2>CodeThrive Infotech</h2>
          <p>Welcome back! Please login to your account.</p>
        </div>

        {error && (
          <div className="auth-error-msg" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px',
            background: isWifiError ? 'rgba(239, 68, 68, 0.15)' : undefined,
            border: isWifiError ? '1.5px solid rgba(239, 68, 68, 0.5)' : undefined,
            borderRadius: '12px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {isWifiError && <WifiOff size={22} color="#f87171" style={{ flexShrink: 0 }} />}
              <span style={{ color: isWifiError ? '#fca5a5' : undefined, fontWeight: isWifiError ? 600 : undefined, fontSize: '0.88rem', lineHeight: '1.45' }}>
                {error}
              </span>
            </div>
            {!isWifiError && (
              <button 
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.5rem', width: '100%', borderColor: 'rgba(255,255,255,0.4)', color: 'var(--text-main)', fontWeight: '600' }}
                onClick={() => navigate('/employee/register')}
              >
                Go to Registration Page
              </button>
            )}
          </div>
        )}


        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Employee ID</label>
            <input 
              type="text" 
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className={`input-field ${error && !formData.employeeId ? 'input-error' : ''}`} 
              placeholder="" 
            />
          </div>
          
          <div className="form-group relative-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${error && !formData.password ? 'input-error' : ''}`} 
                placeholder="" 
              />
              <button 
                type="button" 
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="auth-options">
            <Link to="/employee/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>
          
          <button type="submit" className="btn btn-primary w-100" disabled={isLoading} style={{ padding: '0.85rem', marginTop: '1.5rem', fontSize: '1rem' }}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
        </form>
        
        <div className="auth-footer" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p>New to CodeThrive Infotech? <Link to="/employee/register">Register here</Link></p>
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Are you an Administrator? <Link to="/admin/login" style={{ color: 'var(--primary)' }}>Go to Admin Portal</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
