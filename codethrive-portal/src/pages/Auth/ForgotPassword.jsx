import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, Eye, EyeOff, ArrowLeft, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { verifyResetIdentity, resetPasswordWithPhone } = useAuth();

  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Verify Employee ID & Phone Number
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!employeeId.trim()) {
      setError('Please enter your Employee ID (e.g. CTI-2026-001)');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter your registered Phone Number');
      return;
    }

    setIsLoading(true);
    const result = await verifyResetIdentity(employeeId.trim(), phoneNumber.trim());
    setIsLoading(false);

    if (result.success) {
      setVerifiedEmployee(result.employee || { employeeId, fullName: 'Employee' });
      setStep(2);
      setSuccess('Identity verified! You can now set your new password.');
    } else {
      setError(result.message || 'Verification failed. Please check your Employee ID and Phone Number.');
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    const result = await resetPasswordWithPhone(employeeId.trim(), phoneNumber.trim(), newPassword);
    setIsLoading(false);

    if (result.success) {
      setSuccess('Password updated successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/employee/login');
      }, 2000);
    } else {
      setError(result.message || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card" style={{ maxWidth: '460px' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <div 
            style={{ 
              width: '70px', 
              height: '70px', 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.25) 100%)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.25rem',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            {step === 1 ? (
              <ShieldCheck size={36} color="var(--primary, #3b82f6)" />
            ) : (
              <KeyRound size={36} color="var(--success, #10b981)" />
            )}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {step === 1 ? 'Reset Password' : 'Set New Password'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>
            {step === 1 
              ? 'Verify your identity using your Employee ID & Registered Phone Number.'
              : 'Choose a strong new password for your account.'}
          </p>
        </div>

        {error && (
          <div className="auth-error-msg" style={{ marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div 
            className="auth-error-msg" 
            style={{ 
              marginBottom: '1.25rem',
              background: 'rgba(16, 185, 129, 0.12)', 
              color: '#10b981', 
              borderColor: 'rgba(16, 185, 129, 0.3)' 
            }}
          >
            {success}
          </div>
        )}

        {step === 1 ? (
          /* STEP 1: Verify Identity */
          <form onSubmit={handleVerify} className="auth-form">
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.4rem' }}>
                Employee ID
              </label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. CTI-2026-001" 
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);
                  setError('');
                }}
                required 
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.4rem' }}>
                Registered Phone Number
              </label>
              <input 
                type="tel" 
                className="input-field" 
                placeholder="e.g. 9876543210" 
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError('');
                }}
                required 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.35rem', display: 'block' }}>
                Enter the phone number provided during your registration/onboarding.
              </span>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-100" 
              disabled={isLoading}
              style={{ padding: '0.85rem', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {isLoading ? 'Verifying...' : 'Verify Details & Proceed'}
            </button>
          </form>
        ) : (
          /* STEP 2: Set New Password */
          <form onSubmit={handleResetPassword} className="auth-form">
            {verifiedEmployee && (
              <div 
                style={{ 
                  background: 'rgba(59, 130, 246, 0.08)', 
                  border: '1px solid rgba(59, 130, 246, 0.25)', 
                  borderRadius: '10px', 
                  padding: '0.75rem 1rem', 
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <UserCheck size={20} color="#3b82f6" />
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary, #94a3b8)', display: 'block' }}>Verified Employee</span>
                  <strong style={{ color: 'var(--text-main, #ffffff)' }}>
                    {verifiedEmployee.fullName} ({employeeId})
                  </strong>
                </div>
              </div>
            )}

            <div className="form-group relative-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.4rem' }}>
                New Password
              </label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="input-field" 
                  placeholder="Enter new password (min. 6 chars)" 
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  required 
                  autoFocus
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

            <div className="form-group relative-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.4rem' }}>
                Confirm New Password
              </label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="input-field" 
                  placeholder="Re-enter new password" 
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  required 
                />
                <button 
                  type="button" 
                  className="pwd-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100" 
              disabled={isLoading}
              style={{ padding: '0.85rem', fontSize: '0.95rem', fontWeight: '600' }}
            >
              {isLoading ? 'Updating Password...' : 'Save New Password'}
            </button>

            <button
              type="button"
              className="btn btn-outline w-100"
              style={{ marginTop: '0.75rem', padding: '0.65rem', fontSize: '0.85rem', borderColor: 'rgba(255, 255, 255, 0.2)' }}
              onClick={() => {
                setStep(1);
                setError('');
                setSuccess('');
              }}
            >
              Change Employee ID / Phone
            </button>
          </form>
        )}
        
        <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link 
            to="/employee/login" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none', fontSize: '0.9rem' }}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
