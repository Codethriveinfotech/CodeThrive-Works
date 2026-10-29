import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import {
  Search, Save, CheckCircle2, RefreshCw,
  ChevronLeft, ChevronRight, CalendarDays, AlertCircle,
  Pencil, Clock
} from 'lucide-react';
import DateInput, { toIsoDate } from '../components/common/DateInput';
import Modal from '../components/common/Modal';
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
  return `${h}h ${m}m`;
};

const STATUS_OPTIONS = [
  'Present', 'Absent', 'Permission', 'Half Day', 'On Leave', 'Late',
];

const getBadgeClass = (status) => {
  const map = {
    'Working': 'working', 'Checked Out': 'checked', 'On Break': 'working',
    'On Lunch': 'working', 'Present': 'present', 'Absent': 'absent',
    'Permission': 'permission', 'On Leave': 'leave', 'Half Day': 'half', 'Work From Home': 'wfh',
    'Late': 'late', 'Not Checked In': 'not-in',
  };
  return map[status] || 'not-in';
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

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

  // Edit Modal State
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'Present',
    inTime: '',
    outTime: '',
    reason: ''
  });
  const [modalSaving, setModalSaving] = useState(false);

  const handleOpenEditModal = (row) => {
    setEditingRow(row);
    setEditForm({
      status: row._localStatus || row.status || 'Present',
      inTime: row.firstLoginTime ? new Date(row.firstLoginTime).toTimeString().slice(0, 5) : '',
      outTime: row.lastLogoutTime ? new Date(row.lastLogoutTime).toTimeString().slice(0, 5) : '',
      reason: row.correctionReason || ''
    });
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

      await api.post('/admin/attendance/mark', {
        employeeId: editingRow.employeeId,
        date: selectedDate,
        status: editForm.status,
        firstLoginTime,
        lastLogoutTime,
        correctionReason: editForm.reason || 'Admin manual update'
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

  // ─── Fetch daily register ──────────────────────────────────
  const fetchRegister = useCallback(async (date) => {
    setLoading(true);
    setSavedRows(new Set());
    try {
      const res = await api.get(`/admin/attendance/register?date=${date}`);
      if (res.data.success) {
        // Add local editable fields to each row
        const rows = res.data.data.map(row => ({
          ...row,
          _localStatus: row.status,
          _localIn: row.firstLoginTime ? new Date(row.firstLoginTime).toTimeString().slice(0,5) : '',
          _localOut: row.lastLogoutTime ? new Date(row.lastLogoutTime).toTimeString().slice(0,5) : '',
        }));
        setRegister(rows);
        setSummary(res.data.summary || {});
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
      if (res.data.success) setMonthlyData(res.data.data);
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
  const filteredRegister = register.filter(r => {
    const matchSearch = search === '' ||
      r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.empCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'ALL' || r._localStatus === filterStatus;
    return matchSearch && matchFilter;
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
      <div className="aa-hero">
        <div className="aa-hero-content">
          <h1>📋 Attendance Register</h1>
          <p>Mark and manage daily employee attendance — school/college style register for your entire team</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="aa-tabs">
        <button
          className={`aa-tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          Daily Register
        </button>
        <button
          className={`aa-tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Report
        </button>
      </div>

      {/* ═══════════════ DAILY REGISTER TAB ═══════════════ */}
      {activeTab === 'daily' && (
        <>
          {/* Toolbar */}
          <div className="aa-toolbar">
            {/* Date Nav */}
            <div className="aa-date-picker">
              <button
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => shiftDate(-1)} title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>
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
              <button
                style={{ background: 'none', border: 'none', color: selectedDate >= today ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)', cursor: selectedDate >= today ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => selectedDate < today && shiftDate(1)} title="Next Day"
                disabled={selectedDate >= today}
              >
                <ChevronRight size={16} />
              </button>
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
              {['ALL', 'Present', 'Absent', 'On Leave', 'Half Day', 'Late'].map(f => (
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
            <button
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}
              onClick={() => fetchRegister(selectedDate)} title="Refresh"
            >
              <RefreshCw size={16} />
            </button>

            {/* Bulk Save */}
            <button
              className="aa-btn-save-all"
              onClick={saveAll}
              disabled={bulkSaving || loading}
              id="aa-bulk-save-btn"
            >
              {bulkSaving ? <><div className="aa-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</> : <><Save size={16} /> Save All</>}
            </button>
          </div>

          {/* Summary Cards */}
          {!loading && (
            <div className="aa-summary-grid">
              <div className="aa-stat-card total">
                <div className="aa-stat-num">{summary.total ?? 0}</div>
                <div className="aa-stat-label">Total</div>
              </div>
              <div className="aa-stat-card present">
                <div className="aa-stat-num">{summary.present ?? 0}</div>
                <div className="aa-stat-label">Present</div>
              </div>
              <div className="aa-stat-card absent">
                <div className="aa-stat-num">{summary.absent ?? 0}</div>
                <div className="aa-stat-label">Absent</div>
              </div>
              <div className="aa-stat-card leave">
                <div className="aa-stat-num">{summary.onLeave ?? 0}</div>
                <div className="aa-stat-label">On Leave</div>
              </div>
              <div className="aa-stat-card half">
                <div className="aa-stat-num">{summary.halfDay ?? 0}</div>
                <div className="aa-stat-label">Half Day</div>
              </div>
              <div className="aa-stat-card late">
                <div className="aa-stat-num">{summary.late ?? 0}</div>
                <div className="aa-stat-label">Late</div>
              </div>
            </div>
          )}

          {/* Register Table */}
          <div className="aa-table-wrap">
            <div className="aa-table-header-bar">
              <h3>
                <CalendarDays size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
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
                      <th style={{ width: '40px' }}>#</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th style={{ width: '180px' }}>Attendance Status</th>
                      <th>Logged Punch</th>
                      <th style={{ width: '160px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegister.map((row, idx) => {
                      const isSaved = savedRows.has(row.employeeId);
                      const isSaving = savingId === row.employeeId;
                      const initial = (row.fullName || '?')[0].toUpperCase();

                      return (
                        <tr key={row.employeeId}>
                          <td style={{ color: 'rgba(255,255,255,0.3)', width: '40px' }}>{idx + 1}</td>

                          {/* Employee cell */}
                          <td>
                            <div className="aa-emp-cell">
                              {row.profilePhoto
                                ? <img src={row.profilePhoto} alt={row.fullName} className="aa-avatar" />
                                : <div className="aa-avatar-fallback">{initial}</div>
                              }
                              <div>
                                <div className="aa-emp-name">
                                  {row.fullName}
                                  {row.isManualCorrection && <span className="aa-correction-dot" title={row.correctionReason || 'Admin edited'} />}
                                </div>
                                <div className="aa-emp-code">{row.empCode}</div>
                              </div>
                            </div>
                          </td>

                          <td style={{ color: 'rgba(255,255,255,0.55)' }}>{row.department}</td>

                          {/* Status Dropdown */}
                          <td>
                            <select
                              className="aa-status-select"
                              value={row._localStatus}
                              onChange={e => handleFieldChange(row.employeeId, '_localStatus', e.target.value)}
                              id={`aa-status-${row.employeeId}`}
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                              {!STATUS_OPTIONS.includes(row._localStatus) && <option value={row._localStatus}>{row._localStatus}</option>}
                            </select>
                          </td>

                          {/* Logged Punch (Automated or recorded checkin/checkout) */}
                          <td>
                            {row.firstLoginTime ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ color: '#34d399', fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 600 }}>
                                  In: {fmtTime(row.firstLoginTime)}
                                </span>
                                {row.lastLogoutTime && (
                                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.74rem', fontFamily: 'monospace' }}>
                                    Out: {fmtTime(row.lastLogoutTime)} {row.totalWorkDurationInSeconds > 0 ? `(${fmtDuration(row.totalWorkDurationInSeconds)})` : ''}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                                Not Checked In
                              </span>
                            )}
                          </td>

                          {/* Actions: Save button & Edit button */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <button
                                className={`aa-save-btn ${isSaved ? 'saved' : ''}`}
                                onClick={() => saveRow(row)}
                                disabled={isSaving}
                                id={`aa-save-row-${row.employeeId}`}
                                title="Save Attendance Status"
                              >
                                {isSaving ? <><div className="aa-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Saving</> :
                                 isSaved ? <><CheckCircle2 size={13} /> Saved</> :
                                 <><Save size={13} /> Save</>}
                              </button>
                              <button
                                type="button"
                                className="aa-edit-btn"
                                onClick={() => handleOpenEditModal(row)}
                                id={`aa-edit-row-${row.employeeId}`}
                                title="Edit Attendance Details"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                            </div>
                          </td>
                        </tr>
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
                        <td>
                          <span className={`aa-badge ${getBadgeClass(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{fmtTime(rec.firstLoginTime)}</td>
                        <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{fmtTime(rec.lastLogoutTime)}</td>
                        <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{fmtDuration(rec.totalWorkDurationInSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Attendance Modal */}
      <Modal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        title={<><Clock size={18} style={{ marginRight: '0.5rem', color: '#38bdf8' }} /> Edit Attendance — {editingRow?.fullName}</>}
      >
        <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem' }}>Attendance Date</label>
              <input 
                type="text" 
                className="aa-time-input" 
                value={selectedDate} 
                disabled 
                style={{ width: '100%', padding: '0.55rem', opacity: 0.7, cursor: 'not-allowed', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem' }}>Attendance Status</label>
              <select 
                className="aa-status-select" 
                value={editForm.status} 
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                style={{ width: '100%', padding: '0.55rem' }}
              >
                <option value="Present">Present (Full Day Approved)</option>
                <option value="Late">Late (Late Punch-In)</option>
                <option value="Half Day">Half Day</option>
                <option value="Permission">Permission (Official Permission)</option>
                <option value="On Leave">On Leave</option>
                <option value="Absent">Absent</option>
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

          <div>
            <label style={{ fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem', color: 'rgba(255,255,255,0.8)' }}>Remarks / Reason (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Management approval / Late check-in excused / System adjustment" 
              value={editForm.reason} 
              onChange={e => setEditForm({ ...editForm, reason: e.target.value })} 
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setEditingRow(null)}
              style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={modalSaving}
              style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
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
