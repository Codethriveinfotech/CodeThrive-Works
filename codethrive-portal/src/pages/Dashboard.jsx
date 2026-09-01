import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Clock, Play, Pause, AlertCircle, CheckCircle2, 
  Bell, MoreVertical, Briefcase, CalendarDays, 
  Activity, TrendingUp, AlertTriangle, ArrowRight, CheckSquare, Calendar, FileText
} from 'lucide-react';
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

  const [allTasks, setAllTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    progressPercentage: 0
  });

  // Derived arrays
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState({
    today: [],
    tomorrow: [],
    upcoming: []
  });

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, notifRes, tasksRes] = await Promise.all([
          api.get('/dashboard/employee'),
          api.get('/notifications'),
          api.get('/tasks/my-tasks')
        ]);
        
        const { attendance: attData } = dashRes.data || { attendance: {} };
        const tasksData = tasksRes.data?.data || [];
        
        setAttendance({
          status: attData?.status || 'Not Checked In',
          loginTime: attData?.loginTime || null,
          currentWorkingDuration: attData?.currentWorkingDuration || 0,
          breakDuration: attData?.breakDuration || 0
        });
        
        setAllTasks(tasksData);
        setNotifications(notifRes.data?.data || []);
        
        // Calculate Task Stats
        let pending = 0;
        let inProgress = 0;
        let completed = 0;
        const total = tasksData.length;
        
        const priority = [];
        const dueToday = [];
        const dueTomorrow = [];
        const dueUpcoming = [];
        
        const todayStr = new Date().toDateString();
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toDateString();

        tasksData.forEach(task => {
          // Status counts
          if (task.status === 'Completed') completed++;
          else if (task.status === 'In Progress') inProgress++;
          else pending++; // Not Started, Assigned, Ready for Review, etc

          // Priority
          if ((task.priority === 'High' || task.priority === 'Urgent') && task.status !== 'Completed') {
            priority.push(task);
          }

          // Deadlines (Only for active tasks)
          if (task.dueDate && task.status !== 'Completed') {
            const dueDateStr = new Date(task.dueDate).toDateString();
            if (dueDateStr === todayStr) dueToday.push(task);
            else if (dueDateStr === tomorrowStr) dueTomorrow.push(task);
            else if (new Date(task.dueDate) > new Date()) dueUpcoming.push(task);
          }
        });

        // Limit lists to keep UI clean
        priority.sort((a, b) => new Date(a.dueDate || '2099') - new Date(b.dueDate || '2099'));
        dueUpcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        setTaskStats({
          total,
          pending,
          inProgress,
          completed,
          progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
        });

        setPriorityTasks(priority.slice(0, 5));
        setUpcomingDeadlines({
          today: dueToday,
          tomorrow: dueTomorrow,
          upcoming: dueUpcoming.slice(0, 5)
        });

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

  const getDayGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Main Dashboard Section (Welcome) */}
      <div className="welcome-hero-section ultra-premium-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div className="welcome-content">
          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-light)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.5px' }}>{currentDate}</p>
          <h1 className="welcome-title">{getDayGreeting()}, <span className="highlight-name">{user?.name || 'Employee'}</span></h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>"Success is the sum of small efforts, repeated day in and day out."</p>
          
          <div className="employee-badges" style={{ marginTop: '1.5rem' }}>
            <span className="badge-pill employee-id-badge">
              <strong>ID:</strong> {user?.employeeId || user?.id || 'N/A'}
            </span>
            <span className="badge-pill role-badge">
              <strong>Role:</strong> {user?.designation || (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee')}
            </span>
          </div>
        </div>
        
        {/* Attendance Timer */}
        <Card className="attendance-timer-card premium-timer ultra-glass" style={{ minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={`status-dot ${attendance.status === 'Working' ? 'pulse-green' : attendance.status === 'On Break' ? 'pulse-yellow' : 'pulse-red'}`}></div>
            <div>
              <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'monospace' }}>
                {formatDuration(attendance.status === 'Working' ? attendance.currentWorkingDuration : attendance.breakDuration)}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{attendance.status}</p>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {attendance.status === 'Working' && (
              <button onClick={handleStartBreak} className="btn btn-outline" style={{ width: '100%' }}><Pause size={16} style={{marginRight: '0.5rem'}}/> Start Break</button>
            )}
            {attendance.status === 'On Break' && (
              <button onClick={handleEndBreak} className="btn btn-primary" style={{ width: '100%' }}><Play size={16} style={{marginRight: '0.5rem'}}/> Resume Work</button>
            )}
            {attendance.status !== 'Working' && attendance.status !== 'On Break' && (
               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>Check-in from Attendance Page</p>
            )}
          </div>
        </Card>
      </div>

      {/* 2. Today's Work Overview (Dynamic Counts) */}
      <div className="metrics-grid">
        <Card className="metric-card premium-hover">
          <div className="metric-icon bg-primary-light">
            <Briefcase size={26} color="var(--primary)" />
          </div>
          <div className="metric-data">
            <p>Total Tasks</p>
            <h3>{taskStats.total}</h3>
          </div>
        </Card>
        
        <Card className="metric-card premium-hover">
          <div className="metric-icon bg-warning-light">
            <Clock size={26} color="var(--warning)" />
          </div>
          <div className="metric-data">
            <p>Pending</p>
            <h3>{taskStats.pending}</h3>
          </div>
        </Card>
        
        <Card className="metric-card premium-hover">
          <div className="metric-icon bg-accent-light">
            <Activity size={26} color="var(--accent)" />
          </div>
          <div className="metric-data">
            <p>In Progress</p>
            <h3>{taskStats.inProgress}</h3>
          </div>
        </Card>

        <Card className="metric-card premium-hover">
          <div className="metric-icon bg-success-light">
            <CheckCircle2 size={26} color="var(--success)" />
          </div>
          <div className="metric-data">
            <p>Completed</p>
            <h3>{taskStats.completed}</h3>
          </div>
        </Card>
      </div>

      {/* 4. Task Progress & Useful Actions */}
      <div className="dashboard-content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <Card className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem' }}><TrendingUp size={20} color="var(--primary)"/> Task Progress</h3>
             <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{taskStats.progressPercentage}%</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.25rem', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
             <div style={{ width: `${taskStats.progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-light))', borderRadius: '6px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--success)" /> {taskStats.completed} Completed Tasks</span>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} color="var(--warning)" /> {taskStats.total - taskStats.completed} Remaining Tasks</span>
          </div>
        </Card>

        <Card className="premium-card" title="Quick Actions">
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%', alignItems: 'center' }}>
             <Link to="/tasks" className="btn btn-outline premium-hover" style={{ textDecoration: 'none', justifyContent: 'center', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <CheckSquare size={24} /> <span>View My Tasks</span>
             </Link>
             <Link to="/work/daily-report" className="btn btn-primary premium-hover" style={{ textDecoration: 'none', justifyContent: 'center', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <FileText size={24} /> <span>Submit Report</span>
             </Link>
           </div>
        </Card>
      </div>

      {/* Main Content Split Area */}
      <div className="dashboard-content-grid" style={{ gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
        
        {/* Left Column: Priority Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="var(--danger)" /> Today's Priority Tasks
              </div>
            } 
            className="premium-card"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {priorityTasks.length === 0 ? (
                 <div className="empty-state-premium">
                   <CheckCircle2 size={48} className="icon" />
                   <p>No high priority tasks currently. Great job!</p>
                 </div>
              ) : priorityTasks.map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
                return (
                  <div key={task._id} className="task-item premium-task-item premium-hover" style={{ borderLeft: '3px solid var(--danger)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span className="task-id-badge">{task.taskId || 'Task'}</span>
                        <StatusBadge status={task.priority} />
                        {isOverdue && <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '12px', fontWeight: 500 }}>OVERDUE</span>}
                      </div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>{task.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {task.description || 'No description provided.'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <StatusBadge status={task.status} />
                      {task.dueDate && <span style={{ fontSize: '0.8rem', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}><CalendarDays size={12} style={{display:'inline', marginRight:'0.2rem'}}/> {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

        </div>

        {/* Right Column: Deadlines & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Upcoming Deadlines */}
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--warning)" /> Upcoming Deadlines
              </div>
            }
            className="premium-card"
          >
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               
               {/* Due Today */}
               {upcomingDeadlines.today.length > 0 && (
                 <div>
                   <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--danger)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Today</h5>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     {upcomingDeadlines.today.map(task => (
                       <div key={task._id} style={{ padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{task.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{task.taskId}</span>
                            <StatusBadge status={task.status} />
                          </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Due Tomorrow */}
               {upcomingDeadlines.tomorrow.length > 0 && (
                 <div>
                   <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--warning)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Tomorrow</h5>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     {upcomingDeadlines.tomorrow.map(task => (
                       <div key={task._id} style={{ padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{task.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.taskId}</div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Later */}
               {upcomingDeadlines.upcoming.length > 0 && (
                 <div>
                   <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming</h5>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     {upcomingDeadlines.upcoming.map(task => (
                       <div key={task._id} style={{ padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{task.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {upcomingDeadlines.today.length === 0 && upcomingDeadlines.tomorrow.length === 0 && upcomingDeadlines.upcoming.length === 0 && (
                 <div className="empty-state-premium">
                    <CalendarDays size={48} className="icon" />
                    <p>No upcoming deadlines to worry about.</p>
                 </div>
               )}

             </div>
          </Card>

          {/* Recent Activity / Notifications */}
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="var(--primary)" /> Recent Activity
              </div>
            }
            className="premium-card"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.length === 0 ? (
                 <div className="empty-state-premium">
                   <Bell size={48} className="icon" />
                   <p>No recent activities.</p>
                 </div>
              ) : (
                notifications.slice(0, 5).map(notif => (
                  <div key={notif._id} className="notification-item" style={{ 
                    borderLeft: `3px solid var(--${notif.type === 'Alert' ? 'danger' : notif.type === 'Success' ? 'success' : 'primary'})`, 
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-main)',
                    borderRadius: '0 8px 8px 0',
                    transition: 'all 0.2s',
                    border: '1px solid var(--border-color)',
                    borderLeftWidth: '3px'
                  }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)' }}>{notif.title}</p>
                    <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{notif.message}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
