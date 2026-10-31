import React, { useState, useRef, useEffect } from 'react';
import { Search, Settings, ChevronDown, RefreshCw, Menu, Bell, BellRing, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';
import GlobalSearchBar from './GlobalSearchBar';

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayName = () => user?.fullName || user?.name || 'CodeThrive Employee';
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

          <GlobalSearchBar 
            isAdmin={false} 
            placeholder="Search Employee Portal (Tasks, Payslips, Profile)..." 
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
        
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          {/* Notification Center */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (hasUnreadNotif) setHasUnreadNotif(false);
              }}
              title="Employee Notifications"
              style={{ 
                background: showNotifDropdown ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)', 
                border: showNotifDropdown ? '1.5px solid #6366f1' : '1px solid var(--border-color)', 
                color: showNotifDropdown ? '#818cf8' : 'var(--text-main)', 
                cursor: 'pointer', 
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!showNotifDropdown) e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseOut={(e) => {
                if (!showNotifDropdown) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              {hasUnreadNotif ? (
                <BellRing size={20} color="#818cf8" />
              ) : (
                <Bell size={20} />
              )}
              {hasUnreadNotif && (
                <span style={{ 
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  boxShadow: '0 0 8px #6366f1'
                }}></span>
              )}
            </button>

            {showNotifDropdown && (
              <div 
                className="topbar-notif-popover"
                style={{
                  position: 'absolute',
                  top: '125%',
                  right: 0,
                  width: '320px',
                  maxWidth: 'calc(100vw - 24px)',
                background: 'linear-gradient(150deg, #0e1726 0%, #0a0f1d 100%)',
                border: '1.5px solid rgba(99, 102, 241, 0.45)',
                borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Notifications</span>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>All Systems Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', display: 'block' }}>Workspace Synced</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Daily report and task queue up to date.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

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
            <RefreshCw size={19} className={isRefreshing ? 'spin' : ''} />
          </button>

          {/* Portal Settings Button */}
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
              {getInitials(getDisplayName())}
            </div>
            <div className="profile-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="profile-name" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                {getDisplayName()}
              </span>
              <span className="profile-role" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {getDisplayRole()}
              </span>
            </div>
            <ChevronDown className="topbar-profile-chevron" size={16} color="var(--text-muted)" style={{ marginLeft: '0.5rem' }} />
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
