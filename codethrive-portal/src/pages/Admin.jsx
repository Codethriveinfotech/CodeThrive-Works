import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, Coffee, UserX, UserPlus, FileCheck, Eye } from 'lucide-react';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import './Admin.css';
import './Dashboard.css'; // added to use premium dashboard styles

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
        setLoading(true);
        const res = await api.get('/dashboard/admin-stats');
        if (res.data.success) {
          setStats(res.data.stats);
          setLiveMonitoring(res.data.liveMonitoring || []);
        }
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
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
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: 0 }}>
      {/* Welcome / Header */}
      <div className="welcome-hero-section ultra-premium-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div className="welcome-content">
          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-light)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.5px' }}>Administrator Panel</p>
          <h1 className="welcome-title">Management Console</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>Live Overview & System Health</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="metrics-grid">
        <Card className="metric-card premium-hover">
          <div className="metric-icon bg-primary-light">
            <Users size={26} color="var(--primary)" />
          </div>
          <div className="metric-data">
            <p>Total Employees</p>
            <h3>{stats.totalEmployees}</h3>
          </div>
        </Card>
        
        <Card className="metric-card premium-hover">
          <div className="metric-icon bg-success-light">
            <UserCheck size={26} color="var(--success)" />
          </div>
          <div className="metric-data">
            <p>Working Now</p>
            <h3>{stats.working}</h3>
          </div>
        </Card>
        
        <Card className="metric-card premium-hover">
          <div className="metric-icon bg-warning-light">
            <Coffee size={26} color="var(--warning)" />
          </div>
          <div className="metric-data">
            <p>On Break</p>
            <h3>{stats.onBreak}</h3>
          </div>
        </Card>
        
        <Card className="metric-card premium-hover">
          <div className="metric-icon bg-danger-light">
            <UserX size={26} color="var(--danger)" />
          </div>
          <div className="metric-data">
            <p>Absent</p>
            <h3>{stats.absent}</h3>
          </div>
        </Card>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <Card className="metric-card premium-hover">
          <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <UserPlus size={26} color="var(--secondary)" />
          </div>
          <div className="metric-data">
            <p>Pending Registrations</p>
            <h3>{stats.pendingRegistrations}</h3>
          </div>
        </Card>
        <Card className="metric-card premium-hover">
          <div className="metric-icon" style={{ background: 'rgba(236, 72, 153, 0.12)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <FileCheck size={26} color="var(--accent)" />
          </div>
          <div className="metric-data">
            <p>Pending Task Reviews</p>
            <h3>{stats.pendingTaskReviews}</h3>
          </div>
        </Card>
      </div>

      {/* Live Monitoring Table */}
      <Card className="premium-card" title="Live Employee Monitoring" action={<button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>View Full Report</button>} style={{ padding: 0 }}>
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
