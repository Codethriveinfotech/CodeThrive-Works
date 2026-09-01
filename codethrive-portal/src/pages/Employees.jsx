import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { 
  Search, Filter, Download, Plus, MapPin, Phone, Mail, User, 
  Briefcase, GraduationCap, Banknote, FileText, Activity, AlertCircle, Edit, Save, X, Eye
} from 'lucide-react';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import './Employees.css';

const Employees = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isProfileRoute = location.pathname === '/profile';
  const isHRAdmin = ['admin', 'superadmin', 'hr'].includes(user?.role);
  
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  
  const [viewMode, setViewMode] = useState(isProfileRoute ? 'profile' : 'list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    if (isProfileRoute) {
      fetchMyProfile();
    } else {
      fetchEmployees();
    }
  }, [isProfileRoute]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/me');
      if (res.data.success) {
        setSelectedEmployee(res.data.data);
        fetchSummaryMock();
      }
    } catch (err) {
      console.error('Failed to fetch my profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (emp) => {
    try {
      setLoading(true);
      const res = await api.get(`/employees/${emp._id}`);
      if (res.data.success) {
        setSelectedEmployee(res.data.data);
        setViewMode('profile');
        setIsEditing(false);
        fetchSummaryMock();
      }
    } catch (err) {
      console.error('Failed to fetch profile details', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryMock = () => {
    setSummaryData({
      attendance: 'Online',
      assignedTasks: 12,
      completedTasks: 8,
      pendingTasks: 4,
      leaveBalance: '14 Days'
    });
  };

  const handleEditClick = () => {
    setEditFormData({
      personalPhoneNumber: selectedEmployee.personalPhoneNumber || '',
      personalEmailAddress: selectedEmployee.personalEmailAddress || '',
      currentAddress: selectedEmployee.currentAddress || '',
      permanentAddress: selectedEmployee.permanentAddress || '',
      emergencyContact: selectedEmployee.emergencyContact || { name: '', phone: '', relationship: '' },
      skills: selectedEmployee.skills?.join(', ') || ''
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const payload = {
        ...editFormData,
        skills: editFormData.skills.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      const endpoint = isProfileRoute ? '/employees/me' : `/employees/${selectedEmployee._id}`;
      const res = await api.put(endpoint, payload);
      
      if (res.data.success) {
        setIsEditing(false);
        setSelectedEmployee(res.data.data);
        if (!isProfileRoute) fetchEmployees();
      }
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile');
    }
  };

  const columns = [
    { 
      header: 'Profile', 
      accessor: 'profile',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 'bold'
          }}>
            {row.fullName.charAt(0)}
          </div>
        </div>
      )
    },
    { header: 'Emp ID', accessor: 'employeeId' },
    { header: 'Full Name', accessor: 'fullName' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleViewProfile(row)}>
          <Eye size={14} style={{ marginRight: '0.25rem' }} /> View
        </button>
      )
    }
  ];

  if (loading && viewMode === 'list') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Directory...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {viewMode === 'list' && !isProfileRoute ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Employee Management</h1>
              <p style={{ color: 'var(--text-muted)' }}>View and manage all company employees.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={fetchEmployees}>Refresh</button>
              <button className="btn btn-primary"><Plus size={16} /> Add Employee</button>
            </div>
          </div>
          
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--text-muted)" />
                <select 
                  value={filterDept} 
                  onChange={e => setFilterDept(e.target.value)} 
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="" style={{ color: 'var(--bg-main)' }}>All Departments</option>
                  <option value="Engineering" style={{ color: 'var(--bg-main)' }}>Engineering</option>
                  <option value="Design" style={{ color: 'var(--bg-main)' }}>Design</option>
                  <option value="HR" style={{ color: 'var(--bg-main)' }}>HR</option>
                  <option value="Marketing" style={{ color: 'var(--bg-main)' }}>Marketing</option>
                </select>
              </div>
            </div>
            <DataTable 
              columns={columns} 
              data={employees.filter(emp => !filterDept || emp.department === filterDept)} 
              searchable={true} 
            />
          </Card>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '2rem', fontWeight: 'bold'
              }}>
                {selectedEmployee?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{selectedEmployee?.fullName || 'Loading...'}</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{selectedEmployee?.designation} &bull; {selectedEmployee?.employeeId}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <StatusBadge status={selectedEmployee?.status || 'Pending'} />
                  <StatusBadge status="Online" text="Online" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {isEditing ? (
                <>
                  <button className="btn btn-outline" onClick={() => setIsEditing(false)}><X size={16} /> Cancel</button>
                  <button className="btn btn-primary" onClick={handleSaveProfile}><Save size={16} /> Save Changes</button>
                </>
              ) : (
                <button className="btn btn-outline" onClick={handleEditClick}><Edit size={16} /> Edit Info</button>
              )}
              {!isProfileRoute && (
                <button className="btn btn-outline" onClick={() => { setViewMode('list'); setSelectedEmployee(null); }}>Back to List</button>
              )}
            </div>
          </div>
          
          {selectedEmployee && !loading && (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Activity size={24} color="var(--primary)" />
                    <div><p style={{ margin: 0, color: 'var(--text-muted)' }}>Attendance</p><h4 style={{ margin: '0.25rem 0 0 0' }}>{summaryData?.attendance}</h4></div>
                  </div>
                </Card>
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Briefcase size={24} color="var(--warning)" />
                    <div><p style={{ margin: 0, color: 'var(--text-muted)' }}>Tasks</p><h4 style={{ margin: '0.25rem 0 0 0' }}>{summaryData?.assignedTasks}</h4></div>
                  </div>
                </Card>
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FileText size={24} color="var(--success)" />
                    <div><p style={{ margin: 0, color: 'var(--text-muted)' }}>Completed</p><h4 style={{ margin: '0.25rem 0 0 0' }}>{summaryData?.completedTasks}</h4></div>
                  </div>
                </Card>
              </div>

              {/* Detail Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                
                {/* Personal Info */}
                <Card title={<><User size={18} style={{ marginRight: '0.5rem', display: 'inline' }}/> Personal Information</>}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group"><label>Email</label><input type="email" className="input-field" value={editFormData.personalEmailAddress} onChange={e => setEditFormData({...editFormData, personalEmailAddress: e.target.value})} /></div>
                      <div className="form-group"><label>Phone</label><input type="text" className="input-field" value={editFormData.personalPhoneNumber} onChange={e => setEditFormData({...editFormData, personalPhoneNumber: e.target.value})} /></div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Email:</span> <span>{selectedEmployee.personalEmailAddress || '-'}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <span>{selectedEmployee.personalPhoneNumber || '-'}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <span>{selectedEmployee.gender || '-'}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Blood Group:</span> <span>{selectedEmployee.bloodGroup || '-'}</span></div>
                    </div>
                  )}
                </Card>

                {/* Address */}
                <Card title={<><MapPin size={18} style={{ marginRight: '0.5rem', display: 'inline' }}/> Address Information</>}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group"><label>Current Address</label><textarea className="input-field" rows={2} value={editFormData.currentAddress} onChange={e => setEditFormData({...editFormData, currentAddress: e.target.value})}></textarea></div>
                      <div className="form-group"><label>Permanent Address</label><textarea className="input-field" rows={2} value={editFormData.permanentAddress} onChange={e => setEditFormData({...editFormData, permanentAddress: e.target.value})}></textarea></div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                      <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Current Address:</span> <span>{selectedEmployee.currentAddress || '-'}</span></div>
                      <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Permanent Address:</span> <span>{selectedEmployee.permanentAddress || '-'}</span></div>
                    </div>
                  )}
                </Card>

                {/* Employment */}
                <Card title={<><Briefcase size={18} style={{ marginRight: '0.5rem', display: 'inline' }}/> Employment Details</>}>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Department:</span> <span>{selectedEmployee.department || '-'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Designation:</span> <span>{selectedEmployee.designation || '-'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Type:</span> <span>{selectedEmployee.employmentType || '-'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Skills:</span> <span style={{ textAlign: 'right', maxWidth: '60%' }}>{selectedEmployee.skills?.join(', ') || '-'}</span></div>
                  </div>
                </Card>

                {/* Payroll Info (Admin/HR) */}
                {isHRAdmin && (
                  <Card title={<><Banknote size={18} style={{ marginRight: '0.5rem', display: 'inline' }}/> Bank & Payroll</>}>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Bank Name:</span> <span>{selectedEmployee.bankName || 'Not Set'}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Acc Number:</span> <span>{selectedEmployee.accountNumber ? `XXXX${selectedEmployee.accountNumber.slice(-4)}` : 'Not Set'}</span></div>
                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                         <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Salary:</span> <strong>₹{selectedEmployee.salaryAmount?.toLocaleString() || '0'} / Mo</strong></p>
                      </div>
                    </div>
                  </Card>
                )}

              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Employees;
