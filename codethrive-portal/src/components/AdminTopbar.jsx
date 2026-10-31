import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Settings, ChevronDown, UserCheck, ChevronRight, User, RefreshCw, Menu,
  Bell, BellRing, Download, MessageCircle, FileText, CheckCircle2, Calendar, ShieldCheck
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
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registeredStaff, setRegisteredStaff] = useState([]);

  const notifRef = useRef(null);
  const regRef = useRef(null);

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

  const handleSendMonthEndWhatsAppAlert = () => {
    const today = new Date();
    const monthName = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    const msg = `🔔 *CodeThrive Infotech - Month-End Audit Notification*\n\nHello Kirubakaran,\nToday is the month-end date (${monthName} ${year}).\n\nAll employee master database records (Full Profiles, Monthly Attendance Logs, Leaves, Completed Tasks & Payroll Computation) are consolidated into a single master audit dossier.\n\nPlease review and download the monthly dossiers from the Admin Portal.\n\n🌐 Portal URL: https://codethriveinfotech.in/admin\n📅 Timestamp: ${today.toLocaleString('en-IN')}`;
    
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
          {/* 🔔 Executive Notification Center with Month-End Audit Notice & PDF Download */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowRegDropdown(false);
                if (hasUnreadNotif) setHasUnreadNotif(false);
              }}
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
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
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
                  1
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifDropdown && (
              <div style={{
                position: 'absolute',
                top: '125%',
                right: '-50px',
                width: '390px',
                maxWidth: '92vw',
                background: 'linear-gradient(150deg, #0e1726 0%, #0a0f1d 100%)',
                border: '1.5px solid rgba(52, 211, 153, 0.45)',
                borderRadius: '18px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(52, 211, 153, 0.2)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeIn 0.25s ease-out'
              }}>
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
                  </div>
                  <span style={{
                    background: 'rgba(52, 211, 153, 0.2)',
                    color: '#34d399',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: '1px solid rgba(52, 211, 153, 0.4)'
                  }}>
                    Month-End Notice
                  </span>
                </div>

                <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.85rem' }}>
                  {/* NOTIFICATION ITEM 1: Month-End Employee Master Dossier PDF */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    borderRadius: '14px',
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.65rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#34d399',
                        flexShrink: 0
                      }}>
                        <FileText size={19} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            MONTH-END CONSOLIDATION AUDIT
                          </span>
                        </div>
                        <h5 style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                          Employee Monthly Master Audit Dossier
                        </h5>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.45' }}>
                          Consolidates all database records (Full Profile, KYC, Monthly Attendance, Leaves, Completed Tasks & Payroll) into a single master PDF.
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons Inside Notification */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.85rem' }}>
                      <button
                        type="button"
                        onClick={() => handleDownloadMonthlyMasterDossier()}
                        disabled={isGeneratingPdf}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.9rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          cursor: isGeneratingPdf ? 'wait' : 'pointer',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Download size={15} />
                        <span>{isGeneratingPdf ? 'Generating Official Dossier PDF...' : 'Download Monthly Master Dossier (PDF)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSendMonthEndWhatsAppAlert}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.9rem',
                          borderRadius: '10px',
                          background: 'rgba(37, 211, 102, 0.12)',
                          border: '1px solid rgba(37, 211, 102, 0.4)',
                          color: '#25d366',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <MessageCircle size={15} />
                        <span>Send WhatsApp Alert to MD (7812864905)</span>
                      </button>
                    </div>
                  </div>

                  {/* NOTIFICATION ITEM 2: Employee Registrations Quick Access */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '0.85rem 1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>
                        Registered Staff Records ({registeredStaff.length})
                      </span>
                      <button 
                        onClick={() => {
                          setShowNotifDropdown(false);
                          navigate('/admin/employees');
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        View Directory &rarr;
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {registeredStaff.slice(0, 3).map(staff => (
                        <div 
                          key={staff._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                              {staff.name.charAt(0)}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{staff.name}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadMonthlyMasterDossier(staff)}
                            title={`Download ${staff.name}'s PDF Dossier`}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(52, 211, 153, 0.15)',
                              border: '1px solid rgba(52, 211, 153, 0.35)',
                              color: '#34d399',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Download size={11} /> PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Registered Employees Onboarding Hub Option next to Settings */}
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
              <div style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '320px',
                background: '#0f172a',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '14px',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out'
              }}>
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
