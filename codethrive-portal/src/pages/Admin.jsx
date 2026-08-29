import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, Coffee, UserX, UserPlus, FileCheck, Eye } from 'lucide-react';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    online: 0,
    working: 0,
    onBreak: 0,
    absent: 0,
    pendingRegistrations: 0,
    pendingTaskReviews: 0
  });

  const [liveMonitoring, setLiveMonitoring] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // const res = await api.get('/dashboard/admin-stats');
        // if (res.success) { ... }
        
        // Simulating Backend Response
        setTimeout(() => {
          setStats({
            totalEmployees: 45,
            online: 38,
            working: 32,
            onBreak: 6,
            absent: 7,
            pendingRegistrations: 3,
            pendingTaskReviews: 12
          });
          setLiveMonitoring([
            { id: 'EMP-001', name: 'Alice Smith', dept: 'Engineering', status: 'Working', task: 'API Integration', duration: '04:12:00' },
            { id: 'EMP-002', name: 'Bob Johnson', dept: 'Design', status: 'On Break', task: 'UI Mockups', duration: '03:45:10' },
            { id: 'EMP-003', name: 'Charlie Davis', dept: 'Marketing', status: 'Working', task: 'Campaign Analysis', duration: '05:20:00' },
            { id: 'EMP-004', name: 'Diana Prince', dept: 'HR', status: 'Absent', task: 'Leave', duration: '00:00:00' },
          ]);
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error('Failed to load admin stats', err);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const columns = [
    { 
      header: 'Employee', 
      accessor: 'name',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.name}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.id}</span>
        </div>
      )
    },
    { header: 'Department', accessor: 'dept' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    { header: 'Current Task', accessor: 'task' },
    { 
      header: 'Net Work Duration', 
      accessor: 'duration',
      render: (row) => <span style={{ fontFamily: 'monospace' }}>{row.duration}</span>
    },
    {
      header: 'Action',
      render: () => (
        <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
          <Eye size={14} /> Timeline
        </button>
      )
    }
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Admin Console...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Management Console</h1>
        <p style={{ color: 'var(--text-muted)' }}>Live Overview & System Health</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)' }}>
              <Users size={24} color="var(--primary-light)" />
            </div>
            <div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Employees</p><h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{stats.totalEmployees}</h3></div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)' }}>
              <UserCheck size={24} color="var(--success)" />
            </div>
            <div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Working Now</p><h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{stats.working}</h3></div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
              <Coffee size={24} color="var(--warning)" />
            </div>
            <div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>On Break</p><h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{stats.onBreak}</h3></div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
              <UserX size={24} color="var(--danger)" />
            </div>
            <div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Absent</p><h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{stats.absent}</h3></div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <UserPlus size={24} color="#8b5cf6" />
            </div>
            <div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pending Registrations</p><h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{stats.pendingRegistrations}</h3></div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              <FileCheck size={24} color="#ec4899" />
            </div>
            <div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pending Task Reviews</p><h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{stats.pendingTaskReviews}</h3></div>
          </div>
        </Card>
      </div>

      {/* Live Monitoring Table */}
      <Card title="Live Employee Monitoring" action={<button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>View Full Report</button>} style={{ padding: 0 }}>
        <DataTable 
          columns={columns} 
          data={liveMonitoring} 
          searchable={true} 
          itemsPerPage={10} 
        />
      </Card>
    </div>
  );
};

export default Admin;
