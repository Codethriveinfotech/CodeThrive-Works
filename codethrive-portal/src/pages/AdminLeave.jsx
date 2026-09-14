import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, CheckCircle, XCircle, Calendar, Clock, 
  User, Eye, Check, X, Sparkles, AlertCircle, RefreshCw, FileText, Layers
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

      const localShared = JSON.parse(localStorage.getItem('cti_shared_leaves') || '[]');
      
      let finalShared = localShared;
      if (localShared.length === 0 && apiLeaves.length === 0) {
        finalShared = [
          {
            _id: 'l-shared-1',
            employee: { fullName: 'Sarah Jenkins', employeeId: 'CTI-EMP-004', department: 'UI/UX Design', avatar: 'SJ' },
            employeeId: 'CTI-EMP-004',
            leaveType: 'Casual Leave',
            startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            reason: 'Attending family wedding event in hometown. Urgent personal work.',
            status: 'Pending',
            createdAt: new Date().toISOString()
          },
          {
            _id: 'l-shared-2',
            employee: { fullName: 'Alex Rivera', employeeId: 'CTI-EMP-007', department: 'Frontend Team', avatar: 'AR' },
            employeeId: 'CTI-EMP-007',
            leaveType: 'Sick Leave',
            startDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
            endDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            reason: 'High viral fever and doctor recommended complete bed rest for 2 days.',
            status: 'Approved',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            _id: 'l-shared-3',
            employee: { fullName: 'Michael Scott', employeeId: 'CTI-EMP-012', department: 'Operations', avatar: 'MS' },
            employeeId: 'CTI-EMP-012',
            leaveType: 'Vacation',
            startDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
            reason: 'Annual family vacation trip to Goa. Handed over pending tasks to Dwight.',
            status: 'Pending',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            _id: 'l-shared-4',
            employee: { fullName: 'Pam Beesly', employeeId: 'CTI-EMP-015', department: 'Design Team', avatar: 'PB' },
            employeeId: 'CTI-EMP-015',
            leaveType: 'Maternity Leave',
            startDate: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000 * 45).toISOString().split('T')[0],
            reason: 'Maternity leave request for 60 days as per HR policy guidelines.',
            status: 'Approved',
            createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
          }
        ];
        localStorage.setItem('cti_shared_leaves', JSON.stringify(finalShared));
      }

      const map = new Map();
      apiLeaves.forEach(l => map.set(l._id, l));
      finalShared.forEach(l => map.set(l._id, l));

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

      {/* Main Content Card */}
      <Card style={{ background: 'rgba(15, 23, 42, 0.75)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', backdropFilter: 'blur(16px)' }}>
        
        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '4px', overflowX: 'auto', maxWidth: '100%' }}>
            {[
              { key: 'ALL', label: 'All Requests', count: stats.total },
              { key: 'Pending', label: 'Pending', count: stats.pending },
              { key: 'Approved', label: 'Approved', count: stats.approved },
              { key: 'Rejected', label: 'Rejected', count: stats.rejected }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: statusFilter === tab.key ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                  color: statusFilter === tab.key ? '#fff' : 'var(--text-muted)',
                  fontWeight: statusFilter === tab.key ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  background: statusFilter === tab.key ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontSize: '0.75rem'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '0 1rem',
            flex: 1,
            minWidth: '240px'
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
                padding: '0.65rem 0.75rem',
                outline: 'none',
                width: '100%',
                fontSize: '0.88rem'
              }}
            />
          </div>
        </div>

        {/* Leave Table View */}
        <div className="table-responsive" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '780px', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.8rem 1rem', textAlign: 'left' }}>Employee</th>
                <th style={{ padding: '0.8rem 1rem', textAlign: 'left' }}>Leave Type</th>
                <th style={{ padding: '0.8rem 1rem', textAlign: 'left' }}>Duration & Dates</th>
                <th style={{ padding: '0.8rem 1rem', textAlign: 'left' }}>Reason Overview</th>
                <th style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Actions</th>
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
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                    className="hover-lift"
                  >
                    {/* Employee info */}
                    <td style={{ padding: '1rem', borderRadius: '12px 0 0 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '150px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                          flexShrink: 0
                        }}>
                          {empInitials}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{req.employee?.fullName}</span>
                          <span style={{ fontSize: '0.78rem', color: '#a5b4fc', whiteSpace: 'nowrap' }}>{req.employee?.employeeId || req.employeeId}</span>
                        </div>
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        background: req.leaveType?.includes('Sick') ? 'rgba(239, 68, 68, 0.15)' :
                                    req.leaveType?.includes('Casual') ? 'rgba(245, 158, 11, 0.15)' :
                                    req.leaveType?.includes('Maternity') ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: req.leaveType?.includes('Sick') ? '#fca5a5' :
                               req.leaveType?.includes('Casual') ? '#fde68a' :
                               req.leaveType?.includes('Maternity') ? '#fbcfe8' : '#93c5fd',
                        border: req.leaveType?.includes('Sick') ? '1px solid rgba(239, 68, 68, 0.3)' :
                                req.leaveType?.includes('Casual') ? '1px solid rgba(245, 158, 11, 0.3)' :
                                req.leaveType?.includes('Maternity') ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        {req.leaveType}
                      </span>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: '145px' }}>
                        <div style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {req.startDate} to {req.endDate}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ⏱️ {days} {days === 1 ? 'Day' : 'Days'} Total
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td style={{ padding: '1rem', maxWidth: '240px' }}>
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem'
                      }}>
                        {req.reason}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedLeave(req)}
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
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
                                padding: '0.45rem 0.75rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9))',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              <Check size={15} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req._id, 'Rejected')}
                              style={{
                                padding: '0.45rem 0.75rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(185, 28, 28, 0.9))',
                                border: 'none',
                                color: '#fff',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                              }}
                            >
                              <X size={15} />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', italic: 'true' }}>
                            {req.status === 'Approved' ? '✓ Authorized' : '✗ Declined'}
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                      <AlertCircle size={40} color="var(--text-muted)" />
                      <h4 style={{ margin: 0, color: '#fff' }}>No Leave Applications Found</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Try clearing search terms or changing selected status filters.
                      </p>
                    </div>
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
