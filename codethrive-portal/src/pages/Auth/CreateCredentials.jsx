import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const CreateCredentials = () => {
  const navigate = useNavigate();
  const { createCredentials } = useAuth();
  
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    emailOrPhone: '',
    otp: '',
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

  const requestOTP = (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.emailOrPhone) {
      setError('Please provide your Employee ID and Contact info.');
      return;
    }
    setSuccess('OTP sent to your registered email/phone! (Use 123456 for testing)');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const result = await createCredentials({
      employeeId: formData.employeeId,
      emailOrPhone: formData.emailOrPhone,
      otp: formData.otp,
      password: formData.password
    });
    setIsLoading(false);

    if (result.success) {
      setSuccess('Credentials created successfully! Redirecting to login...');
      setTimeout(() => navigate('/employee/login'), 3000);
    } else {
      setError(result.message || 'Verification failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div className="auth-logo-circle">
            <KeyRound size={24} color="white" />
          </div>
          <h2>Create Credentials</h2>
          <p>Verify your identity and set up your login password.</p>
        </div>

        {error && <div className="auth-error-msg">{error}</div>}
        {success && <div className="auth-error-msg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>{success}</div>}

        <form onSubmit={step === 1 ? requestOTP : handleSubmit} className="auth-form">
          
          <div className="form-group">
            <label>Approved Employee ID</label>
            <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="input-field" placeholder="e.g. CTI-2026-001" disabled={step === 2} />
          </div>
          
          <div className="form-group">
            <label>Registered Email or Phone</label>
            <input type="text" name="emailOrPhone" value={formData.emailOrPhone} onChange={handleChange} className="input-field" placeholder="Email or Phone Number" disabled={step === 2} />
          </div>

          {step === 1 && (
            <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.85rem', marginTop: '1.5rem' }}>
              Send Verification OTP
            </button>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label>Enter OTP</label>
                <input type="text" name="otp" value={formData.otp} onChange={handleChange} className="input-field" placeholder="6-digit code" />
              </div>

              <div className="form-group relative-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Min 8 chars, 1 uppercase, 1 special char" />
                  <button type="button" className="pwd-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group relative-group">
                <label>Confirm Password</label>
                <div className="password-input-wrapper">
                  <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field" placeholder="Confirm password" />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={isLoading} style={{ padding: '0.85rem', marginTop: '1.5rem' }}>
                {isLoading ? 'Creating Account...' : 'Set Password'}
              </button>
            </>
          )}
          
        </form>
        
        <div className="auth-footer" style={{ marginTop: '2rem' }}>
          <p>Back to <Link to="/employee/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default CreateCredentials;
