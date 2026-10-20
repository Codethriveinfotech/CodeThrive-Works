import React, { useState, useEffect } from 'react';
import { Search, Settings, ChevronDown, UserCheck, ChevronRight, User, RefreshCw, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';
import GlobalSearchBar from './GlobalSearchBar';
import api from '../utils/api';

const AdminTopbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showRegDropdown, setShowRegDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registeredStaff, setRegisteredStaff] = useState([]);

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

  const fetchRegisteredStaff = async () => {
    try {
      const res = await api.get('/employees').catch(() => ({ data: { success: false, data: [] } }));
      let dbStaff = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];

      const localUsers = JSON.parse(localStorage.getItem('cti_local_users') || '[]');
      const combined = [...dbStaff];

      localUsers.forEach(lu => {
        const luEmpId = (lu.employeeId || '').toLowerCase().trim();
        const luEmail = (lu.email || lu.personalEmailAddress || '').toLowerCase().trim();

        const exists = combined.some(e => {
          const eId = (e.employeeId || '').toLowerCase().trim();
          const eEmail = (e.personalEmailAddress || e.email || '').toLowerCase().trim();
          return (luEmpId && eId === luEmpId) || (luEmail && eEmail === luEmail);
        });

        if (!exists && luEmail !== 'admin@codethrive.com' && luEmpId !== 'cti-adm-001') {
          combined.unshift({
            _id: lu._id || 'local_' + Date.now(),
            fullName: lu.fullName || lu.name || 'New Employee',
            employeeId: lu.employeeId || 'CTI-EMP-NEW',
            designation: lu.role || lu.designation || 'Software Engineer',
            department: lu.department || 'Engineering',
            personalEmailAddress: lu.email || lu.personalEmailAddress,
            status: lu.status || 'Active',
            isNewRegistration: true
          });
        }
      });

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
          {/* Registered Employees Onboarding Hub Option next to Settings */}
          <div style={{ position: 'relative' }}>
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
