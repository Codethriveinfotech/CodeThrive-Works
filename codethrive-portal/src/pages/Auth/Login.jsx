import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
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
      navigate('/employee/dashboard');
    } else {
      if (result.notRegistered) {
        setError('No registered account found! You need to register first. Redirecting to Registration page...');
        setTimeout(() => {
          navigate('/employee/register');
        }, 1800);
      } else {
        setError(result.message || 'Login failed.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo-circle" style={{ width: '65px', height: '65px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <img src="/logo.png" alt="CodeThrive Infotech Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2>CodeThrive Infotech</h2>
          <p>Welcome back! Please login to your account.</p>
        </div>

        {error && (
          <div className="auth-error-msg" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span>{error}</span>
            <button 
              type="button"
              className="btn btn-outline"
              style={{ padding: '0.5rem', width: '100%', borderColor: 'rgba(255,255,255,0.4)', color: 'var(--text-main)', fontWeight: '600' }}
              onClick={() => navigate('/employee/register')}
            >
              Go to Registration Page
            </button>
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
              placeholder="e.g. CTI-2026-001" 
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
                placeholder="Enter password" 
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
          <p>New to CodeThrive? <Link to="/employee/register">Register here</Link></p>
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
