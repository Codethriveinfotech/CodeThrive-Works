import React, { useState } from 'react';
import Modal from './common/Modal';
import { Shield, User, RefreshCw, LogOut, Check, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SettingsModal = ({ isOpen, onClose, isAdmin = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      setIsRefreshing(false);
    }, 800);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate(isAdmin ? '/admin/login' : '/employee/login', { replace: true });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Portal Workspace Settings">
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
              onClose();
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
                onClose();
                navigate(isAdmin ? '/admin/profile' : '/employee/profile');
              }}
              style={{ padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Shield size={16} /> Change Password
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
          <button type="button" className="btn-outline-glass" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary-glow" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Save size={16} /> Save Settings
          </button>
        </div>

      </form>
    </Modal>
  );
};

export default SettingsModal;
