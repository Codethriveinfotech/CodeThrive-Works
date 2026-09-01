import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AdminTopbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Admins might not have traditional notifications in this demo, but keeping structure
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications');
        const unread = (res.data?.data || []).filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to fetch unread notifications count', err);
      }
    };
    if (user) fetchUnreadCount();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
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
          placeholder="Search Admin Portal..." 
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
          onClick={() => navigate('/admin/notifications')}
          style={{ 
            background: 'transparent', border: 'none', color: 'var(--text-muted)', 
            cursor: 'pointer', position: 'relative'
          }}
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: 'var(--danger)', color: '#fff', fontSize: '0.65rem',
              width: '16px', height: '16px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>

        <div className="profile-widget" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/admin/profile')}>
          <div className="profile-avatar" style={{ 
            width: '40px', height: '40px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--danger), var(--warning))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1.1rem', color: '#fff'
          }}>
            {getInitials(user?.name || user?.email || 'Admin')}
          </div>
          <div className="profile-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="profile-name" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
              {user?.name || 'Administrator'}
            </span>
            <span className="profile-role" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role || 'Admin'}
            </span>
          </div>
          <ChevronDown size={16} color="var(--text-muted)" style={{ marginLeft: '0.5rem' }} />
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
