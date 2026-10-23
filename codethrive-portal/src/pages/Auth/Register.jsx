import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Eye, EyeOff, Check, X, ShieldAlert } from 'lucide-react';
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
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Evaluate password strength in real time
  const passwordAnalysis = useMemo(() => {
    const pwd = formData.password || '';
    const hasMinLen = pwd.length >= 8;
    const hasWord = /[a-zA-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    let score = 0;
    if (hasMinLen) score++;
    if (hasLower && hasUpper) score++;
    else if (hasWord) score += 0.5;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    let level = 'weak';
    let percent = '25%';
    let color = '#f87171';
    let label = 'Weak (Simple)';

    if (score >= 4) {
      level = 'strong';
      percent = '100%';
      color = '#34d399';
      label = 'Strong';
    } else if (score >= 3) {
      level = 'good';
      percent = '75%';
      color = '#fbbf24';
      label = 'Good';
    } else if (score >= 2) {
      level = 'fair';
      percent = '50%';
      color = '#fb923c';
      label = 'Fair';
    }

    const isStrong = hasMinLen && hasLower && hasUpper && hasNumber && hasSpecial;

    return {
      hasMinLen,
      hasLower,
      hasUpper,
      hasWord,
      hasNumber,
      hasSpecial,
      score,
      level,
      percent,
      color,
      label,
      isStrong
    };
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (
      !formData.fullName.trim() || 
      !formData.employeeId.trim() || 
      !formData.emailId.trim() || 
      !formData.phoneNumber.trim() || 
      !formData.password || 
      !formData.confirmPassword
    ) {
      setError('All mandatory fields must be filled.');
      return;
    }

    if (!passwordAnalysis.isStrong) {
      setError('Password is too simple! Please create a strong password using words (uppercase & lowercase letters), numbers, and special characters (minimum 8 characters).');
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
      setTimeout(() => navigate('/employee/login'), 2500);
    } else {
      setError(result.message || 'Registration failed. Please check your details and try again.');
    }
  };

  return (
    <div className="auth-page" style={{ margin: '2rem 0' }}>
      <div className="auth-card card" style={{ maxWidth: '640px', padding: '2.5rem' }}>
        <div className="auth-logo-circle" style={{ width: '65px', height: '65px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <img src="/logo.png" alt="CodeThrive Infotech Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div className="auth-header">
          <h2>New Employee Registration</h2>
          <p>Please register to create your account.</p>
        </div>

        {error && <div className="auth-error-msg">{error}</div>}
        {success && (
          <div className="auth-error-msg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form registration-grid">
          
          <div className="form-group full-width">
            <label>Full Name *</label>
            <input 
              type="text" 
              name="fullName" 
              placeholder="e.g. Kirubakaran V"
              value={formData.fullName} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          
          <div className="form-group full-width">
            <label>Employee ID *</label>
            <input 
              type="text" 
              name="employeeId" 
              placeholder="e.g. CTI-2026-002"
              value={formData.employeeId} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>

          <div className="form-group full-width">
            <label>Role / Position *</label>
            <input 
              type="text" 
              name="role" 
              placeholder="e.g. Senior Software Engineer, Managing Director, UI/UX Designer" 
              value={formData.role} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          
          <div className="form-group full-width">
            <label>Email ID *</label>
            <input 
              type="email" 
              name="emailId" 
              placeholder="e.g. employee@codethrive.com"
              value={formData.emailId} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>
          
          <div className="form-group full-width">
            <label>Phone Number *</label>
            <input 
              type="tel" 
              name="phoneNumber" 
              placeholder="e.g. 9876543210"
              value={formData.phoneNumber} 
              onChange={handleChange} 
              className="input-field" 
              required 
            />
          </div>

          <div className="form-group half-width">
            <label>Create Password *</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                placeholder="Enter strong password"
                value={formData.password} 
                onChange={handleChange} 
                className="input-field" 
                required 
              />
              <button 
                type="button" 
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="form-group half-width">
            <label>Confirm Password *</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                name="confirmPassword" 
                placeholder="Re-enter password"
                value={formData.confirmPassword} 
                onChange={handleChange} 
                className="input-field" 
                required 
              />
              <button 
                type="button" 
                className="pwd-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.confirmPassword && (
              <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', fontWeight: 500 }}>
                {formData.password === formData.confirmPassword ? (
                  <span style={{ color: '#34d399' }}>✓ Passwords match</span>
                ) : (
                  <span style={{ color: '#f87171' }}>✗ Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          {/* Password Strength and Guidance Section */}
          {formData.password && (
            <div className="form-group full-width" style={{ marginTop: '-0.25rem' }}>
              <div className="password-strength-box">
                <div className="strength-header">
                  <span className="strength-title">Password Strength:</span>
                  <span className={`strength-level ${passwordAnalysis.level}`}>
                    {passwordAnalysis.label} {passwordAnalysis.isStrong ? '✓' : ''}
                  </span>
                </div>

                <div className="strength-meter-track">
                  <div 
                    className="strength-meter-bar" 
                    style={{ 
                      width: passwordAnalysis.percent, 
                      backgroundColor: passwordAnalysis.color 
                    }} 
                  />
                </div>

                <div className="strength-rules">
                  <div className={`strength-rule-item ${passwordAnalysis.hasMinLen ? 'valid' : 'invalid'}`}>
                    {passwordAnalysis.hasMinLen ? <Check size={14} /> : <X size={14} />}
                    <span>Min 8 characters</span>
                  </div>
                  <div className={`strength-rule-item ${passwordAnalysis.hasUpper && passwordAnalysis.hasLower ? 'valid' : 'invalid'}`}>
                    {passwordAnalysis.hasUpper && passwordAnalysis.hasLower ? <Check size={14} /> : <X size={14} />}
                    <span>Uppercase & lowercase letters</span>
                  </div>
                  <div className={`strength-rule-item ${passwordAnalysis.hasNumber ? 'valid' : 'invalid'}`}>
                    {passwordAnalysis.hasNumber ? <Check size={14} /> : <X size={14} />}
                    <span>Numbers (0-9)</span>
                  </div>
                  <div className={`strength-rule-item ${passwordAnalysis.hasSpecial ? 'valid' : 'invalid'}`}>
                    {passwordAnalysis.hasSpecial ? <Check size={14} /> : <X size={14} />}
                    <span>Special characters (@$!%*?&#)</span>
                  </div>
                </div>

                {!passwordAnalysis.isStrong && (
                  <div style={{ marginTop: '0.65rem', color: '#fb923c', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.4rem', lineHeight: 1.4 }}>
                    <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                    <span>Simple passwords are not allowed. Please use a combination of words, numbers, and special characters.</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button type="submit" className="btn btn-primary w-100 full-width" disabled={isLoading || success} style={{ padding: '1rem', marginTop: '1.5rem', fontSize: '1rem' }}>
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
