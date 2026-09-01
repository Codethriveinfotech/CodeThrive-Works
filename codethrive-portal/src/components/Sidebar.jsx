import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, CheckSquare, FileText, Banknote, 
  CalendarOff, UserCircle, LogOut, ChevronLeft, ChevronRight, FolderOpen 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: <LayoutDashboard size={26} /> },
    { name: 'My Tasks', path: '/employee/tasks', icon: <CheckSquare size={26} /> },
    { name: 'Today\'s Work', path: '/employee/reports', icon: <FileText size={26} /> },
    { name: 'Leave', path: '/employee/leave', icon: <CalendarOff size={26} /> },
    { name: 'Payslips', path: '/employee/payslips', icon: <Banknote size={26} /> },
    { name: 'Documents', path: '/employee/documents', icon: <FolderOpen size={26} /> },
    { name: 'My Profile', path: '/employee/profile', icon: <UserCircle size={26} /> },
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
            <img src="/logo.png" alt="CodeThrive Infotech Logo" className="sidebar-logo-img" style={{ width: '38px', height: '38px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }} />
            <span className="logo-text" style={{ fontSize: '1.15rem' }}>CodeThrive<br/><span style={{ fontSize: '0.8rem', opacity: 0.8, letterSpacing: '1px' }}>Infotech</span></span>
          </div>
        )}
        {collapsed && <img src="/logo.png" alt="Logo" className="sidebar-logo-img small" style={{ width: '38px', height: '38px', objectFit: 'contain', margin: '0 auto', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }} />}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <span className="nav-section-title">EMPLOYEE PORTAL</span>}
          {navLinks.map((link) => (
            <NavLink key={link.name} to={link.path} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title={collapsed ? link.name : ''}>
              {link.icon}
              {!collapsed && <span>{link.name}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout} title={collapsed ? "Logout" : ""}>
          <LogOut size={26} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
