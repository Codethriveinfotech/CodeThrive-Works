import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import './Auth.css';

const ForgotPassword = () => {
  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header" style={{ marginBottom: '2rem' }}>
          <h2>Forgot Password</h2>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '80px', height: '80px', 
            background: 'var(--primary-bg)', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1rem' 
          }}>
            <Mail size={40} color="var(--primary)" />
          </div>
          <h3>Forgot Password?</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Enter your registered email or phone number
          </p>
        </div>

        <form className="auth-form">
          <div className="form-group">
            <label>Email or Phone Number</label>
            <input type="text" className="input-field" placeholder="Enter email or phone number" required />
          </div>
          
          <button type="button" className="btn btn-primary w-100" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            Send OTP
          </button>
        </form>
        
        <div className="auth-footer" style={{ marginTop: '2rem' }}>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
