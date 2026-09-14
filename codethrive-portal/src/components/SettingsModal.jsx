import React, { useState } from 'react';
import Modal from './common/Modal';
import { Shield, User, RefreshCw, LogOut, Check, Save, Lock, ArrowLeft, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const SettingsModal = ({ isOpen, onClose, isAdmin = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Change Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleRefreshWorkspace = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('cti_global_refresh'));
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate(isAdmin ? '/admin/login' : '/employee/login', { replace: true });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    try {
      setIsSavingPassword(true);
      await api.put('/auth/updatepassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordMsg({ type: '', text: '' });
      }, 1400);
    } catch (err) {
      setPasswordMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update password. Please check your current password.' 
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const resetModalState = () => {
    setShowPasswordForm(false);
    setPasswordMsg({ type: '', text: '' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetModalState} title={showPasswordForm ? "Change Password" : "Portal Workspace Settings"}>
      {showPasswordForm ? (
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          <button
            type="button"
            className="btn-outline-glass"
            onClick={() => {
              setShowPasswordForm(false);
              setPasswordMsg({ type: '', text: '' });
            }}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}
          >
            <ArrowLeft size={14} /> Back to Settings
          </button>

          {passwordMsg.text && (
            <div style={{
              padding: '0.75rem 1rem',
              background: passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${passwordMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
              borderRadius: '12px',
              color: passwordMsg.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {passwordMsg.type === 'success' ? <Check size={18} /> : <Shield size={18} />}
              {passwordMsg.text}
            </div>
          )}

          <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Key size={14} /> Current Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} /> New Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter new password (min 6 chars)"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} /> Confirm New Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Re-enter new password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
            <button 
              type="button" 
              className="btn-outline-glass" 
              onClick={() => {
                setShowPasswordForm(false);
                setPasswordMsg({ type: '', text: '' });
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary-glow" 
              disabled={isSavingPassword}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isSavingPassword ? (
                <>
                  <RefreshCw size={16} className="spin" /> Updating...
                </>
              ) : (
                <>
                  <Lock size={16} /> Update Password
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {savedSuccess && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '12px',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>
              <Check size={18} /> Settings applied successfully!
            </div>
          )}

          {/* 1. Account Summary Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                  {user?.fullName || user?.name || 'CodeThrive User'}
                </div>
                <div style={{ fontSize: '0.785rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                  <span>{user?.email || 'user@codethrive.com'}</span>
                  <span>&bull;</span>
                  <span style={{ color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    {user?.role || (isAdmin ? 'ADMIN' : 'EMPLOYEE')}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-outline-glass"
              onClick={() => {
                resetModalState();
                navigate(isAdmin ? '/admin/profile' : '/employee/profile');
              }}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            >
              <User size={15} /> My Profile
            </button>
          </div>

          {/* 3. Workspace Data Sync */}
          <div>
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700 }}>
              <RefreshCw size={16} /> Workspace Data Sync
            </h4>
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  Re-sync Local Workspace
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Force refresh tasks, attendance, and payroll records
                </div>
              </div>

              <button
                type="button"
                className="btn-outline-glass"
                onClick={handleRefreshWorkspace}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
              >
                <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} /> Sync Now
              </button>
            </div>
          </div>

          {/* 4. Session & Security */}
          <div>
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 700 }}>
              <Shield size={16} /> Account Security & Session
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <button
                type="button"
                className="btn-outline-glass"
                onClick={() => {
                  setShowPasswordForm(true);
                  setPasswordMsg({ type: '', text: '' });
                }}
                style={{ padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Lock size={16} /> Change Password
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
            <button type="button" className="btn-outline-glass" onClick={resetModalState}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-glow" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Save size={16} /> Save Settings
            </button>
          </div>

        </form>
      )}
    </Modal>
  );
};

export default SettingsModal;
