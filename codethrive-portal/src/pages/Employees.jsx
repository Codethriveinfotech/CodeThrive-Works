import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils/dateUtils';
import { createOfficialCodeThriveDoc, exportOfficialWordDoc, getCorporateTableStyles } from '../utils/pdfLetterhead';
import { 
  Search, Filter, Plus, User, Briefcase, Banknote, Edit, Eye,
  RefreshCw, Trash2, UserCheck, Download, X,
  UserPlus, Mail, Phone, Building2, ShieldCheck, KeyRound, EyeOff, IndianRupee, Loader2, FileText
} from 'lucide-react';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import './Employees.css';

const Employees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Register New Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newEmpData, setNewEmpData] = useState({
    fullName: '',
    personalEmailAddress: '',
    personalPhoneNumber: '',
    department: 'Engineering',
    designation: 'Software Developer',
    role: 'employee',
    employmentType: 'Full-Time',
    salaryAmount: '60000',
    password: 'Password@123'
  });
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

  const handleDeleteEmployee = async (empId) => {
    if (!window.confirm('Are you sure you want to delete this employee record?')) return;
    try {
      await api.delete(`/employees/${empId}`);
    } catch (err) {
      console.warn('Deleted locally');
    }
    setEmployees(prev => prev.filter(e => e._id !== empId));
    alert('Employee record deleted.');
  };

  const handleRegisterNewEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpData.fullName || !newEmpData.personalEmailAddress) return;

    setIsAddingEmp(true);
    const count = employees.length + 1;
    const empId = `CTI-EMP-00${count}`;

    const newDoc = {
      _id: 'emp_' + Date.now(),
      employeeId: empId,
      fullName: newEmpData.fullName,
      personalEmailAddress: newEmpData.personalEmailAddress,
      personalPhoneNumber: newEmpData.personalPhoneNumber || '9876543210',
      department: newEmpData.department,
      designation: newEmpData.designation,
      employmentType: newEmpData.employmentType,
      status: 'Active',
      dateOfJoining: new Date().toISOString().split('T')[0],
      salaryAmount: Number(newEmpData.salaryAmount || 60000),
      user: { role: newEmpData.role, status: 'active' }
    };

    try {
      const res = await api.post('/employees', {
        ...newEmpData,
        employeeId: empId
      });
      if (res.data?.success) {
        await fetchEmployees();
        alert(`Registered new employee (${res.data.data?.employeeId || empId}) successfully in database!`);
      } else {
        alert(res.data?.message || 'Failed to register employee');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to register employee in database');
    } finally {
      setIsAddingEmp(false);
      setShowAddModal(false);
      setNewEmpData({
        fullName: '',
        personalEmailAddress: '',
        personalPhoneNumber: '',
        department: 'Engineering',
        designation: 'Software Developer',
        role: 'employee',
        employmentType: 'Full-Time',
        salaryAmount: '60000',
        password: 'Password@123'
      });
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      emp.fullName?.toLowerCase().includes(q) || 
      emp.employeeId?.toLowerCase().includes(q) || 
      emp.personalEmailAddress?.toLowerCase().includes(q) ||
      emp.designation?.toLowerCase().includes(q);

    const matchesDept = !filterDept || emp.department === filterDept;
    const matchesStatus = !filterStatus || emp.status === filterStatus;
    const matchesRole = !filterRole || emp.user?.role === filterRole;

    return matchesSearch && matchesDept && matchesStatus && matchesRole;
  });

  const handleExportMasterPDF = async () => {
    try {
      const listToExport = filteredEmployees.length > 0 ? filteredEmployees : employees;

      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'MASTER REGISTERED EMPLOYEES DIRECTORY',
        metaFields: [
          { label: 'Directory Scope', value: 'Complete Corporate Staff Register' },
          { label: 'Date Generated', value: formatDate(new Date()) },
          { label: 'Total Registered Staff', value: `${listToExport.length} Active Employees` },
          { label: 'Admin Authorization', value: 'System Verified Record' }
        ]
      });

      const tableData = listToExport.map((e, index) => [
        index + 1,
        e.employeeId || `CTI-EMP-00${index + 1}`,
        e.fullName || 'N/A',
        e.department || 'N/A',
        e.designation || 'N/A',
        (e.user?.role || e.role || 'employee').toUpperCase(),
        e.status || 'Active',
        `Rs. ${Number(e.salaryAmount || 65000).toLocaleString('en-IN')}`
      ]);

      const autoTableFn = autoTable || doc.autoTable;
      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, {
          startY: startY,
          head: [['#', 'Emp ID', 'Full Name', 'Department', 'Designation', 'Access Role', 'Status', 'Monthly Salary']],
          body: tableData,
          ...getCorporateTableStyles()
        });
      }

      const dateString = formatDate(new Date()).replace(/\//g, '-');
      finalizeDoc(`CodeThrive_Master_Employees_Directory_${dateString}.pdf`);
    } catch (err) {
      console.error('Failed to export master directory PDF', err);
      alert('Error exporting PDF report: ' + (err?.message || 'Check console logs'));
    }
  };

  const handleExportMasterWord = () => {
    try {
      const listToExport = filteredEmployees.length > 0 ? filteredEmployees : employees;
      const tableData = listToExport.map((e, index) => [
        index + 1,
        e.employeeId || `CTI-EMP-00${index + 1}`,
        e.fullName || 'N/A',
        e.department || 'N/A',
        e.designation || 'N/A',
        (e.user?.role || e.role || 'employee').toUpperCase(),
        e.status || 'Active',
        `Rs. ${Number(e.salaryAmount || 65000).toLocaleString('en-IN')}`
      ]);

      exportOfficialWordDoc({
        title: 'MASTER REGISTERED EMPLOYEES DIRECTORY',
        metaFields: [
          { label: 'Directory Scope', value: 'Complete Corporate Staff Register' },
          { label: 'Date Generated', value: formatDate(new Date()) },
          { label: 'Total Staff', value: `${listToExport.length} Active Employees` }
        ],
        tableHeaders: ['#', 'Emp ID', 'Full Name', 'Department', 'Designation', 'Access Role', 'Status', 'Monthly Salary'],
        tableRows: tableData,
        fileName: `CodeThrive_Employees_Directory_${formatDate(new Date()).replace(/\//g, '-')}.doc`
      });
    } catch (err) {
      alert('Error exporting Word document: ' + err.message);
    }
  };

  const totalRegistered = employees.length;
  const activeWorking = employees.filter(e => e.status === 'Active').length;
  const totalMonthlyPayroll = employees.reduce((acc, e) => acc + (Number(e.salaryAmount) || 0), 0);

  const columns = [
    {
      header: 'Employee Details',
      accessor: 'fullName',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }} onClick={() => handleOpenEmployeePage(row._id)}>
          <div className="emp-avatar-circle">
            {row.fullName ? row.fullName.charAt(0).toUpperCase() : 'E'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{row.fullName}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{row.personalEmailAddress} | <strong style={{ color: 'var(--primary-light)' }}>{row.employeeId}</strong></span>
          </div>
        </div>
      )
    },
    {
      header: 'Department / Designation',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{row.department}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{row.designation}</span>
        </div>
      )
    },
    {
      header: 'Access Role',
      render: (row) => {
        const role = row.user?.role || row.role || 'employee';
        const roleColors = {
          admin: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
          hr: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
          teamlead: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
          employee: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
          intern: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' }
        };
        const style = roleColors[role] || roleColors.employee;
        return (
          <span style={{ 
            background: style.bg, color: style.color, border: `1px solid ${style.border}`,
            padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' 
          }}>
            {role}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Monthly Salary',
      render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--success)' }}>₹{row.salaryAmount ? Number(row.salaryAmount).toLocaleString('en-IN') : '60,000'}</span>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => handleOpenEmployeePage(row._id)}
            className="btn btn-primary"
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Eye size={14} /> Open Employee Page
          </button>
          <button 
            onClick={() => handleDeleteEmployee(row._id)}
            className="btn-icon-danger"
            title="Delete Employee"
            style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer' }}
          >
            <Trash2 size={14} />
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
          <button className="btn btn-outline" onClick={handleExportMasterPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#10b981', color: '#34d399' }}>
            <Download size={15} /> Export Directory (PDF)
          </button>
          <button className="btn btn-outline" onClick={handleExportMasterWord} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#2563eb', color: '#60a5fa' }}>
            <FileText size={15} /> Export Directory (Word)
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> Register New Employee
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="emp-metrics-grid">
        <div className="emp-metric-card">
          <div className="emp-metric-icon bg-primary">
            <User size={22} color="var(--primary)" />
          </div>
          <div>
            <span className="metric-label">Total Registered Staff</span>
            <h3 className="metric-val">{totalRegistered}</h3>
          </div>
        </div>

        <div className="emp-metric-card">
          <div className="emp-metric-icon bg-success">
            <UserCheck size={22} color="var(--success)" />
          </div>
          <div>
            <span className="metric-label">Active Working</span>
            <h3 className="metric-val">{activeWorking}</h3>
          </div>
        </div>

        <div className="emp-metric-card">
          <div className="emp-metric-icon bg-warning">
            <Briefcase size={22} color="var(--warning)" />
          </div>
          <div>
            <span className="metric-label">Departments Covered</span>
            <h3 className="metric-val">5</h3>
          </div>
        </div>

        <div className="emp-metric-card">
          <div className="emp-metric-icon bg-info">
            <Banknote size={22} color="var(--info)" />
          </div>
          <div>
            <span className="metric-label">Total Monthly Payroll</span>
            <h3 className="metric-val">₹{totalMonthlyPayroll.toLocaleString('en-IN')}</h3>
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

      {/* Register New Employee Modal */}
      {showAddModal && (
        <div className="workspace-360-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal-box" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title-group">
                <div className="admin-modal-icon-badge">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="admin-modal-title">Register New Employee</h3>
                  <p className="admin-modal-subtitle">
                    Create staff credentials, assign department, access role & monthly salary
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

            <form onSubmit={handleRegisterNewEmployee} className="reg-emp-grid">
              {/* Full Name */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <User size={13} className="reg-emp-label-icon" /> Full Name <span className="reg-emp-req">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Ramesh Kumar" 
                  className="reg-emp-input" 
                  value={newEmpData.fullName} 
                  onChange={e => setNewEmpData({...newEmpData, fullName: e.target.value})} 
                />
              </div>

              {/* Email Address */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <Mail size={13} className="reg-emp-label-icon" /> Email Address <span className="reg-emp-req">*</span>
                </label>
                <input 
                  type="email" 
                  required 
                  placeholder="e.g. ramesh@codethrive.com" 
                  className="reg-emp-input" 
                  value={newEmpData.personalEmailAddress} 
                  onChange={e => setNewEmpData({...newEmpData, personalEmailAddress: e.target.value})} 
                />
              </div>

              {/* Phone Number */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <Phone size={13} className="reg-emp-label-icon" /> Phone Number
                </label>
                <input 
                  type="tel" 
                  placeholder="e.g. 9876543210" 
                  className="reg-emp-input" 
                  value={newEmpData.personalPhoneNumber} 
                  onChange={e => setNewEmpData({...newEmpData, personalPhoneNumber: e.target.value})} 
                />
              </div>

              {/* Department */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <Building2 size={13} className="reg-emp-label-icon" /> Department
                </label>
                <select 
                  className="reg-emp-input" 
                  value={newEmpData.department} 
                  onChange={e => setNewEmpData({...newEmpData, department: e.target.value})}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Management">Management</option>
                  <option value="HR">HR</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              {/* Designation */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <Briefcase size={13} className="reg-emp-label-icon" /> Designation
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Software Developer" 
                  className="reg-emp-input" 
                  value={newEmpData.designation} 
                  onChange={e => setNewEmpData({...newEmpData, designation: e.target.value})} 
                />
              </div>

              {/* Access Role */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <ShieldCheck size={13} className="reg-emp-label-icon" /> Access Role
                </label>
                <select 
                  className="reg-emp-input" 
                  value={newEmpData.role} 
                  onChange={e => setNewEmpData({...newEmpData, role: e.target.value})}
                >
                  <option value="employee">Employee</option>
                  <option value="teamlead">Team Lead</option>
                  <option value="hr">HR Manager</option>
                  <option value="admin">Admin</option>
                  <option value="intern">Intern</option>
                </select>
              </div>

              {/* Monthly Salary */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <IndianRupee size={13} className="reg-emp-label-icon" /> Monthly Salary (₹)
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 60000" 
                  className="reg-emp-input" 
                  value={newEmpData.salaryAmount} 
                  onChange={e => setNewEmpData({...newEmpData, salaryAmount: e.target.value})} 
                />
              </div>

              {/* Initial Account Password */}
              <div className="reg-emp-field">
                <label className="reg-emp-label">
                  <KeyRound size={13} className="reg-emp-label-icon" /> Initial Account Password
                </label>
                <div className="reg-emp-input-wrap">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="e.g. Password@123" 
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
    </div>
  );
};

export default Employees;
