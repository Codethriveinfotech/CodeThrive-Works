import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  Search, X, LayoutDashboard, CheckSquare, FileText, 
  CreditCard, Folder, User, Users, Calendar, Clock, 
  Briefcase, TrendingUp, Video, Settings, RefreshCw, ChevronRight
} from 'lucide-react';

const GlobalSearchBar = ({ isAdmin = false, placeholder = 'Search Employee Portal...', onOpenSettings }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const searchContainerRef = useRef(null);

  // Fetch employees list for live directory search
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoadingEmp(true);
      const res = await api.get('/employees').catch(() => ({ data: [] }));
      const data = res?.data?.data || res?.data || [];
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.warn('Failed to fetch employees for global search', err);
    } finally {
      setLoadingEmp(false);
    }
  };

  // Predefined System Pages & Navigation Routes
  const pageRoutes = isAdmin ? [
    { title: 'Admin Dashboard', category: 'Pages', route: '/admin/dashboard', icon: LayoutDashboard, keywords: 'home overview analytics main' },
    { title: 'Employee Directory', category: 'Pages', route: '/admin/employees', icon: Users, keywords: 'staff team list onboarding add users' },
    { title: 'Task Management', category: 'Pages', route: '/admin/tasks', icon: CheckSquare, keywords: 'tasks assign todo work projects' },
    { title: 'Daily Reports', category: 'Pages', route: '/admin/reports', icon: FileText, keywords: 'reports daily log work status' },
    { title: 'Leave Approvals', category: 'Pages', route: '/admin/leave', icon: Calendar, keywords: 'leave vacation holiday permission approve' },
    { title: 'Payroll & Salaries', category: 'Pages', route: '/admin/payroll', icon: CreditCard, keywords: 'salary payslip pay finance bank' },
    { title: 'Documents Hub', category: 'Pages', route: '/admin/documents', icon: Folder, keywords: 'documents files uploads certificates offer letter' },
    { title: 'My Profile', category: 'Pages', route: '/admin/profile', icon: User, keywords: 'profile account identity security password' },
  ] : [
    { title: 'Employee Dashboard', category: 'Pages', route: '/employee/dashboard', icon: LayoutDashboard, keywords: 'home overview main' },
    { title: 'My Tasks', category: 'Pages', route: '/employee/tasks', icon: CheckSquare, keywords: 'tasks assigned todo work pending completed' },
    { title: 'Daily Reports', category: 'Pages', route: '/employee/reports', icon: FileText, keywords: 'reports daily submit log work status' },
    { title: 'My Payslips & Payroll', category: 'Pages', route: '/employee/payslips', icon: CreditCard, keywords: 'payslip salary pay breakdown tax pf' },
    { title: 'My Documents', category: 'Pages', route: '/employee/documents', icon: Folder, keywords: 'documents files uploads identity aadhaar pan' },
    { title: 'My Profile', category: 'Pages', route: '/employee/profile', icon: User, keywords: 'profile account identity address photo edit' },
    { title: 'Team Directory', category: 'Pages', route: '/employee/team', icon: Users, keywords: 'team staff colleagues members department' },
    { title: 'Leave Management', category: 'Pages', route: '/employee/leave', icon: Calendar, keywords: 'leave apply vacation holiday sick leave' },
    { title: 'Attendance Record', category: 'Pages', route: '/employee/attendance', icon: Clock, keywords: 'attendance clock in checkin hours punch' },
    { title: 'Timesheet', category: 'Pages', route: '/employee/timesheet', icon: Clock, keywords: 'timesheet hours weekly time log' },
    { title: 'Projects', category: 'Pages', route: '/employee/projects', icon: Briefcase, keywords: 'projects assignments client work' },
    { title: 'Performance', category: 'Pages', route: '/employee/performance', icon: TrendingUp, keywords: 'performance appraisal rating review' },
    { title: 'Meetings & Calls', category: 'Pages', route: '/employee/meetings', icon: Video, keywords: 'meetings video call teams call' },
  ];

  // Quick System Actions
  const systemActions = [
    {
      title: 'Portal Settings',
      category: 'Actions',
      icon: Settings,
      action: () => {
        if (onOpenSettings) onOpenSettings();
      }
    },
    {
      title: 'Refresh Workspace Data',
      category: 'Actions',
      icon: RefreshCw,
      action: () => {
        window.dispatchEvent(new CustomEvent('cti_global_refresh'));
      }
    }
  ];

  // Filter matching pages
  const trimmed = query.trim().toLowerCase();
  const matchingPages = trimmed
    ? pageRoutes.filter(p => p.title.toLowerCase().includes(trimmed) || p.keywords.toLowerCase().includes(trimmed))
    : pageRoutes.slice(0, 5); // Show top 5 quick shortcuts when focused without query

  // Filter matching employees
  const matchingEmployees = trimmed
    ? employees.filter(emp => 
        (emp.fullName && emp.fullName.toLowerCase().includes(trimmed)) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(trimmed)) ||
        (emp.department && emp.department.toLowerCase().includes(trimmed)) ||
        (emp.designation && emp.designation.toLowerCase().includes(trimmed)) ||
        (emp.personalEmailAddress && emp.personalEmailAddress.toLowerCase().includes(trimmed))
      )
    : [];

  // Filter matching actions
  const matchingActions = trimmed
    ? systemActions.filter(a => a.title.toLowerCase().includes(trimmed))
    : systemActions;

  const handleSelectRoute = (route) => {
    setIsOpen(false);
    setQuery('');
    navigate(route);
  };

  const handleSelectEmployee = (emp) => {
    setIsOpen(false);
    setQuery('');
    if (isAdmin) {
      navigate(`/admin/employees/${emp._id}`);
    } else {
      navigate('/employee/team');
    }
  };

  const handleSelectAction = (act) => {
    setIsOpen(false);
    setQuery('');
    if (act.action) act.action();
  };

  const hasResults = matchingPages.length > 0 || matchingEmployees.length > 0 || matchingActions.length > 0;

  return (
    <div className="global-search-container" ref={searchContainerRef} style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
      {/* Search Input Box */}
      <div 
        className="topbar-search"
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '30px',
          padding: '0.45rem 1rem',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 15px rgba(59, 130, 246, 0.25)' : 'none',
          borderColor: isOpen ? '#3b82f6' : 'rgba(255, 255, 255, 0.12)'
        }}
      >
        <Search size={17} color={isOpen ? '#60a5fa' : 'var(--text-muted)'} style={{ marginRight: '0.65rem', flexShrink: 0 }} />
        
        <input 
          type="text" 
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main, #f8fafc)',
            width: '100%',
            outline: 'none',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        />

        {query && (
          <button 
            type="button" 
            onClick={() => { setQuery(''); setIsOpen(false); }}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Live Search Overlay Results Dropdown */}
      {isOpen && (
        <div 
          className="search-results-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            minWidth: '340px',
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.98) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            maxHeight: '420px',
            overflowY: 'auto'
          }}
        >
          {!trimmed && (
            <div style={{ padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.05em', background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              ⚡ QUICK SHORTCUTS & NAVIGATION
            </div>
          )}

          {!hasResults ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              🔍 No results found for "<span style={{ color: '#fff', fontWeight: 600 }}>{query}</span>"
            </div>
          ) : (
            <div style={{ padding: '0.4rem' }}>
              {/* Pages Section */}
              {matchingPages.length > 0 && (
                <div style={{ marginBottom: '0.4rem' }}>
                  {trimmed && (
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', padding: '0.4rem 0.75rem', letterSpacing: '0.05em' }}>
                      Pages & Features ({matchingPages.length})
                    </div>
                  )}
                  {matchingPages.map((page, idx) => {
                    const IconComp = page.icon;
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleSelectRoute(page.route)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          marginBottom: '2px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.18)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconComp size={17} />
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f8fafc', display: 'block' }}>
                              {page.title}
                            </span>
                            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                              {page.route}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={15} color="#94a3b8" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Employees Section */}
              {matchingEmployees.length > 0 && (
                <div style={{ marginBottom: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', padding: '0.4rem 0.75rem', letterSpacing: '0.05em' }}>
                    Employees & Team ({matchingEmployees.length})
                  </div>
                  {matchingEmployees.map((emp) => (
                    <div 
                      key={emp._id}
                      onClick={() => handleSelectEmployee(emp)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        marginBottom: '2px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.18)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {emp.fullName ? emp.fullName.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc', display: 'block' }}>
                            {emp.fullName}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                            {emp.designation || 'Staff'} &bull; {emp.employeeId || emp.department || 'Active'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={15} color="#94a3b8" />
                    </div>
                  ))}
                </div>
              )}

              {/* Actions Section */}
              {matchingActions.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', padding: '0.4rem 0.75rem', letterSpacing: '0.05em' }}>
                    Quick Actions
                  </div>
                  {matchingActions.map((act, idx) => {
                    const ActIcon = act.icon;
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleSelectAction(act)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          marginBottom: '2px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.18)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ActIcon size={17} />
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f8fafc', display: 'block' }}>
                              {act.title}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={15} color="#94a3b8" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
