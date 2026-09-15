import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, CheckSquare, 
  FileText, Banknote, FolderOpen, UserCircle, Building2,
  CalendarOff, LogOut, ChevronLeft, ChevronRight 
} from 'lucide-react';
import './Sidebar.css';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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

  const handleNavClick = () => {
    document.body.classList.remove('mobile-sidebar-open');
  };

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Employees', path: '/admin/employees', icon: <Users size={20} /> },
    { name: 'Tasks', path: '/admin/tasks', icon: <CheckSquare size={20} /> },
    { name: 'Daily Reports', path: '/admin/reports', icon: <FileText size={20} /> },
    { name: 'Leave', path: '/admin/leave', icon: <CalendarOff size={20} /> },
    { name: 'Payroll', path: '/admin/payroll', icon: <Banknote size={20} /> },
    { name: 'Documents', path: '/admin/documents', icon: <FolderOpen size={20} /> },
    { name: 'Company Profile', path: '/admin/profile', icon: <Building2 size={20} /> }
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
