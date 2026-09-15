import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, Coffee, CheckCircle2, Eye, 
  Clock, Plus, X, ListTodo, Briefcase, Mail, Calendar,
  FileText, Check, ArrowRight, RefreshCw, ShieldCheck, Sparkles, TrendingUp
} from 'lucide-react';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import './Admin.css';
import './Dashboard.css';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Recent Submitted Reports
  const [recentReports, setRecentReports] = useState([]);

  // Quick Task Assign State
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskAssignee, setQuickTaskAssignee] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState('Medium');
  const [quickTaskDueDate, setQuickTaskDueDate] = useState('');
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [res, reportsRes] = await Promise.all([
        api.get('/dashboard/admin-stats').catch(() => ({ data: { success: false } })),
        api.get('/daily-reports').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      let liveList = [];
      if (res.data && res.data.success) {
        liveList = res.data.liveMonitoring || [];
      }

      // Check local storage registered users
      const localUsers = JSON.parse(localStorage.getItem('cti_local_users') || '[]');
      localUsers.forEach(lu => {
        const exists = liveList.some(e => e.email === lu.email || e.id === lu.employeeId);
        if (!exists && lu.email !== 'admin@codethrive.com') {
          liveList.push({
            _id: lu._id || 'local_' + Date.now(),
            id: lu.employeeId || 'CTI-EMP-NEW',
            name: lu.fullName || lu.name,
            email: lu.email,
            dept: lu.department || 'Engineering',
            designation: lu.role || 'Software Engineer',
            joiningDate: new Date().toLocaleDateString(),
            status: 'Not Checked In',
            firstLoginTime: null,
            lastLogoutTime: null,
            workSec: 0,
            breakSec: 0,
            lunchSec: 0,
            duration: '00h 00m',
            assignedTasksCount: 0,
            tasks: []
          });
        }
      });

      // Filter out system administrator from monitoring
      const filteredLive = liveList.filter(e => e.email !== 'admin@codethrive.com' && e.id !== 'CTI-ADM-001');
      setLiveMonitoring(filteredLive);

      const working = filteredLive.filter(e => e.status === 'Working').length;
      const onBreak = filteredLive.filter(e => e.status === 'On Break').length;
      const onLunch = filteredLive.filter(e => e.status === 'On Lunch').length;
      const checkedOut = filteredLive.filter(e => e.status === 'Checked Out').length;
      const absent = filteredLive.length - working - onBreak - onLunch - checkedOut;

      setStats({
        totalEmployees: filteredLive.length,
        working,
        onBreak,
        onLunch,
        checkedOut,
        absent: Math.max(0, absent),
        pendingRegistrations: 0,
        pendingTaskReviews: 0
      });

      if (reportsRes.data && reportsRes.data.success && Array.isArray(reportsRes.data.data)) {
        setRecentReports(reportsRes.data.data.slice(0, 5));
      } else {
        setRecentReports([]);
      }
    } catch (err) {
      console.warn('Error fetching admin dashboard stats from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const handleRefreshEvent = () => fetchStats();
    window.addEventListener('cti_global_refresh', handleRefreshEvent);
    return () => window.removeEventListener('cti_global_refresh', handleRefreshEvent);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
    setTimeout(() => setIsRefreshing(false), 800);
  };

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

  const handleOpenEmployeePage = (empId) => {
    navigate(`/admin/employees/${empId}`);
  };

  const handleReportAction = (reportId, newStatus) => {
    setRecentReports(prev => prev.map(r => r._id === reportId ? { ...r, status: newStatus } : r));
    alert(`Report marked as ${newStatus}!`);
  };

  const handleQuickAssignTask = (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !quickTaskAssignee) return;

    setIsTaskSubmitting(true);
    setTimeout(() => {
      setIsTaskSubmitting(false);
      const targetEmp = liveMonitoring.find(e => e._id === quickTaskAssignee || e.id === quickTaskAssignee);
      alert(`Task "${quickTaskTitle}" assigned to ${targetEmp ? targetEmp.name : 'employee'}!`);
      setQuickTaskTitle('');
      setQuickTaskDueDate('');
    }, 600);
  };

  // Filtered employees list
  const filteredMonitoring = liveMonitoring.filter(e => {
    const matchesEmp = selectedEmpId === 'ALL' || e._id === selectedEmpId || e.id === selectedEmpId;
    const matchesFilter = activeFilter === 'ALL' || 
      (activeFilter === 'Working' && e.status === 'Working') ||
      (activeFilter === 'On Break' && (e.status === 'On Break' || e.status === 'On Lunch')) ||
      (activeFilter === 'Checked Out' && e.status === 'Checked Out');
    return matchesEmp && matchesFilter;
  });

  const columns = [
    { 
      header: 'EMPLOYEE DETAILS', 
      accessor: 'name',
      width: '21%',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <div className="emp-avatar-big" style={{ width: '36px', height: '36px', fontSize: '0.9rem', flexShrink: 0, cursor: 'pointer' }} onClick={() => handleOpenEmployeePage(row._id)}>
            {row.name ? row.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }} onClick={() => handleOpenEmployeePage(row._id)}>
              {row.name}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.email}>
              {row.email} &bull; <strong style={{ color: '#818cf8' }}>{row.id}</strong>
            </span>
          </div>
        </div>
      )
    },
    { 
      header: 'DEPARTMENT / ROLE', 
      width: '15%',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.dept}</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.designation}>{row.designation}</span>
        </div>
      )
    },
    { 
      header: 'STATUS', 
      accessor: 'status',
      width: '11%',
      render: (row) => <StatusBadge status={row.status} />
    },
    { 
      header: 'CHECK IN', 
      width: '8%',
      render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#34d399', fontSize: '0.82rem' }}>{formatTimeOnly(row.firstLoginTime)}</span>
    },
    { 
      header: 'CHECK OUT', 
      width: '8%',
      render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 600, color: row.lastLogoutTime ? '#60a5fa' : '#64748b', fontSize: '0.82rem' }}>{formatTimeOnly(row.lastLogoutTime)}</span>
    },
    { 
      header: 'WORK / BREAK', 
      width: '16%',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', fontFamily: 'monospace' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', padding: '3px 7px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ color: '#a5b4fc', fontSize: '0.7rem' }}>W:</span> {formatDurationStr(row.workSec)}
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '3px 7px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ color: '#fde68a', fontSize: '0.7rem' }}>B:</span> {formatDurationStr(row.breakSec)}
          </div>
        </div>
      )
    },
    {
      header: '360° ACTIONS',
      width: '21%',
      render: (row) => (
        <button 
          onClick={() => handleOpenEmployeePage(row._id)} 
          className="btn btn-primary" 
          style={{ 
            padding: '0.45rem 0.85rem', 
            fontSize: '0.8rem', 
            fontWeight: 600,
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.4rem', 
            whiteSpace: 'nowrap', 
            borderRadius: '99px',
            boxShadow: '0 0 14px rgba(99, 102, 241, 0.3)',
            cursor: 'pointer'
          }}
        >
          <Eye size={14} /> Open 360° Workspace
        </button>
      )
    }
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Executive Control Center...</p>
    </div>
  );

  return (
    <div className="admin-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. EXECUTIVE HERO BANNER WITH GRADIENT SHIMMER */}
      <div className="ultra-premium-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 className="welcome-title-glowing">Employee Attendance & Task Console</h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0 0', fontSize: '0.95rem' }}>
              Real-Time Attendance Monitoring, Daily Reports Review & 360° Employee Workspace Control
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/admin/employees')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Register Employee
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE LIVE MONITORING METRIC CARDS - MEDIUM COMPACT SIZE */}
      <div className="metrics-grid">
        {/* Card 1: Total Registered Staff */}
        <div 
          className={`stat-card stat-card-indigo ${activeFilter === 'ALL' ? 'selected' : ''}`}
          onClick={() => { setSelectedEmpId('ALL'); setActiveFilter('ALL'); }}
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-indigo">
              <Users size={18} />
            </div>
            <span className="stat-tag tag-indigo">REGISTERED</span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{stats.totalEmployees}</h3>
            <p className="stat-title">Total Staff Members</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Click to view all</span>
            {activeFilter === 'ALL' && <span className="stat-active-pill pill-indigo">Active</span>}
          </div>
        </div>
        
        {/* Card 2: Working Right Now */}
        <div 
          className={`stat-card stat-card-emerald ${activeFilter === 'Working' ? 'selected' : ''}`}
          onClick={() => setActiveFilter('Working')}
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-emerald">
              <UserCheck size={18} />
            </div>
            <span className="stat-tag tag-emerald">
              <span className="beacon-dot"></span> WORKING NOW
            </span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{stats.working}</h3>
            <p className="stat-title">Active Employees</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Logged in & working</span>
            {activeFilter === 'Working' && <span className="stat-active-pill pill-emerald">Active</span>}
          </div>
        </div>
        
        {/* Card 3: On Break / Lunch */}
        <div 
          className={`stat-card stat-card-amber ${activeFilter === 'On Break' ? 'selected' : ''}`}
          onClick={() => setActiveFilter('On Break')}
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-amber">
              <Coffee size={18} />
            </div>
            <span className="stat-tag tag-amber">ON BREAK</span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{(stats.onBreak || 0) + (stats.onLunch || 0)}</h3>
            <p className="stat-title">Break / Lunch</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Tea or lunch break</span>
            {activeFilter === 'On Break' && <span className="stat-active-pill pill-amber">Active</span>}
          </div>
        </div>

        {/* Card 4: Checked Out Today */}
        <div 
          className={`stat-card stat-card-cyan ${activeFilter === 'Checked Out' ? 'selected' : ''}`}
          onClick={() => setActiveFilter('Checked Out')}
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-cyan">
              <CheckCircle2 size={18} />
            </div>
            <span className="stat-tag tag-cyan">COMPLETED</span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{stats.checkedOut || 0}</h3>
            <p className="stat-title">Checked Out Today</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Shift ended</span>
            {activeFilter === 'Checked Out' && <span className="stat-active-pill pill-cyan">Active</span>}
          </div>
        </div>
      </div>

      {/* 3. LIVE CHECK IN / CHECK OUT AUDIT TABLE */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Live Check In / Check Out Audit</h3>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Real-time employee activity, work duration & session logs</span>
            </div>
          </div>

          {/* Filter Pills & Employee Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(15, 23, 42, 0.8)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button 
                onClick={() => setActiveFilter('ALL')}
                style={{
                  background: activeFilter === 'ALL' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: activeFilter === 'ALL' ? '#818cf8' : '#94a3b8',
                  border: activeFilter === 'ALL' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                All ({liveMonitoring.length})
              </button>
              <button 
                onClick={() => setActiveFilter('Working')}
                style={{
                  background: activeFilter === 'Working' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  color: activeFilter === 'Working' ? '#34d399' : '#94a3b8',
                  border: activeFilter === 'Working' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Working ({liveMonitoring.filter(e => e.status === 'Working').length})
              </button>
              <button 
                onClick={() => setActiveFilter('On Break')}
                style={{
                  background: activeFilter === 'On Break' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  color: activeFilter === 'On Break' ? '#fbbf24' : '#94a3b8',
                  border: activeFilter === 'On Break' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                On Break ({liveMonitoring.filter(e => e.status === 'On Break' || e.status === 'On Lunch').length})
              </button>
            </div>

            <select 
              className="emp-filter-select"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              style={{ minWidth: '190px', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
            >
              <option value="ALL">Select Employee (All)</option>
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
          className="admin-audit-table"
          tableLayout="fixed"
        />
      </Card>

      {/* 4. BOTTOM GRID: QUICK SUBMITTED REPORTS REVIEW & QUICK TASK ASSIGNMENT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        
        {/* Submitted Daily Reports Review Panel */}
        <Card title={<><FileText size={18} color="#818cf8" style={{ marginRight: '0.5rem' }} /> Submitted Employee Daily Reports</>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentReports.map(r => (
              <div key={r._id} className="emp-task-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.15rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#ffffff', fontSize: '0.92rem' }}>{r.empName}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>{r.empId}</span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#cbd5e1' }}>{r.title}</p>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Date: {r.date} &bull; Time: {r.hours}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StatusBadge status={r.status} />
                  {r.status === 'Pending' && (
                    <>
                      <button className="action-btn-approve" onClick={() => handleReportAction(r._id, 'Approved')} title="Approve Report">
                        <Check size={14} /> Approve
                      </button>
                      <button className="action-btn-reject" onClick={() => handleReportAction(r._id, 'Rejected')} title="Reject Report">
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => navigate('/admin/reports')} style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              View All Daily Reports <ArrowRight size={14} />
            </button>
          </div>
        </Card>

        {/* Quick Assign Task Panel */}
        <Card title={<><ListTodo size={18} color="#818cf8" style={{ marginRight: '0.5rem' }} /> Quick Assign Task to Employee</>}>
          <form onSubmit={handleQuickAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Select Employee *</label>
              <select 
                value={quickTaskAssignee}
                onChange={e => setQuickTaskAssignee(e.target.value)}
                required
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.6rem 0.85rem', borderRadius: '10px', outline: 'none' }}
              >
                <option value="">-- Choose Employee --</option>
                {liveMonitoring.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.id}) &bull; {emp.dept}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Task Title & Objective *</label>
              <input 
                type="text" 
                placeholder="e.g. Implement Payment Gateway Integration"
                value={quickTaskTitle}
                onChange={e => setQuickTaskTitle(e.target.value)}
                required
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.6rem 0.85rem', borderRadius: '10px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Priority</label>
                <select 
                  value={quickTaskPriority}
                  onChange={e => setQuickTaskPriority(e.target.value)}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.6rem 0.85rem', borderRadius: '10px', outline: 'none' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Due Date</label>
                <input 
                  type="date" 
                  value={quickTaskDueDate}
                  onChange={e => setQuickTaskDueDate(e.target.value)}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.6rem 0.85rem', borderRadius: '10px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" disabled={isTaskSubmitting} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                {isTaskSubmitting ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </form>
        </Card>

      </div>

    </div>
  );
};

export default Admin;
