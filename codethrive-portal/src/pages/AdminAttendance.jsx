import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import {
  Search, Save, CheckCircle2, RefreshCw,
  ChevronLeft, ChevronRight, CalendarDays, AlertCircle
} from 'lucide-react';
import DateInput, { toIsoDate } from '../components/common/DateInput';
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
  'Present', 'Absent', 'Permission', 'Half Day', 'On Leave', 'Work From Home', 'Late', 'Checked Out',
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
      let firstLoginTime = null;
      let lastLogoutTime = null;

      if (row._localIn) {
        const dt = new Date(selectedDate);
        const [h, m] = row._localIn.split(':');
        dt.setHours(parseInt(h), parseInt(m), 0, 0);
        firstLoginTime = dt.toISOString();
      }
      if (row._localOut) {
        const dt = new Date(selectedDate);
        const [h, m] = row._localOut.split(':');
        dt.setHours(parseInt(h), parseInt(m), 0, 0);
        lastLogoutTime = dt.toISOString();
      }

      await api.post('/admin/attendance/mark', {
        employeeId: row.employeeId,
        date: selectedDate,
        status: row._localStatus,
        firstLoginTime,
        lastLogoutTime,
        correctionReason: 'Admin marked via attendance register',
      });

      setSavedRows(prev => new Set([...prev, row.employeeId]));
      showToast(`✓ ${row.fullName}'s attendance saved`, 'success');
      // Refresh summary
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
      const records = filteredRegister.map(row => {
        let firstLoginTime = null;
        let lastLogoutTime = null;
        if (row._localIn) {
          const dt = new Date(selectedDate);
          const [h, m] = row._localIn.split(':');
          dt.setHours(parseInt(h), parseInt(m), 0, 0);
          firstLoginTime = dt.toISOString();
        }
        if (row._localOut) {
          const dt = new Date(selectedDate);
          const [h, m] = row._localOut.split(':');
          dt.setHours(parseInt(h), parseInt(m), 0, 0);
          lastLogoutTime = dt.toISOString();
        }
        return { employeeId: row.employeeId, status: row._localStatus, firstLoginTime, lastLogoutTime };
      });
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
              {['ALL', 'Present', 'Absent', 'On Leave', 'Half Day', 'Work From Home', 'Late'].map(f => (
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
              <div className="aa-stat-card wfh">
                <div className="aa-stat-num">{summary.wfh ?? 0}</div>
                <div className="aa-stat-label">WFH</div>
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
                      <th>#</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Work Hours</th>
                      <th>Action</th>
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
                                  {row.isManualCorrection && <span className="aa-correction-dot" title="Manually corrected" />}
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
                              {/* Also allow current system-set statuses */}
                              {!STATUS_OPTIONS.includes(row.status) && <option value={row.status}>{row.status}</option>}
                            </select>
                          </td>

                          {/* Time In */}
                          <td>
                            <input
                              type="time"
                              className="aa-time-input"
                              value={row._localIn}
                              onChange={e => handleFieldChange(row.employeeId, '_localIn', e.target.value)}
                              id={`aa-in-${row.employeeId}`}
                            />
                          </td>

                          {/* Time Out */}
                          <td>
                            <input
                              type="time"
                              className="aa-time-input"
                              value={row._localOut}
                              onChange={e => handleFieldChange(row.employeeId, '_localOut', e.target.value)}
                              id={`aa-out-${row.employeeId}`}
                            />
                          </td>

                          {/* Work Hours */}
                          <td style={{ color: 'rgba(255,255,255,0.55)' }}>
                            {row._localIn && row._localOut
                              ? (() => {
                                  const [ih, im] = row._localIn.split(':').map(Number);
                                  const [oh, om] = row._localOut.split(':').map(Number);
                                  const mins = (oh * 60 + om) - (ih * 60 + im);
                                  if (mins <= 0) return '—';
                                  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                                })()
                              : fmtDuration(row.totalWorkDurationInSeconds)
                            }
                          </td>

                          {/* Save Row */}
                          <td>
                            <button
                              className={`aa-save-btn ${isSaved ? 'saved' : ''}`}
                              onClick={() => saveRow(row)}
                              disabled={isSaving}
                              id={`aa-save-row-${row.employeeId}`}
                            >
                              {isSaving ? <><div className="aa-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Saving</> :
                               isSaved ? <><CheckCircle2 size={13} /> Saved</> :
                               <><Save size={13} /> Save</>}
                            </button>
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
