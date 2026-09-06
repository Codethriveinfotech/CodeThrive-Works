import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Settings, Sun, Moon, Bell, Shield, User, Globe, Check, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsModal = ({ isOpen, onClose, isAdmin = false }) => {
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState(localStorage.getItem('cti_theme') || 'dark');
  const [emailAlerts, setEmailAlerts] = useState(localStorage.getItem('cti_email_alerts') !== 'false');
  const [taskAlerts, setTaskAlerts] = useState(localStorage.getItem('cti_task_alerts') !== 'false');
  const [language, setLanguage] = useState(localStorage.getItem('cti_lang') || 'en');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('cti_date_format') || 'DD/MM/YYYY');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Apply theme class to document elem
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('cti_theme', theme);
    localStorage.setItem('cti_email_alerts', emailAlerts);
    localStorage.setItem('cti_task_alerts', taskAlerts);
    localStorage.setItem('cti_lang', language);
    localStorage.setItem('cti_date_format', dateFormat);
    
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Portal Settings">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {savedSuccess && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--success)',
            borderRadius: '8px',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500'
          }}>
            <Check size={18} /> Settings saved successfully!
          </div>
        )}

        {/* 1. Theme Selection */}
        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Sun size={16} /> Appearance & Theme
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              style={{
                padding: '0.8rem',
                borderRadius: '8px',
                border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                background: theme === 'dark' ? 'rgba(79, 70, 229, 0.15)' : 'var(--glass-bg)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: theme === 'dark' ? 'bold' : 'normal'
              }}
            >
              <Moon size={16} /> Dark Mode
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              style={{
                padding: '0.8rem',
                borderRadius: '8px',
                border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                background: theme === 'light' ? 'rgba(79, 70, 229, 0.15)' : 'var(--glass-bg)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: theme === 'light' ? 'bold' : 'normal'
              }}
            >
              <Sun size={16} /> Light Mode
            </button>
          </div>
        </div>

        {/* 2. Notifications Preferences */}
        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Bell size={16} /> Notification Preferences
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--glass-bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.9rem' }}>Email Notifications & Summaries</span>
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--glass-bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.9rem' }}>Task & Attendance Push Alerts</span>
              <input type="checkbox" checked={taskAlerts} onChange={(e) => setTaskAlerts(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            </label>
          </div>
        </div>

        {/* 3. System Preferences */}
        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Globe size={16} /> Language & Regional
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem' }}>Portal Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)} 
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="en">English (US)</option>
                <option value="ta">Tamil (தமிழ்)</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem' }}>Date Format</label>
              <select 
                value={dateFormat} 
                onChange={(e) => setDateFormat(e.target.value)} 
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Quick Account Actions */}
        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Shield size={16} /> Account Quick Actions
          </h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                onClose();
                navigate(isAdmin ? '/admin/profile' : '/employee/profile');
              }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <User size={16} /> View Profile
            </button>
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={16} /> Save Settings
          </button>
        </div>

      </form>
    </Modal>
  );
};

export default SettingsModal;
