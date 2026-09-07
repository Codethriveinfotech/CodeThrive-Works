import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Clock, LogIn, LogOut, CheckCircle2, 
  Bell, Activity, AlertTriangle, 
  CheckSquare, Calendar, FileText, Sun, Moon, Briefcase, ListTodo, MoreHorizontal, UserCircle
} from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [attendance, setAttendance] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [liveDuration, setLiveDuration] = useState(0);

  const [tasksData, setTasksData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  // Stats
  const [taskStats, setTaskStats] = useState({ total: 0, pending: 0, completed: 0 });

  // Derived arrays
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  // Load Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, notifRes, tasksRes] = await Promise.all([
          api.get('/dashboard/employee'),
          api.get('/notifications'),
          api.get('/tasks/my-tasks')
        ]);
        
        const dashData = dashRes.data?.data || {};
        setAttendance(dashData.attendance);
        setActiveSession(dashData.activeSession);
        
        const tasks = tasksRes.data?.data || [];
        setTasksData(tasks);
        setNotifications(notifRes.data?.data || []);
        
        // Calculate Task Stats
        let pending = 0;
        let completed = 0;
        const priority = [];
        const deadlines = [];
        
        tasks.forEach(task => {
          if (task.status === 'Completed') completed++;
          else pending++; 

          if ((task.priority === 'High' || task.priority === 'Urgent') && task.status !== 'Completed') {
            priority.push(task);
          }

          if (task.dueDate && task.status !== 'Completed') {
            deadlines.push(task);
          }
        });

        priority.sort((a, b) => new Date(a.dueDate || '2099') - new Date(b.dueDate || '2099'));
        deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        setTaskStats({ total: tasks.length, pending, completed });
        setPriorityTasks(priority.slice(0, 4));
        setUpcomingDeadlines(deadlines.slice(0, 4));

        setLoading(false);
      } catch (err) {
        console.warn('Backend API offline. Loading fallback demo dashboard data...', err);
        const mockTasks = [
          { _id: 't1', title: 'Complete Code Review & Module Testing', status: 'In Progress', priority: 'High', dueDate: '2026-09-15' },
          { _id: 't2', title: 'Update Enterprise Portal Documentation', status: 'Pending', priority: 'Medium', dueDate: '2026-09-18' },
          { _id: 't3', title: 'Weekly Engineering Sync', status: 'Completed', priority: 'High', dueDate: '2026-09-07' }
        ];
        setTasksData(mockTasks);
        setTaskStats({ total: 3, pending: 2, completed: 1 });
        setPriorityTasks([mockTasks[0]]);
        setUpcomingDeadlines([mockTasks[0], mockTasks[1]]);
        setNotifications([
          { _id: 'n1', title: 'Welcome to CodeThrive Portal!', message: 'Your workspace is ready and active.', createdAt: new Date().toISOString() }
        ]);
        setAttendance({ status: 'Not Checked In', totalWorkDurationInSeconds: 0 });
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval;
    if (activeSession && activeSession.startTime) {
      const startTime = new Date(activeSession.startTime).getTime();
      const prevDuration = attendance?.totalWorkDurationInSeconds || 0;

      // Update timer immediately
      setLiveDuration(Math.floor((Date.now() - startTime) / 1000) + prevDuration);

      interval = setInterval(() => {
        setLiveDuration(Math.floor((Date.now() - startTime) / 1000) + prevDuration);
      }, 1000);
    } else if (attendance && attendance.status === 'Checked Out') {
      setLiveDuration(attendance.totalWorkDurationInSeconds || 0);
    } else {
      setLiveDuration(attendance?.totalWorkDurationInSeconds || 0);
    }
    return () => clearInterval(interval);
  }, [activeSession, attendance]);

  const handleCheckIn = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/start-work');
      await new Promise(resolve => setTimeout(resolve, 600));
      if (res.data.success) {
        setAttendance(res.data.data.attendance);
        setActiveSession(res.data.data.activeSession);
      }
    } catch (error) {
      // Fallback check-in for local mode
      const now = new Date();
      setActiveSession({ startTime: now.toISOString() });
      setAttendance({ status: 'Working', firstLoginTime: now, totalWorkDurationInSeconds: 0 });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/checkout');
      await new Promise(resolve => setTimeout(resolve, 600));
      if (res.data.success) {
        setAttendance(res.data.data.attendance);
        setActiveSession(res.data.data.activeSession);
      }
    } catch (error) {
      // Fallback check-out for local mode
      setActiveSession(null);
      setAttendance({ status: 'Checked Out', totalWorkDurationInSeconds: liveDuration });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  if (loading) return (
    <div className="dashboard-container">
      <SkeletonLoader type="dashboard" />
    </div>
  );

  const hr = new Date().getHours();
  const isMorning = hr < 12;
  const isEvening = hr >= 17;
  const greeting = isMorning ? 'Good Morning' : (isEvening ? 'Good Evening' : 'Good Afternoon');
  const GreetingIcon = isEvening ? Moon : Sun;

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const isCheckedIn = !!activeSession;
  const isCheckedOut = attendance && attendance.status === 'Checked Out';
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Employee';
  const roleDisplay = user?.designation || (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Software Engineer');

  return (
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* -----------------------------
          Tier 1: Hero Banner
      ----------------------------- */}
      <motion.div className="dashboard-hero" variants={itemVariants}>
        <div className="hero-content">
          <div className="hero-date">
            <Calendar size={14} />
            {currentDate}
          </div>
          <h1 className="hero-title">
            <GreetingIcon size={28} className={isEvening ? "text-indigo-300" : "text-amber-400"} />
            {greeting}, <span>{displayName}</span>
          </h1>

          <div className="hero-badges">
            <span className="hero-badge"><Briefcase size={14} /> {roleDisplay}</span>
            <span className="hero-badge"><UserCircle size={14} /> ID: {user?.employeeId || user?.id}</span>
          </div>
        </div>
        
        <div className="hero-actions">
           <Link to="/tasks" className="btn btn-outline">
             <CheckSquare size={16} /> My Tasks
           </Link>
           <Link to="/work/daily-report" className="btn btn-primary">
             <FileText size={16} /> Submit Report
           </Link>
        </div>
      </motion.div>

      {/* -----------------------------
          Tier 2: Metric Cards Grid
      ----------------------------- */}
      <div className="metrics-grid">
        <motion.div className="metric-card" variants={itemVariants}>
          <div className="metric-icon-wrapper primary">
            <ListTodo size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Tasks</span>
            <span className="metric-value">{taskStats.total}</span>
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={itemVariants}>
          <div className="metric-icon-wrapper warning">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Pending</span>
            <span className="metric-value">{taskStats.pending}</span>
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={itemVariants}>
          <div className="metric-icon-wrapper success">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Completed</span>
            <span className="metric-value">{taskStats.completed}</span>
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={itemVariants}>
          <div className="metric-icon-wrapper info">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Time Logged</span>
            <span className="metric-value">{formatDuration(liveDuration)}</span>
          </div>
        </motion.div>
      </div>

      {/* -----------------------------
          Tier 3: Workspace Grid
      ----------------------------- */}
      <div className="workspace-grid">
        
        {/* Left Col: Timer Widget */}
        <motion.div variants={itemVariants}>
          <div className="timer-widget">
            <div className="timer-header">
              <div>
                <h3 style={{margin: '0 0 0.25rem 0', fontSize: '1.1rem'}}>Work Session</h3>
                <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Track today's activity</span>
              </div>
              <div className="timer-status">
                {isCheckedIn && <><span className="status-dot active"></span> Active</>}
                {!isCheckedIn && !isCheckedOut && <><span className="status-dot"></span> Not Started</>}
                {isCheckedOut && <><CheckCircle2 size={16} color="var(--success)"/> Completed</>}
              </div>
            </div>

            <div className="timer-display">
              {isCheckedIn && <div className="timer-ring"></div>}
              <span className="timer-value">{formatDuration(liveDuration)}</span>
              <span className="timer-label">{isCheckedIn ? "Checked In" : (isCheckedOut ? "Total Duration" : "0 Hours Logged")}</span>
            </div>

            <div className="timer-details">
              <div className="timer-detail-item">
                <span className="timer-detail-label">Check-In</span>
                <span className="timer-detail-value">
                  {attendance?.firstLoginTime 
                    ? new Date(attendance.firstLoginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : '--:--'}
                </span>
              </div>
              <div className="timer-detail-item">
                <span className="timer-detail-label">Check-Out</span>
                <span className="timer-detail-value">
                  {isCheckedOut && attendance?.lastLogoutTime 
                    ? new Date(attendance.lastLogoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : '--:--'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              {!isCheckedIn && !isCheckedOut && (
                <button onClick={handleCheckIn} disabled={isActionLoading} className={`btn-huge btn-primary ${!isActionLoading ? 'pulse-btn' : ''}`}>
                  {isActionLoading ? <span className="loader-small"></span> : <><LogIn size={20} style={{marginRight: '0.5rem'}} /> START SESSION</>}
                </button>
              )}
              {isCheckedIn && (
                <button onClick={handleCheckOut} disabled={isActionLoading} className="btn-huge btn-danger">
                  {isActionLoading ? <span className="loader-small"></span> : <><LogOut size={20} style={{marginRight: '0.5rem'}} /> END SESSION</>}
                </button>
              )}
              {isCheckedOut && (
                <div className="btn-huge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', cursor: 'default' }}>
                   Session Completed
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Col: Tasks & Deadlines */}
        <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><AlertTriangle size={18} color="var(--warning)"/> Priority Tasks</div>}>
            {priorityTasks.length === 0 ? (
              <div className="empty-state-modern">
                <CheckCircle2 size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No high priority tasks currently.</p>
              </div>
            ) : (
              <ul className="modern-list">
                {priorityTasks.map(task => (
                  <li key={task._id} className="modern-list-item">
                    <div className={`item-icon ${task.priority?.toLowerCase() === 'urgent' ? 'urgent' : 'high'}`}>
                      <AlertTriangle size={18} />
                    </div>
                    <div className="item-content">
                      <h4 className="item-title">{task.title}</h4>
                      <div className="item-meta">
                        <span className="item-meta-info"><CheckSquare size={12}/> {task.taskId}</span>
                        {task.dueDate && <span className="item-meta-info"><Calendar size={12}/> {new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={<div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Calendar size={18} color="var(--primary)"/> Upcoming Deadlines</div>}>
            {upcomingDeadlines.length === 0 ? (
              <div className="empty-state-modern">
                <Calendar size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No upcoming deadlines.</p>
              </div>
            ) : (
              <ul className="modern-list">
                {upcomingDeadlines.map(task => (
                  <li key={task._id} className="modern-list-item">
                    <div className="item-icon normal">
                      <Clock size={18} />
                    </div>
                    <div className="item-content">
                      <h4 className="item-title">{task.title}</h4>
                      <div className="item-meta">
                        <span className="item-meta-info"><MoreHorizontal size={12}/> {task.status}</span>
                      </div>
                    </div>
                    <span style={{fontSize: '0.85rem', color: 'var(--danger)', fontWeight: '600'}}>
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

        </motion.div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
