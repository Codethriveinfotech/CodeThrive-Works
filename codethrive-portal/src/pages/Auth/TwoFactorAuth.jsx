import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const TwoFactorAuth = () => {
  const navigate = useNavigate();

  const handleVerify = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header" style={{ marginBottom: '2rem' }}>
          <h2>Two Factor Authentication</h2>
          <p style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>Enter Verification Code</p>
          <p style={{ fontSize: '0.85rem' }}>
            We have sent a 6 digit code to your email
            <br />
            <strong>mahadev@example.com</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          <div className="otp-inputs">
            <input type="text" maxLength="1" className="otp-field" defaultValue="2" />
            <input type="text" maxLength="1" className="otp-field" defaultValue="4" />
            <input type="text" maxLength="1" className="otp-field" defaultValue="6" />
            <input type="text" maxLength="1" className="otp-field" defaultValue="8" />
            <input type="text" maxLength="1" className="otp-field" defaultValue="1" />
            <input type="text" maxLength="1" className="otp-field" defaultValue="2" />
          </div>
          
          <p className="resend-text">
            Didn't receive code? <a href="#">Resend (00:30)</a>
          </p>
          
          <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            Verify
          </button>
        </form>
        
        <div className="auth-footer" style={{ marginTop: '2rem' }}>
          <Link to="/employee/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
