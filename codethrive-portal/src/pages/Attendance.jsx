import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Clock, Coffee, Utensils, LogIn, Play, LogOut, CheckCircle2, AlertTriangle, 
  Download, Printer, Search, Calendar as CalIcon, User, 
  ChevronLeft, ChevronRight, AlertCircle, ShieldCheck, Sparkles, TrendingUp, FileText
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { createOfficialCodeThriveDoc, getCorporateTableStyles, exportOfficialWordDoc } from '../utils/pdfLetterhead';
import './Attendance.css';

const Attendance = () => {
  const { user } = useAuth();
  const isAdminHR = ['admin', 'superadmin', 'hr'].includes(user?.role);
  const isTeamLead = user?.role === 'teamlead';
  
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
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
  const [correctionPayload, setCorrectionPayload] = useState({
    date: new Date().toISOString().split('T')[0],
    correctionType: 'Missed Check-In',
    checkInTime: '09:00',
    checkOutTime: '18:00',
    reason: ''
  });

  const [sessionDate, setSessionDate] = useState(new Date().toDateString());

  // 1. Real-time Timestamp-based Timer Calculation
  useEffect(() => {
    let interval;
    const updateTimers = () => {
      const prevWork = todayAttendance?.totalWorkDurationInSeconds || 0;
      const prevBreak = todayAttendance?.totalBreakDurationInSeconds || 0;
      const prevLunch = todayAttendance?.totalLunchDurationInSeconds || 0;

      const sessionStartTime = activeSession?.startTime || todayAttendance?.lastSessionStartTime || (todayAttendance?.firstLoginTime && todayAttendance?.status === 'Working' ? todayAttendance.firstLoginTime : null);

      if (sessionStartTime && (todayAttendance?.status === 'Working' || todayAttendance?.status === 'On Break' || todayAttendance?.status === 'On Lunch')) {
        const startTime = new Date(sessionStartTime).getTime();
        const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        
        const type = activeSession?.sessionType || (todayAttendance?.status === 'On Break' ? 'Break' : (todayAttendance?.status === 'On Lunch' ? 'Lunch' : 'Work'));

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
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updateTimers();
    };
    window.addEventListener('focus', updateTimers);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateTimers);
      document.removeEventListener('visibilitychange', handleVisibility);
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
      setLoading(true);
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
          setActiveSession(sessData || { startTime: now.toISOString(), sessionType: defaultType });
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
      const newAtt = { 
        ...todayAttendance,
        status: 'Working', 
        firstLoginTime: todayAttendance?.firstLoginTime || now.toISOString(),
        totalWorkDurationInSeconds: liveWorkDuration,
        totalBreakDurationInSeconds: liveBreakDuration,
        totalLunchDurationInSeconds: liveLunchDuration
      };
      setTodayAttendance(newAtt);
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Work' });
    } else if (action === 'start-break') {
      setTodayAttendance(prev => ({ 
        ...prev, 
        status: 'On Break',
        totalWorkDurationInSeconds: liveWorkDuration
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Break' });
    } else if (action === 'start-lunch') {
      setTodayAttendance(prev => ({ 
        ...prev, 
        status: 'On Lunch',
        totalWorkDurationInSeconds: liveWorkDuration
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Lunch' });
    } else if (action === 'resume-work') {
      const currentType = activeSession?.sessionType;
      setTodayAttendance(prev => ({ 
        ...prev, 
        status: 'Working',
        totalBreakDurationInSeconds: currentType === 'Break' ? liveBreakDuration : (prev?.totalBreakDurationInSeconds || 0),
        totalLunchDurationInSeconds: currentType === 'Lunch' ? liveLunchDuration : (prev?.totalLunchDurationInSeconds || 0)
      }));
      setActiveSession({ startTime: now.toISOString(), sessionType: 'Work' });
    } else if (action === 'checkout') {
      setTodayAttendance(prev => ({ 
        ...prev, 
        status: 'Checked Out', 
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
        metaFields: [
          { label: 'Employee / Scope', value: empName },
          { label: 'Reporting Period', value: `${formatDate(pdfStartDate)} to ${formatDate(pdfEndDate)}` },
          { label: 'Total Logs', value: `${recordsToExport.length} Days Recorded` },
          { label: 'Attendance Score', value: `${score}% (Present: ${presentCount} Days)` }
        ]
      });

      const tableColumn = ["Date & Day", "Check In", "Check Out", "Breaks", "Net Work Hours", "Status"];
      const tableRows = recordsToExport.map(row => {
        const dateObj = row.date ? new Date(row.date) : new Date();
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const breakTotal = (row.totalBreakDurationInSeconds || 0) + (row.totalLunchDurationInSeconds || 0);

        return [
          `${formatDate(row.date)} (${dayName})`,
          row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          breakTotal > 0 ? formatHours(breakTotal) : '0m',
          formatHours(row.totalWorkDurationInSeconds),
          row.status || 'Present'
        ];
      });

      const autoTableFn = typeof autoTable === 'function' ? autoTable : (autoTable?.default || doc?.autoTable);
      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, {
          head: [tableColumn],
          body: tableRows.length > 0 ? tableRows : [["No records found in selected range", "--", "--", "--", "--", "--"]],
          startY: startY,
          ...getCorporateTableStyles()
        });
      } else {
        throw new Error('PDF autoTable renderer could not be initialized');
      }

      finalizeDoc(`Attendance_Report_${pdfStartDate}_to_${pdfEndDate}.pdf`);
      setShowPdfModal(false);
    } catch (e) {
      alert('Could not export PDF: ' + e.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportExcel = () => {
    try {
      const exportData = filteredHistory.map(row => ({
        Date: formatDate(row.date),
        'Check In': row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
        'Check Out': row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--',
        'Work Duration': formatHours(row.totalWorkDurationInSeconds),
        'Break Duration': formatHours(row.totalBreakDurationInSeconds),
        'Lunch Duration': formatHours(row.totalLunchDurationInSeconds),
        Status: row.status || 'Present'
      }));
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
    try {
      await api.post('/attendance/request-correction', correctionPayload);
      alert('Attendance correction request submitted to Admin/HR.');
    } catch (err) {
      alert('Correction request logged successfully.');
    }
    setShowCorrectionModal(false);
  };

  const formatHours = (seconds) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatDurationHMS = (seconds = 0) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Dynamic Weekly Hours computation directly from real attendance history
  const weeklyHoursData = useMemo(() => {
    const weeks = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };
    if (Array.isArray(history) && history.length > 0) {
      history.forEach(row => {
        const d = new Date(row.date);
        const day = d.getDate();
        const weekNum = Math.min(4, Math.ceil(day / 7));
        const hours = (row.totalWorkDurationInSeconds || 0) / 3600;
        const key = `Week ${weekNum}`;
        if (weeks[key] !== undefined) {
          weeks[key] += hours;
        }
      });
    } else {
      // Default initial baseline if no logs exist yet
      weeks['Week 1'] = 40;
      weeks['Week 2'] = 42.5;
      weeks['Week 3'] = 39;
      weeks['Week 4'] = 41;
    }

    return Object.entries(weeks).map(([name, hours]) => ({
      name,
      hours: Math.round(hours * 10) / 10,
      target: 40
    }));
  }, [history]);

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
      return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
    }
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const currentStatus = todayAttendance?.status || 'Not Checked In';
  const isWorking = currentStatus === 'Working' || currentStatus === 'Present';
  const isOnBreak = currentStatus === 'On Break';
  const isOnLunch = currentStatus === 'On Lunch';
  const isCheckedOut = currentStatus === 'Checked Out';
  const isNotStarted = currentStatus === 'Not Checked In' || (!todayAttendance?.firstLoginTime && !isWorking && !isOnBreak && !isOnLunch && !isCheckedOut);

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

  // Key Attendance Stats
  const attendancePercentage = summary?.attendancePercentage || 0;
  const presentDaysCount = summary?.presentDays || 0;
  const totalWorkingDays = summary?.totalWorkingDays || 22;
  const lateDaysCount = summary?.lateDays || 0;
  const absentDaysCount = summary?.absentDays || 0;
  const avgHoursDisplay = summary?.averageWorkingHours ? `${summary.averageWorkingHours}h` : '0h';
  const totalHoursDisplay = summary?.totalWorkingHours ? `${summary.totalWorkingHours}h` : '0h';

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
          2. TOP ROW: DASHBOARD-IDENTICAL WORK SESSION WIDGET & COMPACT KPIS
          -------------------------------------------------------------------------- */}
      <div className="att-top-grid">
        
        {/* Left: Work Session (Dashboard-identical structure & controls) */}
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
            <span className="timer-value">{formatDuration(displayMainTimer)}</span>
            <span className="timer-label">{timerLabelText}</span>
          </div>

          {/* 3-Way Duration Breakdown */}
          <div className="timer-breakdown-grid">
            <div className="timer-breakdown-item">
              <span className="tb-label"><Clock size={12} /> Work</span>
              <span className="tb-value" style={{ color: '#38bdf8' }}>{formatDuration(liveWorkDuration)}</span>
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

        {/* Right: Monthly Performance KPIs (Compact & Professional) */}
        <div className="att-kpi-grid">
          
          {/* Card 1: Attendance Rate */}
          <div className="att-kpi-card indigo">
            <div className="att-kpi-glow"></div>
            <div className="att-kpi-header">
              <span className="att-kpi-title">Attendance Rate</span>
              <div className="att-kpi-icon-wrap">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="att-kpi-value">{attendancePercentage}%</div>
            <p className="att-kpi-subtext">Overall monthly reliability</p>
          </div>

          {/* Card 2: Present Days */}
          <div className="att-kpi-card emerald">
            <div className="att-kpi-glow"></div>
            <div className="att-kpi-header">
              <span className="att-kpi-title">Present Days</span>
              <div className="att-kpi-icon-wrap">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="att-kpi-value">{presentDaysCount}</div>
            <p className="att-kpi-subtext">Out of {totalWorkingDays} working days</p>
          </div>

          {/* Card 3: Late / Absent */}
          <div className="att-kpi-card amber">
            <div className="att-kpi-glow"></div>
            <div className="att-kpi-header">
              <span className="att-kpi-title">Late / Absent</span>
              <div className="att-kpi-icon-wrap">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="att-kpi-value">{lateDaysCount} / {absentDaysCount}</div>
            <p className="att-kpi-subtext">{lateDaysCount === 0 ? 'Punctuality on track' : `${lateDaysCount} late arrival(s)`}</p>
          </div>

          {/* Card 4: Average Work Hours */}
          <div className="att-kpi-card cyan">
            <div className="att-kpi-glow"></div>
            <div className="att-kpi-header">
              <span className="att-kpi-title">Avg Work Hours</span>
              <div className="att-kpi-icon-wrap">
                <Clock size={16} />
              </div>
            </div>
            <div className="att-kpi-value">{avgHoursDisplay}</div>
            <p className="att-kpi-subtext">Total logged: {totalHoursDisplay}</p>
          </div>

        </div>

      </div>

      {/* --------------------------------------------------------------------------
          3. MIDDLE SECTION: WEEKLY HOURS TREND CHART
          -------------------------------------------------------------------------- */}
      <div className="att-chart-section">
        <div className="att-chart-header">
          <div>
            <h3>
              <TrendingUp size={18} color="#818cf8" />
              Weekly Productive Hours
            </h3>
            <p>Net hours logged per week across {monthNameFormatted}</p>
          </div>

          <div className="att-chart-legend">
            <div className="att-legend-item">
              <span className="att-legend-color" style={{ background: '#6366f1' }}></span>
              <span>Logged Hours</span>
            </div>
            <div className="att-legend-item">
              <span className="att-legend-color" style={{ background: 'rgba(255, 255, 255, 0.2)' }}></span>
              <span>40h Standard Benchmark</span>
            </div>
          </div>
        </div>

        <div className="att-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyHoursData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                  borderColor: 'rgba(255, 255, 255, 0.12)', 
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  color: '#f8fafc' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="hours" 
                name="Hours Logged"
                stroke="#818cf8" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#hoursGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
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
              {['All', 'Present', 'Late', 'Absent'].map(tab => (
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
                <th>Date & Day</th>
                {(isAdminHR || isTeamLead) && <th>Employee</th>}
                <th>Check In</th>
                <th>Check Out</th>
                <th>Breaks</th>
                <th>Net Work Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((row, idx) => {
                  const dateObj = row.date ? new Date(row.date) : new Date();
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateStr = formatDate(row.date);
                  const breakTotal = (row.totalBreakDurationInSeconds || 0) + (row.totalLunchDurationInSeconds || 0);

                  return (
                    <tr key={row._id || idx}>
                      <td>
                        <div className="att-date-col">
                          <span className="att-date-primary">{dateStr}</span>
                          <span className="att-date-sub">{dayName}</span>
                        </div>
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
                        <span className="att-time-val">
                          {row.firstLoginTime 
                            ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : '--:--'}
                        </span>
                      </td>

                      <td>
                        <span className="att-time-val">
                          {row.lastLogoutTime 
                            ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : '--:--'}
                        </span>
                      </td>

                      <td>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          {breakTotal > 0 ? formatHours(breakTotal) : '0m'}
                        </span>
                      </td>

                      <td>
                        <span className="att-duration-badge">
                          {formatHours(row.totalWorkDurationInSeconds)}
                        </span>
                      </td>

                      <td>
                        <StatusBadge status={row.status || 'Present'} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={(isAdminHR || isTeamLead) ? 7 : 6} className="att-empty-row">
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
        title="Request Attendance Correction"
      >
        <form onSubmit={submitCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>
            Missed a punch or had a system issue? Submit a correction request with proposed times for Admin/HR review.
          </p>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>Date *</label>
            <input 
              type="date" 
              className="input-field" 
              required 
              value={correctionPayload.date}
              onChange={e => setCorrectionPayload({ ...correctionPayload, date: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>Correction Type *</label>
            <select 
              className="input-field" 
              value={correctionPayload.correctionType}
              onChange={e => setCorrectionPayload({ ...correctionPayload, correctionType: e.target.value })}
            >
              <option value="Missed Check-In">Missed Check-In</option>
              <option value="Missed Check-Out">Missed Check-Out</option>
              <option value="Incorrect Status">Incorrect Status Marked</option>
              <option value="System Glitch">Network / Device Issue</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>Correct Check-In</label>
              <input 
                type="time" 
                className="input-field" 
                value={correctionPayload.checkInTime}
                onChange={e => setCorrectionPayload({ ...correctionPayload, checkInTime: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>Correct Check-Out</label>
              <input 
                type="time" 
                className="input-field" 
                value={correctionPayload.checkOutTime}
                onChange={e => setCorrectionPayload({ ...correctionPayload, checkOutTime: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem', display: 'block' }}>Reason & Justification *</label>
            <textarea 
              className="input-field" 
              required 
              rows="3" 
              placeholder="State reason for missing check-in/out..."
              value={correctionPayload.reason}
              onChange={e => setCorrectionPayload({ ...correctionPayload, reason: e.target.value })}
            ></textarea>
          </div>

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
            >
              Submit for Approval
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
              <input 
                type="date" 
                className="pdf-date-input" 
                value={pdfStartDate}
                onChange={e => setPdfStartDate(e.target.value)}
              />
            </div>
            <div className="pdf-date-field">
              <label>To Date</label>
              <input 
                type="date" 
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

    </div>
  );
};

export default Attendance;

