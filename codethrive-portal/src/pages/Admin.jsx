import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserCheck, Coffee, UserX, UserPlus, FileCheck, Eye, 
  Clock, LogIn, LogOut, CheckCircle2, Utensils, Plus, X, ListTodo, Briefcase, Mail, Calendar
} from 'lucide-react';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import './Admin.css';
import './Dashboard.css';

const Admin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    working: 0,
    onBreak: 0,
    onLunch: 0,
    checkedOut: 0,
    absent: 0,
    pendingRegistrations: 0,
    pendingTaskReviews: 0
  });

  const [liveMonitoring, setLiveMonitoring] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('ALL');
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);

  // New Task state inside modal
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin-stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setLiveMonitoring(res.data.liveMonitoring || []);
      }
    } catch (err) {
      console.warn('Backend API offline. Loading fallback admin demo stats...', err);
      setStats({
        totalEmployees: 4,
        working: 2,
        onBreak: 1,
        onLunch: 0,
        checkedOut: 1,
        absent: 0,
        pendingRegistrations: 0,
        pendingTaskReviews: 2
      });
      setLiveMonitoring([
        { 
          _id: 'emp1',
          id: 'CTI-EMP-001', 
          name: 'Mahadevan', 
          email: 'mahadevan@codethrive.com',
          dept: 'Engineering', 
          designation: 'Senior Developer',
          joiningDate: '2025-01-15',
          status: 'Working',
          firstLoginTime: '2026-09-08T09:15:00.000Z',
          lastLogoutTime: null,
          workSec: 14400,
          breakSec: 900,
          lunchSec: 1800,
          duration: '4h 00m',
          assignedTasksCount: 2,
          tasks: [
            { _id: 'tk1', taskId: 'TSK-101', title: 'Implement Payment Gateway Integration', status: 'In Progress', priority: 'High', dueDate: '2026-09-12' },
            { _id: 'tk2', taskId: 'TSK-102', title: 'Fix Dashboard Responsiveness', status: 'Assigned', priority: 'Medium', dueDate: '2026-09-15' }
          ]
        },
        { 
          _id: 'emp2',
          id: 'CTI-EMP-002', 
          name: 'Priya Sharma', 
          email: 'priya@codethrive.com',
          dept: 'UI/UX Design', 
          designation: 'Product Designer',
          joiningDate: '2025-03-01',
          status: 'On Break',
          firstLoginTime: '2026-09-08T09:30:00.000Z',
          lastLogoutTime: null,
          workSec: 12600,
          breakSec: 1200,
          lunchSec: 0,
          duration: '3h 30m',
          assignedTasksCount: 1,
          tasks: [
            { _id: 'tk3', taskId: 'TSK-103', title: 'Design Mobile HRMS UI Mockups', status: 'In Progress', priority: 'Urgent', dueDate: '2026-09-10' }
          ]
        },
        { 
          _id: 'emp3',
          id: 'CTI-EMP-003', 
          name: 'Rahul Verma', 
          email: 'rahul@codethrive.com',
          dept: 'Management', 
          designation: 'Project Lead',
          joiningDate: '2024-11-10',
          status: 'Checked Out',
          firstLoginTime: '2026-09-08T08:45:00.000Z',
          lastLogoutTime: '2026-09-08T17:15:00.000Z',
          workSec: 28800,
          breakSec: 1800,
          lunchSec: 2700,
          duration: '8h 00m',
          assignedTasksCount: 3,
          tasks: [
            { _id: 'tk4', taskId: 'TSK-104', title: 'Prepare Q3 Engineering Roadmap', status: 'Completed', priority: 'High', dueDate: '2026-09-07' }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDurationStr = (seconds) => {
    const sec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filtered employees according to dropdown selector
  const filteredMonitoring = selectedEmpId === 'ALL' 
    ? liveMonitoring 
    : liveMonitoring.filter(e => e._id === selectedEmpId || e.id === selectedEmpId);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedEmployeeDetail) return;

    setIsTaskSubmitting(true);
    try {
      await api.post('/tasks', {
        title: newTaskTitle,
        assignedTo: selectedEmployeeDetail._id,
        priority: newTaskPriority,
        dueDate: newTaskDueDate || new Date(Date.now() + 86400000 * 3).toISOString()
      });

      const newTask = {
        _id: 't_' + Date.now(),
        taskId: 'TSK-' + Math.floor(100 + Math.random() * 900),
        title: newTaskTitle,
        status: 'Assigned',
        priority: newTaskPriority,
        dueDate: newTaskDueDate || new Date(Date.now() + 86400000 * 3).toISOString()
      };

      // Local state update
      setSelectedEmployeeDetail(prev => ({
        ...prev,
        assignedTasksCount: (prev.assignedTasksCount || 0) + 1,
        tasks: [newTask, ...(prev.tasks || [])]
      }));

      setNewTaskTitle('');
      setNewTaskDueDate('');
    } catch (err) {
      // Local fallback push
      const newTask = {
        _id: 't_' + Date.now(),
        taskId: 'TSK-' + Math.floor(100 + Math.random() * 900),
        title: newTaskTitle,
        status: 'Assigned',
        priority: newTaskPriority,
        dueDate: newTaskDueDate || new Date(Date.now() + 86400000 * 3).toISOString()
      };

      setSelectedEmployeeDetail(prev => ({
        ...prev,
        assignedTasksCount: (prev.assignedTasksCount || 0) + 1,
        tasks: [newTask, ...(prev.tasks || [])]
      }));

      setNewTaskTitle('');
      setNewTaskDueDate('');
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const columns = [
    { 
      header: 'Employee Details', 
      accessor: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="emp-avatar-big" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
            {row.name ? row.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email} | {row.id}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Department / Role', 
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{row.dept}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.designation}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    { 
      header: 'Check In', 
      render: (row) => <span style={{ fontFamily: 'monospace', color: 'var(--success)' }}>{formatTimeOnly(row.firstLoginTime)}</span>
    },
    { 
      header: 'Check Out', 
      render: (row) => <span style={{ fontFamily: 'monospace', color: row.lastLogoutTime ? 'var(--info)' : 'var(--text-muted)' }}>{formatTimeOnly(row.lastLogoutTime)}</span>
    },
    { 
      header: 'Work / Break / Lunch', 
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
          <span style={{ color: 'var(--primary-light)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>W: {formatDurationStr(row.workSec)}</span>
          <span style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>B: {formatDurationStr(row.breakSec)}</span>
          <span style={{ color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>L: {formatDurationStr(row.lunchSec)}</span>
        </div>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <button 
          onClick={() => setSelectedEmployeeDetail(row)} 
          className="btn btn-outline" 
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <Eye size={14} /> Profile & Tasks ({row.assignedTasksCount || 0})
        </button>
      )
    }
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Admin Monitoring Console...</p>
    </div>
  );

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: 0 }}>
      {/* Welcome / Header */}
      <div className="welcome-hero-section ultra-premium-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div className="welcome-content">
          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-light)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.5px' }}>Administrator Panel</p>
          <h1 className="welcome-title">Employee Attendance & Task Console</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>Live Real-Time Monitoring & Employee Task Oversight</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="metrics-grid">
        <Card className="metric-card premium-hover clickable" style={{ cursor: 'pointer' }} onClick={() => setSelectedEmpId('ALL')}>
          <div className="metric-icon bg-primary-light">
            <Users size={26} color="var(--primary)" />
          </div>
          <div className="metric-data">
            <p>Total Registered</p>
            <h3>{stats.totalEmployees}</h3>
          </div>
        </Card>
        
        <Card className="metric-card premium-hover clickable" style={{ cursor: 'pointer' }} onClick={() => {
          const workingEmp = liveMonitoring.find(e => e.status === 'Working');
          if (workingEmp) setSelectedEmpId(workingEmp._id);
          else setSelectedEmpId('ALL');
        }}>
          <div className="metric-icon bg-success-light">
            <UserCheck size={26} color="var(--success)" />
          </div>
          <div className="metric-data">
            <p>Working Now</p>
            <h3>{stats.working}</h3>
          </div>
        </Card>
        
        <Card className="metric-card premium-hover clickable" style={{ cursor: 'pointer' }} onClick={() => {
          const breakEmp = liveMonitoring.find(e => e.status === 'On Break' || e.status === 'On Lunch');
          if (breakEmp) setSelectedEmpId(breakEmp._id);
          else setSelectedEmpId('ALL');
        }}>
          <div className="metric-icon bg-warning-light">
            <Coffee size={26} color="var(--warning)" />
          </div>
          <div className="metric-data">
            <p>On Break / Lunch</p>
            <h3>{(stats.onBreak || 0) + (stats.onLunch || 0)}</h3>
          </div>
        </Card>

        <Card className="metric-card premium-hover clickable" style={{ cursor: 'pointer' }} onClick={() => {
          const outEmp = liveMonitoring.find(e => e.status === 'Checked Out');
          if (outEmp) setSelectedEmpId(outEmp._id);
          else setSelectedEmpId('ALL');
        }}>
          <div className="metric-icon bg-info-light">
            <CheckCircle2 size={26} color="var(--info)" />
          </div>
          <div className="metric-data">
            <p>Checked Out Today</p>
            <h3>{stats.checkedOut || 0}</h3>
          </div>
        </Card>
      </div>

      {/* Live Monitoring Section */}
      <Card className="premium-card" style={{ padding: 0 }}>
        {/* Admin Toolbar with Employee Filter Selector */}
        <div className="admin-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Live Check In / Check Out Audit</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Employee:</span>
            <select 
              className="emp-filter-select"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
            >
              <option value="ALL">All Employees ({liveMonitoring.length})</option>
              {liveMonitoring.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredMonitoring} 
          searchable={true} 
          itemsPerPage={10} 
        />
      </Card>

      {/* Dedicated Individual Employee Profile & Task Modal */}
      {selectedEmployeeDetail && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Individual Employee Overview</h3>
              </div>
              <button 
                onClick={() => setSelectedEmployeeDetail(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Employee Summary Banner */}
              <div className="emp-profile-summary">
                <div className="emp-avatar-big">
                  {selectedEmployeeDetail.name ? selectedEmployeeDetail.name.charAt(0).toUpperCase() : 'E'}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{selectedEmployeeDetail.name}</h3>
                    <StatusBadge status={selectedEmployeeDetail.status} />
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span><Mail size={12} /> {selectedEmployeeDetail.email}</span>
                    <span><Briefcase size={12} /> {selectedEmployeeDetail.dept} ({selectedEmployeeDetail.designation})</span>
                    <span><Calendar size={12} /> Employee ID: {selectedEmployeeDetail.id}</span>
                  </div>
                </div>
              </div>

              {/* Today's Attendance Session Breakdown */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: 'var(--primary-light)' }}>Today's Session Breakdown</h4>
                <div className="emp-audit-grid">
                  <div className="emp-audit-card">
                    <span className="audit-title">Check-In Time</span>
                    <span className="audit-value" style={{ color: 'var(--success)' }}>{formatTimeOnly(selectedEmployeeDetail.firstLoginTime)}</span>
                  </div>
                  <div className="emp-audit-card">
                    <span className="audit-title">Check-Out Time</span>
                    <span className="audit-value" style={{ color: 'var(--info)' }}>{formatTimeOnly(selectedEmployeeDetail.lastLogoutTime)}</span>
                  </div>
                  <div className="emp-audit-card">
                    <span className="audit-title">Work Time Logged</span>
                    <span className="audit-value" style={{ color: 'var(--primary-light)' }}>{formatDurationStr(selectedEmployeeDetail.workSec)}</span>
                  </div>
                  <div className="emp-audit-card">
                    <span className="audit-title">Break / Lunch Time</span>
                    <span className="audit-value" style={{ color: '#fbbf24' }}>
                      {formatDurationStr((selectedEmployeeDetail.breakSec || 0) + (selectedEmployeeDetail.lunchSec || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Individual Employee Tasks List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ListTodo size={16} /> Assigned Tasks ({selectedEmployeeDetail.tasks?.length || 0})
                  </h4>
                </div>

                {(!selectedEmployeeDetail.tasks || selectedEmployeeDetail.tasks.length === 0) ? (
                  <div style={{ padding: '1.5rem', textAlignment: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    No specific tasks assigned to this employee yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {selectedEmployeeDetail.tasks.map(t => (
                      <div key={t._id} className="emp-task-card">
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.taskId}</span>
                          <h5 style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>{t.title}</h5>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className={`hero-badge ${t.priority?.toLowerCase() === 'urgent' ? 'urgent' : ''}`}>{t.priority}</span>
                          <StatusBadge status={t.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign New Task directly for this employee */}
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} color="var(--primary)" /> Assign New Task to {selectedEmployeeDetail.name}
                </h4>
                <form onSubmit={handleAssignTask} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Task Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Develop Auth Module UI"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      required
                      style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Priority</label>
                    <select 
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Due Date</label>
                    <input 
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px' }}
                    />
                  </div>
                  <button type="submit" disabled={isTaskSubmitting} className="btn btn-primary" style={{ padding: '0.55rem 1rem' }}>
                    {isTaskSubmitting ? 'Assigning...' : 'Assign Task'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

