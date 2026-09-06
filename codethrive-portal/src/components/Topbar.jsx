import React, { useState } from 'react';
import { Search, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="topbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="topbar-search" style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          padding: '0.5rem 1.25rem',
          width: '350px',
          transition: 'all var(--transition-fast)'
        }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.75rem' }} />
          <input 
            type="text" 
            placeholder="Search Employee Portal..." 
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              width: '100%',
              outline: 'none',
              fontSize: '0.95rem'
            }}
          />
        </div>
        
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            title="Portal Settings"
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-main)', 
              cursor: 'pointer', 
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <Settings size={20} />
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>

          <div className="profile-widget" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/employee/profile')}>
            <div className="profile-avatar" style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)'
            }}>
              {getInitials(user?.name || user?.email || 'User')}
            </div>
            <div className="profile-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="profile-name" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                {user?.name || 'CodeThrive Employee'}
              </span>
              <span className="profile-role" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role || 'Employee'}
              </span>
            </div>
            <ChevronDown size={16} color="var(--text-muted)" style={{ marginLeft: '0.5rem' }} />
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isAdmin={false}
      />
    </>
  );
};

export default Topbar;
