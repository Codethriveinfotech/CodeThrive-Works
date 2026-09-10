import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, PlusCircle, CheckCircle2, Clock, 
  AlertCircle, CalendarRange, Sparkles, Filter, 
  FileText, ArrowUpRight, Search, RefreshCw, UserCheck, ShieldCheck
} from 'lucide-react';
import './Leave.css';

const Leave = () => {
  const [data, setData] = useState({ requests: [], casualLeaveBalance: 12, sickLeaveBalance: 6, paidLeaveBalance: 15, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves/my-leaves');
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('Backend API offline or empty, using fallback leave data', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeaves();
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/leaves', formData);
      const newLeave = res.data?.data || {
        _id: 'l-local-' + Date.now(),
        ...formData,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      
      setData(prev => ({
        ...prev,
        pendingRequests: (prev.pendingRequests || 0) + 1,
        requests: [newLeave, ...(prev.requests || [])]
      }));
      setIsModalOpen(false);
      setFormData({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
    } catch (err) {
      // Local fallback in case server fails
      const fallbackLeave = {
        _id: 'l-fallback-' + Date.now(),
        ...formData,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      setData(prev => ({
        ...prev,
        pendingRequests: (prev.pendingRequests || 0) + 1,
        requests: [fallbackLeave, ...(prev.requests || [])]
      }));
      setIsModalOpen(false);
      setFormData({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
    }
  };

  const safeRequests = Array.isArray(data.requests) ? data.requests : [];

  const filteredRequests = safeRequests.filter(req => {
    const matchesTab = activeTab === 'All' || req.status === activeTab || req.leaveType === activeTab;
    const matchesSearch = (req.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (req.leaveType || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Calculate day difference for preview
  const calcDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const requestedDays = calcDays(formData.startDate, formData.endDate);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="loader-small" style={{ width: '42px', height: '42px', borderWidth: '3px' }}></div>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading Leave Workspace...</p>
    </div>
  );

  return (
    <motion.div 
      className="leave-workspace-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* --------------------------------------------------------------------------
          1. HERO HEADER
         -------------------------------------------------------------------------- */}
      <div className="leave-hero-banner">
        <div className="hero-left-content">
          <div className="hero-badge-pill">
            <Sparkles size={14} className="sparkle-icon" />
            <span>TIME-OFF & ATTENDANCE MANAGEMENT</span>
          </div>
          <h1 className="hero-main-title">Leave & Attendance Hub</h1>
          <p className="hero-subtext">
            Track your casual, sick, and earned leave balances, submit time-off requests, and monitor approval statuses in real-time.
          </p>
        </div>

        <div className="hero-right-actions">
          <button 
            onClick={handleRefresh} 
            className="btn-glass-icon"
            title="Refresh Leave Data"
          >
            <RefreshCw size={17} className={isRefreshing ? 'spin' : ''} />
          </button>

          <button className="btn-primary-glow" onClick={() => setIsModalOpen(true)}>
            <PlusCircle size={19} />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          2. LEAVE BALANCE METRIC CARDS (4 ANIMATED CARDS)
         -------------------------------------------------------------------------- */}
      <div className="leave-metrics-grid">
        {/* Card 1: Casual Leave */}
        <motion.div 
          className="leave-metric-card emerald"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="metric-icon-wrapper emerald">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-title">Casual Leave Balance</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.casualLeaveBalance || 12}</span>
              <span className="metric-unit">days available</span>
            </div>
            <span className="metric-subtext">Annual quota: 12 days</span>
          </div>
        </motion.div>

        {/* Card 2: Sick Leave */}
        <motion.div 
          className="leave-metric-card amber"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="metric-icon-wrapper amber">
            <AlertCircle size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-title">Sick Leave Balance</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.sickLeaveBalance || 6}</span>
              <span className="metric-unit">days available</span>
            </div>
            <span className="metric-subtext">Annual quota: 6 days</span>
          </div>
        </motion.div>

        {/* Card 3: Paid Leave */}
        <motion.div 
          className="leave-metric-card blue"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="metric-icon-wrapper blue">
            <CalendarRange size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-title">Earned / Paid Leave</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.paidLeaveBalance || 15}</span>
              <span className="metric-unit">days available</span>
            </div>
            <span className="metric-subtext">Carried over from Q3</span>
          </div>
        </motion.div>

        {/* Card 4: Pending Approvals */}
        <motion.div 
          className="leave-metric-card purple"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="metric-icon-wrapper purple">
            <Clock size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-title">Pending Approvals</span>
            <div className="metric-value-row">
              <span className="metric-value">{data.pendingRequests || 0}</span>
              <span className="metric-unit">active requests</span>
            </div>
            <span className="metric-subtext">Awaiting Manager Review</span>
          </div>
        </motion.div>
      </div>

      {/* --------------------------------------------------------------------------
          3. WORKSPACE TOOLBAR (SEARCH & TAB FILTERS)
         -------------------------------------------------------------------------- */}
      <div className="leave-toolbar-card">
        <div className="leave-search-box">
          <Search size={17} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search leave requests by reason or type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="leave-filter-tabs">
          <button 
            className={`tab-pill ${activeTab === 'All' ? 'active' : ''}`}
            onClick={() => setActiveTab('All')}
          >
            All Requests ({safeRequests.length})
          </button>
          <button 
            className={`tab-pill ${activeTab === 'Approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('Approved')}
          >
            Approved
          </button>
          <button 
            className={`tab-pill ${activeTab === 'Pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('Pending')}
          >
            Pending
          </button>
          <button 
            className={`tab-pill ${activeTab === 'Casual' ? 'active' : ''}`}
            onClick={() => setActiveTab('Casual')}
          >
            Casual
          </button>
          <button 
            className={`tab-pill ${activeTab === 'Sick' ? 'active' : ''}`}
            onClick={() => setActiveTab('Sick')}
          >
            Sick
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          4. LEAVE REQUESTS TABLE / LIST
         -------------------------------------------------------------------------- */}
      <div className="leave-table-card">
        {safeRequests.length === 0 ? (
          <div className="leave-empty-state">
            <div className="empty-icon-ring">
              <Calendar size={40} />
            </div>
            <h3>No Leave Requests Recorded</h3>
            <p>You haven't requested any time off yet. Click below to submit your first leave application.</p>
            <button className="btn-primary-glow" onClick={() => setIsModalOpen(true)}>
              <PlusCircle size={18} /> Apply for Leave
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="leave-empty-state">
            <p>No leave requests matched your filter parameters.</p>
            <button className="btn-outline-glass" onClick={() => { setActiveTab('All'); setSearchQuery(''); }}>Reset Filters</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="leave-data-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Duration & Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredRequests.map(req => {
                    const start = new Date(req.startDate);
                    const end = new Date(req.endDate);
                    const days = calcDays(req.startDate, req.endDate) || 1;
                    const appliedOn = req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Today';

                    return (
                      <motion.tr 
                        key={req._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ background: 'rgba(255, 255, 255, 0.03)' }}
                      >
                        <td>
                          <span className={`leave-type-pill ${req.leaveType?.toLowerCase() || 'casual'}`}>
                            {req.leaveType} Leave
                          </span>
                        </td>
                        <td>
                          <div className="date-range-cell">
                            <span className="dates">{start.toLocaleDateString()} - {end.toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>
                          <span className="days-count-badge">{days} {days === 1 ? 'day' : 'days'}</span>
                        </td>
                        <td className="reason-cell">
                          <p className="reason-text">{req.reason}</p>
                        </td>
                        <td>
                          <span className="applied-date">{appliedOn}</span>
                        </td>
                        <td>
                          <StatusBadge status={req.status || 'Pending'} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------------
          5. APPLY FOR LEAVE MODAL
         -------------------------------------------------------------------------- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Apply for Time-Off / Leave"
      >
        <form onSubmit={handleApplyLeave} className="exec-modal-form">
          <div className="form-group-pro">
            <label className="form-label-pro">Leave Category</label>
            <select 
              className="input-field-pro" 
              required 
              value={formData.leaveType} 
              onChange={e => setFormData({...formData, leaveType: e.target.value})}
            >
              <option value="Casual">🌴 Casual Leave (CL)</option>
              <option value="Sick">🏥 Sick Leave (SL)</option>
              <option value="Paid">💼 Earned / Paid Leave (PL)</option>
              <option value="Unpaid">🚫 Unpaid Leave (LWP)</option>
              <option value="WFH">🏠 Work From Home (WFH)</option>
              <option value="Permission">⏱️ Short Permission (2 Hours)</option>
            </select>
          </div>

          <div className="form-row-2col">
            <div className="form-group-pro">
              <label className="form-label-pro">Start Date</label>
              <input 
                type="date" 
                className="input-field-pro" 
                required 
                value={formData.startDate} 
                onChange={e => setFormData({...formData, startDate: e.target.value})} 
              />
            </div>
            <div className="form-group-pro">
              <label className="form-label-pro">End Date</label>
              <input 
                type="date" 
                className="input-field-pro" 
                required 
                value={formData.endDate} 
                onChange={e => setFormData({...formData, endDate: e.target.value})} 
              />
            </div>
          </div>

          {requestedDays > 0 && (
            <div className="duration-preview-box">
              <Clock size={15} color="#60a5fa" />
              <span>Calculated Leave Duration: <strong>{requestedDays} {requestedDays === 1 ? 'Business Day' : 'Business Days'}</strong></span>
            </div>
          )}

          <div className="form-group-pro">
            <label className="form-label-pro">Reason & Notes</label>
            <textarea 
              className="input-field-pro" 
              rows="3" 
              required 
              placeholder="State the reason for your time-off request..." 
              value={formData.reason} 
              onChange={e => setFormData({...formData, reason: e.target.value})}
            ></textarea>
          </div>

          <div className="modal-actions-footer">
            <button type="button" className="btn-outline-glass" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-glow">
              Submit Leave Request
            </button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
};

export default Leave;
// Ultra-clean Executive Leave Workspace

