import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Clock, LogIn, LogOut, CheckCircle2, 
  Bell, Activity, AlertTriangle, 
  CheckSquare, Calendar, FileText, Sun, Moon, Briefcase, ListTodo, MoreHorizontal, UserCircle,
  Coffee, Utensils, Play
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
  
  // Dynamic live duration trackers (in seconds)
  const [liveWorkDuration, setLiveWorkDuration] = useState(0);
  const [liveBreakDuration, setLiveBreakDuration] = useState(0);
  const [liveLunchDuration, setLiveLunchDuration] = useState(0);

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
        let savedAttendance = null;
        let savedActiveSession = null;
        try {
          const cached = localStorage.getItem('codethrive_session');
          if (cached) {
            const parsed = JSON.parse(cached);
            const todayStr = new Date().toDateString();
            if (parsed.savedDate === todayStr) {
              savedAttendance = parsed.attendance;
              savedActiveSession = parsed.activeSession;
            }
          }
        } catch (e) {}

        setAttendance(savedAttendance || { status: 'Not Checked In', totalWorkDurationInSeconds: 0, totalBreakDurationInSeconds: 0, totalLunchDurationInSeconds: 0 });
        setActiveSession(savedActiveSession || null);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Real-time Dynamic Multi-timer Logic
  useEffect(() => {
    let interval;
    const updateTimers = () => {
      const prevWork = attendance?.totalWorkDurationInSeconds || 0;
      const prevBreak = attendance?.totalBreakDurationInSeconds || 0;
      const prevLunch = attendance?.totalLunchDurationInSeconds || 0;

      const sessionStartTime = activeSession?.startTime || attendance?.lastSessionStartTime || (attendance?.firstLoginTime && attendance?.status === 'Working' ? attendance.firstLoginTime : null);

      if (sessionStartTime && (attendance?.status === 'Working' || attendance?.status === 'On Break' || attendance?.status === 'On Lunch')) {
        const startTime = new Date(sessionStartTime).getTime();
        const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        
        const type = activeSession?.sessionType || (attendance?.status === 'On Break' ? 'Break' : (attendance?.status === 'On Lunch' ? 'Lunch' : 'Work'));

        if (type === 'Work') {
          setLiveWorkDuration(prevWork + elapsed);
          setLiveBreakDuration(prevBreak);
          setLiveLunchDuration(prevLunch);
        } else if (type === 'Break') {
          setLiveWorkDuration(prevWork);
          setLiveBreakDuration(prevBreak + elapsed);
          setLiveLunchDuration(prevLunch);
        } else if (type === 'Lunch') {
          setLiveWorkDuration(prevWork);
          setLiveBreakDuration(prevBreak);
          setLiveLunchDuration(prevLunch + elapsed);
        }
      } else {
        setLiveWorkDuration(prevWork);
        setLiveBreakDuration(prevBreak);
        setLiveLunchDuration(prevLunch);
      }
    };

    updateTimers();
    interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [activeSession, attendance]);

  // Sync session state to localStorage to persist tab closes and page refreshes
  useEffect(() => {
    if (attendance) {
      try {
        localStorage.setItem('codethrive_session', JSON.stringify({
          savedDate: new Date().toDateString(),
          attendance,
          activeSession
        }));
      } catch (e) {}
    }
  }, [attendance, activeSession]);

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
      // Local fallback check-in
      const now = new Date();
      const newAttendance = { 
        status: 'Working', 
        firstLoginTime: now.toISOString(), 
        totalWorkDurationInSeconds: liveWorkDuration,
        totalBreakDurationInSeconds: liveBreakDuration,
        totalLunchDurationInSeconds: liveLunchDuration
      };
      setAttendance(newAttendance);
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Work' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/start-break');
      await new Promise(resolve => setTimeout(resolve, 600));
      if (res.data.success) {
        setAttendance(res.data.data.attendance);
        setActiveSession(res.data.data.activeSession);
      }
    } catch (error) {
      // Local fallback start break
      const now = new Date();
      setAttendance(prev => ({
        ...prev,
        status: 'On Break',
        totalWorkDurationInSeconds: liveWorkDuration
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Break' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartLunch = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/start-lunch');
      await new Promise(resolve => setTimeout(resolve, 600));
      if (res.data.success) {
        setAttendance(res.data.data.attendance);
        setActiveSession(res.data.data.activeSession);
      }
    } catch (error) {
      // Local fallback start lunch
      const now = new Date();
      setAttendance(prev => ({
        ...prev,
        status: 'On Lunch',
        totalWorkDurationInSeconds: liveWorkDuration
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Lunch' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResumeWork = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/resume-work');
      await new Promise(resolve => setTimeout(resolve, 600));
      if (res.data.success) {
        setAttendance(res.data.data.attendance);
        setActiveSession(res.data.data.activeSession);
      }
    } catch (error) {
      // Local fallback resume work
      const now = new Date();
      const currentType = activeSession?.sessionType;
      setAttendance(prev => ({
        ...prev,
        status: 'Working',
        totalBreakDurationInSeconds: currentType === 'Break' ? liveBreakDuration : (prev?.totalBreakDurationInSeconds || 0),
        totalLunchDurationInSeconds: currentType === 'Lunch' ? liveLunchDuration : (prev?.totalLunchDurationInSeconds || 0)
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Work' });
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
      // Local fallback checkout
      const now = new Date();
      setActiveSession(null);
      setAttendance(prev => ({
        ...prev,
        status: 'Checked Out',
        lastLogoutTime: now.toISOString(),
        totalWorkDurationInSeconds: activeSession?.sessionType === 'Work' ? liveWorkDuration : (prev?.totalWorkDurationInSeconds || 0),
        totalBreakDurationInSeconds: activeSession?.sessionType === 'Break' ? liveBreakDuration : (prev?.totalBreakDurationInSeconds || 0),
        totalLunchDurationInSeconds: activeSession?.sessionType === 'Lunch' ? liveLunchDuration : (prev?.totalLunchDurationInSeconds || 0)
      }));
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
    }
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
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

  const currentStatus = attendance?.status || 'Not Checked In';
  const isWorking = currentStatus === 'Working';
  const isOnBreak = currentStatus === 'On Break';
  const isOnLunch = currentStatus === 'On Lunch';
  const isCheckedOut = currentStatus === 'Checked Out';
  const isNotStarted = currentStatus === 'Not Checked In' || (!attendance?.firstLoginTime && !isWorking && !isOnBreak && !isOnLunch && !isCheckedOut);

  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Employee';
  const roleDisplay = user?.designation || (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Software Engineer');

  // Active Timer Value and Label Calculation
  let displayMainTimer = liveWorkDuration;
  let timerLabelText = "Work Duration";
  if (isOnBreak) {
    displayMainTimer = liveBreakDuration;
    timerLabelText = "On Break Time";
  } else if (isOnLunch) {
    displayMainTimer = liveLunchDuration;
    timerLabelText = "Lunch Break Time";
  } else if (isCheckedOut) {
    displayMainTimer = liveWorkDuration;
    timerLabelText = "Total Work Logged";
  }

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
            <span className="metric-label">Work Logged</span>
            <span className="metric-value">{formatDuration(liveWorkDuration)}</span>
          </div>
        </motion.div>
      </div>

      {/* -----------------------------
          Tier 3: Workspace Grid
      ----------------------------- */}
      <div className="workspace-grid">
        
        {/* Left Col: Work Session & Multi-Timer Widget */}
        <motion.div variants={itemVariants}>
          <div className="timer-widget">
            <div className="timer-header">
              <div>
                <h3 style={{margin: '0 0 0.25rem 0', fontSize: '1.1rem'}}>Work Session</h3>
                <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Track today's activity & breaks</span>
              </div>
              <div className="timer-status">
                {isWorking && <><span className="status-dot active"></span> Working</>}
                {isOnBreak && <><span className="status-dot break"></span> On Break</>}
                {isOnLunch && <><span className="status-dot lunch"></span> On Lunch</>}
                {isNotStarted && <><span className="status-dot"></span> Not Started</>}
                {isCheckedOut && <><CheckCircle2 size={16} color="var(--success)"/> Completed</>}
              </div>
            </div>

            <div className="timer-display">
              {isWorking && <div className="timer-ring"></div>}
              {isOnBreak && <div className="timer-ring ring-break"></div>}
              {isOnLunch && <div className="timer-ring ring-lunch"></div>}
              <span className="timer-value">{formatDuration(displayMainTimer)}</span>
              <span className="timer-label">{timerLabelText}</span>
            </div>

            {/* 3-Way Duration Breakdown */}
            <div className="timer-breakdown-grid">
              <div className="timer-breakdown-item">
                <span className="tb-label"><Clock size={12} /> Work</span>
                <span className="tb-value" style={{ color: 'var(--primary-light)' }}>{formatDuration(liveWorkDuration)}</span>
              </div>
              <div className="timer-breakdown-item">
                <span className="tb-label"><Coffee size={12} /> Break</span>
                <span className="tb-value" style={{ color: '#fbbf24' }}>{formatDuration(liveBreakDuration)}</span>
              </div>
              <div className="timer-breakdown-item">
                <span className="tb-label"><Utensils size={12} /> Lunch</span>
                <span className="tb-value" style={{ color: '#60a5fa' }}>{formatDuration(liveLunchDuration)}</span>
              </div>
            </div>

            <div className="timer-details">
              <div className="timer-detail-item">
                <span className="timer-detail-label">Check-In Time</span>
                <span className="timer-detail-value">
                  {attendance?.firstLoginTime 
                    ? new Date(attendance.firstLoginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : '--:--'}
                </span>
              </div>
              <div className="timer-detail-item">
                <span className="timer-detail-label">Check-Out Time</span>
                <span className="timer-detail-value">
                  {isCheckedOut && attendance?.lastLogoutTime 
                    ? new Date(attendance.lastLogoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : '--:--'}
                </span>
              </div>
            </div>

            {/* Action Buttons depending on status */}
            <div style={{ marginTop: 'auto' }}>
              {isNotStarted && (
                <button onClick={handleCheckIn} disabled={isActionLoading} className={`btn-huge btn-primary ${!isActionLoading ? 'pulse-btn' : ''}`}>
                  {isActionLoading ? <span className="loader-small"></span> : <><LogIn size={20} style={{marginRight: '0.5rem'}} /> START WORK (CHECK IN)</>}
                </button>
              )}

              {isWorking && (
                <div className="btn-session-group">
                  <div className="btn-session-row">
                    <button onClick={handleStartBreak} disabled={isActionLoading} className="btn-session btn-break">
                      <Coffee size={18} /> Break
                    </button>
                    <button onClick={handleStartLunch} disabled={isActionLoading} className="btn-session btn-lunch">
                      <Utensils size={18} /> Lunch
                    </button>
                  </div>
                  <button onClick={handleCheckOut} disabled={isActionLoading} className="btn-huge btn-danger">
                    {isActionLoading ? <span className="loader-small"></span> : <><LogOut size={20} style={{marginRight: '0.5rem'}} /> CHECK OUT</>}
                  </button>
                </div>
              )}

              {(isOnBreak || isOnLunch) && (
                <div className="btn-session-group">
                  <button onClick={handleResumeWork} disabled={isActionLoading} className="btn-huge btn-resume">
                    {isActionLoading ? <span className="loader-small"></span> : <><Play size={20} style={{marginRight: '0.5rem'}} /> RESUME WORK</>}
                  </button>
                  <button onClick={handleCheckOut} disabled={isActionLoading} className="btn-session btn-danger" style={{width: '100%'}}>
                    <LogOut size={18} /> Check Out
                  </button>
                </div>
              )}

              {isCheckedOut && (
                <div className="btn-huge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', cursor: 'default' }}>
                   Today's Session Completed
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
