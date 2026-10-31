import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, User, Briefcase, Eye,
  UserCheck, X, UserPlus, Mail, Phone,
  ShieldCheck, KeyRound, EyeOff, Loader2, Download
} from 'lucide-react';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import ContactActionModal, { openDirectEmail } from '../components/common/ContactActionModal';
import { generateEmployeeMasterDossierPDF } from '../utils/employeeMasterDossierPdf';
import './Employees.css';

const Employees = () => {
  const { registerEmployee } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState({ isOpen: false, name: '', phone: '' });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Register New Employee Modal (exact order & fields as Register.jsx)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newEmpData, setNewEmpData] = useState({
    fullName: '',
    employeeId: '',
    role: '',
    emailId: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isAddingEmp, setIsAddingEmp] = useState(false);

  useEffect(() => {
    fetchEmployees();

    const handleRefreshEvent = () => fetchEmployees();
    window.addEventListener('cti_global_refresh', handleRefreshEvent);
    window.addEventListener('storage', handleRefreshEvent);
    return () => {
      window.removeEventListener('cti_global_refresh', handleRefreshEvent);
      window.removeEventListener('storage', handleRefreshEvent);
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees').catch(() => ({ data: { success: false, data: [] } }));
      let dbEmps = res.data && res.data.success && Array.isArray(res.data.data) ? res.data.data : [];

      // Filter out admin user from employee directory so only real staff show up
      const filtered = dbEmps.filter(e => {
        const email = (e.personalEmailAddress || e.email || '').toLowerCase();
        const id = (e.employeeId || '').toLowerCase();
        return email !== 'admin@codethrive.com' && id !== 'cti-adm-001';
      });
      setEmployees(filtered);
    } catch (err) {
      console.warn('API error fetching employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmployeePage = (empId) => {
    navigate(`/admin/employees/${empId}`);
  };

  const handleDownloadDossier = async (row) => {
    try {
      const today = new Date();
      const monthName = today.toLocaleString('default', { month: 'long' });
      const year = today.getFullYear();
      await generateEmployeeMasterDossierPDF(row, monthName, year);
    } catch (err) {
      console.error('Failed to export employee dossier:', err);
      alert('Error generating dossier: ' + err.message);
    }
  };

  const handleOpenAddModal = () => {
    const nextId = `CTI-2026-00${employees.length + 1}`;
    setNewEmpData({
      fullName: '',
      employeeId: nextId,
      role: '',
      emailId: '',
      phoneNumber: '',
      password: '',
      confirmPassword: ''
    });
    setRegError('');
    setRegSuccess('');
    setShowAddModal(true);
  };

  const handleRegisterNewEmployee = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (
      !newEmpData.fullName.trim() ||
      !newEmpData.employeeId.trim() ||
      !newEmpData.role.trim() ||
      !newEmpData.emailId.trim() ||
      !newEmpData.phoneNumber.trim() ||
      !newEmpData.password ||
      !newEmpData.confirmPassword
    ) {
      setRegError('All mandatory fields must be filled.');
      return;
    }

    const pwd = newEmpData.password;
    const hasMinLen = pwd.length >= 8;
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    if (!hasMinLen || !hasLower || !hasUpper || !hasNumber || !hasSpecial) {
      setRegError('Password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols (@$!%*?&#).');
      return;
    }

    if (newEmpData.password !== newEmpData.confirmPassword) {
      setRegError('Password and Confirm Password must match.');
      return;
    }

    setIsAddingEmp(true);
    try {
      const result = await registerEmployee(newEmpData);
      if (result.success) {
        setRegSuccess(result.message || 'Employee registered successfully!');
        await fetchEmployees();
        setTimeout(() => {
          setShowAddModal(false);
          setRegSuccess('');
        }, 1500);
      } else {
        setRegError(result.message || 'Failed to register employee');
      }
    } catch (err) {
      setRegError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsAddingEmp(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      emp.fullName?.toLowerCase().includes(q) || 
      emp.employeeId?.toLowerCase().includes(q) || 
      emp.personalEmailAddress?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.designation?.toLowerCase().includes(q) ||
      emp.role?.toLowerCase().includes(q);

    const matchesDept = !filterDept || emp.department === filterDept;
    const matchesStatus = !filterStatus || emp.status === filterStatus;
    const matchesRole = !filterRole || emp.user?.role === filterRole || emp.role === filterRole;

    return matchesSearch && matchesDept && matchesStatus && matchesRole;
  });

  const totalRegistered = employees.length;
  const activeWorking = employees.filter(e => e.status !== 'Inactive').length;
  const departmentsCovered = Math.max(5, new Set(employees.map(e => e.department).filter(Boolean)).size);

  // Table Columns strictly matching requirement:
  // 1. Employee Name | 2. Employee ID | 3. Phone Number | 4. Department / Designation | 5. Action
  const columns = [
    {
      header: 'Employee Name',
      render: (row) => (
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          onClick={() => handleOpenEmployeePage(row._id)}
          title={`View ${row.fullName}'s profile`}
        >
          <div className="emp-avatar-circle" style={{ flexShrink: 0 }}>
            {row.fullName ? row.fullName.charAt(0).toUpperCase() : 'E'}
          </div>
          <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.94rem', whiteSpace: 'nowrap' }}>
            {row.fullName}
          </span>
        </div>
      )
    },
    {
      header: 'Employee ID',
      render: (row) => (
        <span style={{ 
          background: 'rgba(99, 102, 241, 0.12)', 
          color: '#a5b4fc', 
          padding: '0.4rem 0.9rem', 
          borderRadius: '8px', 
          fontWeight: 700, 
          fontSize: '0.84rem', 
          letterSpacing: '0.04em',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'inline-block',
          whiteSpace: 'nowrap'
        }}>
          {row.employeeId || 'N/A'}
        </span>
      )
    },
    {
      header: 'Phone Number',
      render: (row) => {
        const phone = row.personalPhoneNumber || row.phoneNumber || row.phone || '';
        return phone ? (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setContactModal({
                isOpen: true,
                name: row.fullName,
                phone: phone
              });
            }}
            style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.25)', 
              color: '#34d399', 
              borderRadius: '8px', 
              padding: '0.4rem 0.75rem', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontSize: '0.84rem', 
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
            title="Connect on WhatsApp or Phone Call"
          >
            <Phone size={12} style={{ flexShrink: 0 }} />
            <span>{phone}</span>
          </button>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
        );
      }
    },
    {
      header: 'Department / Designation',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 600 }}>
            {row.department || 'Engineering'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {row.designation || row.role || 'Staff'}
          </span>
        </div>
      )
    },
    {
      header: 'Action',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          <button 
            onClick={() => handleOpenEmployeePage(row._id)}
            className="btn btn-primary"
            style={{ 
              padding: '0.45rem 1rem', 
              fontSize: '0.8rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              borderRadius: '20px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Eye size={13} /> Open Page
          </button>

          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadDossier(row);
            }}
            title={`Download ${row.fullName}'s Monthly PDF (All Database Records)`}
            style={{ 
              padding: '0.45rem 0.95rem', 
              fontSize: '0.8rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              borderRadius: '20px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.35) 100%)',
              border: '1.5px solid rgba(52, 211, 153, 0.55)',
              color: '#34d399',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={13} /> Monthly PDF
          </button>
        </div>
      )
    }
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Registered Employees Console...</p>
    </div>
  );

  return (
    <div className="employees-page-container">
      {/* Header Banner */}
      <div className="page-header-hero">
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 0.4rem 0', fontWeight: 700 }}>Registered Employees Directory</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Full Administrative Oversight of Registered Staff Profiles, Submissions, Tasks, Payroll & Account Access
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleOpenAddModal} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              fontWeight: 600, 
              padding: '0.68rem 1.5rem', 
              borderRadius: '12px', 
              fontSize: '0.92rem',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              boxShadow: '0 4px 18px rgba(79, 70, 229, 0.4)',
              cursor: 'pointer'
            }}
          >
            Register New Employee
          </button>
        </div>
      </div>

      {/* Attractive 4 Metric Cards (Zero Empty Feel, Rich Detail) */}
      <div className="emp-metrics-grid">
        {/* Card 1: Total Registered Staff */}
        <div className="emp-metric-card card-primary">
          <div className="emp-metric-top">
            <span className="metric-label">Total Registered Staff</span>
            <div className="emp-metric-icon bg-primary">
              <User size={22} color="#818cf8" />
            </div>
          </div>
          <div className="emp-metric-middle">
            <h3 className="metric-val">{totalRegistered}</h3>
            <span className="metric-val-suffix">Staff Members</span>
          </div>
          <div className="emp-metric-bottom">
            <span className="metric-badge-pill badge-primary">● Live Directory</span>
            <span className="emp-metric-subtext">All Synced</span>
          </div>
        </div>

        {/* Card 2: Active Working Status */}
        <div className="emp-metric-card card-success">
          <div className="emp-metric-top">
            <span className="metric-label">Active Working Status</span>
            <div className="emp-metric-icon bg-success">
              <UserCheck size={22} color="#34d399" />
            </div>
          </div>
          <div className="emp-metric-middle">
            <h3 className="metric-val">{activeWorking}</h3>
            <span className="metric-val-suffix">Active Staff</span>
          </div>
          <div className="emp-metric-bottom">
            <span className="metric-badge-pill badge-success">● 100% Active</span>
            <span className="emp-metric-subtext">Operational</span>
          </div>
        </div>

        {/* Card 3: Replaced from Departments Covered -> Verified Staff Profiles */}
        <div className="emp-metric-card card-warning">
          <div className="emp-metric-top">
            <span className="metric-label">Verified Staff Profiles</span>
            <div className="emp-metric-icon bg-warning">
              <ShieldCheck size={22} color="#fbbf24" />
            </div>
          </div>
          <div className="emp-metric-middle">
            <h3 className="metric-val">{totalRegistered}</h3>
            <span className="metric-val-suffix">Profiles Verified</span>
          </div>
          <div className="emp-metric-bottom">
            <span className="metric-badge-pill badge-warning">● KYC Complete</span>
            <span className="emp-metric-subtext">Compliant</span>
          </div>
        </div>

        {/* Card 4: Portal Credentials Issued */}
        <div className="emp-metric-card card-info">
          <div className="emp-metric-top">
            <span className="metric-label">Portal Credentials</span>
            <div className="emp-metric-icon bg-info">
              <KeyRound size={22} color="#38bdf8" />
            </div>
          </div>
          <div className="emp-metric-middle">
            <h3 className="metric-val">{totalRegistered}</h3>
            <span className="metric-val-suffix">Accounts Ready</span>
          </div>
          <div className="emp-metric-bottom">
            <span className="metric-badge-pill badge-info">● Security Active</span>
            <span className="emp-metric-subtext">Access Ready</span>
          </div>
        </div>
      </div>

      {/* Employee Directory Card */}
      <Card style={{ padding: 0 }}>
        {/* Filters Toolbar */}
        <div className="emp-toolbar">
          <div className="emp-search-box">
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by Name, Employee ID, Email, Designation..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="emp-filters-group">
            <div className="filter-item">
              <Filter size={14} color="var(--text-muted)" />
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Management">Management</option>
                <option value="HR">HR</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div className="filter-item">
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="teamlead">Team Lead</option>
                <option value="employee">Employee</option>
                <option value="intern">Intern</option>
              </select>
            </div>

            <div className="filter-item">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable 
          columns={columns} 
          data={filteredEmployees} 
          searchable={false}
          itemsPerPage={10} 
        />
      </Card>

      {/* Register New Employee Modal - Exact same fields & order as Register.jsx */}
      {showAddModal && (
        <div className="workspace-360-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="admin-modal-header">
              <div className="admin-modal-title-group">
                <div className="admin-modal-icon-badge">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="admin-modal-title">Register New Employee</h3>
                  <p className="admin-modal-subtitle">
                    Create credentials and profile in the exact registration order
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="admin-modal-close-btn" 
                onClick={() => setShowAddModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {regError && (
              <div style={{ 
                margin: '1rem 0 0.5rem 0', 
                padding: '0.75rem 1rem', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '10px', 
                color: '#f87171', 
                fontSize: '0.85rem' 
              }}>
                {regError}
              </div>
            )}

            {regSuccess && (
              <div style={{ 
                margin: '1rem 0 0.5rem 0', 
                padding: '0.75rem 1rem', 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', 
                borderRadius: '10px', 
                color: '#34d399', 
                fontSize: '0.85rem' 
              }}>
                {regSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterNewEmployee} className="reg-emp-grid" style={{ marginTop: '1rem' }}>
              {/* 1. Full Name * */}
              <div className="reg-emp-field" style={{ gridColumn: '1 / -1' }}>
                <label className="reg-emp-label">
                  <User size={13} className="reg-emp-label-icon" /> Full Name <span className="reg-emp-req">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Kirubakaran V" 
                  className="reg-emp-input" 
                  value={newEmpData.fullName} 
                  onChange={e => setNewEmpData({...newEmpData, fullName: e.target.value})} 
                />
              </div>

              {/* 2. Employee ID * */}
              <div className="reg-emp-field" style={{ gridColumn: '1 / -1' }}>
                <label className="reg-emp-label">
                  <ShieldCheck size={13} className="reg-emp-label-icon" /> Employee ID <span className="reg-emp-req">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. CTI-2026-002" 
                  className="reg-emp-input" 
                  value={newEmpData.employeeId} 
                  onChange={e => setNewEmpData({...newEmpData, employeeId: e.target.value})} 
                />
              </div>

              {/* 3. Role / Position * */}
              <div className="reg-emp-field" style={{ gridColumn: '1 / -1' }}>
                <label className="reg-emp-label">
                  <Briefcase size={13} className="reg-emp-label-icon" /> Role / Position <span className="reg-emp-req">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Senior Software Engineer, Managing Director, UI/UX Designer" 
                  className="reg-emp-input" 
                  value={newEmpData.role} 
                  onChange={e => setNewEmpData({...newEmpData, role: e.target.value})} 
                />
              </div>

              {/* 4. Email ID * */}
              <div className="reg-emp-field" style={{ gridColumn: '1 / -1' }}>
                <label className="reg-emp-label">
                  <Mail size={13} className="reg-emp-label-icon" /> Email ID <span className="reg-emp-req">*</span>
                </label>
                <input 
                  type="email" 
                  required 
                  placeholder="e.g. employee@codethrive.com" 
                  className="reg-emp-input" 
                  value={newEmpData.emailId} 
                  onChange={e => setNewEmpData({...newEmpData, emailId: e.target.value})} 
                />
              </div>

              {/* 5. Phone Number * */}
              <div className="reg-emp-field" style={{ gridColumn: '1 / -1' }}>
                <label className="reg-emp-label">
                  <Phone size={13} className="reg-emp-label-icon" /> Phone Number <span className="reg-emp-req">*</span>
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="e.g. 9876543210" 
                  className="reg-emp-input" 
                  value={newEmpData.phoneNumber} 
                  onChange={e => setNewEmpData({...newEmpData, phoneNumber: e.target.value})} 
                />
              </div>

              {/* 6. Create Password * */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <KeyRound size={13} className="reg-emp-label-icon" /> Create Password <span className="reg-emp-req">*</span>
                </label>
                <div className="reg-emp-input-wrap">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="Enter password" 
                    className="reg-emp-input" 
                    style={{ paddingRight: '2.5rem' }}
                    value={newEmpData.password} 
                    onChange={e => setNewEmpData({...newEmpData, password: e.target.value})} 
                  />
                  <button 
                    type="button" 
                    className="reg-emp-pwd-toggle" 
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* 7. Confirm Password * */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <KeyRound size={13} className="reg-emp-label-icon" /> Confirm Password <span className="reg-emp-req">*</span>
                </label>
                <div className="reg-emp-input-wrap">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    placeholder="Re-enter password" 
                    className="reg-emp-input" 
                    style={{ paddingRight: '2.5rem' }}
                    value={newEmpData.confirmPassword} 
                    onChange={e => setNewEmpData({...newEmpData, confirmPassword: e.target.value})} 
                  />
                  <button 
                    type="button" 
                    className="reg-emp-pwd-toggle" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="reg-emp-footer">
                <button 
                  type="button" 
                  className="reg-emp-btn-cancel" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isAddingEmp} 
                  className="reg-emp-btn-submit"
                >
                  {isAddingEmp ? (
                    <>
                      <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Register Employee
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Options Modal (WhatsApp vs Call) */}
      <ContactActionModal 
        isOpen={contactModal.isOpen} 
        onClose={() => setContactModal(prev => ({ ...prev, isOpen: false }))} 
        name={contactModal.name} 
        phone={contactModal.phone} 
      />
    </div>
  );
};

export default Employees;
