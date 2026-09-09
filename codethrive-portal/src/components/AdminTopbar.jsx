import React, { useState } from 'react';
import { Search, Settings, ChevronDown, UserCheck, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';

const DEMO_ONBOARDING_STAFF = [
  { _id: 'emp_001', name: 'Mahadevan', id: 'CTI-EMP-001', role: 'Senior Developer', dept: 'Engineering' },
  { _id: 'emp_002', name: 'Priya Sharma', id: 'CTI-EMP-002', role: 'Product Designer', dept: 'UI/UX Design' },
  { _id: 'emp_003', name: 'Rahul Verma', id: 'CTI-EMP-003', role: 'Engineering Lead', dept: 'Management' },
  { _id: 'emp_004', name: 'Ananya Roy', id: 'CTI-EMP-004', role: 'HR Manager', dept: 'HR' }
];

const AdminTopbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showRegDropdown, setShowRegDropdown] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSelectEmployee = (empId) => {
    setShowRegDropdown(false);
    navigate(`/admin/employees/${empId}`);
  };

  return (
    <>
      <header className="topbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="topbar-search" style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          padding: '0.5rem 1.25rem',
          width: '350px',
          transition: 'all var(--transition-fast)'
        }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.75rem' }} />
          <input 
            type="text" 
            placeholder="Search Admin Portal..." 
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              width: '100%',
              outline: 'none',
              fontSize: '0.95rem'
            }}
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
              <span>Registrations</span>
              <span style={{ 
                background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700, 
                padding: '1px 6px', borderRadius: '10px' 
              }}>
                4
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
                  {DEMO_ONBOARDING_STAFF.map(staff => (
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
                  ))}
                </div>
              </div>
            )}
          </div>

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
              background: 'linear-gradient(135deg, var(--danger), var(--warning))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)'
            }}>
              {getInitials(user?.name || user?.email || 'Admin')}
            </div>
            <div className="profile-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="profile-name" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                {user?.name || 'Administrator'}
              </span>
              <span className="profile-role" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role || 'Admin'}
              </span>
            </div>
            <ChevronDown size={16} color="var(--text-muted)" style={{ marginLeft: '0.5rem' }} />
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
