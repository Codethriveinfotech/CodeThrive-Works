import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { registerEmployee } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    emailId: '',
    phoneNumber: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (
      !formData.fullName || 
      !formData.employeeId || 
      !formData.emailId || 
      !formData.phoneNumber || 
      !formData.password || 
      !formData.confirmPassword
    ) {
      setError('All mandatory fields must be filled.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password must match.');
      return;
    }

    setIsLoading(true);
    const result = await registerEmployee(formData);
    setIsLoading(false);

    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => navigate('/employee/login'), 3000);
    } else {
      setError(result.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-page" style={{ margin: '2rem 0' }}>
      <div className="auth-card card" style={{ maxWidth: '600px', padding: '2.5rem' }}>
        <div className="auth-logo-circle" style={{ width: '65px', height: '65px', overflow: 'hidden', border: 'none', background: 'transparent' }}>
          <img src="/logo.png" alt="CTI Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }} />
        </div>
        <div className="auth-header">
          <h2>New Employee Registration</h2>
          <p>Please register to create your account.</p>
        </div>

        {error && <div className="auth-error-msg">{error}</div>}
        {success && (
          <div className="auth-error-msg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Full Name *</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field" required />
          </div>
          
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Employee ID *</label>
            <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="input-field" required />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Role / Position *</label>
            <input 
              type="text" 
              name="role" 
              placeholder="e.g. Senior Software Engineer, UI/UX Designer, Project Manager" 
              value={formData.role} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Email ID *</label>
            <input type="email" name="emailId" value={formData.emailId} onChange={handleChange} className="input-field" required />
          </div>
          
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Phone Number *</label>
            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="input-field" required />
          </div>

          <div className="form-group">
            <label>Create Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" required />
          </div>
          
          <div className="form-group">
            <label>Confirm Password *</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field" required />
          </div>
          
          <button type="submit" className="btn btn-primary w-100" disabled={isLoading || success} style={{ gridColumn: 'span 2', padding: '1rem', marginTop: '1.5rem', fontSize: '1rem' }}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
          
        </form>
        
        <div className="auth-footer" style={{ marginTop: '2rem' }}>
          <p>Already have an account? <Link to="/employee/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
