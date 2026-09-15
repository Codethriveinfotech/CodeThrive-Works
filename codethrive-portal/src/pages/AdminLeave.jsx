import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, CheckCircle, XCircle, Calendar, Clock, 
  Eye, Check, X, Sparkles, RefreshCw, FileText, Layers
} from 'lucide-react';
import './Modules.css';

const AdminLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLeave, setSelectedLeave] = useState(null);
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
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(139, 92, 246, 0.1), rgba(15, 23, 42, 0.6))',
        borderRadius: '20px',
        padding: '2rem 2.2rem',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)'
            }}>
              <Calendar size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Leave Management
              </h1>
              <span style={{ fontSize: '0.85rem', color: '#fcd34d', fontWeight: 500 }}>HR Approval & Time-Off Console</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0 0', fontSize: '0.95rem', maxWidth: '600px' }}>
            Review pending leave requests, authorize staff time-off, and track real-time leave balances across departments.
          </p>
        </div>

      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => setStatusFilter('ALL')}
          style={{
            background: statusFilter === 'ALL' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(15, 23, 42, 0.8))' : 'rgba(15, 23, 42, 0.6)',
            border: statusFilter === 'ALL' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.3rem 1.5rem',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: statusFilter === 'ALL' ? '0 10px 25px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Applications</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{stats.total}</div>
          <div style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: '0.3rem' }}>All employee submissions</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => setStatusFilter('Pending')}
          style={{
            background: statusFilter === 'Pending' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(15, 23, 42, 0.8))' : 'rgba(15, 23, 42, 0.6)',
            border: statusFilter === 'Pending' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.3rem 1.5rem',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: statusFilter === 'Pending' ? '0 10px 25px rgba(245, 158, 11, 0.2)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Approval</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{stats.pending}</div>
          <div style={{ fontSize: '0.8rem', color: '#fde68a', marginTop: '0.3rem' }}>Requires immediate review</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => setStatusFilter('Approved')}
          style={{
            background: statusFilter === 'Approved' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(15, 23, 42, 0.8))' : 'rgba(15, 23, 42, 0.6)',
            border: statusFilter === 'Approved' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.3rem 1.5rem',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: statusFilter === 'Approved' ? '0 10px 25px rgba(16, 185, 129, 0.2)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved Leaves</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{stats.approved}</div>
          <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '0.3rem' }}>Authorized & logged</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => setStatusFilter('Rejected')}
          style={{
            background: statusFilter === 'Rejected' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(15, 23, 42, 0.8))' : 'rgba(15, 23, 42, 0.6)',
            border: statusFilter === 'Rejected' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.3rem 1.5rem',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: statusFilter === 'Rejected' ? '0 10px 25px rgba(239, 68, 68, 0.2)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rejected Requests</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>{stats.rejected}</div>
          <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '0.3rem' }}>Declined applications</div>
        </motion.div>
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
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px 0 0 12px' }}>Employee</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', background: 'rgba(30, 41, 59, 0.4)' }}>Leave Type</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', background: 'rgba(30, 41, 59, 0.4)' }}>Duration & Dates</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', background: 'rgba(30, 41, 59, 0.4)' }}>Reason Overview</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'center', background: 'rgba(30, 41, 59, 0.4)' }}>Status</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '0 12px 12px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((req, index) => {
                const days = calculateDays(req.startDate, req.endDate);
                const empInitials = req.employee?.avatar || req.employee?.fullName?.split(' ').map(n => n[0]).join('') || 'EMP';
                
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
                    {/* Employee info */}
                    <td style={{ padding: '1.1rem 1.25rem', borderRadius: '16px 0 0 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '160px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                          flexShrink: 0
                        }}>
                          {empInitials}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{req.employee?.fullName}</span>
                          <span style={{ fontSize: '0.785rem', color: '#60a5fa', fontWeight: 600, whiteSpace: 'nowrap' }}>{req.employee?.employeeId || req.employeeId}</span>
                        </div>
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <span style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
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

                    {/* Duration */}
                    <td style={{ padding: '1.1rem 1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
                        <div style={{ fontSize: '0.88rem', color: '#f1f5f9', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {req.startDate} to {req.endDate}
                        </div>
                        <div style={{ fontSize: '0.785rem', color: '#fbbf24', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ⏱️ {days} {days === 1 ? 'Day' : 'Days'} Total
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td style={{ padding: '1.1rem 1.25rem', maxWidth: '240px' }}>
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#cbd5e1',
                        fontSize: '0.86rem'
                      }}>
                        {req.reason}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1.1rem 1.25rem', textAlign: 'center' }}>
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right', borderRadius: '0 16px 16px 0' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedLeave(req)}
                          style={{
                            padding: '0.45rem 0.8rem',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.2s ease'
                          }}
                          title="View Full Application"
                        >
                          <Eye size={15} />
                          <span>Inspect</span>
                        </button>

                        {req.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(req._id, 'Approved')}
                              style={{
                                padding: '0.45rem 0.85rem',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                              }}
                            >
                              <Check size={15} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req._id, 'Rejected')}
                              style={{
                                padding: '0.45rem 0.85rem',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                              }}
                            >
                              <X size={15} />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.785rem', color: '#94a3b8', fontWeight: 600 }}>
                            {req.status === 'Approved' ? '✓ Authorized' : '✗ Declined'}
                          </span>
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

      {/* Inspect Leave Detail Modal */}
      <AnimatePresence>
        {selectedLeave && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                width: '100%',
                maxWidth: '540px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '1.5rem 1.8rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FileText color="#f59e0b" size={22} />
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Leave Application Dossier</h3>
                </div>
                <button
                  onClick={() => setSelectedLeave(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}>
                    {selectedLeave.employee?.avatar || 'EMP'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{selectedLeave.employee?.fullName}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>
                      ID: {selectedLeave.employee?.employeeId || selectedLeave.employeeId} • {selectedLeave.employee?.department || 'Operations'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.9rem', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leave Type</span>
                    <div style={{ fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{selectedLeave.leaveType}</div>
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.9rem', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</span>
                    <div style={{ fontWeight: 700, color: '#f59e0b', marginTop: '0.2rem' }}>
                      {calculateDays(selectedLeave.startDate, selectedLeave.endDate)} Days Off
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.9rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date Window</span>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', marginTop: '0.2rem' }}>
                    From {selectedLeave.startDate} to {selectedLeave.endDate}
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Application Reason</span>
                  <p style={{ color: '#e2e8f0', margin: '0.4rem 0 0 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    "{selectedLeave.reason}"
                  </p>
                </div>
              </div>

              <div style={{
                padding: '1.2rem 1.8rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                <StatusBadge status={selectedLeave.status} />

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {selectedLeave.status !== 'Approved' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedLeave._id, 'Approved')}
                      style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Approve Request
                    </button>
                  )}
                  {selectedLeave.status !== 'Rejected' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedLeave._id, 'Rejected')}
                      style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Reject Request
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminLeave;
