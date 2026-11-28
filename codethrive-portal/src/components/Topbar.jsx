import React, { useState } from 'react';
import { Search, Settings, ChevronDown, RefreshCw, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';
import logoImg from '../assets/logo.png';

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getDisplayName = () => user?.fullName || user?.name || 'CodeThrive Infotech Employee';
  const getDisplayRole = () => user?.designation || user?.role || 'Employee';

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('cti_global_refresh'));
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="mobile-menu-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              document.body.classList.toggle('mobile-sidebar-open');
            }}
            title="Toggle Mobile Menu"
            aria-label="Toggle Mobile Menu"
          >
            <Menu size={22} color="#ffffff" />
          </button>

          <div className="topbar-brand-display" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <img 
              src={logoImg} 
              alt="CodeThrive Infotech Logo" 
              style={{ 
                width: '34px', 
                height: '34px', 
                objectFit: 'contain',
                borderRadius: '8px',
                filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.5))',
                flexShrink: 0
              }} 
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', lineHeight: 1 }}>
              <span style={{ 
                fontSize: '1.15rem', 
                fontWeight: 900, 
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 65%, #0072ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                CODETHRIVE
              </span>
              <span style={{ 
                fontSize: '1.12rem', 
                fontWeight: 900, 
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #00ff87 0%, #60efff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                INFOTECH
              </span>
            </div>
          </div>
        </div>
        
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          {/* Global Portal Refresh Button */}
          <button 
            onClick={handleGlobalRefresh}
            title="Global Refresh Workspace"
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
            <RefreshCw size={19} className={isRefreshing ? 'spin-animation' : ''} />
          </button>

          {/* Settings Trigger */}
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

          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)', margin: '0 0.25rem' }}></div>

          {/* User Profile Pill */}
          <div 
            onClick={() => navigate('/employee/profile')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              borderRadius: '30px',
              transition: 'background 0.2s ease',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: user?.profilePhoto ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--accent))', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 600,
              fontSize: '0.9rem',
              overflow: 'hidden',
              border: '1.5px solid rgba(255,255,255,0.2)'
            }}>
              {user?.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerText = getInitials(getDisplayName());
                  }}
                />
              ) : (
                getInitials(getDisplayName())
              )}
            </div>

            <div className="topbar-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.2' }}>
                {getDisplayName()}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                {getDisplayRole()}
              </span>
            </div>
            
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default Topbar;
