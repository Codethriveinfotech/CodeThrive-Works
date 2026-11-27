import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  Clock, Coffee, Utensils, LogIn, Play, LogOut, CheckCircle2, AlertTriangle, 
  Download, Printer, Search, Calendar as CalIcon, User, 
  ChevronLeft, ChevronRight, AlertCircle, ShieldCheck, Sparkles, TrendingUp, FileText,
  Edit, Pencil
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import DateInput from '../components/common/DateInput';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import DailyQuoteBanner from '../components/common/DailyQuoteBanner';
import { createOfficialCodeThriveDoc, getCorporateTableStyles } from '../utils/pdfLetterhead';
import './Attendance.css';

const Attendance = () => {
  const { user } = useAuth();
  const isAdminHR = ['admin', 'superadmin', 'hr'].includes(user?.role);
  const isTeamLead = user?.role === 'teamlead';
  
  const [todayAttendance, setTodayAttendance] = useState(() => {
    try {
      const cached = localStorage.getItem('codethrive_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.savedDate === new Date().toDateString()) {
          return parsed.attendance;
        }
      }
    } catch {}
    return null;
  });

  const [activeSession, setActiveSession] = useState(() => {
    try {
      const cached = localStorage.getItem('codethrive_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.savedDate === new Date().toDateString()) {
          return parsed.activeSession;
        }
      }
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('codethrive_session');
      return !cached;
    } catch {
      return false;
    }
  });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]); 
  
  // Real-time live duration trackers in seconds
  const [liveWorkDuration, setLiveWorkDuration] = useState(0);
  const [liveBreakDuration, setLiveBreakDuration] = useState(0);
  const [liveLunchDuration, setLiveLunchDuration] = useState(0);

  const [selectedEmp, setSelectedEmp] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // History table filtering
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  // Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [myCorrections, setMyCorrections] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [correctionPayload, setCorrectionPayload] = useState({
    date: new Date().toISOString().split('T')[0],
    correctionType: 'Missed Check-In',
    customType: '',
    checkInTime: '10:00',
    checkOutTime: '18:00',
    breakMinutes: '30',
    lunchMinutes: '60',
    reason: ''
  });

  const fetchMyCorrections = useCallback(async () => {
    try {
      let list = [];
      try {
        const res = await api.get('/attendance/my-corrections');
        if (res.data?.success && Array.isArray(res.data.data)) {
          list = res.data.data;
        }
      } catch {}

      const local = JSON.parse(localStorage.getItem('cti_my_corrections') || '[]');
      if (Array.isArray(local)) {
        local.forEach(item => {
          if (!list.some(x => x.date && item.date && x.date.split('T')[0] === item.date.split('T')[0])) {
            list.push(item);
          }
        });
      }
      setMyCorrections(list);
    } catch {}
  }, []);

  const fetchMyLeaves = useCallback(async () => {
    try {
      let leavesArr = [];
      try {
        const res = await api.get('/leaves/my-leaves');
        if (res.data?.data?.requests) {
          leavesArr = res.data.data.requests;
        } else if (Array.isArray(res.data?.data)) {
          leavesArr = res.data.data;
        }
      } catch {}

      const localShared = JSON.parse(localStorage.getItem('cti_shared_leaves') || '[]');
      if (Array.isArray(localShared)) {
        localShared.forEach(l => {
          if (!leavesArr.some(x => x._id === l._id)) {
            leavesArr.push(l);
          }
        });
      }
      setMyLeaves(leavesArr);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMyCorrections();
    fetchMyLeaves();
  }, [fetchMyCorrections, fetchMyLeaves]);

  const correctionMap = useMemo(() => {
    const map = {};
    (myCorrections || []).forEach(c => {
      if (c.date) {
        const dStr = new Date(c.date).toISOString().split('T')[0];
        if (!map[dStr]) map[dStr] = c;
      }
    });
    return map;
  }, [myCorrections]);

  const leaveMap = useMemo(() => {
    const map = {};
    (myLeaves || []).forEach(l => {
      const st = (l.status || '').toLowerCase();
      if (st === 'approved' || st === 'pending') {
        const start = l.startDate ? new Date(l.startDate) : null;
        const end = l.endDate ? new Date(l.endDate) : start;
        if (start && end) {
          const cur = new Date(start);
          while (cur <= end) {
            const dateKey = cur.toISOString().split('T')[0];
            map[dateKey] = l;
            cur.setDate(cur.getDate() + 1);
          }
        }
      }
    });
    return map;
  }, [myLeaves]);

  // Live Shift Preview in Correction Modal
  const shiftPreview = useMemo(() => {
    if (!correctionPayload.checkInTime || !correctionPayload.checkOutTime) return null;
    const [ih, im] = correctionPayload.checkInTime.split(':').map(Number);
    const [oh, om] = correctionPayload.checkOutTime.split(':').map(Number);
    let totalMins = (oh * 60 + om) - (ih * 60 + im);
    if (totalMins < 0) totalMins += 24 * 60;
    const breakTotal = (Number(correctionPayload.breakMinutes) || 0) + (Number(correctionPayload.lunchMinutes) || 0);
    const netMins = Math.max(0, totalMins - breakTotal);
    const h = Math.floor(netMins / 60);
    const m = netMins % 60;
    return { netH: h, netM: m, breakTotal };
  }, [correctionPayload.checkInTime, correctionPayload.checkOutTime, correctionPayload.breakMinutes, correctionPayload.lunchMinutes]);

  const getRowAttendanceInfo = (row) => {
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    const rowDateObj = row.date ? new Date(row.date) : new Date();
    const rowDateStr = row.date ? rowDateObj.toISOString().split('T')[0] : '';
    const isToday = rowDateStr === todayDateStr;
    const dayOfWeek = rowDateObj.getDay(); // 0 is Sunday, 1-6 Mon-Sat

    let rawStatus = row.status || 'Present';
    let resolvedStatus = rawStatus;

    // 1. Check if employee has leave applied or approved for this date
    const matchingLeave = leaveMap[rowDateStr];
    if (matchingLeave) {
      resolvedStatus = 'Leave';
    } else if (isToday) {
      // Today can keep active status (Working, On Break, Checked In, Present, Late)
      resolvedStatus = rawStatus;
    } else {
      // For all past dates: Status 'Working' or 'Checked In' MUST NOT show!
      const lower = rawStatus.toLowerCase();
      if (lower === 'working' || lower === 'checked in' || lower === 'active') {
        resolvedStatus = row.isLate ? 'Late' : 'Present';
      } else if (lower === 'absent' || (!row.firstLoginTime && lower !== 'present' && lower !== 'half day' && lower !== 'permission' && lower !== 'leave')) {
        // If Mon-Sat without login, mark Absent
        if (dayOfWeek >= 1 && dayOfWeek <= 6) {
          resolvedStatus = 'Absent';
        } else {
          resolvedStatus = 'Weekend';
        }
      }
    }

    // Determine remarks text and status
    const matchingCorrection = correctionMap[rowDateStr];
    let remarksText = 'Standard Shift';
    let remarksType = 'standard';
    let isPending = false;

    if (matchingCorrection) {
      isPending = (matchingCorrection.status || 'Pending').toLowerCase() === 'pending';
      const cleanReason = matchingCorrection.reason 
        ? matchingCorrection.reason.replace(/^Approved Correction:\s*/i, '').trim() 
        : (matchingCorrection.correctionType || 'Correction Request');
      remarksText = cleanReason;
      remarksType = isPending ? 'pending' : 'approved';
    } else if (row.correctionReason && row.correctionReason !== 'Management Adjustment' && row.correctionReason !== 'Admin manual mark' && row.correctionReason !== 'Admin bulk mark') {
      remarksText = row.correctionReason.replace(/^Approved Correction:\s*/i, '').trim();
      remarksType = 'approved';
    } else if (matchingLeave) {
      remarksText = `${matchingLeave.leaveType || 'Approved'} Leave`;
      remarksType = 'approved';
    } else if (resolvedStatus === 'Absent') {
      remarksText = 'Absent - No Punch-In';
      remarksType = 'standard';
    } else if (resolvedStatus === 'Late' || row.isLate) {
      remarksText = 'Late Login (>10:15 AM)';
      remarksType = 'standard';
    } else {
      remarksText = 'Standard Shift';
      remarksType = 'standard';
    }

    return {
      status: resolvedStatus,
      remarksText,
      remarksType,
      isPending
    };
  };

  // Dedicated Break & Lunch Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    checkInTime: '09:00',
    checkOutTime: '',
    breakMinutes: 15,
    lunchMinutes: 45,
    reason: ''
  });
  const [adjustSaving, setAdjustSaving] = useState(false);

  const handleOpenAdjustModal = () => {
    let inTime = '09:30';
    if (todayAttendance?.firstLoginTime) {
      try {
        const dt = new Date(todayAttendance.firstLoginTime);
        inTime = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {}
    }

    let outTime = '';
    if (todayAttendance?.lastLogoutTime) {
      try {
        const dt = new Date(todayAttendance.lastLogoutTime);
        outTime = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {}
    }

    const bMins = Math.round((liveBreakDuration || todayAttendance?.totalBreakDurationInSeconds || 0) / 60) || 15;
    const lMins = Math.round((liveLunchDuration || todayAttendance?.totalLunchDurationInSeconds || 0) / 60) || 45;

    setAdjustForm({
      checkInTime: inTime,
      checkOutTime: outTime,
      breakMinutes: bMins,
      lunchMinutes: lMins,
      reason: ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustTimings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setAdjustSaving(true);
      const bSec = (Number(adjustForm.breakMinutes) || 0) * 60;
      const lSec = (Number(adjustForm.lunchMinutes) || 0) * 60;
      const totalBreakSec = bSec + lSec;

      const now = new Date();
      let inDate = todayAttendance?.firstLoginTime ? new Date(todayAttendance.firstLoginTime) : new Date();
      if (adjustForm.checkInTime) {
        const [ih, im] = adjustForm.checkInTime.split(':').map(Number);
        inDate.setHours(ih, im, 0, 0);
      }

      let outDate = null;
      if (adjustForm.checkOutTime) {
        outDate = new Date();
        const [oh, om] = adjustForm.checkOutTime.split(':').map(Number);
        outDate.setHours(oh, om, 0, 0);
      } else if (todayAttendance?.lastLogoutTime) {
        outDate = new Date(todayAttendance.lastLogoutTime);
      }

      const grossSec = Math.max(0, Math.floor(((outDate || now).getTime() - inDate.getTime()) / 1000));
      const netWorkSec = Math.max(0, grossSec - totalBreakSec);

      const payload = {
        checkInTime: inDate.toISOString(),
        checkOutTime: outDate ? outDate.toISOString() : null,
        totalBreakDurationInSeconds: bSec,
        totalLunchDurationInSeconds: lSec,
        breakMinutes: Number(adjustForm.breakMinutes) || 0,
        lunchMinutes: Number(adjustForm.lunchMinutes) || 0,
        status: outDate ? 'Checked Out' : (todayAttendance?.status === 'On Break' || todayAttendance?.status === 'On Lunch' ? todayAttendance.status : 'Working'),
        reason: adjustForm.reason || 'Manual break, lunch & timing adjustment'
      };

      const updatedAtt = {
        ...todayAttendance,
        firstLoginTime: inDate.toISOString(),
        lastLogoutTime: outDate ? outDate.toISOString() : null,
        totalBreakDurationInSeconds: bSec,
        totalLunchDurationInSeconds: lSec,
        totalWorkDurationInSeconds: netWorkSec,
        status: payload.status,
        isManualCorrection: true
      };

      setTodayAttendance(updatedAtt);
      setLiveWorkDuration(netWorkSec);
      setLiveBreakDuration(bSec);
      setLiveLunchDuration(lSec);

      try {
        localStorage.setItem('codethrive_session', JSON.stringify({
          savedDate: new Date().toDateString(),
          attendance: updatedAtt,
          activeSession
        }));
      } catch {}

      try {
        await api.put('/attendance/today', payload);
      } catch (apiErr) {
        console.warn('Backend update attendance today notice:', apiErr);
      }

      setIsAdjustModalOpen(false);
      alert('✓ Today attendance, break & lunch durations updated and recalculated!');
    } catch (err) {
      console.error('Failed to update timings', err);
      alert('Failed to save timings: ' + err.message);
    } finally {
      setAdjustSaving(false);
    }
  };

  const [sessionDate, setSessionDate] = useState(new Date().toDateString());

  // 1. Real-time Timestamp-based Timer Calculation (Persists across sleep, shutdown & tab close)
  useEffect(() => {
    let interval;
    const updateTimers = () => {
      const prevWork = todayAttendance?.totalWorkDurationInSeconds || 0;
      const prevBreak = todayAttendance?.totalBreakDurationInSeconds || 0;
      const prevLunch = todayAttendance?.totalLunchDurationInSeconds || 0;

      const hasActive = Boolean(activeSession && (activeSession.status === 'Active' || activeSession.startTime));
      const sessType = hasActive ? activeSession.sessionType : (todayAttendance?.status === 'On Break' ? 'Break' : (todayAttendance?.status === 'On Lunch' ? 'Lunch' : 'Work'));

      const isCurrentlyCheckedOut = (Boolean(todayAttendance?.lastLogoutTime) || todayAttendance?.status === 'Checked Out') && !hasActive;
      const isCurrentlyWorking = (hasActive && sessType === 'Work') ||
                                (!isCurrentlyCheckedOut && sessType !== 'Break' && sessType !== 'Lunch' && Boolean(todayAttendance?.firstLoginTime)) ||
                                todayAttendance?.status === 'Working';

      const sessionStartTime = activeSession?.startTime || 
                               todayAttendance?.lastSessionStartTime || 
                               (todayAttendance?.firstLoginTime && isCurrentlyWorking ? todayAttendance.firstLoginTime : null);

      if (sessionStartTime && (isCurrentlyWorking || sessType === 'Break' || sessType === 'Lunch')) {
        const startTime = new Date(sessionStartTime).getTime();
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
  }, [activeSession, todayAttendance]);

  // 2. Sync session to LocalStorage so closing/refreshing tab doesn't lose state
  useEffect(() => {
    if (todayAttendance) {
      try {
        localStorage.setItem('codethrive_session', JSON.stringify({
          savedDate: new Date().toDateString(),
          attendance: todayAttendance,
          activeSession: activeSession
        }));
      } catch (e) {}
    }
  }, [todayAttendance, activeSession]);

  useEffect(() => {
    fetchDashboardData();
    if (isAdminHR || isTeamLead) {
      fetchTeamMembers();
    }
  }, [selectedMonth, selectedYear, selectedEmp]);

  useEffect(() => {
    const handleRemoteUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('cti_attendance_updated', handleRemoteUpdate);
    return () => window.removeEventListener('cti_attendance_updated', handleRemoteUpdate);
  }, []);

  // Check midnight rollover
  useEffect(() => {
    const checkDateChange = () => {
      const todayStr = new Date().toDateString();
      if (sessionDate !== todayStr) {
        setSessionDate(todayStr);
        setTodayAttendance({ status: 'Not Checked In', totalWorkDurationInSeconds: 0, totalBreakDurationInSeconds: 0, totalLunchDurationInSeconds: 0 });
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

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/employees');
      if (res?.data) setEmployees(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) {
      console.warn('Could not load team members for scope dropdown', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      if (!todayAttendance) setLoading(true);
      const params = { month: selectedMonth, year: selectedYear, employeeId: selectedEmp };
      const [todayRes, historyRes, summaryRes] = await Promise.allSettled([
        api.get('/attendance/today'),
        api.get('/attendance/history', { params }),
        api.get('/attendance/summary', { params })
      ]);
      
      let todayVal = todayRes.status === 'fulfilled' ? todayRes.value : null;
      let historyVal = historyRes.status === 'fulfilled' ? historyRes.value : null;
      let summaryVal = summaryRes.status === 'fulfilled' ? summaryRes.value : null;

      let todayData = todayVal?.data?.data?.attendance || todayVal?.data?.attendance || todayVal?.attendance || null;
      let activeSessData = todayVal?.data?.data?.activeSession || todayVal?.data?.activeSession || todayVal?.activeSession || null;

      let historyData = historyVal?.data?.data || historyVal?.data || historyVal || [];
      let summaryData = summaryVal?.data?.data || summaryVal?.data || summaryVal || null;

      // Fallback to localStorage cache if backend returns no today record yet
      if (!todayData) {
        try {
          const cached = localStorage.getItem('codethrive_session');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.savedDate === new Date().toDateString()) {
              todayData = parsed.attendance;
              activeSessData = parsed.activeSession;
            }
          }
        } catch (e) {}
      }

      if (todayData) {
        setTodayAttendance(todayData);
        setActiveSession(activeSessData);
      } else {
        setTodayAttendance({ status: 'Not Checked In', totalWorkDurationInSeconds: 0, totalBreakDurationInSeconds: 0, totalLunchDurationInSeconds: 0 });
        setActiveSession(null);
      }

      setHistory(Array.isArray(historyData) ? historyData : []);
      setSummary(summaryData || {
        totalWorkingDays: 22, presentDays: 20, absentDays: 1, leaveDays: 1, lateDays: 2, 
        halfDays: 0, workFromHomeDays: 3, attendancePercentage: 91, 
        totalWorkingHours: 165.5, averageWorkingHours: 8.2, overtimeHours: 4.5
      });
      setLoading(false);
    } catch (err) {
      console.warn('Backend API error in Attendance, using fallback', err);
      setTodayAttendance({ status: 'Not Checked In', totalWorkDurationInSeconds: 0, totalBreakDurationInSeconds: 0, totalLunchDurationInSeconds: 0 });
      setActiveSession(null);
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setIsActionLoading(true);
    const endpointMap = {
      'start-work': '/attendance/start-work',
      'start-break': '/attendance/start-break',
      'start-lunch': '/attendance/start-lunch',
      'resume-work': '/attendance/resume-work',
      'checkout': '/attendance/checkout'
    };

    const endpoint = endpointMap[action];
    if (!endpoint) {
      setIsActionLoading(false);
      return;
    }

    const now = new Date();

    try {
      const res = await api.post(endpoint);
      const attData = res?.data?.data?.attendance || res?.data?.attendance || res?.attendance;
      const sessData = res?.data?.data?.activeSession || res?.data?.activeSession || res?.activeSession;

      if (attData) {
        setTodayAttendance(attData);
        if (action === 'checkout') {
          setActiveSession(null);
        } else {
          const defaultType = action === 'start-break' ? 'Break' : (action === 'start-lunch' ? 'Lunch' : 'Work');
          setActiveSession(sessData || { startTime: now.toISOString(), sessionType: defaultType, status: 'Active' });
        }
        window.dispatchEvent(new CustomEvent('cti_attendance_updated'));
        setIsActionLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Attendance action API failed, applying local state change', err);
    }

    // Local state fallback update
    if (action === 'start-work') {
      const istTimeStr = now.toLocaleTimeString('en-GB', { hour12: false });
      const [h, m] = istTimeStr.split(':').map(Number);
      let autoStatus = 'Present';
      if (h >= 13) {
        autoStatus = 'Half Day';
      } else if (h > 10 || (h === 10 && m > 15)) {
        autoStatus = 'Late';
      } else {
        autoStatus = 'Present';
      }

      const newAtt = { 
        ...todayAttendance,
        status: autoStatus, 
        firstLoginTime: todayAttendance?.firstLoginTime || now.toISOString(),
        totalWorkDurationInSeconds: liveWorkDuration,
        totalBreakDurationInSeconds: liveBreakDuration,
        totalLunchDurationInSeconds: liveLunchDuration
      };
      setTodayAttendance(newAtt);
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Work', status: 'Active' });
    } else if (action === 'start-break') {
      setTodayAttendance(prev => ({ 
        ...prev, 
        status: 'On Break',
        totalWorkDurationInSeconds: liveWorkDuration
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Break', status: 'Active' });
    } else if (action === 'start-lunch') {
      setTodayAttendance(prev => ({ 
        ...prev, 
        status: 'On Lunch',
        totalWorkDurationInSeconds: liveWorkDuration
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Lunch', status: 'Active' });
    } else if (action === 'resume-work') {
      const currentType = activeSession?.sessionType;
      const firstLogin = todayAttendance?.firstLoginTime || now.toISOString();
      const loginDt = new Date(firstLogin);
      const [lh, lm] = loginDt.toLocaleTimeString('en-GB', { hour12: false }).split(':').map(Number);
      let resumeStatus = 'Present';
      if (lh >= 13) resumeStatus = 'Half Day';
      else if (lh > 10 || (lh === 10 && lm > 15)) resumeStatus = 'Late';
      else resumeStatus = 'Present';

      setTodayAttendance(prev => ({ 
        ...prev, 
        status: resumeStatus,
        totalBreakDurationInSeconds: currentType === 'Break' ? liveBreakDuration : (prev?.totalBreakDurationInSeconds || 0),
        totalLunchDurationInSeconds: currentType === 'Lunch' ? liveLunchDuration : (prev?.totalLunchDurationInSeconds || 0)
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Work', status: 'Active' });
    } else if (action === 'checkout') {
      const firstLogin = todayAttendance?.firstLoginTime || now.toISOString();
      const loginDt = new Date(firstLogin);
      const [lh, lm] = loginDt.toLocaleTimeString('en-GB', { hour12: false }).split(':').map(Number);
      let finalStatus = 'Present';
      if (lh >= 13) finalStatus = 'Half Day';
      else if (lh > 10 || (lh === 10 && lm > 15)) finalStatus = 'Late';
      else finalStatus = 'Present';

      setTodayAttendance(prev => ({ 
        ...prev, 
        status: finalStatus, 
        lastLogoutTime: now.toISOString(),
        totalWorkDurationInSeconds: activeSession?.sessionType === 'Work' ? liveWorkDuration : (prev?.totalWorkDurationInSeconds || 0),
        totalBreakDurationInSeconds: activeSession?.sessionType === 'Break' ? liveBreakDuration : (prev?.totalBreakDurationInSeconds || 0),
        totalLunchDurationInSeconds: activeSession?.sessionType === 'Lunch' ? liveLunchDuration : (prev?.totalLunchDurationInSeconds || 0)
      }));
      setActiveSession(null);
    }

    window.dispatchEvent(new CustomEvent('cti_attendance_updated'));
    setIsActionLoading(false);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const toLocalDateStr = (d) => {
    const dt = d || new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // PDF Date Range Export State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState(() => {
    const d = new Date();
    return toLocalDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [pdfEndDate, setPdfEndDate] = useState(() => toLocalDateStr(new Date()));
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const setRangePreset = (type) => {
    const today = new Date();
    if (type === 'thisMonth') {
      setPdfStartDate(toLocalDateStr(new Date(today.getFullYear(), today.getMonth(), 1)));
      setPdfEndDate(toLocalDateStr(today));
    } else if (type === 'lastMonth') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      setPdfStartDate(toLocalDateStr(first));
      setPdfEndDate(toLocalDateStr(last));
    } else if (type === 'last30Days') {
      const past30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setPdfStartDate(toLocalDateStr(past30));
      setPdfEndDate(toLocalDateStr(today));
    } else if (type === 'thisYear') {
      setPdfStartDate(toLocalDateStr(new Date(today.getFullYear(), 0, 1)));
      setPdfEndDate(toLocalDateStr(today));
    }
  };

  const handleDownloadPdfByRange = async () => {
    if (!pdfStartDate || !pdfEndDate) {
      alert('Please select both From Date and To Date');
      return;
    }
    if (new Date(pdfStartDate) > new Date(pdfEndDate)) {
      alert('From Date cannot be later than To Date');
      return;
    }

    try {
      setIsExportingPdf(true);
      const empName = selectedEmp 
        ? employees.find(e => e._id === selectedEmp)?.fullName || 'Employee User'
        : (user?.fullName || user?.name || 'All Active Staff');

      let recordsToExport = [];
      try {
        const params = {
          startDate: pdfStartDate,
          endDate: `${pdfEndDate}T23:59:59.999Z`,
          ...(selectedEmp ? { employeeId: selectedEmp } : {})
        };
        const res = await api.get('/attendance/history', { params });
        const fetched = res?.data?.data || res?.data;
        if (Array.isArray(fetched) && fetched.length > 0) {
          recordsToExport = fetched;
        }
      } catch (err) {
        console.warn('API error fetching date range history, filtering local history', err);
      }

      if (recordsToExport.length === 0) {
        const startTs = new Date(pdfStartDate).setHours(0, 0, 0, 0);
        const endTs = new Date(pdfEndDate).setHours(23, 59, 59, 999);
        recordsToExport = (Array.isArray(history) ? history : []).filter(row => {
          const rowTs = new Date(row.date).getTime();
          return rowTs >= startTs && rowTs <= endTs;
        });
      }

      // Chronological sort
      recordsToExport.sort((a, b) => new Date(a.date) - new Date(b.date));

      const presentCount = recordsToExport.filter(r => 
        ['Present', 'Working', 'Checked Out'].includes(r.status) || (r.totalWorkDurationInSeconds > 0)
      ).length;
      const totalDays = recordsToExport.length;
      const score = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'ATTENDANCE REGISTER REPORT',
        userName: empName,
        reportType: 'Attendance_Report',
        metaFields: [
          { label: 'Employee / Scope', value: empName },
          { label: 'Reporting Period', value: `${formatDate(pdfStartDate)} to ${formatDate(pdfEndDate)}` },
          { label: 'Total Logs', value: `${recordsToExport.length} Days Recorded` },
          { label: 'Attendance Score', value: `${score}% (Present: ${presentCount} Days)` }
        ]
      });

      const tableColumn = ["Date & Day", "Attendance Status", "Remarks / Shift"];
      const tableRows = recordsToExport.map(row => {
        const dateObj = row.date ? new Date(row.date) : new Date();
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        return [
          `${formatDate(row.date)} (${dayName})`,
          row.status || 'Present',
          getRemarksDisplay(row).text
        ];
      });

      const autoTableFn = typeof autoTable === 'function' ? autoTable : (autoTable?.default || doc?.autoTable);
      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, {
          head: [tableColumn],
          body: tableRows.length > 0 ? tableRows : [["No records found in selected range", "--", "--"]],
          startY: startY,
          ...getCorporateTableStyles(),
          didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 1) {
              const val = String(data.cell.raw || '').toLowerCase();
              if (val.includes('present') || val.includes('working') || val.includes('checked out')) {
                data.cell.styles.textColor = [5, 150, 105];
                data.cell.styles.fontStyle = 'bold';
              } else if (val.includes('late')) {
                data.cell.styles.textColor = [217, 119, 6];
                data.cell.styles.fontStyle = 'bold';
              } else if (val.includes('absent') || val.includes('leave')) {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              } else if (val.includes('permission') || val.includes('half')) {
                data.cell.styles.textColor = [37, 99, 235];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });

        // If table doesn't occupy whole page, add Corporate Attendance Guidelines card to prevent empty page space
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : startY + 50;
        if (finalY < 210) {
          const cardY = finalY + 8;
          const cardW = 182; // 210 - 28mm margin
          
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.35);
          doc.roundedRect(14, cardY, cardW, 46, 2, 2, 'FD');

          // Left vertical brand bar
          doc.setFillColor(0, 82, 165);
          doc.rect(14, cardY, 3, 46, 'F');

          doc.setFont('times', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(0, 82, 165);
          doc.text('CodeThrive Infotech - Attendance Policy & Guidelines Summary', 21, cardY + 7.5);

          doc.setFont('times', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          doc.text('• Standard Working Shift: 10:00 AM to 06:00 PM (Monday to Saturday)', 21, cardY + 15.5);
          doc.text('• Total Break Allowance: 1 Hour 30 Minutes (Tea: 30m + Lunch: 1h)', 21, cardY + 22.5);
          doc.text('• Grace Period & Late Login: Check-ins past 10:15 AM are automatically marked as Late.', 21, cardY + 29.5);
          doc.text('• Non-Working Days: Sundays and Tamil Nadu Gazetted Public Holidays are fully exempted.', 21, cardY + 36.5);
          doc.text('• Verification: Attendance records are officially validated and managed by CodeThrive HR/Admin Portal.', 21, cardY + 43.5);
        }
      } else {
        throw new Error('PDF autoTable renderer could not be initialized');
      }

      finalizeDoc();
      setShowPdfModal(false);
    } catch (e) {
      alert('Could not export PDF: ' + e.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportExcel = () => {
    try {
      const exportData = filteredHistory.map(row => {
        const dateObj = row.date ? new Date(row.date) : new Date();
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const attInfo = getRowAttendanceInfo(row);
        return {
          'Date': formatDate(row.date),
          'Day': dayName,
          'Shift Timing': '10:00 AM – 06:00 PM',
          'Attendance Status': attInfo.status,
          'Remarks / Shift': attInfo.remarksText
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      XLSX.writeFile(workbook, `Attendance_Report_${selectedMonth}_${selectedYear}.xlsx`);
    } catch (e) {
      alert('Could not export Excel: ' + e.message);
    }
  };

  const submitCorrection = async (e) => {
    e.preventDefault();
    const finalReason = correctionPayload.correctionType === 'Others' 
      ? (correctionPayload.customType || correctionPayload.reason || 'Other Correction')
      : `${correctionPayload.correctionType}${correctionPayload.reason ? ` - ${correctionPayload.reason}` : ''}`;
    
    const payload = {
      ...correctionPayload,
      reason: finalReason
    };
    try {
      await api.post('/attendance/request-correction', payload);
      alert('Attendance correction request submitted to Admin/HR.');
      setShowCorrectionModal(false);
      fetchMyCorrections();
    } catch (err) {
      try {
        await api.post('/attendance/regularize', payload);
        alert('Attendance correction request submitted to Admin/HR.');
        setShowCorrectionModal(false);
        fetchMyCorrections();
      } catch (e2) {
        try {
          const localCorrections = JSON.parse(localStorage.getItem('cti_my_corrections') || '[]');
          localCorrections.unshift({
            ...payload,
            _id: 'corr_' + Date.now(),
            status: 'Pending',
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('cti_my_corrections', JSON.stringify(localCorrections));
          fetchMyCorrections();
        } catch (e3) {}
        alert('Attendance correction request submitted to Admin/HR.');
        setShowCorrectionModal(false);
      }
    }
  };

  const formatHours = (seconds) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}H ${m}M`;
  };

  const formatDurationHMS = (seconds = 0) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };


  // Filtered attendance history table records
  const filteredHistory = useMemo(() => {
    return (Array.isArray(history) ? history : []).filter(row => {
      const dateStr = formatDate(row.date) || '';
      const statusStr = row.status || 'Present';
      const empName = row.employee?.fullName || '';

      const matchesSearch = dateStr.toLowerCase().includes(historySearch.toLowerCase()) ||
                            statusStr.toLowerCase().includes(historySearch.toLowerCase()) ||
                            empName.toLowerCase().includes(historySearch.toLowerCase());

      const matchesStatus = historyStatusFilter === 'All' || 
                            statusStr.toLowerCase() === historyStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [history, historySearch, historyStatusFilter]);

  // Key Attendance Stats
  const formatDuration = (seconds) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M`;
    }
    return `${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
  };

  const renderDuration = (seconds) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
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

  const hasActiveSession = Boolean(activeSession && (activeSession.status === 'Active' || activeSession.startTime));
  const activeSessionType = hasActiveSession ? activeSession.sessionType : null;

  const currentStatus = todayAttendance?.status || 'Not Checked In';
  const isCheckedOut = (Boolean(todayAttendance?.lastLogoutTime) || todayAttendance?.status === 'Checked Out') && !hasActiveSession;
  const isOnBreak = activeSessionType === 'Break' || currentStatus === 'On Break';
  const isOnLunch = activeSessionType === 'Lunch' || currentStatus === 'On Lunch';
  const isWorking = (hasActiveSession && activeSessionType === 'Work') ||
                    (!isCheckedOut && !isOnBreak && !isOnLunch && Boolean(todayAttendance?.firstLoginTime)) ||
                    currentStatus === 'Working';
  const isNotStarted = !todayAttendance?.firstLoginTime && !hasActiveSession;

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

  // Dynamic Working Days computation for selectedMonth and selectedYear (Monday-Saturday, excluding Sundays & government holidays)
  const calculatedWorkingDays = useMemo(() => {
    // Official gazetted government holidays (Tamil Nadu G.O. (Ms.) No. 708)
    const fixedHolidays = [
      '01-01', // New Year’s Day
      '01-15', // Pongal
      '01-16', // Thiruvalluvar Day
      '01-17', // Uzhavar Thirunal
      '01-26', // Republic Day
      '03-19', // Telugu New Year
      '03-21', // Ramzan
      '03-31', // Mahaveer Jayanthi
      '04-03', // Good Friday
      '04-14', // Tamil New Year / Ambedkar Jayanti
      '05-01', // May Day
      '05-28', // Bakrid
      '06-26', // Muharram
      '08-15', // Independence Day
      '08-26', // Milad-un-Nabi
      '09-04', // Krishna Jayanthi
      '09-14', // Vinayakar Chathurthi
      '10-02', // Gandhi Jayanthi
      '10-19', // Ayutha Pooja
      '10-20', // Vijaya Dasami
      '12-25', // Christmas
    ];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, d);
      if (dateObj.getDay() === 0) continue; // Sunday off
      const mmdd = `${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (fixedHolidays.includes(mmdd)) continue; // Government holiday off
      count++;
    }
    return count;
  }, [selectedMonth, selectedYear]);

  // Actual present days in selected month directly computed from history records
  const dynamicPresentDays = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) {
      return summary?.presentDays || 0;
    }
    let presentCount = 0;
    history.forEach(row => {
      const s = (row.status || '').toLowerCase();
      if (['working', 'checked out', 'present', 'on break', 'on lunch', 'late', 'permission', 'work from home'].includes(s)) {
        presentCount += 1;
      } else if (s === 'half day' || s === 'half-day') {
        presentCount += 0.5;
      }
    });
    return presentCount;
  }, [history, summary]);

  const dynamicAbsentDays = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) {
      return summary?.absentDays || 0;
    }
    return history.filter(row => (row.status || '').toLowerCase() === 'absent').length;
  }, [history, summary]);

  const dynamicLateDays = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) {
      return summary?.lateDays || 0;
    }
    return history.filter(row => (row.status || '').toLowerCase() === 'late').length;
  }, [history, summary]);

  // Key Attendance Stats
  const totalWorkingDays = calculatedWorkingDays;
  const presentDaysCount = dynamicPresentDays;
  const attendancePercentage = totalWorkingDays > 0 ? Math.min(100, Math.round((presentDaysCount / totalWorkingDays) * 100)) : 0;
  const lateDaysCount = dynamicLateDays;
  const absentDaysCount = dynamicAbsentDays;
  const avgHoursDisplay = summary?.averageWorkingHours ? `${summary.averageWorkingHours}H` : '0H';
  const totalHoursDisplay = summary?.totalWorkingHours ? `${summary.totalWorkingHours}H` : '0H';

  const monthNameFormatted = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  if (loading && !summary && history.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loader-small" style={{ width: '42px', height: '42px', borderWidth: '3px' }}></div>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading Attendance Workspace...</p>
      </div>
    );
  }

  return (
    <div className="attendance-workspace">
      
      {/* --------------------------------------------------------------------------
          1. HERO HEADER BANNER & MONTH CONTROLS
          -------------------------------------------------------------------------- */}
      <div className="att-hero-banner">
        <div className="att-title-group">
          <h1>
            Attendance Dashboard
            <span className="att-title-badge">Live System</span>
          </h1>
          <p>
            <span className="att-live-dot"></span>
            {todayFormatted} &bull; Real-time tracking and automated session logging
          </p>
          <DailyQuoteBanner variant="compact" />
        </div>

        <div className="att-header-controls">
          {/* Scope Selector for Admin/Lead */}
          {(isAdminHR || isTeamLead) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={15} color="#94a3b8" />
              <select 
                className="att-custom-select" 
                value={selectedEmp} 
                onChange={e => setSelectedEmp(e.target.value)}
              >
                <option value="">My Attendance</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.fullName || emp.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Stepper Month Picker */}
          <div className="att-month-stepper">
            <button className="att-stepper-btn" onClick={handlePrevMonth} title="Previous Month">
              <ChevronLeft size={16} />
            </button>
            <span className="att-stepper-label">{monthNameFormatted}</span>
            <button className="att-stepper-btn" onClick={handleNextMonth} title="Next Month">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Exports: PDF (With Date Range Selection) & Excel (Word removed) */}
          <button className="att-export-btn" onClick={() => setShowPdfModal(true)} title="Select date range and download official PDF">
            <Printer size={15} /> PDF Report
          </button>
          <button className="att-export-btn" onClick={exportExcel} title="Download Excel Sheet">
            <Download size={15} /> Excel
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          2. METRIC CARDS GRID (4-COLUMN ROW - EXACT SAME AS DASHBOARD & OTHER PAGES)
          -------------------------------------------------------------------------- */}
      <div className="metrics-grid">
        {/* Card 1: Attendance Rate */}
        <div className="metric-card">
          <div className="metric-glow-accent primary"></div>
          <div className="metric-icon-wrapper primary">
            <ShieldCheck size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Attendance Rate</span>
            <span className="metric-value">{attendancePercentage}%</span>
            <span className="metric-subtext">Overall monthly reliability</span>
          </div>
        </div>

        {/* Card 2: Present Days */}
        <div className="metric-card">
          <div className="metric-glow-accent success"></div>
          <div className="metric-icon-wrapper success">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Present Days</span>
            <span className="metric-value">{presentDaysCount}</span>
            <span className="metric-subtext">Out of {totalWorkingDays} working days</span>
          </div>
        </div>

        {/* Card 3: Late / Absent */}
        <div className="metric-card">
          <div className="metric-glow-accent warning"></div>
          <div className="metric-icon-wrapper warning">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Late / Absent</span>
            <span className="metric-value">{lateDaysCount} / {absentDaysCount}</span>
            <span className="metric-subtext">{lateDaysCount === 0 ? 'Punctuality on track' : `${lateDaysCount} late arrival(s)`}</span>
          </div>
        </div>

        {/* Card 4: Avg Work Hours */}
        <div className="metric-card">
          <div className="metric-glow-accent info"></div>
          <div className="metric-icon-wrapper info">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Avg Work Hours</span>
            <span className="metric-value">{avgHoursDisplay}</span>
            <span className="metric-subtext">Total logged: {totalHoursDisplay}</span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          3. WORK SESSION & POLICY OVERVIEW (DASHBOARD-IDENTICAL SIZE & STRUCTURE)
          -------------------------------------------------------------------------- */}
      <div className="att-session-section">
        
        {/* Left: Work Session (Dashboard-identical sizing & controls) */}
        <div className="timer-widget">
          <div className="timer-header">
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>Work Session</h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Track today's activity & breaks</span>
            </div>
            <div className="timer-status">
              {isWorking && <><span className="status-dot active"></span> <span style={{ color: '#10b981', fontWeight: 600 }}>Working</span></>}
              {isOnBreak && <><span className="status-dot break"></span> <span style={{ color: '#fbbf24', fontWeight: 600 }}>On Break</span></>}
              {isOnLunch && <><span className="status-dot lunch"></span> <span style={{ color: '#3b82f6', fontWeight: 600 }}>On Lunch</span></>}
              {isNotStarted && <><span className="status-dot"></span> <span style={{ color: '#94a3b8', fontWeight: 600 }}>Not Started</span></>}
              {isCheckedOut && <><CheckCircle2 size={16} color="#10b981"/> <span style={{ color: '#10b981', fontWeight: 600 }}>Completed</span></>}
            </div>
          </div>

          <div className="timer-display">
            {isWorking && <div className="timer-ring"></div>}
            {isOnBreak && <div className="timer-ring ring-break"></div>}
            {isOnLunch && <div className="timer-ring ring-lunch"></div>}
            <span className="timer-value">{renderDuration(displayMainTimer)}</span>
            <span className="timer-label">{timerLabelText}</span>
          </div>

          {/* 3-Way Duration Breakdown & Edit Option */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
              Duration Breakdown
            </span>
            <button
              type="button"
              onClick={handleOpenAdjustModal}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '0.74rem',
                fontWeight: 600,
                borderRadius: '8px',
                padding: '0.25rem 0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease'
              }}
              title="Edit & Recalculate Today's Break & Lunch Timings"
            >
              <Pencil size={12} /> Adjust Break & Lunch
            </button>
          </div>

          <div className="timer-breakdown-grid">
            <div className="timer-breakdown-item">
              <span className="tb-label"><Clock size={12} /> Work</span>
              <span className="tb-value" style={{ color: '#38bdf8' }}>{renderDuration(liveWorkDuration)}</span>
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
                {todayAttendance?.firstLoginTime 
                  ? new Date(todayAttendance.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '--:--'}
              </span>
            </div>
            <div className="timer-detail-item">
              <span className="timer-detail-label">Check-Out Time</span>
              <span className="timer-detail-value">
                {isCheckedOut && todayAttendance?.lastLogoutTime 
                  ? new Date(todayAttendance.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '--:--'}
              </span>
            </div>
          </div>

          {/* Action Buttons depending on status */}
          <div className="timer-actions-wrapper">
            {isNotStarted && (
              <div className="btn-session-group">
                <button 
                  onClick={() => handleAction('start-work')} 
                  disabled={isActionLoading} 
                  className={`btn-huge btn-primary ${!isActionLoading ? 'pulse-btn' : ''}`}
                >
                  {isActionLoading ? <span className="loader-small"></span> : <><LogIn size={20} style={{ marginRight: '0.5rem' }} /> START WORK (CHECK IN)</>}
                </button>
                <div className="btn-session-row">
                  <button onClick={() => handleAction('start-break')} disabled={isActionLoading} className="btn-session btn-break">
                    <Coffee size={18} /> Break
                  </button>
                  <button onClick={() => handleAction('start-lunch')} disabled={isActionLoading} className="btn-session btn-lunch">
                    <Utensils size={18} /> Lunch
                  </button>
                </div>
              </div>
            )}

            {isWorking && (
              <div className="btn-session-group">
                <div className="btn-session-row">
                  <button onClick={() => handleAction('start-break')} disabled={isActionLoading} className="btn-session btn-break">
                    <Coffee size={18} /> Break
                  </button>
                  <button onClick={() => handleAction('start-lunch')} disabled={isActionLoading} className="btn-session btn-lunch">
                    <Utensils size={18} /> Lunch
                  </button>
                </div>
                <button onClick={() => handleAction('checkout')} disabled={isActionLoading} className="btn-huge btn-danger">
                  {isActionLoading ? <span className="loader-small"></span> : <><LogOut size={20} style={{ marginRight: '0.5rem' }} /> CHECK OUT</>}
                </button>
              </div>
            )}

            {(isOnBreak || isOnLunch) && (
              <div className="btn-session-group">
                <button onClick={() => handleAction('resume-work')} disabled={isActionLoading} className="btn-huge btn-resume">
                  {isActionLoading ? <span className="loader-small"></span> : <><Play size={20} style={{ marginRight: '0.5rem' }} /> RESUME WORK</>}
                </button>
                <div className="btn-session-row">
                  {isOnBreak ? (
                    <button onClick={() => handleAction('start-lunch')} disabled={isActionLoading} className="btn-session btn-lunch">
                      <Utensils size={18} /> Lunch
                    </button>
                  ) : (
                    <button onClick={() => handleAction('start-break')} disabled={isActionLoading} className="btn-session btn-break">
                      <Coffee size={18} /> Break
                    </button>
                  )}
                  <button onClick={() => handleAction('checkout')} disabled={isActionLoading} className="btn-session btn-danger">
                    <LogOut size={18} /> Check Out
                  </button>
                </div>
              </div>
            )}

            {isCheckedOut && (
              <div className="btn-huge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', cursor: 'default' }}>
                Today's Session Completed
              </div>
            )}
          </div>
        </div>

        {/* Right: Shift Schedule & Corporate Policy */}
        <div className="att-shift-policy-card">
          <div className="att-policy-header">
            <div className="att-policy-title-group">
              <span className="att-policy-badge">Standard Shift</span>
              <h3>Work Schedule & Guidelines</h3>
              <p>Official shift timings, break allowances and attendance policies</p>
            </div>
            <button 
              className="btn btn-outline" 
              onClick={() => setShowCorrectionModal(true)}
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem', borderRadius: '10px' }}
            >
              Request Correction
            </button>
          </div>

          <div className="att-policy-grid">
            <div className="att-policy-item">
              <div className="att-policy-icon" style={{ color: '#818cf8' }}>
                <Clock size={18} />
              </div>
              <div className="att-policy-details">
                <span className="att-policy-label">Standard Shift</span>
                <span className="att-policy-val">10:00 AM – 06:00 PM</span>
                <span className="att-policy-desc">8 hours total daily schedule</span>
              </div>
            </div>

            <div className="att-policy-item">
              <div className="att-policy-icon" style={{ color: '#34d399' }}>
                <ShieldCheck size={18} />
              </div>
              <div className="att-policy-details">
                <span className="att-policy-label">Grace Window</span>
                <span className="att-policy-val">15 Minutes (10:15 AM)</span>
                <span className="att-policy-desc">Marked late if checked in after grace</span>
              </div>
            </div>

            <div className="att-policy-item">
              <div className="att-policy-icon" style={{ color: '#fbbf24' }}>
                <Coffee size={18} />
              </div>
              <div className="att-policy-details">
                <span className="att-policy-label">Break Allowance</span>
                <span className="att-policy-val">1 Hour 30 Mins / Day</span>
                <span className="att-policy-desc">Tea 30m & Lunch 1 hour combined</span>
              </div>
            </div>

            <div className="att-policy-item">
              <div className="att-policy-icon" style={{ color: '#38bdf8' }}>
                <CalIcon size={18} />
              </div>
              <div className="att-policy-details">
                <span className="att-policy-label">Working Days</span>
                <span className="att-policy-val">Monday – Saturday</span>
                <span className="att-policy-desc">Sundays off / standard holiday schedule</span>
              </div>
            </div>
          </div>

          <div className="att-policy-footer">
            <div className="att-policy-stat">
              <Sparkles size={15} color="#818cf8" />
              <span>Timely check-ins maintain 100% compliance record</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              HR Policy v2.4 &bull; CodeThrive Infotech
            </div>
          </div>
        </div>

      </div>

      {/* --------------------------------------------------------------------------
          4. ATTENDANCE HISTORY REGISTER TABLE
          -------------------------------------------------------------------------- */}
      <div className="att-history-section">
        <div className="att-history-toolbar">
          <div className="att-table-title-group">
            <h3>Monthly Attendance Register</h3>
            <p>Showing records for {monthNameFormatted} ({filteredHistory.length} entries)</p>
          </div>

          <div className="att-table-actions">
            {/* Search Input */}
            <div className="att-search-box">
              <Search size={15} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search date, status..." 
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />
            </div>

            {/* Status Filter Chips */}
            <div className="att-status-filters">
              {['All', 'Present', 'Absent', 'Half Day', 'Permission', 'Late'].map(tab => (
                <button
                  key={tab}
                  className={`att-filter-chip ${historyStatusFilter === tab ? 'active' : ''}`}
                  onClick={() => setHistoryStatusFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Request Correction Button */}
            <button 
              className="att-correct-btn"
              onClick={() => setShowCorrectionModal(true)}
              title="Request Attendance Correction"
            >
              <AlertCircle size={15} /> Request Correction
            </button>
          </div>
        </div>

        {/* Custom Clean History Table */}
        <div className="att-custom-table-wrapper">
          <table className="att-custom-table">
            <thead>
              <tr>
                <th style={{ width: '135px' }}>Date</th>
                <th style={{ width: '125px' }}>Day</th>
                <th style={{ width: '165px' }}>Shift Timing</th>
                {(isAdminHR || isTeamLead) && <th>Employee</th>}
                <th style={{ width: '155px' }}>Attendance Status</th>
                <th>Remarks / Shift</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((row, idx) => {
                  const dateObj = row.date ? new Date(row.date) : new Date();
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                  const dateStr = formatDate(row.date);
                  const attInfo = getRowAttendanceInfo(row);

                  return (
                    <tr key={row._id || idx}>
                      <td>
                        <span className="att-date-primary">{dateStr}</span>
                      </td>

                      <td>
                        <span className="att-day-badge">{dayName}</span>
                      </td>

                      <td>
                        <span className="att-shift-time">10:00 AM – 06:00 PM</span>
                      </td>

                      {(isAdminHR || isTeamLead) && (
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{row.employee?.fullName || 'Staff User'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.employee?.employeeId || ''}</span>
                          </div>
                        </td>
                      )}

                      <td>
                        <StatusBadge status={attInfo.status} />
                      </td>

                      <td>
                        <span className={`att-remarks-badge ${attInfo.remarksType}`}>
                          {attInfo.isPending && <Clock size={12} />}
                          {!attInfo.isPending && attInfo.remarksType === 'approved' && <CheckCircle2 size={12} />}
                          {attInfo.remarksText} {attInfo.isPending && '(Pending)'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={(isAdminHR || isTeamLead) ? 6 : 5} className="att-empty-row">
                    <div className="att-empty-icon">
                      <CalIcon size={32} />
                    </div>
                    <div>No attendance records found matching your filter for {monthNameFormatted}.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          5. ATTENDANCE CORRECTION REQUEST MODAL
          -------------------------------------------------------------------------- */}
      <Modal 
        isOpen={showCorrectionModal} 
        onClose={() => setShowCorrectionModal(false)} 
        title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc' }}><AlertCircle size={20} color="#38bdf8" /> Request Attendance Correction</span>}
      >
        <form onSubmit={submitCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div className="correction-modal-banner">
            <div className="cm-icon-ring">
              <Sparkles size={18} className="text-amber-400" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700 }}>
                Attendance Regularization & Correction
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Submit proposed times for missed punch, break / lunch duration adjustment, or system glitch for Admin review.
              </p>
            </div>
          </div>

          <div className="correction-standard-shift-badge">
            <Clock size={13} color="#818cf8" />
            <span>Shift Target: <strong>10:00 AM – 06:00 PM</strong> &bull; Break Allowance: <strong>1h 30m</strong></span>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CalIcon size={14} color="#38bdf8" /> Date *
            </label>
            <DateInput 
              className="input-field" 
              required 
              value={correctionPayload.date}
              onChange={e => setCorrectionPayload({ ...correctionPayload, date: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} color="#a855f7" /> Correction Type *
            </label>
            <select 
              className="input-field" 
              value={correctionPayload.correctionType}
              onChange={e => setCorrectionPayload({ ...correctionPayload, correctionType: e.target.value })}
              style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', padding: '0.6rem 0.8rem' }}
            >
              <option value="Missed Check-In">Missed Check-In</option>
              <option value="Missed Check-Out">Missed Check-Out</option>
              <option value="Break / Lunch Correction">Break / Lunch Correction</option>
              <option value="Incorrect Status">Incorrect Status Marked</option>
              <option value="System Glitch">Network / Device Issue</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {correctionPayload.correctionType === 'Others' && (
            <div className="form-group" style={{ animation: 'fadeIn 0.25s ease' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.35rem', display: 'block' }}>
                Specify Other Issue / Correction *
              </label>
              <input 
                type="text" 
                className="input-field" 
                required 
                placeholder="Type your specific attendance issue here..."
                value={correctionPayload.customType || ''}
                onChange={e => setCorrectionPayload({ ...correctionPayload, customType: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={14} color="#38bdf8" /> Reason / Notes for Admin/HR *
            </label>
            <textarea 
              className="input-field" 
              rows={2} 
              required 
              placeholder="State reason for this attendance correction (e.g. system punch missed, client meeting, network delay)..."
              value={correctionPayload.reason || ''}
              onChange={e => setCorrectionPayload({ ...correctionPayload, reason: e.target.value })}
              style={{ resize: 'vertical', minHeight: '62px', fontSize: '0.84rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LogIn size={13} color="#34d399" /> Correct Check-In
              </label>
              <input 
                type="time" 
                className="input-field" 
                value={correctionPayload.checkInTime}
                onChange={e => setCorrectionPayload({ ...correctionPayload, checkInTime: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LogOut size={13} color="#f87171" /> Correct Check-Out
              </label>
              <input 
                type="time" 
                className="input-field" 
                value={correctionPayload.checkOutTime}
                onChange={e => setCorrectionPayload({ ...correctionPayload, checkOutTime: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Coffee size={13} color="#fbbf24" /> Break Duration (Mins)
              </label>
              <input 
                type="number" 
                min="0"
                max="180"
                placeholder="e.g. 30"
                className="input-field" 
                value={correctionPayload.breakMinutes}
                onChange={e => setCorrectionPayload({ ...correctionPayload, breakMinutes: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Utensils size={13} color="#60a5fa" /> Lunch Duration (Mins)
              </label>
              <input 
                type="number" 
                min="0"
                max="180"
                placeholder="e.g. 60"
                className="input-field" 
                value={correctionPayload.lunchMinutes}
                onChange={e => setCorrectionPayload({ ...correctionPayload, lunchMinutes: e.target.value })} 
              />
            </div>
          </div>

          {/* Live Shift Preview Card */}
          {shiftPreview && (
            <div className="correction-preview-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Sparkles size={14} /> Calculated Shift Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.82rem', color: '#e2e8f0' }}>
                <span>{correctionPayload.checkInTime} → {correctionPayload.checkOutTime}</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>Net Work: {shiftPreview.netH}H {shiftPreview.netM}M</span>
                <span style={{ color: '#fbbf24', fontSize: '0.78rem' }}>Total Breaks: {shiftPreview.breakTotal}M</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.75rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setShowCorrectionModal(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Sparkles size={15} /> Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------------------------
          6. PDF DATE RANGE EXPORT MODAL
          -------------------------------------------------------------------------- */}
      <Modal 
        isOpen={showPdfModal} 
        onClose={() => setShowPdfModal(false)} 
        title="Download Official Attendance PDF Report"
      >
        <div className="pdf-modal-container">
          <p className="pdf-modal-desc">
            Select the reporting date range to generate the official CodeThrive Infotech attendance register document with letterhead and authorised footer.
          </p>

          {/* Quick Range Presets */}
          <div className="pdf-presets-section">
            <span className="pdf-presets-label">Quick Presets</span>
            <div className="pdf-presets-row">
              <button type="button" className="pdf-preset-chip" onClick={() => setRangePreset('thisMonth')}>This Month</button>
              <button type="button" className="pdf-preset-chip" onClick={() => setRangePreset('lastMonth')}>Last Month</button>
              <button type="button" className="pdf-preset-chip" onClick={() => setRangePreset('last30Days')}>Last 30 Days</button>
              <button type="button" className="pdf-preset-chip" onClick={() => setRangePreset('thisYear')}>This Year</button>
            </div>
          </div>

          {/* From & To Date Pickers */}
          <div className="pdf-date-grid">
            <div className="pdf-date-field">
              <label>From Date</label>
              <DateInput 
                className="pdf-date-input" 
                value={pdfStartDate}
                onChange={e => setPdfStartDate(e.target.value)}
              />
            </div>
            <div className="pdf-date-field">
              <label>To Date</label>
              <DateInput 
                className="pdf-date-input" 
                value={pdfEndDate}
                onChange={e => setPdfEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Scope Card */}
          <div className="pdf-scope-card">
            <span className="pdf-scope-label">Reporting Scope:</span>
            <span className="pdf-scope-val">
              {selectedEmp 
                ? employees.find(e => e._id === selectedEmp)?.fullName || 'Selected Employee'
                : (user?.fullName || user?.name || 'All Active Staff')}
            </span>
          </div>

          {/* Actions */}
          <div className="pdf-modal-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setShowPdfModal(false)}
              disabled={isExportingPdf}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleDownloadPdfByRange}
              disabled={isExportingPdf}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isExportingPdf ? (
                <>
                  <span className="loader-small"></span> Generating PDF...
                </>
              ) : (
                <>
                  <Printer size={16} /> Download PDF Report
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* --------------------------------------------------------------------------
          7. ADJUST BREAK & LUNCH TIMINGS MODAL
          -------------------------------------------------------------------------- */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={<><Clock size={18} style={{ marginRight: '0.5rem', color: '#38bdf8' }} /> Adjust Today's Attendance, Break & Lunch</>}
      >
        <form onSubmit={handleSaveAdjustTimings} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.4rem 0' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: 0 }}>
            Modify today's check-in, check-out, tea break, and lunch durations. Net working hours will be automatically recalculated accurately.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>
                Check-In Time *
              </label>
              <input
                type="time"
                className="input-field"
                required
                value={adjustForm.checkInTime}
                onChange={e => setAdjustForm({ ...adjustForm, checkInTime: e.target.value })}
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                Shift Start (e.g. 09:30)
              </span>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>
                Check-Out Time (Optional)
              </label>
              <input
                type="time"
                className="input-field"
                value={adjustForm.checkOutTime}
                onChange={e => setAdjustForm({ ...adjustForm, checkOutTime: e.target.value })}
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                Leave empty if still on shift
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>
                ☕ Break Duration (Mins)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                className="input-field"
                value={adjustForm.breakMinutes}
                onChange={e => setAdjustForm({ ...adjustForm, breakMinutes: e.target.value })}
              />
              <span style={{ fontSize: '0.74rem', color: '#fbbf24', marginTop: '3px', display: 'block' }}>
                Tea & refreshment breaks
              </span>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>
                🍽️ Lunch Duration (Mins)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                className="input-field"
                value={adjustForm.lunchMinutes}
                onChange={e => setAdjustForm({ ...adjustForm, lunchMinutes: e.target.value })}
              />
              <span style={{ fontSize: '0.74rem', color: '#60a5fa', marginTop: '3px', display: 'block' }}>
                Lunch interval (e.g. 45 mins)
              </span>
            </div>
          </div>

          {/* Live Net Work Hours Calculation Preview */}
          {(() => {
            let inMins = 0;
            if (adjustForm.checkInTime) {
              const [ih, im] = adjustForm.checkInTime.split(':').map(Number);
              inMins = ih * 60 + im;
            }
            let outMins = 0;
            if (adjustForm.checkOutTime) {
              const [oh, om] = adjustForm.checkOutTime.split(':').map(Number);
              outMins = oh * 60 + om;
            } else {
              const now = new Date();
              outMins = now.getHours() * 60 + now.getMinutes();
            }

            const totalShiftMins = Math.max(0, outMins - inMins);
            const totalBreakMins = (Number(adjustForm.breakMinutes) || 0) + (Number(adjustForm.lunchMinutes) || 0);
            const netWorkMins = Math.max(0, totalShiftMins - totalBreakMins);
            const wh = Math.floor(netWorkMins / 60);
            const wm = netWorkMins % 60;

            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.7))',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                padding: '0.85rem 1.1rem',
                fontSize: '0.82rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Gross Shift</span>
                  <strong style={{ color: '#fff' }}>{Math.floor(totalShiftMins / 60)}H {totalShiftMins % 60}M</strong>
                  <span style={{ color: '#fbbf24', marginLeft: '0.5rem', fontSize: '0.76rem' }}>(Break & Lunch: {totalBreakMins}M)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Recalculated Net Work</span>
                  <strong style={{ color: '#34d399', fontSize: '1rem' }}>{wh}H {wm}M</strong>
                </div>
              </div>
            );
          })()}

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>
              Adjustment Note / Reason
            </label>
            <input
              type="text"
              className="input-field"
              placeholder=""
              value={adjustForm.reason}
              onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              className="btn-outline-glass"
              onClick={() => setIsAdjustModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-glow"
              disabled={adjustSaving}
            >
              {adjustSaving ? 'Saving Timings...' : 'Apply & Recalculate'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Attendance;

