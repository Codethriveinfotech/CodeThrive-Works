import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Users, CheckSquare, 
  FileText, Banknote, FolderOpen, UserCircle, Building2,
  CalendarOff, LogOut, ChevronLeft, ChevronRight, ClipboardList, ArrowLeft, User
} from 'lucide-react';
import './Sidebar.css';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeEmployeeInfo, setActiveEmployeeInfo] = useState(null);

  // Check if current view is an Employee Detail page (/admin/employees/:id)
  const isEmployeeDetail = location.pathname.startsWith('/admin/employees/') && location.pathname !== '/admin/employees';
  const empIdMatch = isEmployeeDetail ? location.pathname.replace('/admin/employees/', '').split('/')[0] : null;

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'profile';

  useEffect(() => {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    return () => document.body.classList.remove('sidebar-collapsed');
  }, [collapsed]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (document.body.classList.contains('mobile-sidebar-open')) {
        if (!e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-toggle-btn')) {
          document.body.classList.remove('mobile-sidebar-open');
        }
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Update active employee banner from sessionStorage if viewing an employee
  useEffect(() => {
    if (isEmployeeDetail) {
      try {
        const cached = sessionStorage.getItem('cti_current_viewed_emp');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.id === empIdMatch || parsed._id === empIdMatch)) {
            setActiveEmployeeInfo(parsed);
          }
        }
      } catch (err) {}
    } else {
      setActiveEmployeeInfo(null);
    }
  }, [isEmployeeDetail, empIdMatch]);

  const handleNavClick = () => {
    document.body.classList.remove('mobile-sidebar-open');
  };

  // Standard Admin Links - Dashboard completely removed, Employees is #1
  const adminLinks = [
    { name: 'Employees', path: '/admin/employees', icon: <Users size={20} /> },
    { name: 'Attendance', path: '/admin/attendance', icon: <ClipboardList size={20} /> },
    { name: 'Tasks', path: '/admin/tasks', icon: <CheckSquare size={20} /> },
    { name: 'Daily Reports', path: '/admin/reports', icon: <FileText size={20} /> },
    { name: 'Leave', path: '/admin/leave', icon: <CalendarOff size={20} /> },
    { name: 'Payroll', path: '/admin/payroll', icon: <Banknote size={20} /> },
    { name: 'Documents', path: '/admin/documents', icon: <FolderOpen size={20} /> },
    { name: 'Company Profile', path: '/admin/profile', icon: <Building2 size={20} /> }
  ];

  // Specific Sub-pages for the currently opened employee (standard size 20 icons)
  const employeeSubPages = [
    { id: 'profile', name: 'Profile & HR', icon: <UserCircle size={20} /> },
    { id: 'tasks', name: 'Tasks', icon: <CheckSquare size={20} /> },
    { id: 'reports', name: 'Daily Reports', icon: <FileText size={20} /> },
    { id: 'leaves', name: 'Leave Applications', icon: <CalendarOff size={20} /> },
    { id: 'attendance', name: 'Attendance Audit', icon: <ClipboardList size={20} /> },
    { id: 'documents', name: 'Documents', icon: <FolderOpen size={20} /> },
    { id: 'management', name: 'Payroll & Access', icon: <Banknote size={20} /> }
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed ? (
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/logo.png" alt="CodeThrive Infotech Logo" className="sidebar-logo-img" style={{ width: '50px', height: '50px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }} />
            <span className="logo-text" style={{ fontSize: '1.1rem', lineHeight: '1.2' }}>CodeThrive<br/><span style={{ opacity: 0.8, fontSize: '0.75rem', letterSpacing: '1px' }}>Infotech</span></span>
          </div>
        ) : (
          <div className="logo-container collapsed-logo" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <img src="/logo.png" alt="Logo" className="sidebar-logo-img small" style={{ width: '46px', height: '46px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }} />
          </div>
        )}
        <button 
          className="collapse-btn" 
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* If inside an Employee Page: General Admin menu closes, and only that employee's pages appear */}
        {isEmployeeDetail ? (
          <div className="nav-section">
            <button
              type="button"
              onClick={() => {
                handleNavClick();
                navigate('/admin/employees');
              }}
              className="nav-item"
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                fontWeight: 600,
                marginBottom: '0.75rem',
                cursor: 'pointer',
                position: 'relative'
              }}
              title={collapsed ? "Back to Employees" : ""}
            >
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ArrowLeft size={18} />
                {!collapsed && <span>Back to Employees</span>}
              </span>
            </button>

            {!collapsed && activeEmployeeInfo && (
              <div style={{
                margin: '0 0.75rem 0.75rem 0.75rem',
                padding: '0.6rem 0.85rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Active Employee
                </div>
                <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeEmployeeInfo.fullName}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#818cf8', fontWeight: 600 }}>
                  {activeEmployeeInfo.employeeId}
                </div>
              </div>
            )}

            {!collapsed && <span className="nav-section-title">EMPLOYEE PAGES</span>}

            {employeeSubPages.map((page) => {
              const isActive = currentTab === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    handleNavClick();
                    navigate(`/admin/employees/${empIdMatch}?tab=${page.id}`);
                  }}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? page.name : ''}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    font: 'inherit'
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="admin-sidebar-active"
                      className="sidebar-active-bg"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, transparent 100%)',
                        borderLeft: '4px solid var(--primary)',
                        zIndex: 0,
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {page.icon}
                    {!collapsed && <span>{page.name}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* General Admin Portal Navigation (When not viewing an individual employee) */
          <div className="nav-section">
            {!collapsed && <span className="nav-section-title">ADMIN PORTAL</span>}
            {adminLinks.map((link) => (
              <NavLink 
                key={link.name} 
                to={link.path} 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? link.name : ''}
                onClick={handleNavClick}
                style={{ position: 'relative' }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="admin-sidebar-active"
                        className="sidebar-active-bg"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
                          borderLeft: '4px solid var(--primary)',
                          zIndex: 0,
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {link.icon}
                      {!collapsed && <span>{link.name}</span>}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout} title={collapsed ? "Logout" : ""}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
