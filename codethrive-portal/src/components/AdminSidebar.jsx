import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, CheckSquare, 
  FileText, Banknote, FolderOpen, UserCircle, 
  Settings, LogOut, ChevronLeft, ChevronRight 
} from 'lucide-react';
import './Sidebar.css';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Employees', path: '/admin/employees', icon: <Users size={20} /> },
    { name: 'Tasks', path: '/admin/tasks', icon: <CheckSquare size={20} /> },
    { name: 'Daily Reports', path: '/admin/reports', icon: <FileText size={20} /> },
    { name: 'Payroll', path: '/admin/payroll', icon: <Banknote size={20} /> },
    { name: 'Documents', path: '/admin/documents', icon: <FolderOpen size={20} /> },
    { name: 'Profile', path: '/admin/profile', icon: <UserCircle size={20} /> }
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
            <div className="logo-icon">C</div>
            <span className="logo-text">CodeThrive</span>
          </div>
        )}
        {collapsed && <div className="logo-icon small">C</div>}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <span className="nav-section-title">ADMIN PORTAL</span>}
          {adminLinks.map((link) => (
            <NavLink key={link.name} to={link.path} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title={collapsed ? link.name : ''}>
              {link.icon}
              {!collapsed && <span>{link.name}</span>}
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
