import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email.trim()) {
      setError('Admin Email is required');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    const result = await adminLogin(formData.email, formData.password);
    setIsLoading(false);

    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.message || 'Login failed.');
    }
  };

  return (
    <div className="auth-page" style={{ background: 'var(--bg-main)' }}>
      <div className="auth-card card" style={{ borderColor: 'var(--primary)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <ShieldAlert size={48} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-muted)' }}>Secure access for CodeThrive Administrators.</p>
        </div>

        {error && (
          <div className="auth-error-msg" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Admin Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input-field ${error && !formData.email ? 'input-error' : ''}`} 
              placeholder="admin@codethrive.com" 
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
                placeholder="Enter admin password" 
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
          
          <button type="submit" className="btn btn-primary w-100" disabled={isLoading} style={{ padding: '0.85rem', marginTop: '2rem', fontSize: '1rem' }}>
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
          
        </form>
        
        <div className="auth-footer" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Employees must use the <a href="/employee/login" style={{ color: 'var(--primary)' }}>Employee Portal</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
