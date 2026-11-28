import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import {
  Search, Save, CheckCircle2, RefreshCw,
  ChevronLeft, ChevronRight, CalendarDays, AlertCircle,
  Pencil, Clock, LogIn, LogOut, Coffee, Utensils,
  Users, UserCheck, UserX, CalendarOff, AlertTriangle, Sparkles, BarChart2,
  CalendarCheck, FileCheck, Check, X
} from 'lucide-react';
import DateInput, { toIsoDate } from '../components/common/DateInput';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import './AdminAttendance.css';


// ─── Helpers ────────────────────────────────────────────────
const toLocalDateStr = (d) => {
  if (!d) return new Date().toISOString().split('T')[0];
  const dt = typeof d === 'string' && d.includes('/') ? new Date(toIsoDate(d)) : new Date(d);
  if (isNaN(dt.getTime())) return new Date().toISOString().split('T')[0];
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fmtDuration = (secs) => {
  if (!secs || secs <= 0) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}H ${m}M`;
};

const STATUS_OPTIONS = [
  'Present', 'Absent', 'Permission', 'Half Day', 'On Leave', 'Late', 'Office Holiday', 'Sunday Holiday', 'Government Holiday'
];

const getBadgeClass = (status) => {
  const map = {
    'Working': 'working', 'Checked Out': 'checked', 'On Break': 'working',
    'On Lunch': 'working', 'Present': 'present', 'Absent': 'absent',
    'Permission': 'permission', 'On Leave': 'leave', 'Half Day': 'half', 'Work From Home': 'wfh',
    'Late': 'late', 'Not Checked In': 'not-in',
    'Office Holiday': 'holiday', 'Sunday Holiday': 'holiday', 'Government Holiday': 'holiday'
  };
  return map[status] || 'not-in';
};

const getStatusPillStyle = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'present':
    case 'working':
      return { background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)' };
    case 'absent':
      return { background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.4)' };
    case 'on leave':
    case 'leave':
      return { background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' };
    case 'half day':
      return { background: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', border: '1px solid rgba(251, 146, 60, 0.4)' };
    case 'late':
      return { background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)' };
    case 'permission':
      return { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' };
    case 'office holiday':
    case 'sunday holiday':
    case 'government holiday':
    case 'holiday':
      return { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' };
    default:
      return { background: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.15)' };
  }
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const TN_GOVT_HOLIDAYS = {
  '01-01': "New Year's Day",
  '01-15': 'Pongal',
  '01-16': 'Thiruvalluvar Day',
  '01-17': 'Uzhavar Thirunal',
  '01-26': 'Republic Day',
  '03-19': 'Telugu New Year',
  '03-21': 'Ramzan (Id-ul-Fitr)',
  '03-31': 'Mahaveer Jayanthi',
  '04-03': 'Good Friday',
  '04-14': 'Tamil New Year / Dr. Ambedkar Jayanti',
  '05-01': 'May Day (Labour Day)',
  '05-28': 'Bakrid (Eid al-Adha)',
  '06-26': 'Muharram',
  '08-15': 'Independence Day',
  '08-26': 'Milad-un-Nabi',
  '09-04': 'Krishna Jayanthi',
  '09-14': 'Vinayakar Chathurthi',
  '10-02': 'Gandhi Jayanthi',
  '10-19': 'Ayutha Pooja',
  '10-20': 'Vijaya Dasami',
  '11-08': 'Deepavali',
  '12-25': 'Christmas'
};

const getGovtHolidayName = (dateStr) => {
  if (!dateStr) return null;
  const iso = typeof dateStr === 'string' && dateStr.includes('/') ? toIsoDate(dateStr) : String(dateStr);
  const parts = iso.split('T')[0].split('-');
  if (parts.length >= 3) {
    const mmdd = `${parts[1]}-${parts[2]}`;
    return TN_GOVT_HOLIDAYS[mmdd] || null;
  }
  return null;
};

// ─── Component ──────────────────────────────────────────────
const AdminAttendance = () => {
  const today = toLocalDateStr(new Date());

  // Tabs: 'daily' | 'monthly'
  const [activeTab, setActiveTab] = useState('daily');

  // Daily register state
  const [selectedDate, setSelectedDate] = useState(today);
  const [register, setRegister] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savedRows, setSavedRows] = useState(new Set());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [bulkSaving, setBulkSaving] = useState(false);

  // Correction Requests State
  const [corrections, setCorrections] = useState([]);
  const [correctionsLoading, setCorrectionsLoading] = useState(false);

  const fetchCorrections = useCallback(async () => {
    setCorrectionsLoading(true);
    try {
      const res = await api.get('/admin/attendance/corrections');
      if (res.data.success) {
        setCorrections(res.data.data || []);
      }
    } catch (err) {
      console.error('fetchCorrections error:', err);
    } finally {
      setCorrectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const handleUpdateCorrectionStatus = async (id, status) => {
    try {
      const res = await api.put(`/admin/attendance/corrections/${id}/status`, { status });
      if (res.data.success) {
        showToast(
          status === 'Approved'
            ? '✓ Correction request approved & attendance updated!'
            : '✕ Correction request rejected.',
          status === 'Approved' ? 'success' : 'info'
        );
        setCorrections(prev => prev.map(c => (c._id === id || c.id === id) ? { ...c, status } : c));
        fetchRegister();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update correction status', 'error');
    }
  };

  // Edit Modal State
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'Present',
    inTime: '',
    outTime: '',
    breakMinutes: 15,
    lunchMinutes: 45,
    reason: ''
  });
  const [modalSaving, setModalSaving] = useState(false);

  const handleOpenEditModal = (row) => {
    const currentStatus = row._localStatus || row.status || 'Present';
    const isGovt = currentStatus === 'Government Holiday';
    const holName = getGovtHolidayName(selectedDate);
    let defaultReason = row.correctionReason || '';
    if (!defaultReason && (isGovt || holName)) {
      defaultReason = `Government Holiday - ${holName || 'Public Holiday'}`;
    }

    setEditingRow(row);
    setEditForm({
      status: isGovt ? 'Government Holiday' : (holName && !row.firstLoginTime ? 'Government Holiday' : currentStatus),
      inTime: row.firstLoginTime ? new Date(row.firstLoginTime).toTimeString().slice(0, 5) : '',
      outTime: row.lastLogoutTime ? new Date(row.lastLogoutTime).toTimeString().slice(0, 5) : '',
      breakMinutes: row.totalBreakDurationInSeconds !== undefined ? Math.round(row.totalBreakDurationInSeconds / 60) : (isGovt ? 0 : 15),
      lunchMinutes: row.totalLunchDurationInSeconds !== undefined ? Math.round(row.totalLunchDurationInSeconds / 60) : (isGovt ? 0 : 45),
      reason: defaultReason
    });
  };

  const handleEditStatusChange = (newStatus) => {
    if (newStatus === 'Government Holiday') {
      const holName = getGovtHolidayName(selectedDate) || 'Public Holiday';
      setEditForm(prev => ({
        ...prev,
        status: newStatus,
        inTime: '',
        outTime: '',
        breakMinutes: 0,
        lunchMinutes: 0,
        reason: `Government Holiday - ${holName}`
      }));
    } else if (newStatus === 'Sunday Holiday') {
      setEditForm(prev => ({
        ...prev,
        status: newStatus,
        inTime: '',
        outTime: '',
        breakMinutes: 0,
        lunchMinutes: 0,
        reason: 'Sunday Holiday - Weekly Off'
      }));
    } else if (newStatus === 'Office Holiday') {
      setEditForm(prev => ({
        ...prev,
        status: newStatus,
        inTime: '',
        outTime: '',
        breakMinutes: 0,
        lunchMinutes: 0,
        reason: prev.reason || 'Office Holiday Declared'
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        status: newStatus,
        inTime: prev.inTime || '09:30',
        outTime: prev.outTime || '18:30'
      }));
    }
  };

  const handleSaveModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingRow) return;
    setModalSaving(true);
    try {
      let firstLoginTime = null;
      let lastLogoutTime = null;

      if (editForm.inTime) {
        const dt = new Date(selectedDate);
        const [h, m] = editForm.inTime.split(':');
        dt.setHours(parseInt(h), parseInt(m), 0, 0);
        firstLoginTime = dt.toISOString();
      }
      if (editForm.outTime) {
        const dt = new Date(selectedDate);
        const [h, m] = editForm.outTime.split(':');
        dt.setHours(parseInt(h), parseInt(m), 0, 0);
        lastLogoutTime = dt.toISOString();
      }

      const bSec = (Number(editForm.breakMinutes) || 0) * 60;
      const lSec = (Number(editForm.lunchMinutes) || 0) * 60;

      await api.post('/admin/attendance/mark', {
        employeeId: editingRow.employeeId,
        date: selectedDate,
        status: editForm.status,
        firstLoginTime,
        lastLogoutTime,
        breakMinutes: Number(editForm.breakMinutes) || 0,
        lunchMinutes: Number(editForm.lunchMinutes) || 0,
        totalBreakDurationInSeconds: bSec,
        totalLunchDurationInSeconds: lSec,
        correctionReason: editForm.reason || ''
      });

      showToast(`✓ Updated attendance for ${editingRow.fullName}`, 'success');
      setEditingRow(null);
      fetchRegister(selectedDate);
    } catch {
      showToast(`Failed to update attendance for ${editingRow.fullName}`, 'error');
    } finally {
      setModalSaving(false);
    }
  };

  // Monthly report state
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const isRealEmployeeRow = (row) => {
    const role = (row.role || row.user?.role || '').toLowerCase();
    const empId = (row.empCode || row.employeeId || '').toUpperCase();
    const name = (row.fullName || row.name || '').toLowerCase();
    const dept = (row.department || '').toLowerCase();
    const email = (row.email || row.personalEmailAddress || '').toLowerCase();

    if (role.includes('admin') || role.includes('superadmin') || dept === 'management') return false;
    if (empId === 'CTI-ADM-001' || empId.startsWith('CTI-ADM')) return false;
    if (name.includes('codethrive admin') || name.includes('admin') || name === 'system administrator') return false;
    if (email === 'admin@codethrive.com') return false;
    return true;
  };

  // ─── Fetch daily register ──────────────────────────────────
  const fetchRegister = useCallback(async (date) => {
    setLoading(true);
    setSavedRows(new Set());
    try {
      const res = await api.get(`/admin/attendance/register?date=${date}`);
      if (res.data.success) {
        // Filter out admin users so only real employees appear
        const cleanList = (res.data.data || []).filter(isRealEmployeeRow);
        // Add local editable fields to each row
        const rows = cleanList.map(row => ({
          ...row,
          _localStatus: row.status,
          _localIn: row.firstLoginTime ? new Date(row.firstLoginTime).toTimeString().slice(0,5) : '',
          _localOut: row.lastLogoutTime ? new Date(row.lastLogoutTime).toTimeString().slice(0,5) : '',
        }));
        setRegister(rows);
        
        // Recalculate summary strictly for real employees
        const summaryObj = {
          total: rows.length,
          present: rows.filter(r => ['Working', 'Checked Out', 'On Break', 'On Lunch', 'Present', 'Late', 'Permission'].includes(r._localStatus)).length,
          absent: rows.filter(r => r._localStatus === 'Absent').length,
          permission: rows.filter(r => r._localStatus === 'Permission').length,
          onLeave: rows.filter(r => r._localStatus === 'On Leave').length,
          halfDay: rows.filter(r => r._localStatus === 'Half Day').length,
          late: rows.filter(r => r._localStatus === 'Late').length,
        };
        setSummary(summaryObj);
      }
    } catch {
      showToast('Failed to load attendance register', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'daily') fetchRegister(selectedDate);
  }, [selectedDate, activeTab, fetchRegister]);

  // ─── Fetch monthly report ──────────────────────────────────
  const fetchMonthly = useCallback(async () => {
    setMonthlyLoading(true);
    try {
      const res = await api.get(`/admin/attendance/monthly?month=${reportMonth}&year=${reportYear}`);
      if (res.data.success) {
        const cleanData = (res.data.data || []).filter(r => {
          const emp = r.employee || {};
          const empId = (emp.employeeId || r.empCode || '').toUpperCase();
          const name = (emp.fullName || r.fullName || '').toLowerCase();
          const dept = (emp.department || r.department || '').toLowerCase();
          const role = (emp.role || r.role || '').toLowerCase();
          if (role.includes('admin') || role.includes('superadmin') || dept === 'management') return false;
          if (empId === 'CTI-ADM-001' || empId.startsWith('CTI-ADM')) return false;
          if (name.includes('codethrive admin') || name.includes('admin') || name === 'system administrator') return false;
          return true;
        });
        setMonthlyData(cleanData);
      }
    } catch {
      showToast('Failed to load monthly report', 'error');
    } finally {
      setMonthlyLoading(false);
    }
  }, [reportMonth, reportYear, showToast]);

  useEffect(() => {
    if (activeTab === 'monthly') fetchMonthly();
  }, [activeTab, fetchMonthly]);

  // ─── Inline field change ───────────────────────────────────
  const handleFieldChange = (empId, field, value) => {
    setRegister(prev => prev.map(r => r.employeeId === empId ? { ...r, [field]: value } : r));
    setSavedRows(prev => { const s = new Set(prev); s.delete(empId); return s; });
  };

  // ─── Save single row ───────────────────────────────────────
  const saveRow = async (row) => {
    setSavingId(row.employeeId);
    try {
      await api.post('/admin/attendance/mark', {
        employeeId: row.employeeId,
        date: selectedDate,
        status: row._localStatus,
        firstLoginTime: row.firstLoginTime,
        lastLogoutTime: row.lastLogoutTime,
        correctionReason: 'Admin marked via attendance register',
      });

      setSavedRows(prev => new Set([...prev, row.employeeId]));
      showToast(`✓ ${row.fullName}'s attendance saved as "${row._localStatus}"`, 'success');
      fetchRegister(selectedDate);
    } catch {
      showToast(`Failed to save ${row.fullName}'s attendance`, 'error');
    } finally {
      setSavingId(null);
    }
  };

  // ─── Bulk save all ─────────────────────────────────────────
  const saveAll = async () => {
    setBulkSaving(true);
    try {
      const records = filteredRegister.map(row => ({
        employeeId: row.employeeId,
        status: row._localStatus,
        firstLoginTime: row.firstLoginTime,
        lastLogoutTime: row.lastLogoutTime,
        correctionReason: 'Admin bulk mark'
      }));
      const res = await api.post('/admin/attendance/bulk-mark', { date: selectedDate, records });
      if (res.data.success) {
        const savedIds = new Set(filteredRegister.map(r => r.employeeId));
        setSavedRows(savedIds);
        showToast(`✓ All attendance saved — ${res.data.results.length} records`, 'success');
        fetchRegister(selectedDate);
      }
    } catch {
      showToast('Bulk save failed', 'error');
    } finally {
      setBulkSaving(false);
    }
  };

  // ─── Filtered list ─────────────────────────────────────────
  const filteredRegister = register
    .filter(r => {
      const matchSearch = search === '' ||
        r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.empCode?.toLowerCase().includes(search.toLowerCase()) ||
        r.department?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterStatus === 'ALL' || r._localStatus === filterStatus;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const nameA = (a.fullName || '').trim().toLowerCase();
      const nameB = (b.fullName || '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // ─── Nav date ──────────────────────────────────────────────
  const shiftDate = (days) => {
    const iso = (selectedDate && typeof selectedDate === 'string' && selectedDate.includes('/')) ? toIsoDate(selectedDate) : selectedDate;
    const d = new Date(iso || new Date());
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    setSelectedDate(toLocalDateStr(d));
  };

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="aa-page">
      {/* Hero */}
      <motion.div 
        className="aa-hero"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="aa-hero-ambient" />
        <div className="aa-hero-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="aa-hero-badge">
                <Sparkles size={13} className="aa-spin-slow" />
                <span>Executive Personnel Vault</span>
                <span className="aa-live-pulse-dot" />
                <span style={{ color: '#34d399', fontSize: '0.72rem', fontWeight: 700 }}>LIVE AUDIT</span>
              </div>
              <h1 className="aa-hero-title">Attendance Register</h1>
              <p className="aa-hero-desc">
                Real-time operational audit • Mark and manage daily employee attendance with instantaneous session sync
              </p>
            </div>

            {selectedDate !== today && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(today)}
                className="aa-today-jump-btn"
                title="Jump to Today's Register"
              >
                <CalendarCheck size={14} /> Jump to Today
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="aa-tabs-container">
        <button
          className={`aa-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
          id="aa-tab-daily"
        >
          <CalendarDays size={15} />
          <span>Daily Register</span>
        </button>
        <button
          className={`aa-tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
          id="aa-tab-monthly"
        >
          <BarChart2 size={15} />
          <span>Monthly Report</span>
        </button>
        <button
          className={`aa-tab-btn ${activeTab === 'corrections' ? 'active' : ''}`}
          onClick={() => { setActiveTab('corrections'); fetchCorrections(); }}
          id="aa-tab-corrections"
        >
          <FileCheck size={15} />
          <span>Correction Requests</span>
          {corrections.filter(c => c.status === 'Pending').length > 0 && (
            <span className="aa-badge-count-pill">
              {corrections.filter(c => c.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════ DAILY REGISTER TAB ═══════════════ */}
      {activeTab === 'daily' && (
        <>
          {/* Toolbar */}
          <div className="aa-toolbar">
            {/* Date Nav */}
            <div className="aa-date-picker">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => shiftDate(-1)} title="Previous Day"
              >
                <ChevronLeft size={16} />
              </motion.button>
              <label>Date</label>
              <DateInput
                value={selectedDate}
                max={today}
                onChange={e => setSelectedDate(e.target.value)}
                id="aa-date-input"
                className="aa-date-input-field"
                wrapperStyle={{ width: '135px' }}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.875rem', padding: '0.2rem 0' }}
                showIcon={false}
              />
              <motion.button
                whileHover={{ scale: selectedDate >= today ? 1 : 1.15 }}
                whileTap={{ scale: selectedDate >= today ? 1 : 0.9 }}
                style={{ background: 'none', border: 'none', color: selectedDate >= today ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: selectedDate >= today ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => selectedDate < today && shiftDate(1)} title="Next Day"
                disabled={selectedDate >= today}
              >
                <ChevronRight size={16} />
              </motion.button>
            </div>

            {/* Search */}
            <div className="aa-search-wrap">
              <Search size={14} className="aa-search-icon" />
              <input
                placeholder="Search employee, code, department…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="aa-search-input"
              />
            </div>

            {/* Filter */}
            <div className="aa-filter-tabs">
              {['ALL', 'Present', 'Absent', 'On Leave', 'Half Day', 'Late', 'Sunday Holiday', 'Government Holiday', 'Office Holiday'].map(f => (
                <button
                  key={f}
                  className={`aa-filter-btn ${filterStatus === f ? 'active' : ''}`}
                  onClick={() => setFilterStatus(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.08, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.55rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex' }}
              onClick={() => fetchRegister(selectedDate)} title="Refresh Data"
            >
              <RefreshCw size={15} />
            </motion.button>

            {/* Bulk Save */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="aa-btn-save-all"
              onClick={saveAll}
              disabled={bulkSaving || loading}
              id="aa-bulk-save-btn"
            >
              {bulkSaving ? <><div className="aa-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</> : <><Save size={16} /> Save All</>}
            </motion.button>
          </div>

          {/* Summary Cards with Framer Motion and Click-to-Filter */}
          {!loading && (
            <motion.div 
              className="aa-summary-grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
            >
              {[
                { key: 'ALL', label: 'Total', count: summary.total ?? 0, icon: Users, cls: 'total', color: '#a5b4fc', bg: 'rgba(99, 102, 241, 0.12)' },
                { key: 'Present', label: 'Present', count: summary.present ?? 0, icon: UserCheck, cls: 'present', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' },
                { key: 'Absent', label: 'Absent', count: summary.absent ?? 0, icon: UserX, cls: 'absent', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' },
                { key: 'On Leave', label: 'On Leave', count: summary.onLeave ?? 0, icon: CalendarOff, cls: 'leave', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
                { key: 'Half Day', label: 'Half Day', count: summary.halfDay ?? 0, icon: Clock, cls: 'half', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)' },
                { key: 'Late', label: 'Late', count: summary.late ?? 0, icon: AlertTriangle, cls: 'late', color: '#e879f9', bg: 'rgba(232, 121, 249, 0.12)' },
              ].map(item => {
                const IconComponent = item.icon;
                const isSelected = filterStatus === item.key;
                return (
                  <motion.div
                    key={item.key}
                    whileHover={{ y: -4, scale: 1.025 }}
                    whileTap={{ scale: 0.97 }}
                    className={`aa-stat-card ${item.cls} ${isSelected ? 'active-filter' : ''}`}
                    onClick={() => setFilterStatus(item.key)}
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? `1.5px solid ${item.color}` : undefined,
                      boxShadow: isSelected ? `0 0 16px ${item.bg}` : undefined
                    }}
                    title={`Click to filter by ${item.label}`}
                  >
                    <div className="aa-stat-top">
                      <span className="aa-stat-icon-wrap" style={{ color: item.color, background: item.bg }}>
                        <IconComponent size={14} />
                      </span>
                      <span className="aa-stat-label">{item.label}</span>
                    </div>
                    <div className="aa-stat-num" style={{ color: item.color }}>{item.count}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Register Table */}
          <div className="aa-table-wrap">
            <div className="aa-table-header-bar">
              <h3>
                <CalendarDays size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle', color: '#818cf8' }} />
                {(() => {
                  const iso = (selectedDate && typeof selectedDate === 'string' && selectedDate.includes('/')) ? toIsoDate(selectedDate) : selectedDate;
                  const d = new Date((iso || today) + 'T00:00:00');
                  return (!isNaN(d.getTime()) ? d : new Date()).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                })()}
              </h3>
              <span className="aa-count-badge">{filteredRegister.length} employees</span>
            </div>

            {loading ? (
              <div className="aa-loading">
                <div className="aa-spinner" />
                <p>Loading attendance register…</p>
              </div>
            ) : filteredRegister.length === 0 ? (
              <div className="aa-empty">
                <div className="aa-empty-icon">📭</div>
                <p>{search || filterStatus !== 'ALL' ? 'No employees match your filter.' : 'No employees found.'}</p>
              </div>
            ) : (
              <div className="aa-table-scroll">
                <table className="aa-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Employee</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Department</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Check In</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Check Out</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Work Duration</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Break Time</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Lunch Time</th>
                      <th style={{ whiteSpace: 'nowrap', minWidth: '130px' }}>Status</th>
                      <th style={{ whiteSpace: 'nowrap', width: '100px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegister.map((row, idx) => {
                      const initial = (row.fullName || '?')[0].toUpperCase();
                      const bSec = row.totalBreakDurationInSeconds || (row.breakMinutes ? row.breakMinutes * 60 : 0);
                      const lSec = row.totalLunchDurationInSeconds || (row.lunchMinutes ? row.lunchMinutes * 60 : 0);

                      return (
                        <motion.tr 
                          key={row.employeeId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.3) }}
                          className="aa-row-animated"
                        >
                          <td style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', width: '40px' }}>{idx + 1}</td>

                          {/* Employee cell */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div className="aa-emp-cell">
                              {row.profilePhoto
                                ? <img src={row.profilePhoto} alt={row.fullName} className="aa-avatar" />
                                : <div className="aa-avatar-fallback">{initial}</div>
                              }
                              <div>
                                <div className="aa-emp-name" style={{ whiteSpace: 'nowrap' }}>
                                  {row.fullName}
                                </div>
                                <div className="aa-emp-code">{row.empCode || row.employeeId}</div>
                              </div>
                            </div>
                          </td>

                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className="aa-dept-pill">{row.department || 'General'}</span>
                          </td>

                          {/* Check In Time */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {row.firstLoginTime ? (
                              <span className="aa-pill-in">
                                <LogIn size={13} /> {new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>--:--</span>
                            )}
                          </td>

                          {/* Check Out Time */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {row.lastLogoutTime ? (
                              <span className="aa-pill-out">
                                <LogOut size={13} /> {new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>--:--</span>
                            )}
                          </td>

                          {/* Net Work Duration */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {row.totalWorkDurationInSeconds > 0 ? (
                              <span className="aa-pill-duration">
                                {fmtDuration(row.totalWorkDurationInSeconds)}
                              </span>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>--:--</span>
                            )}
                          </td>

                          {/* Break Time */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className="aa-pill-break">
                              <Coffee size={13} /> {bSec > 0 ? fmtDuration(bSec) : '0H 0M'}
                            </span>
                          </td>

                          {/* Lunch Time */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className="aa-pill-lunch">
                              <Utensils size={13} /> {lSec > 0 ? fmtDuration(lSec) : '0H 0M'}
                            </span>
                          </td>

                          {/* Status Capsule Badge */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                              <StatusBadge status={row._localStatus || row.status || 'Present'} />
                            </div>
                          </td>

                          {/* Actions: Edit button matching Employee page */}
                          <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                            <motion.button
                              whileHover={{ scale: 1.06 }}
                              whileTap={{ scale: 0.94 }}
                              type="button"
                              className="aa-action-edit-btn"
                              onClick={() => handleOpenEditModal(row)}
                              id={`aa-edit-row-${row.employeeId}`}
                              title="Edit Attendance for this day"
                            >
                              <Pencil size={13} /> Edit
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ MONTHLY REPORT TAB ═══════════════ */}
      {activeTab === 'monthly' && (
        <>
          {/* Month picker */}
          <div className="aa-toolbar">
            <div className="aa-date-picker">
              <label>Month</label>
              <select
                value={reportMonth}
                onChange={e => setReportMonth(Number(e.target.value))}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                id="aa-month-select"
              >
                {MONTHS.map((mn, i) => <option key={mn} value={i + 1} style={{ background: '#1e1b4b' }}>{mn}</option>)}
              </select>
              <label>Year</label>
              <input
                type="number"
                value={reportYear}
                onChange={e => setReportYear(Number(e.target.value))}
                min="2020"
                max={new Date().getFullYear()}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', outline: 'none', width: '70px', cursor: 'text' }}
                id="aa-year-input"
              />
            </div>
            <button className="aa-btn-save-all" onClick={fetchMonthly} disabled={monthlyLoading} id="aa-refresh-monthly-btn">
              <RefreshCw size={15} /> Load Report
            </button>
          </div>

          {/* Monthly table */}
          <div className="aa-table-wrap">
            <div className="aa-table-header-bar">
              <h3>Monthly Attendance — {MONTHS[reportMonth - 1]} {reportYear}</h3>
              <span className="aa-count-badge">{monthlyData.length} records</span>
            </div>

            {monthlyLoading ? (
              <div className="aa-loading">
                <div className="aa-spinner" />
                <p>Loading monthly report…</p>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="aa-empty">
                <div className="aa-empty-icon">📊</div>
                <p>No attendance records for this period.</p>
              </div>
            ) : (
              <div className="aa-table-scroll">
                <table className="aa-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Work Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((rec, idx) => (
                      <tr key={rec._id}>
                        <td style={{ color: 'rgba(255,255,255,0.3)' }}>{idx + 1}</td>
                        <td style={{ whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                          {new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td>
                          <div className="aa-emp-cell">
                            <div className="aa-avatar-fallback" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                              {(rec.employee?.fullName || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="aa-emp-name">{rec.employee?.fullName || 'N/A'}</div>
                              <div className="aa-emp-code">{rec.employee?.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{rec.employee?.department || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <StatusBadge status={rec.status || 'Present'} />
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {rec.firstLoginTime ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.84rem' }}>
                              <LogIn size={13} /> {new Date(rec.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>--:--</span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {rec.lastLogoutTime ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#f43f5e', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.84rem' }}>
                              <LogOut size={13} /> {new Date(rec.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>--:--</span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {rec.totalWorkDurationInSeconds > 0 ? (
                            <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.84rem' }}>
                              {fmtDuration(rec.totalWorkDurationInSeconds)}
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ CORRECTION REQUESTS TAB ═══════════════ */}
      {activeTab === 'corrections' && (
        <div className="aa-table-card">
          <div className="aa-table-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FileCheck size={18} style={{ color: '#38bdf8' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>Attendance Correction Requests</h3>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                  Employee-submitted punch corrections, break adjustments, and system issues
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="aa-btn aa-btn-secondary"
              onClick={fetchCorrections}
              title="Refresh Corrections"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={13} className={correctionsLoading ? 'aa-spin' : ''} /> Refresh
            </motion.button>
          </div>

          {correctionsLoading ? (
            <div className="aa-empty" style={{ padding: '3.5rem 0' }}>
              <div className="aa-spinner" />
              <p style={{ marginTop: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Loading correction requests...</p>
            </div>
          ) : corrections.length === 0 ? (
            <div className="aa-empty" style={{ padding: '3.5rem 0' }}>
              <CheckCircle2 size={38} style={{ color: '#34d399', opacity: 0.6, marginBottom: '0.6rem' }} />
              <p style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 0.35rem 0' }}>No Correction Requests Pending</p>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>All attendance records are synchronized.</span>
            </div>
          ) : (
            <div className="aa-table-wrapper">
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>EMPLOYEE</th>
                    <th>DATE</th>
                    <th>CORRECTION DETAILS</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map((item, idx) => {
                    const empName = item.employee?.fullName || 'Employee';
                    const empId = item.employee?.employeeId || 'CTI-EMP';
                    const dept = item.employee?.department || 'General';
                    const reqDateStr = item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                    const isPending = (item.status || 'Pending').toLowerCase() === 'pending';
                    const isApproved = (item.status || '').toLowerCase() === 'approved';

                    return (
                      <tr key={item._id || item.id || idx}>
                        <td style={{ color: 'rgba(255,255,255,0.3)', width: '30px' }}>{idx + 1}</td>
                        <td>
                          <div className="aa-emp-cell">
                            <div className="aa-avatar-circle">
                              {item.employee?.profilePhoto ? (
                                <img src={item.employee.profilePhoto} alt={empName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                empName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="aa-emp-meta">
                              <span className="aa-emp-name">{empName}</span>
                              <span className="aa-emp-code">{empId} • {dept}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#e2e8f0', fontSize: '0.84rem' }}>
                          {reqDateStr}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '420px' }}>
                            <span style={{ color: '#cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}>
                              {item.reason || 'Attendance Timing Correction'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge-capsule ${isPending ? 'warning' : isApproved ? 'success' : 'danger'}`} style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: isPending ? 'rgba(245, 158, 11, 0.15)' : isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isPending ? '#fbbf24' : isApproved ? '#34d399' : '#f87171',
                            border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.35)' : isApproved ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                          }}>
                            {isPending ? 'Pending Review' : item.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isPending ? (
                            <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="aa-action-btn-approve"
                                onClick={() => handleUpdateCorrectionStatus(item._id || item.id, 'Approved')}
                                title="Approve and apply correction to attendance"
                              >
                                <Check size={13} /> Approve
                              </button>
                              <button
                                type="button"
                                className="aa-action-btn-reject"
                                onClick={() => handleUpdateCorrectionStatus(item._id || item.id, 'Rejected')}
                                title="Reject request"
                              >
                                <X size={13} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: isApproved ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
                              {isApproved ? '✓ Applied to Register' : 'Rejected'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Attendance Modal */}
      <Modal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        title={<><Clock size={18} style={{ marginRight: '0.5rem', color: '#38bdf8' }} /> Edit Attendance — {editingRow?.fullName}</>}
      >
        <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem' }}>Attendance Date (DD/MM/YYYY)</label>
              <DateInput
                value={selectedDate}
                disabled
              />
            </div>

            <div>
              <label style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem' }}>Attendance Status</label>
              <select 
                className="aa-status-select" 
                value={editForm.status} 
                onChange={e => handleEditStatusChange(e.target.value)}
                style={{ width: '100%', padding: '0.55rem' }}
              >
                <option value="Present">Present (Full Day Approved)</option>
                <option value="Late">Late (Late Punch-In)</option>
                <option value="Half Day">Half Day</option>
                <option value="Permission">Permission (Official Permission)</option>
                <option value="On Leave">On Leave</option>
                <option value="Absent">Absent</option>
                <option value="Office Holiday">Office Holiday</option>
                <option value="Sunday Holiday">Sunday Holiday</option>
                <option value="Government Holiday">Government Holiday</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem', color: 'rgba(255,255,255,0.8)' }}>Check-In Time (Optional)</label>
              <input 
                type="time" 
                className="aa-time-input" 
                value={editForm.inTime} 
                onChange={e => setEditForm({ ...editForm, inTime: e.target.value })} 
                style={{ width: '100%', padding: '0.55rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                Standard: 09:30 AM (Grace to 10:15 AM)
              </span>
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem', color: 'rgba(255,255,255,0.8)' }}>Check-Out Time (Optional)</label>
              <input 
                type="time" 
                className="aa-time-input" 
                value={editForm.outTime} 
                onChange={e => setEditForm({ ...editForm, outTime: e.target.value })} 
                style={{ width: '100%', padding: '0.55rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                Standard: 06:30 PM
              </span>
            </div>
          </div>

          {/* Break and Lunch Duration Adjustment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem', color: 'rgba(255,255,255,0.8)' }}>
                ☕ Break Duration (Mins)
              </label>
              <input 
                type="number" 
                min="0"
                max="240"
                className="aa-time-input" 
                value={editForm.breakMinutes} 
                onChange={e => setEditForm({ ...editForm, breakMinutes: e.target.value })} 
                style={{ width: '100%', padding: '0.55rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#fbbf24', marginTop: '3px', display: 'block' }}>
                Standard: 15-20 mins
              </span>
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem', color: 'rgba(255,255,255,0.8)' }}>
                🍽️ Lunch Duration (Mins)
              </label>
              <input 
                type="number" 
                min="0"
                max="240"
                className="aa-time-input" 
                value={editForm.lunchMinutes} 
                onChange={e => setEditForm({ ...editForm, lunchMinutes: e.target.value })} 
                style={{ width: '100%', padding: '0.55rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#60a5fa', marginTop: '3px', display: 'block' }}>
                Standard: 45-60 mins
              </span>
            </div>
          </div>

          {/* Live Net Work Hours Calculation Preview */}
          {editForm.inTime && editForm.outTime && (() => {
            const [ih, im] = editForm.inTime.split(':').map(Number);
            const [oh, om] = editForm.outTime.split(':').map(Number);
            const totalShiftMins = (oh * 60 + om) - (ih * 60 + im);
            const totalBreakMins = (Number(editForm.breakMinutes) || 0) + (Number(editForm.lunchMinutes) || 0);
            const netWorkMins = Math.max(0, totalShiftMins - totalBreakMins);
            const wh = Math.floor(netWorkMins / 60);
            const wm = netWorkMins % 60;
            return (
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '0.65rem 0.9rem', fontSize: '0.8rem', color: '#93c5fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Shift Duration: <strong>{Math.floor(totalShiftMins / 60)}H {totalShiftMins % 60}M</strong> (Break: {totalBreakMins}M)</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>Net Working Hours: {wh}H {wm}M</span>
              </div>
            );
          })()}

          <div>
            <label style={{ fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem', color: 'rgba(255,255,255,0.8)' }}>Remarks / Reason (Optional)</label>
            <input 
              type="text" 
              placeholder="" 
              value={editForm.reason} 
              onChange={e => setEditForm({ ...editForm, reason: e.target.value })} 
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

          <div style={{
            position: 'sticky',
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10
          }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setEditingRow(null)}
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.84rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={modalSaving}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                border: 'none',
                padding: '0.55rem 1.4rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer'
              }}
            >
              <Save size={15} /> {modalSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className={`aa-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
