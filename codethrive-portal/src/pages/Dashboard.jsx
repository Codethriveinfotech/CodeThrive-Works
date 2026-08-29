import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Play, Pause, Square, AlertCircle, CheckCircle2, FileText, Calendar, Bell, MoreVertical } from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import api from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [attendance, setAttendance] = useState({
    status: 'Not Checked In',
    loginTime: null,
    currentWorkingDuration: 0,
    breakDuration: 0
  });

  const [tasks, setTasks] = useState({ today: [], pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard/employee');
        const { attendance: attData, tasks: tasksData } = res.data.data;
        
        setAttendance({
          status: attData.status,
          loginTime: attData.loginTime,
          currentWorkingDuration: attData.currentWorkingDuration,
          breakDuration: attData.breakDuration
        });
        
        setTasks(tasksData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard', err);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    let interval;
    if (attendance.status === 'Working') {
      interval = setInterval(() => {
        setAttendance(prev => ({ ...prev, currentWorkingDuration: prev.currentWorkingDuration + 1 }));
      }, 1000);
    } else if (attendance.status === 'On Break') {
      interval = setInterval(() => {
        setAttendance(prev => ({ ...prev, breakDuration: prev.breakDuration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [attendance.status]);

  const handleStartBreak = () => setAttendance(prev => ({ ...prev, status: 'On Break' }));
  const handleEndBreak = () => setAttendance(prev => ({ ...prev, status: 'Working' }));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Dashboard...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Live Attendance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Welcome back, {user?.name || 'Employee'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>ID: {user?.id || 'CTI-EMP-01'} &nbsp;&bull;&nbsp; Engineering Department</p>
        </div>
        
        <Card className="attendance-timer-card" style={{ flexDirection: 'row', alignItems: 'center', padding: '1rem 1.5rem', gap: '2rem', width: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '12px', height: '12px', borderRadius: '50%', 
              background: attendance.status === 'Working' ? 'var(--success)' : 'var(--warning)',
              boxShadow: attendance.status === 'Working' ? '0 0 10px var(--success)' : '0 0 10px var(--warning)'
            }}></div>
            <div>
              <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'monospace' }}>
                {formatDuration(attendance.status === 'Working' ? attendance.currentWorkingDuration : attendance.breakDuration)}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{attendance.status}</p>
            </div>
          </div>
          <div>
            {attendance.status === 'Working' && (
              <button onClick={handleStartBreak} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}><Pause size={16} /> Break</button>
            )}
            {attendance.status === 'On Break' && (
              <button onClick={handleEndBreak} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}><Play size={16} /> Resume</button>
            )}
          </div>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={24} color="var(--primary-light)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Today's Tasks</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{tasks.today.length}</h3>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
              <Clock size={24} color="var(--warning)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pending Tasks</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{tasks.pending}</h3>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
              <AlertCircle size={24} color="var(--danger)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Overdue Tasks</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{tasks.overdue}</h3>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)' }}>
              <Calendar size={24} color="var(--success)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Leave Balance</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>12 Days</h3>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Today's Tasks */}
        <Card title="Today's Work" action={<button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>View All</button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.today.map(task => (
              <div key={task.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.id}</span>
                    <StatusBadge status={task.priority} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>{task.title}</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <StatusBadge status={task.status} />
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoreVertical size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Side Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="Quick Actions">
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><FileText size={18} /> Submit Daily Report</button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><Calendar size={18} /> Apply for Leave</button>
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}><Square size={18} /> End Shift</button>
            </div>
          </Card>
          
          <Card title="Recent Notifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>New task assigned: <strong>Update API Endpoints</strong></p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10 mins ago</span>
              </div>
              <div style={{ borderLeft: '3px solid var(--success)', paddingLeft: '1rem' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>Leave request for Friday <strong>Approved</strong></p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2 hours ago</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
