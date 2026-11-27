import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Clock, LogIn, LogOut, CheckCircle2, 
  Bell, Activity, AlertTriangle, 
  CheckSquare, Calendar, FileText, Sun, Moon, Briefcase, ListTodo, MoreHorizontal, UserCircle,
  Coffee, Utensils, Play, ArrowUpRight, Edit3, ExternalLink, Sparkles,
  TrendingUp, Zap, ChevronRight, Award, ShieldCheck, Compass
} from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import SkeletonLoader from '../components/common/SkeletonLoader';
import DailyQuoteBanner from '../components/common/DailyQuoteBanner';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { formatDate } from '../utils/dateUtils';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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

  // Interactive Task Breakdown Modal States
  const [taskModalType, setTaskModalType] = useState(null); // 'All' | 'Pending' | 'Completed'
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    progressPercentage: 0,
    status: '',
    comment: ''
  });

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
  const [leaveSummary, setLeaveSummary] = useState({ casualLeaveBalance: 12, sickLeaveBalance: 12, paidLeaveBalance: 15 });
  const [monthlyAttSummary, setMonthlyAttSummary] = useState({ totalPresent: 20, onTimeRate: '98%' });

  // Derived arrays
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  // 8-hour target progress
  const targetShiftSeconds = 8 * 3600; // 28,800s

  // Dynamic estimated check-out time based on check-in + 8h target + breaks
  const estimatedCheckOutTime = useMemo(() => {
    if (!attendance || !attendance.firstLoginTime) return null;
    try {
      const loginDate = new Date(attendance.firstLoginTime);
      const startMs = loginDate.getTime();
      if (isNaN(startMs)) return null;
      const breakAndLunchSec = (Number(liveBreakDuration) || 0) + (Number(liveLunchDuration) || 0);
      const targetMs = startMs + (targetShiftSeconds + breakAndLunchSec) * 1000;
      const d = new Date(targetMs);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return null;
    }
  }, [attendance, liveBreakDuration, liveLunchDuration]);

  // Punctuality check
  const isPunctual = useMemo(() => {
    if (!attendance || !attendance.firstLoginTime) return null;
    try {
      const d = new Date(attendance.firstLoginTime);
      if (isNaN(d.getTime())) return null;
      const hour = d.getHours();
      const min = d.getMinutes();
      return hour < 10 || (hour === 10 && min === 0);
    } catch (e) {
      return null;
    }
  }, [attendance]);

  // Current work week days (Monday - Friday)
  const weekDays = useMemo(() => {
    try {
      const today = new Date();
      const currentDay = today.getDay();
      const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + distanceToMon);

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      return dayNames.map((name, idx) => {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
        const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const isToday = dMidnight === todayMidnight;
        const isPast = dMidnight < todayMidnight;
        const isFuture = dMidnight > todayMidnight;
        return {
          name,
          dateNumber: d.getDate(),
          isToday,
          isPast,
          isFuture,
          dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    } catch (e) {
      return [];
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashSettled, notifSettled, tasksSettled] = await Promise.allSettled([
        api.get('/dashboard/employee'),
        api.get('/notifications'),
        api.get('/tasks/my-tasks')
      ]);
      
      const dashRes = dashSettled.status === 'fulfilled' ? dashSettled.value : null;
      const dashData = dashRes?.data?.data || dashRes?.data || {};
      if (dashData.attendance) {
        setAttendance(dashData.attendance);
      }
      if (dashData.activeSession !== undefined) {
        setActiveSession(dashData.activeSession);
      }
      
      const tasksRes = tasksSettled.status === 'fulfilled' ? tasksSettled.value : null;
      const tasksPayload = tasksRes?.data?.data || tasksRes?.data || [];
      const tasks = Array.isArray(tasksPayload) ? tasksPayload : [];
      setTasksData(tasks);
      
      const notifRes = notifSettled.status === 'fulfilled' ? notifSettled.value : null;
      const notifPayload = notifRes?.data?.data || notifRes?.data || [];
      setNotifications(Array.isArray(notifPayload) ? notifPayload : []);

      // Fetch supplementary leave and attendance summaries for executive dashboard
      try {
        const [leaveRes, attSumRes] = await Promise.allSettled([
          api.get('/leaves/my-leaves'),
          api.get('/attendance/summary')
        ]);
        if (leaveRes.status === 'fulfilled' && leaveRes.value?.data?.data) {
          const ld = leaveRes.value.data.data;
          setLeaveSummary({
            casualLeaveBalance: ld.casualLeaveBalance !== undefined ? ld.casualLeaveBalance : 12,
            sickLeaveBalance: ld.sickLeaveBalance !== undefined ? ld.sickLeaveBalance : 12,
            paidLeaveBalance: ld.paidLeaveBalance !== undefined ? ld.paidLeaveBalance : 15,
          });
        }
        if (attSumRes.status === 'fulfilled' && attSumRes.value?.data?.data) {
          const as = attSumRes.value.data.data;
          setMonthlyAttSummary({
            totalPresent: as.presentDays || as.totalPresent || 20,
            onTimeRate: as.onTimeRate || '98%'
          });
        }
      } catch (supplErr) {
        // Safe graceful fallbacks already in place
      }
      
      // Calculate Task Stats
      let pending = 0;
      let completed = 0;
      const priority = [];
      const deadlines = [];
      
      tasks.forEach(task => {
        if (!task) return;
        if (task.status === 'Completed') completed++;
        else pending++; 

        if ((task.priority === 'High' || task.priority === 'Urgent') && task.status !== 'Completed') {
          priority.push(task);
        }

        if (task.dueDate && task.status !== 'Completed') {
          deadlines.push(task);
        }
      });

      try {
        priority.sort((a, b) => new Date(a.dueDate || '2099') - new Date(b.dueDate || '2099'));
        deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      } catch (e) {}

      const computedStats = { total: tasks.length, pending, completed };
      setTaskStats(computedStats);
      try {
        sessionStorage.setItem('cti_dash_stats', JSON.stringify(computedStats));
        sessionStorage.setItem('cti_dash_tasks', JSON.stringify(tasks));
      } catch {}
      setPriorityTasks(priority.slice(0, 4));
      setUpcomingDeadlines(deadlines.slice(0, 4));

      setLoading(false);
    } catch (err) {
      console.warn('Backend API task stats fetch error:', err);
      setTasksData([]);
      setTaskStats({ total: 0, pending: 0, completed: 0 });
      setPriorityTasks([]);
      setUpcomingDeadlines([]);
      setNotifications([]);
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

  // Load Dashboard Data
  useEffect(() => {
    fetchDashboardData();

    const handleSync = () => {
      fetchDashboardData();
    };
    window.addEventListener('cti_attendance_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cti_attendance_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Automatic Calendar Day Change Detector (Resets status to 'Not Checked In' at Midnight 12:00 AM)
  const [sessionDate, setSessionDate] = useState(new Date().toDateString());

  useEffect(() => {
    const checkDateChange = () => {
      const todayStr = new Date().toDateString();
      if (sessionDate !== todayStr) {
        setSessionDate(todayStr);
        setAttendance({ status: 'Not Checked In', totalWorkDurationInSeconds: 0, totalBreakDurationInSeconds: 0, totalLunchDurationInSeconds: 0 });
        setActiveSession(null);
        fetchDashboardData();
      }
    };

    const dateInterval = setInterval(checkDateChange, 5000);
    window.addEventListener('focus', checkDateChange);
    return () => {
      clearInterval(dateInterval);
      window.removeEventListener('focus', checkDateChange);
    };
  }, [sessionDate]);

  // Real-time Dynamic Multi-timer Logic (Persists across sleep, shutdown & tab close)
  useEffect(() => {
    let interval;
    const updateTimers = () => {
      const prevWork = Number(attendance?.totalWorkDurationInSeconds) || 0;
      const prevBreak = Number(attendance?.totalBreakDurationInSeconds) || 0;
      const prevLunch = Number(attendance?.totalLunchDurationInSeconds) || 0;

      const hasActive = Boolean(activeSession && activeSession.status === 'Active');
      const sessType = hasActive ? activeSession.sessionType : (attendance?.status === 'On Break' ? 'Break' : (attendance?.status === 'On Lunch' ? 'Lunch' : 'Work'));

      const isCurrentlyCheckedOut = Boolean(attendance?.lastLogoutTime) && !hasActive;
      const isCurrentlyWorking = (hasActive && sessType === 'Work') ||
                                (!isCurrentlyCheckedOut && sessType !== 'Break' && sessType !== 'Lunch' && Boolean(attendance?.firstLoginTime)) ||
                                attendance?.status === 'Working';

      const sessionStartTime = activeSession?.startTime || 
                               attendance?.lastSessionStartTime || 
                               (attendance?.firstLoginTime && isCurrentlyWorking ? attendance.firstLoginTime : null);

      if (sessionStartTime && (isCurrentlyWorking || sessType === 'Break' || sessType === 'Lunch')) {
        const startTime = new Date(sessionStartTime).getTime();
        if (!isNaN(startTime)) {
          const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
          
          if (sessType === 'Work') {
            setLiveWorkDuration(prevWork + elapsed);
            setLiveBreakDuration(prevBreak);
            setLiveLunchDuration(prevLunch);
          } else if (sessType === 'Break') {
            setLiveWorkDuration(prevWork);
            setLiveBreakDuration(prevBreak + elapsed);
            setLiveLunchDuration(prevLunch);
          } else if (sessType === 'Lunch') {
            setLiveWorkDuration(prevWork);
            setLiveBreakDuration(prevBreak);
            setLiveLunchDuration(prevLunch + elapsed);
          }
        } else {
          setLiveWorkDuration(prevWork);
          setLiveBreakDuration(prevBreak);
          setLiveLunchDuration(prevLunch);
        }
      } else {
        setLiveWorkDuration(prevWork);
        setLiveBreakDuration(prevBreak);
        setLiveLunchDuration(prevLunch);
      }
    };

    updateTimers();
    interval = setInterval(updateTimers, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updateTimers();
    };
    window.addEventListener('focus', updateTimers);
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', updateTimers);
    window.addEventListener('online', updateTimers);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateTimers);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', updateTimers);
      window.removeEventListener('online', updateTimers);
    };
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
      const attData = res?.data?.data?.attendance || res?.data?.attendance || res?.attendance;
      const sessData = res?.data?.data?.activeSession || res?.data?.activeSession || res?.activeSession;
      if (attData) {
        setAttendance(attData);
        setActiveSession(sessData || { startTime: new Date().toISOString(), sessionType: 'Work' });
      } else {
        throw new Error('No attendance object in response');
      }
    } catch (error) {
      console.warn('Backend check-in API failed, using fallback:', error);
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
      window.dispatchEvent(new CustomEvent('cti_attendance_updated'));
      setIsActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/start-break');
      const attData = res?.data?.data?.attendance || res?.data?.attendance || res?.attendance;
      const sessData = res?.data?.data?.activeSession || res?.data?.activeSession || res?.activeSession;
      if (attData) {
        setAttendance(attData);
        setActiveSession(sessData || { startTime: new Date().toISOString(), sessionType: 'Break' });
      } else {
        throw new Error('No attendance object in response');
      }
    } catch (error) {
      console.warn('Backend start-break API failed, using fallback:', error);
      const now = new Date();
      setAttendance(prev => ({
        ...prev,
        status: 'On Break',
        totalWorkDurationInSeconds: liveWorkDuration
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Break' });
    } finally {
      window.dispatchEvent(new CustomEvent('cti_attendance_updated'));
      setIsActionLoading(false);
    }
  };

  const handleStartLunch = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/start-lunch');
      const attData = res?.data?.data?.attendance || res?.data?.attendance || res?.attendance;
      const sessData = res?.data?.data?.activeSession || res?.data?.activeSession || res?.activeSession;
      if (attData) {
        setAttendance(attData);
        setActiveSession(sessData || { startTime: new Date().toISOString(), sessionType: 'Lunch' });
      } else {
        throw new Error('No attendance object in response');
      }
    } catch (error) {
      console.warn('Backend start-lunch API failed, using fallback:', error);
      const now = new Date();
      setAttendance(prev => ({
        ...prev,
        status: 'On Lunch',
        totalWorkDurationInSeconds: liveWorkDuration
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Lunch' });
    } finally {
      window.dispatchEvent(new CustomEvent('cti_attendance_updated'));
      setIsActionLoading(false);
    }
  };

  const handleResumeWork = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/resume-work');
      const attData = res?.data?.data?.attendance || res?.data?.attendance || res?.attendance;
      const sessData = res?.data?.data?.activeSession || res?.data?.activeSession || res?.activeSession;
      if (attData) {
        setAttendance(attData);
        setActiveSession(sessData || { startTime: new Date().toISOString(), sessionType: 'Work' });
      } else {
        throw new Error('No attendance object in response');
      }
    } catch (error) {
      console.warn('Backend resume-work API failed, using fallback:', error);
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
      window.dispatchEvent(new CustomEvent('cti_attendance_updated'));
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/attendance/checkout');
      const attData = res?.data?.data?.attendance || res?.data?.attendance || res?.attendance;
      if (attData) {
        setAttendance(attData);
        setActiveSession(null);
      } else {
        throw new Error('No attendance object in response');
      }
    } catch (error) {
      console.warn('Backend checkout API failed, using fallback:', error);
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
      window.dispatchEvent(new CustomEvent('cti_attendance_updated'));
      setIsActionLoading(false);
    }
  };

  const openTaskModal = (type) => {
    setTaskModalType(type);
    setIsTaskModalOpen(true);
  };

  const openUpdateModal = (task) => {
    setTaskToUpdate(task);
    setUpdateData({
      progressPercentage: task.progressPercentage || 0,
      status: task.status || 'In Progress',
      comment: ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateTaskFromDashboard = async (e) => {
    e.preventDefault();
    if (!taskToUpdate) return;

    try {
      const res = await api.put(`/tasks/${taskToUpdate._id}/progress`, updateData);
      const updated = res.data?.data;
      setTasksData(prev => prev.map(t => t._id === taskToUpdate._id ? (updated || { ...t, ...updateData }) : t));
      setIsUpdateModalOpen(false);
    } catch (err) {
      setTasksData(prev => prev.map(t => t._id === taskToUpdate._id ? { ...t, ...updateData } : t));
      setIsUpdateModalOpen(false);
    }
  };

  // Filter tasks for Breakdown Modal
  const modalTasks = (tasksData || []).filter(t => {
    if (!t) return false;
    if (taskModalType === 'Pending') return t.status !== 'Completed' && t.status !== 'Approved';
    if (taskModalType === 'Completed') return t.status === 'Completed' || t.status === 'Approved';
    return true; // 'All' or 'Total'
  });

  const formatTimeSafe = (timeInput) => {
    if (!timeInput) return '--:--';
    try {
      const d = new Date(timeInput);
      if (isNaN(d.getTime())) return String(timeInput);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(timeInput);
    }
  };

  const formatDuration = (seconds) => {
    const totalSec = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M`;
    }
    return `${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
  };

  const renderDuration = (seconds) => {
    const totalSec = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return (
        <>
          {h.toString().padStart(2, '0')}<span className="unit-letter">H</span>{' '}
          {m.toString().padStart(2, '0')}<span className="unit-letter">M</span>
        </>
      );
    }
    return (
      <>
        {m.toString().padStart(2, '0')}<span className="unit-letter">M</span>{' '}
        {s.toString().padStart(2, '0')}<span className="unit-letter">S</span>
      </>
    );
  };

  const hr = new Date().getHours();
  const isMorning = hr < 12;
  const isEvening = hr >= 17;
  const greeting = isMorning ? 'Good Morning' : (isEvening ? 'Good Evening' : 'Good Afternoon');
  const GreetingIcon = isEvening ? Moon : Sun;

  const todayDateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  const hasActiveSession = Boolean(activeSession && activeSession.status === 'Active');
  const activeSessionType = hasActiveSession ? activeSession.sessionType : null;

  const currentStatus = attendance?.status || 'Not Checked In';
  const isCheckedOut = Boolean(attendance?.lastLogoutTime) && !hasActiveSession;
  const isOnBreak = activeSessionType === 'Break' || currentStatus === 'On Break';
  const isOnLunch = activeSessionType === 'Lunch' || currentStatus === 'On Lunch';
  const isWorking = (hasActiveSession && activeSessionType === 'Work') ||
                    (!isCheckedOut && !isOnBreak && !isOnLunch && Boolean(attendance?.firstLoginTime)) ||
                    currentStatus === 'Working';
  const isNotStarted = !attendance?.firstLoginTime && !hasActiveSession;

  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Employee';
  const roleDisplay = user?.designation || (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Software Engineer');

  const userInitials = (displayName || 'EP')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // 8-hour target progress
  const safeLiveWork = Number(liveWorkDuration) || 0;
  const shiftProgressPercent = Math.min(100, Math.max(0, Math.round((safeLiveWork / targetShiftSeconds) * 100)));
  const workSecondsRemaining = Math.max(0, targetShiftSeconds - safeLiveWork);
  const hoursRemaining = Math.floor(workSecondsRemaining / 3600);
  const minsRemaining = Math.floor((workSecondsRemaining % 3600) / 60);

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

  if (loading) {
    return (
      <div className="dashboard-container">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  return (
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* -----------------------------
          Tier 1: Ultra-Modern Hero Banner
      ----------------------------- */}
      <motion.div className="dashboard-hero" variants={itemVariants}>
        <div className="hero-left-wrapper">
          <div className="hero-avatar-box">
            <div className="hero-avatar-circle">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={displayName} className="hero-avatar-img" />
              ) : (
                <span className="hero-avatar-initials">{userInitials}</span>
              )}
              <span className={`hero-status-dot ${isWorking ? 'active' : ''}`} title={isWorking ? 'Session Active' : 'User Active'}></span>
            </div>
          </div>

          <div className="hero-content">
            <div className="hero-meta-row">
              <span className="hero-date-badge">
                <Calendar size={13} />
                {todayDateStr}
              </span>
            </div>

            <h1 className="hero-title">
              <GreetingIcon size={26} className={isEvening ? "text-indigo-300" : "text-amber-400"} />
              <div className="hero-greeting-text">
                {greeting}, <span>{displayName}</span>
              </div>
            </h1>

            <div className="hero-badges">
              <span className="hero-badge badge-role">
                <Briefcase size={13} /> {roleDisplay}
              </span>
              <span className="hero-badge badge-id">
                <UserCircle size={13} /> ID: {user?.employeeId || user?.id || 'CTI-EMP'}
              </span>
            </div>

            {/* Daily Motivational & Strength Quote */}
            <DailyQuoteBanner variant="hero-quote" showBadge={false} />
          </div>
        </div>
      </motion.div>

      {/* -----------------------------
          Executive Quick Access Hub (4 Direct Workflows)
      ----------------------------- */}
      <motion.div className="quick-hub-grid" variants={itemVariants}>
        <Link to="/employee/reports" className="quick-hub-card hub-report">
          <div className="hub-icon-wrapper">
            <FileText size={20} />
          </div>
          <div className="hub-text-group">
            <h4>Daily Report</h4>
            <p>Log work & tasks</p>
          </div>
          <div className="hub-arrow-badge">
            <ArrowUpRight size={16} className="hub-arrow" />
          </div>
        </Link>

        <Link to="/employee/attendance" className="quick-hub-card hub-attendance">
          <div className="hub-icon-wrapper">
            <Clock size={20} />
          </div>
          <div className="hub-text-group">
            <h4>Attendance</h4>
            <p>Sessions & history</p>
          </div>
          <div className="hub-arrow-badge">
            <ArrowUpRight size={16} className="hub-arrow" />
          </div>
        </Link>

        <Link to="/employee/leave" className="quick-hub-card hub-leave">
          <div className="hub-icon-wrapper">
            <Calendar size={20} />
          </div>
          <div className="hub-text-group">
            <h4>Leave Request</h4>
            <p>Apply time-off</p>
          </div>
          <div className="hub-arrow-badge">
            <ArrowUpRight size={16} className="hub-arrow" />
          </div>
        </Link>

        <Link to="/employee/payroll" className="quick-hub-card hub-payroll">
          <div className="hub-icon-wrapper">
            <Award size={20} />
          </div>
          <div className="hub-text-group">
            <h4>My Payroll</h4>
            <p>Payslips & salary</p>
          </div>
          <div className="hub-arrow-badge">
            <ArrowUpRight size={16} className="hub-arrow" />
          </div>
        </Link>
      </motion.div>

      {/* -----------------------------
          Tier 2: Metric Cards Grid (Compact)
      ----------------------------- */}
      <motion.div className="metrics-grid" variants={containerVariants}>
        <motion.div 
          className="metric-card metric-tasks clickable" 
          variants={itemVariants}
          onClick={() => openTaskModal('All')}
        >
          <div className="metric-glow-accent primary"></div>
          <div className="metric-icon-wrapper primary">
            <ListTodo size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Tasks</span>
            <span className="metric-value">{taskStats.total}</span>
            <span className="metric-subtext">All assigned tasks</span>
          </div>
          <div className="metric-action-arrow">
            <ArrowUpRight size={16} />
          </div>
        </motion.div>

        <motion.div 
          className="metric-card metric-pending clickable" 
          variants={itemVariants}
          onClick={() => openTaskModal('Pending')}
        >
          <div className="metric-glow-accent warning"></div>
          <div className="metric-icon-wrapper warning">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Pending</span>
            <span className="metric-value">{taskStats.pending}</span>
            <span className="metric-subtext">Requires action</span>
          </div>
          <div className="metric-action-arrow">
            <ArrowUpRight size={16} />
          </div>
        </motion.div>

        <motion.div 
          className="metric-card metric-completed clickable" 
          variants={itemVariants}
          onClick={() => openTaskModal('Completed')}
        >
          <div className="metric-glow-accent success"></div>
          <div className="metric-icon-wrapper success">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Completed</span>
            <span className="metric-value">{taskStats.completed}</span>
            <span className="metric-subtext">Done & verified</span>
          </div>
          <div className="metric-action-arrow">
            <ArrowUpRight size={16} />
          </div>
        </motion.div>

        <motion.div 
          className="metric-card metric-work clickable" 
          variants={itemVariants}
          onClick={() => navigate('/employee/attendance')}
        >
          <div className="metric-glow-accent info"></div>
          <div className="metric-icon-wrapper info">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Work Logged</span>
            <span className="metric-value">{renderDuration(liveWorkDuration)}</span>
            <span className="metric-subtext">Today's total session</span>
          </div>
          <div className="metric-action-arrow">
            <ArrowUpRight size={16} />
          </div>
        </motion.div>
      </motion.div>

      {/* -----------------------------
          Tier 3: Workspace Grid
      ----------------------------- */}
      <motion.div className="workspace-grid" variants={containerVariants}>
        
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
              <span className="timer-value">{renderDuration(displayMainTimer)}</span>
              <span className="timer-label">{timerLabelText}</span>
            </div>

            {/* 3-Way Duration Breakdown */}
            <div className="timer-breakdown-grid">
              <div className="timer-breakdown-item">
                <span className="tb-label"><Clock size={12} /> Work</span>
                <span className="tb-value" style={{ color: 'var(--primary-light)' }}>{renderDuration(liveWorkDuration)}</span>
              </div>
              <div className="timer-breakdown-item">
                <span className="tb-label"><Coffee size={12} /> Break</span>
                <span className="tb-value" style={{ color: '#fbbf24' }}>{renderDuration(liveBreakDuration)}</span>
              </div>
              <div className="timer-breakdown-item">
                <span className="tb-label"><Utensils size={12} /> Lunch</span>
                <span className="tb-value" style={{ color: '#60a5fa' }}>{renderDuration(liveLunchDuration)}</span>
              </div>
            </div>

            <div className="timer-details">
              <div className="timer-detail-item">
                <span className="timer-detail-label">Check-In Time</span>
                <span className="timer-detail-value">
                  {formatTimeSafe(attendance?.firstLoginTime)}
                </span>
              </div>
              <div className="timer-detail-item">
                <span className="timer-detail-label">Check-Out Time</span>
                <span className="timer-detail-value">
                  {isCheckedOut && attendance?.lastLogoutTime 
                    ? formatTimeSafe(attendance.lastLogoutTime) 
                    : '--:--'}
                </span>
              </div>
            </div>

            {/* Action Buttons depending on status */}
            <div className="timer-actions-wrapper">
              {isNotStarted && (
                <div className="btn-session-group">
                  <button onClick={handleCheckIn} disabled={isActionLoading} className={`btn-huge btn-primary ${!isActionLoading ? 'pulse-btn' : ''}`}>
                    {isActionLoading ? <span className="loader-small"></span> : <><LogIn size={20} style={{marginRight: '0.5rem'}} /> START WORK (CHECK IN)</>}
                  </button>
                  <div className="btn-session-row">
                    <button onClick={handleStartBreak} disabled={isActionLoading} className="btn-session btn-break">
                      <Coffee size={18} /> Break
                    </button>
                    <button onClick={handleStartLunch} disabled={isActionLoading} className="btn-session btn-lunch">
                      <Utensils size={18} /> Lunch
                    </button>
                  </div>
                </div>
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
                  <div className="btn-session-row">
                    {isOnBreak ? (
                      <button onClick={handleStartLunch} disabled={isActionLoading} className="btn-session btn-lunch">
                        <Utensils size={18} /> Lunch
                      </button>
                    ) : (
                      <button onClick={handleStartBreak} disabled={isActionLoading} className="btn-session btn-break">
                        <Coffee size={18} /> Break
                      </button>
                    )}
                    <button onClick={handleCheckOut} disabled={isActionLoading} className="btn-session btn-danger">
                      <LogOut size={18} /> Check Out
                    </button>
                  </div>
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

        {/* Right Col: Shift Performance Target & Weekly Rhythm Hub (Replaces Priority Tasks & Deadlines) */}
        <motion.div variants={itemVariants} className="dash-executive-col">
          
          {/* Card 1: Shift Target & Productivity Pulse */}
          <div className="dash-pulse-card shift-target-pulse">
            <div className="dpc-ambient-glow indigo"></div>
            
            <div className="dpc-header">
              <div className="dpc-title-group">
                <div className="dpc-icon-badge indigo">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="dpc-title">Shift Target & Productivity Pulse</h3>
                  <span className="dpc-subtitle">Standard 8h Target &bull; Live Progress</span>
                </div>
              </div>
              <span className={`dpc-status-tag ${shiftProgressPercent >= 100 ? 'completed' : (isWorking ? 'active' : 'idle')}`}>
                <span className="dpc-pulse-dot"></span>
                {shiftProgressPercent >= 100 ? 'Target Reached' : (isWorking ? 'Session Active' : 'Target In Progress')}
              </span>
            </div>

            {/* Target Progress Bar & Percentage */}
            <div className="shift-gauge-container">
              <div className="shift-gauge-meta">
                <span className="sg-label">Daily Shift Completion</span>
                <span className="sg-percent">{shiftProgressPercent}%</span>
              </div>
              
              <div className="shift-progress-track">
                <div 
                  className={`shift-progress-fill ${shiftProgressPercent >= 100 ? 'completed' : ''}`}
                  style={{ width: `${shiftProgressPercent}%` }}
                >
                  <span className="shift-progress-glow"></span>
                </div>
              </div>

              <div className="shift-gauge-stats">
                <span>
                  Logged: <strong>{renderDuration(liveWorkDuration)}</strong> of <strong>8h 00m</strong>
                </span>
                <span>
                  {shiftProgressPercent >= 100 ? (
                    <span className="text-emerald-400 font-semibold">&bull; Overtime Active</span>
                  ) : (
                    <span>&bull; {hoursRemaining}h {minsRemaining}m remaining</span>
                  )}
                </span>
              </div>
            </div>

            {/* Shift Milestones & Schedule Grid */}
            <div className="shift-milestones-grid">
              <div className="sm-item">
                <span className="sm-label"><Clock size={12} /> Standard Shift</span>
                <span className="sm-value">09:30 AM &ndash; 06:30 PM</span>
              </div>

              <div className="sm-item">
                <span className="sm-label"><ShieldCheck size={12} /> Punctuality Status</span>
                <span className="sm-value">
                  {attendance?.firstLoginTime ? (
                    isPunctual ? (
                      <span className="punctual-tag on-time"><CheckCircle2 size={12}/> On-Time Punch</span>
                    ) : (
                      <span className="punctual-tag late"><AlertTriangle size={12}/> Grace / Late</span>
                    )
                  ) : (
                    <span className="punctual-tag awaiting">Awaiting Punch-In</span>
                  )}
                </span>
              </div>

              <div className="sm-item">
                <span className="sm-label"><TrendingUp size={12} /> Estimated Check-Out</span>
                <span className="sm-value highlight">
                  {estimatedCheckOutTime ? `${estimatedCheckOutTime}` : '06:30 PM (Standard)'}
                </span>
              </div>

              <div className="sm-item">
                <span className="sm-label"><Coffee size={12} /> Break Allowance</span>
                <div className="break-budget-bar-wrap">
                  <span className="sm-value" style={{ fontSize: '0.82rem' }}>
                    Tea: {renderDuration(liveBreakDuration)} / 30m &bull; Lunch: {renderDuration(liveLunchDuration)} / 45m
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Weekly Attendance Rhythm & Leave Balance Overview */}
          <div className="dash-pulse-card weekly-rhythm-pulse">
            <div className="dpc-ambient-glow teal"></div>

            <div className="dpc-header">
              <div className="dpc-title-group">
                <div className="dpc-icon-badge teal">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="dpc-title">Weekly Attendance & Leave Balance</h3>
                  <span className="dpc-subtitle">Current Week &bull; Mon to Fri Activity</span>
                </div>
              </div>
              <Link to="/employee/attendance" className="dpc-view-link">
                View Register <ArrowUpRight size={13} />
              </Link>
            </div>

            {/* Mon - Fri Visual Day Strip */}
            <div className="weekly-days-strip">
              {(weekDays || []).map(day => (
                <div 
                  key={day.name} 
                  className={`week-day-pill ${day.isToday ? 'today' : (day.isPast ? 'past' : 'future')}`}
                >
                  <span className="wd-name">{day.name}</span>
                  <span className="wd-date">{day.dateNumber}</span>
                  <div className="wd-indicator">
                    {day.isToday ? (
                      <span className="wd-today-pulse" title="Today"></span>
                    ) : day.isPast ? (
                      <CheckCircle2 size={13} className="wd-check" />
                    ) : (
                      <span className="wd-future-dot"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Balances & Monthly Quick Metrics */}
            <div className="leave-balance-quick-row">
              <div className="lb-item">
                <span className="lb-label">Casual Leave (CL)</span>
                <span className="lb-val emerald">{leaveSummary?.casualLeaveBalance ?? 12} <small>days left</small></span>
              </div>
              <div className="lb-item">
                <span className="lb-label">Sick Leave (SL)</span>
                <span className="lb-val amber">{leaveSummary?.sickLeaveBalance ?? 12} <small>days left</small></span>
              </div>
              <div className="lb-item">
                <span className="lb-label">Month Attendance</span>
                <span className="lb-val cyan">{monthlyAttSummary?.totalPresent ?? 20} <small>days logged</small></span>
              </div>
              <div className="lb-action-box">
                <Link to="/employee/leave" className="btn-apply-leave-dash">
                  <Sparkles size={13} /> Apply Leave
                </Link>
              </div>
            </div>

            <div className="dash-workplace-status">
              <span className="ws-dot"></span>
              <span className="ws-text">CodeThrive Workplace &bull; On-Premises Office &bull; System Active</span>
            </div>

          </div>

        </motion.div>

      </motion.div>

      {/* -----------------------------
          Task Breakdown Modal (Pop-up on Metric Card Click)
      ----------------------------- */}
      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)}
        title={
          taskModalType === 'Pending' 
            ? `Pending & In-Progress Tasks (${modalTasks.length})` 
            : (taskModalType === 'Completed' 
                ? `Completed Tasks (${modalTasks.length})` 
                : `All Assigned Tasks (${modalTasks.length})`)
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {modalTasks.length} {taskModalType?.toLowerCase()} task(s)
            </span>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setIsTaskModalOpen(false);
                navigate(`/employee/tasks?filter=${taskModalType || 'All'}`);
              }}
              style={{ borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Open Full Tasks Page <ExternalLink size={14} />
            </button>
          </div>
        }
      >
        <div className="task-breakdown-list">
          {modalTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={42} style={{ marginBottom: '0.75rem', opacity: 0.5, color: '#38bdf8', margin: '0 auto 0.75rem auto' }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>No {taskModalType?.toLowerCase()} tasks found.</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>All clear! You don't have any tasks in this category.</p>
            </div>
          ) : (
            modalTasks.map(task => (
              <div key={task._id} className="task-breakdown-item">
                <div className="breakdown-header">
                  <span className="task-id-badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {task.taskId || 'TSK-00'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <StatusBadge status={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>

                <h4 className="breakdown-title">{task.title}</h4>
                <p className="breakdown-desc">{task.description || 'No detailed instructions provided.'}</p>

                <div className="breakdown-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Progress: <strong style={{ color: '#38bdf8' }}>{task.progressPercentage || 0}%</strong></span>
                    {task.dueDate && <span>Due: <strong style={{ color: '#fbbf24' }}>{formatDate(task.dueDate)}</strong></span>}
                  </div>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => openUpdateModal(task)}
                    style={{ borderRadius: '8px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Edit3 size={13} /> Update Status
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Quick Task Update Modal */}
      {taskToUpdate && (
        <Modal 
          isOpen={isUpdateModalOpen} 
          onClose={() => setIsUpdateModalOpen(false)} 
          title={`Update Progress: ${taskToUpdate.taskId || 'Task'}`}
        >
          <div style={{ marginBottom: '1rem', padding: '0.85rem', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 0.3rem 0', color: '#fff' }}>{taskToUpdate.title}</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{taskToUpdate.description}</p>
          </div>
          
          <form onSubmit={handleUpdateTaskFromDashboard} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ color: '#f1f5f9', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Status</label>
              <select 
                className="input-field" 
                value={updateData.status} 
                onChange={e => setUpdateData({...updateData, status: e.target.value})} 
                required
                style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fff', padding: '0.65rem', borderRadius: '8px' }}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Blocked">Blocked</option>
                <option value="Ready for Review">Ready for Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                <span>Completion Percentage</span>
                <span style={{ color: '#38bdf8' }}>{updateData.progressPercentage}%</span>
              </div>
              <input 
                type="range" min="0" max="100" step="5"
                value={updateData.progressPercentage} 
                onChange={e => setUpdateData({...updateData, progressPercentage: parseInt(e.target.value)})}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
};

export default Dashboard;
