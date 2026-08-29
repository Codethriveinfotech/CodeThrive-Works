import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarCheck, CheckSquare, Briefcase, 
  Building2, Banknote, FileBarChart, CalendarDays, UsersRound, 
  FolderOpen, LifeBuoy, Bell, ShieldAlert, Settings, FileText, 
  LogOut, UserCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  
  // Super Admin / Admin / HR Sidebar Links
  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Employees', path: '/admin/employees', icon: <Users size={20} /> },
    { name: 'HRMS', path: '/hrms', icon: <Building2 size={20} /> },
    { name: 'Attendance', path: '/admin/attendance', icon: <CalendarCheck size={20} /> },
    { name: 'Tasks', path: '/admin/tasks', icon: <CheckSquare size={20} /> },
    { name: 'Projects', path: '/admin/projects', icon: <Briefcase size={20} /> },
    { name: 'Departments', path: '/admin/departments', icon: <Building2 size={20} /> },
    { name: 'Payroll', path: '/payroll', icon: <Banknote size={20} /> },
    { name: 'Reports', path: '/reports', icon: <FileBarChart size={20} /> },
    { name: 'Meetings', path: '/admin/meetings', icon: <CalendarDays size={20} /> },
    { name: 'Clients', path: '/admin/clients', icon: <UsersRound size={20} /> },
    { name: 'Documents', path: '/admin/documents', icon: <FolderOpen size={20} /> },
    { name: 'Support', path: '/admin/support', icon: <LifeBuoy size={20} /> },
    { name: 'Notifications', path: '/admin/notifications', icon: <Bell size={20} /> },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: <ShieldAlert size={20} /> },
    { name: 'Company Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  // Employee / Intern / Team Lead Sidebar Links
  const employeeLinks = [
    { name: "Today's Work", path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
    { name: 'Daily Reports', path: '/work/daily-report', icon: <FileText size={20} /> },
    { name: 'Payslips', path: '/payroll', icon: <Banknote size={20} /> },
    { name: 'Meetings', path: '/meetings', icon: <CalendarDays size={20} /> },
    { name: 'Leave', path: '/leave', icon: <CalendarCheck size={20} /> },
    { name: 'Documents', path: '/documents', icon: <FolderOpen size={20} /> },
    { name: 'Notifications', path: '/notifications', icon: <Bell size={20} /> },
    { name: 'Support', path: '/support', icon: <LifeBuoy size={20} /> },
    { name: 'Profile', path: '/profile', icon: <UserCircle size={20} /> },
  ];

  const links = (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'hr') 
    ? adminLinks 
    : employeeLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Logo" className="sidebar-logo-img" />
        <h3>CODETHRIVE INFOTECH</h3>
      </div>
      
      <div className="sidebar-nav-container">
        <ul className="sidebar-nav">
          {links.map((link, index) => (
            <li key={index} className="nav-item">
              <NavLink 
                to={link.path} 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            </li>
          ))}
          
          <li className="nav-item logout-item">
            <button onClick={logout} className="nav-link logout-btn">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
