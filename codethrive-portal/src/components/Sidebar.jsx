import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, CheckSquare, FileText, Banknote, 
  CalendarOff, UserCircle, LogOut, ChevronLeft, ChevronRight, FolderOpen 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    return () => document.body.classList.remove('sidebar-collapsed');
  }, [collapsed]);

  const navLinks = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Tasks', path: '/employee/tasks', icon: <CheckSquare size={20} /> },
    { name: 'Today\'s Work', path: '/employee/reports', icon: <FileText size={20} /> },
    { name: 'Leave', path: '/employee/leave', icon: <CalendarOff size={20} /> },
    { name: 'Payslips', path: '/employee/payslips', icon: <Banknote size={20} /> },
    { name: 'Documents', path: '/employee/documents', icon: <FolderOpen size={20} /> },
    { name: 'My Profile', path: '/employee/profile', icon: <UserCircle size={20} /> },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="logo-container">
            <img src="/logo.png" alt="CodeThrive Infotech Logo" className="sidebar-logo-img" style={{ width: '70px', height: '70px', objectFit: 'contain', marginLeft: '-8px', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }} />
            <span className="logo-text" style={{ fontSize: '1.15rem' }}>CodeThrive<br/><span style={{ opacity: 0.8, letterSpacing: '1px' }}>Infotech</span></span>
          </div>
        )}
        {collapsed && <img src="/logo.png" alt="Logo" className="sidebar-logo-img small" style={{ width: '54px', height: '54px', objectFit: 'contain', margin: '0 auto', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }} />}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <span className="nav-section-title">EMPLOYEE PORTAL</span>}
          {navLinks.map((link) => (
            <NavLink 
              key={link.name} 
              to={link.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? link.name : ''}
              style={{ position: 'relative' }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
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

export default Sidebar;
