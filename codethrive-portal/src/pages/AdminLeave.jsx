import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, CheckCircle, XCircle, Calendar, Clock, 
  Eye, Check, X, Sparkles, RefreshCw, FileText, Layers,
  Quote, User, Tag, ShieldCheck
} from 'lucide-react';
import './Admin.css';
import './Modules.css';

const fmtLeaveDate = (d) => {
  if (!d) return '—';
  const cleanStr = String(d).split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const day = parts[2];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day} ${monthNames[m - 1] || parts[1]} ${y}`;
  }
  return cleanStr;
};

const AdminLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [readingReasonModal, setReadingReasonModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      let apiLeaves = [];
      try {
        const res = await api.get('/leaves');
        apiLeaves = res.data?.data || [];
      } catch (err) {
        console.warn('Backend API offline or empty for admin leaves', err);
      }

      const rawShared = JSON.parse(localStorage.getItem('cti_shared_leaves') || '[]');
      const localShared = rawShared.filter(l => {
        if (!l || !l._id) return false;
        const idStr = l._id.toString();
        if (idStr.startsWith('l-shared-') || idStr.startsWith('l-demo-') || idStr.startsWith('l-mock-')) return false;
        if (l.reason?.toLowerCase().includes('personal family commitments')) return false;
        if (l.startDate === '9/10/2026' || l.startDate === '2026-09-10') return false;
        return true;
      });
      localStorage.setItem('cti_shared_leaves', JSON.stringify(localShared));
      
      const map = new Map();
      apiLeaves.forEach(l => map.set(l._id, l));
      localShared.forEach(l => map.set(l._id, l));

      setLeaves(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/leaves/${id}`, { status });
    } catch (err) {
      console.warn('Backend API update skipped', err);
    }

    const updated = leaves.map(l => l._id === id ? { ...l, status } : l);
    setLeaves(updated);

    try {
      const localShared = JSON.parse(localStorage.getItem('cti_shared_leaves') || '[]');
      const updatedShared = localShared.map(l => l._id === id ? { ...l, status } : l);
      localStorage.setItem('cti_shared_leaves', JSON.stringify(updatedShared));
    } catch (e) {
      console.warn('LocalStorage update failed', e);
    }

    showNotification(`Leave application marked as ${status.toUpperCase()}`);
    if (selectedLeave && selectedLeave._id === id) {
      setSelectedLeave(prev => ({ ...prev, status }));
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length
  };

  const filteredLeaves = leaves.filter(l => {
    const searchLower = searchTerm.toLowerCase();
    const empName = l.employee?.fullName?.toLowerCase() || '';
    const empId = l.employee?.employeeId?.toLowerCase() || '';
    const type = l.leaveType?.toLowerCase() || '';
    const matchesSearch = empName.includes(searchLower) || empId.includes(searchLower) || type.includes(searchLower);
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="loader" style={{ width: '45px', height: '45px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Synchronizing Leave Consoles...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative' }}
    >
      {/* Toast alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
              backdropFilter: 'blur(10px)'
            }}
          >
            <CheckCircle size={20} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="ultra-premium-hero" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(45, 27, 75, 0.75) 50%, rgba(15, 23, 42, 0.92) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <h1 className="welcome-title-glowing" style={{ fontSize: '1.9rem', margin: '0 0 0.35rem 0' }}>Leave Management</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.88rem' }}>
            Review pending leave requests, authorize staff time-off, and track real-time leave balances across departments.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="metrics-grid">
        <div 
          className={`stat-card stat-card-indigo ${statusFilter === 'ALL' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('ALL')}
          title="Click to view all leave applications"
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-indigo">
              <Layers size={18} />
            </div>
            <span className="stat-tag tag-indigo">
              <span className="beacon-dot"></span> ALL SUBMISSIONS
            </span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{stats.total}</h3>
            <p className="stat-title">Total Applications</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">All Staff Submissions</span>
            <span className="stat-active-pill pill-indigo">Total</span>
          </div>
        </div>

        <div 
          className={`stat-card stat-card-amber ${statusFilter === 'Pending' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('Pending')}
          title="Click to filter pending applications"
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-amber">
              <Clock size={18} />
            </div>
            <span className="stat-tag tag-amber">REVIEW REQ</span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{stats.pending}</h3>
            <p className="stat-title">Pending Approval</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Immediate Review Needed</span>
            <span className="stat-active-pill pill-amber">Pending</span>
          </div>
        </div>

        <div 
          className={`stat-card stat-card-emerald ${statusFilter === 'Approved' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('Approved')}
          title="Click to filter approved applications"
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-emerald">
              <CheckCircle size={18} />
            </div>
            <span className="stat-tag tag-emerald">AUTHORIZED</span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{stats.approved}</h3>
            <p className="stat-title">Approved Leaves</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Authorized & Logged</span>
            <span className="stat-active-pill pill-emerald">Approved</span>
          </div>
        </div>

        <div 
          className={`stat-card stat-card-red ${statusFilter === 'Rejected' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('Rejected')}
          title="Click to filter rejected applications"
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-red">
              <XCircle size={18} />
            </div>
            <span className="stat-tag tag-red">DECLINED</span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{stats.rejected}</h3>
            <p className="stat-title">Rejected Requests</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Declined Applications</span>
            <span className="stat-active-pill pill-red">Rejected</span>
          </div>
        </div>
      </div>

      {/* Main Content Card - High-Tech Glass Console */}
      <Card style={{ 
        background: 'linear-gradient(135deg, rgba(21, 32, 51, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)', 
        borderRadius: '24px', 
        border: '1px solid rgba(255, 255, 255, 0.12)', 
        padding: '1.75rem', 
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}>
        
        {/* Filter and Search Control Bar Box */}
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.65)', 
          padding: '1rem 1.25rem', 
          borderRadius: '18px', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          backdropFilter: 'blur(12px)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          marginBottom: '1.75rem',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '100%', padding: '2px' }}>
            {[
              { key: 'ALL', label: 'All Requests', count: stats.total },
              { key: 'Pending', label: 'Pending', count: stats.pending },
              { key: 'Approved', label: 'Approved', count: stats.approved },
              { key: 'Rejected', label: 'Rejected', count: stats.rejected }
            ].map(tab => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '12px',
                    border: isActive ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive 
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                      : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 6px 20px rgba(245, 158, 11, 0.4)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    background: isActive ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '0 1.1rem',
            flex: 1,
            minWidth: '260px',
            transition: 'all 0.25s ease'
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text"
              placeholder="Search employee or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '0.75rem 0.75rem',
                outline: 'none',
                width: '100%',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                title="Clear Search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Leave Table Container */}
        <div className="table-responsive" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '780px', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <thead>
              <tr style={{ 
                color: '#94a3b8', 
                fontSize: '0.8rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em', 
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700
              }}>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'left', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px 0 0 12px' }}>Employee</th>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'left', background: 'rgba(30, 41, 59, 0.4)' }}>Leave Type</th>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'left', background: 'rgba(30, 41, 59, 0.4)' }}>Date Period</th>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'left', background: 'rgba(30, 41, 59, 0.4)' }}>Reason</th>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'center', background: 'rgba(30, 41, 59, 0.4)' }}>Status</th>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'right', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '0 12px 12px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((req, index) => {
                return (
                  <motion.tr 
                    key={req._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)',
                      borderRadius: '16px',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
                    }}
                    className="hover-lift"
                  >
                    {/* Employee info: Name & ID without avatar image/circle */}
                    <td style={{ padding: '0.9rem 1.15rem', borderRadius: '16px 0 0 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem', whiteSpace: 'nowrap' }}>
                          {req.employee?.fullName || 'Employee'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {req.employee?.employeeId || req.employeeId}
                        </span>
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td style={{ padding: '0.9rem 1.15rem' }}>
                      <span style={{
                        padding: '0.35rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        background: req.leaveType?.includes('Sick') ? 'rgba(239, 68, 68, 0.18)' :
                                    req.leaveType?.includes('Casual') ? 'rgba(245, 158, 11, 0.18)' :
                                    req.leaveType?.includes('Maternity') ? 'rgba(236, 72, 153, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                        color: req.leaveType?.includes('Sick') ? '#fca5a5' :
                               req.leaveType?.includes('Casual') ? '#fde68a' :
                               req.leaveType?.includes('Maternity') ? '#fbcfe8' : '#93c5fd',
                        border: req.leaveType?.includes('Sick') ? '1px solid rgba(239, 68, 68, 0.35)' :
                                req.leaveType?.includes('Casual') ? '1px solid rgba(245, 158, 11, 0.35)' :
                                req.leaveType?.includes('Maternity') ? '1px solid rgba(236, 72, 153, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)'
                      }}>
                        {req.leaveType}
                      </span>
                    </td>

                    {/* Date Period: Only From and To dates formatted cleanly */}
                    <td style={{ padding: '0.9rem 1.15rem' }}>
                      <div style={{ fontSize: '0.86rem', color: '#f1f5f9', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {fmtLeaveDate(req.startDate)} to {fmtLeaveDate(req.endDate)}
                      </div>
                    </td>

                    {/* Reason: Read button & preview */}
                    <td style={{ padding: '0.9rem 1.15rem', maxWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: '#cbd5e1',
                          fontSize: '0.84rem',
                          maxWidth: '160px'
                        }}>
                          {req.reason}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReadingReasonModal(req)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.24rem 0.55rem',
                            borderRadius: '6px',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                          }}
                          title="Click to read full leave reason in popup"
                        >
                          <Eye size={13} />
                          <span>Read</span>
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Actions: Pending shows Approve/Reject; already Approved/Rejected shows no inspect or text */}
                    <td style={{ padding: '0.9rem 1.15rem', textAlign: 'right', borderRadius: '0 16px 16px 0' }}>
                      <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {req.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(req._id, 'Approved')}
                              style={{
                                padding: '0.38rem 0.75rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                              }}
                              title="Approve Leave"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req._id, 'Rejected')}
                              style={{
                                padding: '0.38rem 0.75rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
                              }}
                              title="Reject Leave"
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>—</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {/* Masterpiece Animated Empty Console Card (When 0 Records) */}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ border: 'none', padding: '1.5rem 0' }}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      style={{
                        background: 'radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
                        border: '1px dashed rgba(245, 158, 11, 0.3)',
                        borderRadius: '24px',
                        padding: '3.5rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '1.25rem',
                        boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.4)'
                      }}
                    >
                      {/* Multi-layer Glowing Icon Box */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 35px rgba(245, 158, 11, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <Calendar size={36} color="#fbbf24" />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', maxWidth: '540px' }}>
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#fbbf24',
                          padding: '0.35rem 0.95rem',
                          borderRadius: '20px',
                          fontSize: '0.785rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          marginBottom: '0.4rem'
                        }}>
                          <Sparkles size={13} /> 0 Active Leave Submissions
                        </div>

                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                          No Leave Applications Found
                        </h3>

                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.925rem', lineHeight: 1.6 }}>
                          All employee time-off requests, vacation applications, and authorization logs will appear here in real-time.
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.5rem' }}>
                        {(searchTerm || statusFilter !== 'ALL') && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('ALL');
                            }}
                            className="btn-outline-glass"
                            style={{ fontSize: '0.85rem', padding: '0.55rem 1.1rem' }}
                          >
                            <X size={15} /> Clear Search & Filters
                          </button>
                        )}
                        <button
                          onClick={fetchLeaves}
                          className="btn-primary-glow"
                          style={{ fontSize: '0.85rem', padding: '0.55rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                        >
                          <RefreshCw size={15} /> Refresh Consoles
                        </button>
                      </div>
                    </motion.div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Leave Reason Popup Modal */}
      {readingReasonModal && (
        <Modal
          isOpen={!!readingReasonModal}
          onClose={() => setReadingReasonModal(null)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}>
                <Quote size={17} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  Official Leave Application Reason
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Submitted by {readingReasonModal.employee?.fullName || 'Staff Member'}
                </span>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', paddingTop: '0.25rem' }}>
            {/* Metadata Pills Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
              gap: '0.75rem', 
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.75))', 
              padding: '0.9rem 1.1rem', 
              borderRadius: '12px', 
              border: '1px solid rgba(255, 255, 255, 0.08)' 
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={11} style={{ color: '#60a5fa' }} /> Staff Member
                </span>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem', marginTop: '3px' }}>
                  {readingReasonModal.employee?.fullName || 'Employee'}
                </div>
                <span style={{ fontSize: '0.74rem', color: '#818cf8', fontFamily: 'monospace' }}>
                  {readingReasonModal.employee?.employeeId || readingReasonModal.employeeId}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tag size={11} style={{ color: '#fbbf24' }} /> Leave Type
                </span>
                <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.9rem', marginTop: '3px' }}>
                  {readingReasonModal.leaveType}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={11} style={{ color: '#a78bfa' }} /> Period
                </span>
                <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.86rem', marginTop: '3px' }}>
                  {fmtLeaveDate(readingReasonModal.startDate)} <span style={{ color: '#94a3b8' }}>→</span> {fmtLeaveDate(readingReasonModal.endDate)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={11} style={{ color: '#34d399' }} /> Review Status
                </span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={readingReasonModal.status} />
                </div>
              </div>
            </div>

            {/* Quotation Statement Card */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Employee Statement & Justification
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Full submitted remark
                </span>
              </div>

              <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.65))',
                border: '1px solid rgba(99, 102, 241, 0.28)',
                borderLeft: '4px solid #6366f1',
                borderRadius: '12px',
                padding: '1.2rem 1.4rem',
                boxShadow: '0 10px 28px rgba(0, 0, 0, 0.4)',
                overflow: 'hidden'
              }}>
                <Quote size={48} style={{
                  position: 'absolute',
                  top: '10px',
                  right: '14px',
                  color: 'rgba(99, 102, 241, 0.08)',
                  pointerEvents: 'none'
                }} />

                <p style={{
                  position: 'relative',
                  margin: 0,
                  color: '#e2e8f0',
                  fontSize: '0.94rem',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  fontStyle: 'normal'
                }}>
                  {readingReasonModal.reason || 'No specific remarks provided.'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setReadingReasonModal(null)} 
                style={{ 
                  padding: '0.55rem 1.5rem', 
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  borderRadius: '9px',
                  borderColor: 'rgba(99, 102, 241, 0.35)',
                  background: 'rgba(99, 102, 241, 0.08)',
                  color: '#e2e8f0'
                }}
              >
                Close Statement
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default AdminLeave;
