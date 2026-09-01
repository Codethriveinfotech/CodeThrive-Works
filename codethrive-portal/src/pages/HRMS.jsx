import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Users, Building2, Briefcase, CalendarClock, 
  FileCheck, CalendarOff, Settings, Search, Filter,
  Plus, Download, Edit, Trash2
} from 'lucide-react';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import './HRMS.css';

const HRMS = () => {
  const [activeTab, setActiveTab] = useState('directory');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    personalEmailAddress: '',
    personalPhoneNumber: '',
    department: '',
    designation: '',
    employmentType: 'Full-Time'
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // const res = await api.get('/employees');
      setTimeout(() => {
        setEmployees([
          { _id: '1', employeeId: 'CTI-EMP-001', fullName: 'John Doe', department: 'Engineering', designation: 'Senior Developer', status: 'Active', employmentType: 'Full-Time' },
          { _id: '2', employeeId: 'CTI-EMP-002', fullName: 'Jane Smith', department: 'Design', designation: 'UI/UX Designer', status: 'Pending', employmentType: 'Full-Time' },
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.warn('Backend unavailable');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      // await api.post('/employees', formData);
      setEmployees([...employees, { 
        _id: Math.random().toString(),
        employeeId: `CTI-EMP-${String(employees.length+1).padStart(3, '0')}`,
        status: 'Active',
        ...formData
      }]);
      setIsModalOpen(false);
      setFormData({ fullName: '', personalEmailAddress: '', personalPhoneNumber: '', department: '', designation: '', employmentType: 'Full-Time' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, empId) => {
    if(!window.confirm(`Are you sure you want to delete ${empId}?`)) return;
    try {
      // await api.delete(`/employees/${id}`);
      setEmployees(employees.filter(emp => emp._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Building2 size={16} /> },
    { id: 'directory', label: 'Directory', icon: <Users size={16} /> },
    { id: 'departments', label: 'Departments', icon: <Briefcase size={16} /> },
    { id: 'lifecycle', label: 'Lifecycle', icon: <FileCheck size={16} /> },
    { id: 'leave_policy', label: 'Policies', icon: <CalendarOff size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  const columns = [
    { header: 'Emp ID', accessor: 'employeeId' },
    { header: 'Name', accessor: 'fullName' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Type', accessor: 'employmentType' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }}><Edit size={14} /></button>
          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => handleDelete(row._id, row.employeeId)}><Trash2 size={14} /></button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>HR Management System</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage employee lifecycle, departments, policies, and records.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', paddingBottom: '1px' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem', background: 'transparent',
              border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'directory' && (
          <Card title="Employee Directory" action={
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}><Download size={14} /> Export</button>
              <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => setIsModalOpen(true)}><Plus size={14} /> Add Employee</button>
            </div>
          } style={{ padding: 0 }}>
            <DataTable 
              columns={columns} 
              data={employees} 
              searchable={true} 
            />
          </Card>
        )}

        {activeTab === 'dashboard' && (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3>HR Dashboard</h3>
            <p style={{ color: 'var(--text-muted)' }}>Comprehensive analytics for attrition, hiring, and department costs will appear here.</p>
          </div>
        )}

        {activeTab !== 'directory' && activeTab !== 'dashboard' && (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <Settings size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3>Module Under Construction</h3>
            <p style={{ color: 'var(--text-muted)' }}>The {activeTab.replace('_', ' ')} module is being integrated with backend logic.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Employee"
      >
        <form id="addEmpForm" onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="input-field" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Email Address</label>
              <input type="email" className="input-field" required value={formData.personalEmailAddress} onChange={(e) => setFormData({...formData, personalEmailAddress: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Phone Number</label>
              <input type="text" className="input-field" required value={formData.personalPhoneNumber} onChange={(e) => setFormData({...formData, personalPhoneNumber: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Department</label>
              <input type="text" className="input-field" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Designation</label>
              <input type="text" className="input-field" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Employment Type</label>
            <select className="input-field" value={formData.employmentType} onChange={(e) => setFormData({...formData, employmentType: e.target.value})} style={{ backgroundColor: 'var(--bg-card)' }}>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Employee</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HRMS;
