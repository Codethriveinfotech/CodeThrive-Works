import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Settings, ChevronDown, UserCheck, ChevronRight, User, RefreshCw, Menu,
  Bell, BellRing, Download, MessageCircle, FileText, CheckCircle2, Calendar, ShieldCheck,
  Clock, CheckCheck, Sparkles, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';
import GlobalSearchBar from './GlobalSearchBar';
import api from '../utils/api';
import { generateEmployeeMasterDossierPDF } from '../utils/employeeMasterDossierPdf';

const AdminTopbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showRegDropdown, setShowRegDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Month-end date check: returns true if today is the last calendar day of the current month
  const isMonthEndToday = () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return tomorrow.getDate() === 1;
  };

  const getMonthNotifKey = () => {
    const now = new Date();
    return `cti_month_end_notif_seen_${now.getFullYear()}_${now.getMonth() + 1}`;
  };

  const [notifications, setNotifications] = useState([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registeredStaff, setRegisteredStaff] = useState([]);

  const notifRef = useRef(null);
  const regRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications').catch(() => null);
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        setNotifications(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('cti_global_refresh', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('cti_global_refresh', handleRefresh);
    };
  }, []);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const isMonthEndAlertActive = isMonthEndToday() && localStorage.getItem(getMonthNotifKey()) !== 'true';
  const unreadCount = unreadNotifications.length + (isMonthEndAlertActive ? 1 : 0);
  const hasUnreadNotif = unreadCount > 0;

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all').catch(() => null);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (isMonthEndToday()) {
        localStorage.setItem(getMonthNotifKey(), 'true');
      }
    } catch (e) {
      console.warn('Failed to mark all read:', e);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif._id || notif.id}/read`).catch(() => null);
        setNotifications(prev => prev.map(n => ((n._id && n._id === notif._id) || (n.id && n.id === notif.id)) ? { ...n, isRead: true } : n));
      }
      setShowNotifDropdown(false);
      if (notif.actionLink) {
        navigate(notif.actionLink);
      }
    } catch (e) {
      console.warn('Error clicking notification:', e);
      if (notif.actionLink) navigate(notif.actionLink);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'Report':
        return <FileText size={16} color="#38bdf8" />;
      case 'Leave':
        return <Calendar size={16} color="#f59e0b" />;
      case 'Document':
        return <FileText size={16} color="#a855f7" />;
      case 'Attendance':
        return <Clock size={16} color="#34d399" />;
      default:
        return <Bell size={16} color="#38bdf8" />;
    }
  };

  // Check month-end notification on mount & automatically trigger WhatsApp alert to MD (7812864905)
  useEffect(() => {
    if (isMonthEndToday()) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const alertedKey = `cti_auto_wa_month_end_${todayStr}`;
      
      if (!localStorage.getItem(alertedKey)) {
        try {
          localStorage.setItem(alertedKey, 'true');
          const today = new Date();
          const monthName = today.toLocaleString('default', { month: 'long' });
          const year = today.getFullYear();
          const msg = `🔔 *CodeThrive Infotech - Month-End Audit Notification*\n\nHello Kirubakaran (MD),\nToday is the month-end date (${monthName} ${year}).\n\nAll employee master database records (Full Profiles, Monthly Attendance Logs, Leaves, Completed Tasks & Payroll Computation) are consolidated into Monthly Employee Full Pdf.\n\nPlease review and download the monthly records from the Admin Portal.\n\n🌐 Portal URL: https://codethriveinfotech.in/admin\n📅 Timestamp: ${today.toLocaleString('en-IN')}`;
          const waUrl = `https://wa.me/917812864905?text=${encodeURIComponent(msg)}`;

          // Automatic WhatsApp alert launch
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
          console.warn('Auto WhatsApp trigger exception:', e);
        }
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('CodeThrive Infotech Month-End Audit Notice', {
            body: 'Today is Month-End! Monthly Employee Full Pdf is consolidated. WhatsApp alert sent to MD (7812864905).',
            icon: '/favicon.ico'
          });
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchRegisteredStaff();

    const handleRefreshEvent = () => fetchRegisteredStaff();
    window.addEventListener('cti_global_refresh', handleRefreshEvent);
    window.addEventListener('storage', handleRefreshEvent);
    return () => {
      window.removeEventListener('cti_global_refresh', handleRefreshEvent);
      window.removeEventListener('storage', handleRefreshEvent);
    };
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (regRef.current && !regRef.current.contains(e.target)) {
        setShowRegDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRegisteredStaff = async () => {
    try {
      const res = await api.get('/employees').catch(() => ({ data: { success: false, data: [] } }));
      let dbStaff = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];

      const combined = [...dbStaff];

      const filtered = combined.filter(e => {
        const email = (e.personalEmailAddress || e.email || '').toLowerCase();
        const id = (e.employeeId || '').toLowerCase();
        return email !== 'admin@codethrive.com' && id !== 'cti-adm-001';
      });

      const mapped = filtered.map(emp => ({
        _id: emp._id,
        name: emp.fullName || emp.name || 'Employee',
        id: emp.employeeId || 'CTI-EMP-001',
        role: emp.designation || emp.role || 'Software Engineer',
        dept: emp.department || 'Engineering',
        email: emp.personalEmailAddress || emp.email || 'N/A',
        isNew: emp.isNewRegistration || false
      }));
      setRegisteredStaff(mapped);
    } catch (err) {
      console.warn('Failed to fetch registered staff for topbar popover', err);
      setRegisteredStaff([]);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSelectEmployee = (empId) => {
    setShowRegDropdown(false);
    navigate(`/admin/employees/${empId}`);
  };

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    fetchRegisteredStaff();
    window.dispatchEvent(new CustomEvent('cti_global_refresh'));
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  const handleDownloadMonthlyMasterDossier = async (targetStaff = null) => {
    try {
      setIsGeneratingPdf(true);
      const today = new Date();
      const monthName = today.toLocaleString('default', { month: 'long' });
      const year = today.getFullYear();

      const emp = targetStaff || (registeredStaff.length > 0 ? registeredStaff[0] : {
        fullName: 'Kirubakaran V',
        employeeId: 'CTI-2026-001',
        designation: 'Managing Director & Lead',
        department: 'Executive Leadership',
        personalEmailAddress: 'admin@codethrive.com',
        personalPhoneNumber: '7812864905',
        salary: 80000
      });

      await generateEmployeeMasterDossierPDF(emp, monthName, year);
    } catch (err) {
      console.error('Error generating dossier PDF:', err);
      alert('Error generating dossier PDF: ' + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleToggleNotif = () => {
    const nextState = !showNotifDropdown;
    setShowNotifDropdown(nextState);
    setShowRegDropdown(false);
    if (hasUnreadNotif) {
      setHasUnreadNotif(false);
      try {
        localStorage.setItem(getMonthNotifKey(), 'true');
      } catch (err) {
        console.warn('Failed to save notif state:', err);
      }
    }
  };

  const handleSendMonthEndWhatsAppAlert = () => {
    const today = new Date();
    const monthName = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    const msg = `🔔 *CodeThrive Infotech - Month-End Audit Notification*\n\nHello Kirubakaran (MD),\nToday is the month-end date (${monthName} ${year}).\n\nAll employee master database records (Full Profiles, Monthly Attendance Logs, Leaves, Completed Tasks & Payroll Computation) are consolidated into Monthly Employee Full Pdf.\n\nPlease review and download the monthly dossiers from the Admin Portal.\n\n🌐 Portal URL: https://codethriveinfotech.in/admin\n📅 Timestamp: ${today.toLocaleString('en-IN')}`;
    
    try {
      localStorage.setItem(`cti_wa_month_end_alert_${today.toISOString().slice(0, 10)}`, 'sent');
      localStorage.setItem(getMonthNotifKey(), 'true');
      setHasUnreadNotif(false);
    } catch (e) {
      console.warn(e);
    }

    const waUrl = `https://wa.me/917812864905?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
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
            isAdmin={true} 
            placeholder="Search Admin Portal (Employees, Reports, Tasks)..." 
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
        
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
          {/* Registered Employees Onboarding Hub Option */}
          <div ref={regRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowRegDropdown(!showRegDropdown)}
              title="Registered Employees Directory"
              style={{ 
                background: 'rgba(99, 102, 241, 0.15)', 
                border: '1px solid rgba(99, 102, 241, 0.4)', 
                color: 'var(--primary-light)', 
                cursor: 'pointer', 
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
            >
              <UserCheck size={18} color="var(--primary-light)" />
              <span className="reg-btn-text">Registrations</span>
              <span style={{ 
                background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700, 
                padding: '1px 6px', borderRadius: '10px' 
              }}>
                {registeredStaff.length}
              </span>
            </button>

            {/* Quick Registration Popover Dropdown */}
            {showRegDropdown && (
              <div 
                className="topbar-reg-popover"
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '320px',
                  maxWidth: 'calc(100vw - 24px)',
                  background: '#0f172a',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '14px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--primary-light)' }}>Registered Employees</span>
                  <button onClick={() => navigate('/admin/employees')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>
                    View All &rarr;
                  </button>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '0.35rem' }}>
                  {registeredStaff.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      No registered employees found.
                    </div>
                  ) : (
                    registeredStaff.map(staff => (
                      <div 
                        key={staff._id}
                        onClick={() => handleSelectEmployee(staff._id)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.2s',
                          marginBottom: '2px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>{staff.name}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{staff.dept} &bull; {staff.id}</span>
                          </div>
                        </div>
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </div>
                    ))
                  )}
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

          {/* 🔔 Executive Notification Center (Placed AFTER Settings as requested) */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button 
              onClick={handleToggleNotif}
              title="Notifications & Month-End Audit Alerts"
              style={{ 
                background: showNotifDropdown ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)', 
                border: showNotifDropdown ? '1.5px solid #34d399' : '1px solid var(--border-color)', 
                color: showNotifDropdown ? '#34d399' : 'var(--text-main)', 
                cursor: 'pointer', 
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.2s ease',
                boxShadow: showNotifDropdown ? '0 0 15px rgba(52, 211, 153, 0.35)' : 'none'
              }}
              onMouseOver={(e) => {
                if (!showNotifDropdown) e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseOut={(e) => {
                if (!showNotifDropdown) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              {hasUnreadNotif ? (
                <BellRing size={20} color="#34d399" style={{ animation: 'phoneRingVibrate 0.6s infinite alternate ease-in-out' }} />
              ) : (
                <Bell size={20} />
              )}
              
              {hasUnreadNotif && (
                <span style={{ 
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #0f172a',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifDropdown && (
              <div 
                className="topbar-notif-popover"
                style={{
                  position: 'absolute',
                  top: '125%',
                  right: 0,
                  width: '390px',
                  maxWidth: 'calc(100vw - 24px)',
                  background: 'linear-gradient(150deg, #0e1726 0%, #0a0f1d 100%)',
                  border: '1.5px solid rgba(52, 211, 153, 0.45)',
                  borderRadius: '18px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(52, 211, 153, 0.2)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.25s ease-out'
                }}
              >
                {/* Popover Header */}
                <div style={{
                  padding: '1rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={17} color="#34d399" />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                      Notification Center
                    </span>
                    {unreadCount > 0 && (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        fontWeight: 700
                      }}>
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 6px',
                        borderRadius: '6px'
                      }}
                      title="Mark all as read"
                    >
                      <CheckCheck size={13} />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div style={{ padding: '0.9rem' }}>
                  {/* Month End Badge */}
                  {isMonthEndToday() && (
                    <div style={{
                      background: 'rgba(52, 211, 153, 0.12)',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} color="#34d399" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>
                          Today is Month-End Date!
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleDownloadMonthlyMasterDossier()}
                          disabled={isGeneratingPdf}
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.6rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Download size={13} />
                          <span>{isGeneratingPdf ? 'PDF...' : 'Master PDF'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSendMonthEndWhatsAppAlert}
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.6rem',
                            borderRadius: '8px',
                            background: 'rgba(37, 211, 102, 0.15)',
                            border: '1px solid rgba(37, 211, 102, 0.45)',
                            color: '#25d366',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer'
                          }}
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp MD</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Employee Live Notifications List */}
                  {notifications && notifications.length > 0 ? (
                    <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
                      {notifications.map((notif) => (
                        <div
                          key={notif._id || notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          style={{
                            padding: '0.75rem 0.85rem',
                            borderRadius: '12px',
                            background: notif.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(56, 189, 248, 0.09)',
                            border: notif.isRead ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(56, 189, 248, 0.35)',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start',
                            transition: 'all 0.2s ease',
                            marginBottom: '0.5rem',
                            position: 'relative'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = notif.isRead ? 'rgba(255, 255, 255, 0.06)' : 'rgba(56, 189, 248, 0.16)'}
                          onMouseOut={e => e.currentTarget.style.background = notif.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(56, 189, 248, 0.09)'}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            {getNotifIcon(notif.notificationType)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{
                                fontSize: '0.82rem',
                                fontWeight: notif.isRead ? 600 : 800,
                                color: notif.isRead ? '#cbd5e1' : '#ffffff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {notif.title}
                              </span>
                              <span style={{ fontSize: '0.67rem', color: '#94a3b8', flexShrink: 0, marginLeft: '6px' }}>
                                {formatTimeAgo(notif.createdAt)}
                              </span>
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: '0.74rem',
                              color: notif.isRead ? '#94a3b8' : '#e2e8f0',
                              lineHeight: 1.35,
                              wordBreak: 'break-word'
                            }}>
                              {notif.description}
                            </p>
                            {notif.actionLink && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
                                <span>Open module</span>
                                <ArrowRight size={11} />
                              </div>
                            )}
                          </div>
                          {!notif.isRead && (
                            <span style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: '#38bdf8',
                              flexShrink: 0,
                              marginTop: '6px',
                              boxShadow: '0 0 6px rgba(56, 189, 248, 0.9)'
                            }}></span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    !isMonthEndToday() && (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                        <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem auto', display: 'block', opacity: 0.8 }} />
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}>All Caught Up!</div>
                        <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>No pending employee notifications.</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>

          <div className="profile-widget" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/admin/profile')}>
            <div className="profile-avatar" style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1rem', color: '#fff',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
            }}>
              CTI
            </div>
            <div className="profile-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="profile-name" style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                Codethrive Infotech
              </span>
              <span className="profile-role" style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                {user?.role === 'superadmin' ? 'Superadmin' : (user?.role || 'Admin')}
              </span>
            </div>
            <ChevronDown className="topbar-profile-chevron" size={16} color="var(--text-muted)" style={{ marginLeft: '0.5rem' }} />
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isAdmin={true}
      />
    </>
  );
};

export default AdminTopbar;
