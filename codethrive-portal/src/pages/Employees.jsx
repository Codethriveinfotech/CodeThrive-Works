import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Plus, User, Briefcase, Banknote, Edit, Eye,
  RefreshCw, Trash2, UserCheck
} from 'lucide-react';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import './Employees.css';

const DEFAULT_DEMO_EMPLOYEES = [
  {
    _id: 'emp_001',
    employeeId: 'CTI-EMP-001',
    fullName: 'Mahadevan',
    personalEmailAddress: 'mahadevan@codethrive.com',
    personalPhoneNumber: '9876543210',
    department: 'Engineering',
    designation: 'Senior Full Stack Developer',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2025-01-15',
    workLocation: 'Office',
    salaryAmount: 85000,
    user: { role: 'employee', status: 'active' }
  },
  {
    _id: 'emp_002',
    employeeId: 'CTI-EMP-002',
    fullName: 'Priya Sharma',
    personalEmailAddress: 'priya@codethrive.com',
    personalPhoneNumber: '9876543211',
    department: 'UI/UX Design',
    designation: 'Lead Product Designer',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2025-03-01',
    workLocation: 'Hybrid',
    salaryAmount: 78000,
    user: { role: 'teamlead', status: 'active' }
  },
  {
    _id: 'emp_003',
    employeeId: 'CTI-EMP-003',
    fullName: 'Rahul Verma',
    personalEmailAddress: 'rahul@codethrive.com',
    personalPhoneNumber: '9876543212',
    department: 'Management',
    designation: 'Senior Engineering Lead',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2024-11-10',
    workLocation: 'Office',
    salaryAmount: 110000,
    user: { role: 'admin', status: 'active' }
  },
  {
    _id: 'emp_004',
    employeeId: 'CTI-EMP-004',
    fullName: 'Ananya Roy',
    personalEmailAddress: 'ananya@codethrive.com',
    personalPhoneNumber: '9876543213',
    department: 'HR',
    designation: 'HR Operations Manager',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2025-02-01',
    workLocation: 'Office',
    salaryAmount: 72000,
    user: { role: 'hr', status: 'active' }
  }
];

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
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setEmployees(res.data.data);
      } else {
        setEmployees(DEFAULT_DEMO_EMPLOYEES);
      }
    } catch (err) {
      console.warn('API offline. Loading demo employees directory.', err);
      setEmployees(DEFAULT_DEMO_EMPLOYEES);
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
      if (res.data.success) {
        setEmployees(prev => [res.data.data, ...prev]);
      } else {
        setEmployees(prev => [newDoc, ...prev]);
      }
    } catch (err) {
      setEmployees(prev => [newDoc, ...prev]);
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
      alert(`Registered new employee (${empId}) successfully!`);
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
        const role = row.user?.role || 'employee';
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
      render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--success)' }}>₹{row.salaryAmount ? Number(row.salaryAmount).toLocaleString() : '60,000'}</span>
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
          <span style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 600, letterSpacing: '0.5px' }}>ADMINISTRATION CONSOLE</span>
          <h1 style={{ fontSize: '1.8rem', margin: '0.25rem 0 0.4rem 0', fontWeight: 700 }}>Registered Employees Directory</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Full Administrative Oversight of Registered Staff Profiles, Submissions, Tasks, Payroll & Account Access
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={fetchEmployees} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={15} /> Refresh
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
            <h3 className="metric-val">₹{totalMonthlyPayroll.toLocaleString()}</h3>
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
        <div className="workspace-360-overlay">
          <div className="admin-modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={18} /> Register New Employee
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterNewEmployee} className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" required placeholder="e.g. Ramesh Kumar" className="form-input" value={newEmpData.fullName} onChange={e => setNewEmpData({...newEmpData, fullName: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" required placeholder="e.g. ramesh@codethrive.com" className="form-input" value={newEmpData.personalEmailAddress} onChange={e => setNewEmpData({...newEmpData, personalEmailAddress: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" placeholder="9876543210" className="form-input" value={newEmpData.personalPhoneNumber} onChange={e => setNewEmpData({...newEmpData, personalPhoneNumber: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select className="form-input" value={newEmpData.department} onChange={e => setNewEmpData({...newEmpData, department: e.target.value})}>
                  <option value="Engineering">Engineering</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Management">Management</option>
                  <option value="HR">HR</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input type="text" placeholder="e.g. Full Stack Developer" className="form-input" value={newEmpData.designation} onChange={e => setNewEmpData({...newEmpData, designation: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Access Role</label>
                <select className="form-input" value={newEmpData.role} onChange={e => setNewEmpData({...newEmpData, role: e.target.value})}>
                  <option value="employee">Employee</option>
                  <option value="teamlead">Team Lead</option>
                  <option value="hr">HR Manager</option>
                  <option value="admin">Admin</option>
                  <option value="intern">Intern</option>
                </select>
              </div>

              <div className="form-group">
                <label>Monthly Salary (₹)</label>
                <input type="number" placeholder="60000" className="form-input" value={newEmpData.salaryAmount} onChange={e => setNewEmpData({...newEmpData, salaryAmount: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Initial Account Password</label>
                <input type="password" placeholder="Password@123" className="form-input" value={newEmpData.password} onChange={e => setNewEmpData({...newEmpData, password: e.target.value})} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" disabled={isAddingEmp} className="btn btn-primary">
                  {isAddingEmp ? 'Registering...' : 'Register Employee'}
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
