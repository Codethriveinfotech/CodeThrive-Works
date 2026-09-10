import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Send, CheckCircle2, Clock, 
  AlertCircle, Download, PlusCircle, Search, 
  Calendar, Star, MapPin, ChevronRight, 
  Sparkles, RefreshCw, CheckSquare, MessageSquare, Edit3,
  ArrowRight, ArrowUpRight, Layers, FileCheck, ExternalLink,
  Grid, List, TrendingUp, Award, Zap, Briefcase, Filter,
  Eye, ShieldCheck, Activity, BarChart3, UserCheck, Flame
} from 'lucide-react';
import './DailyReports.css';

// Fallback demo reports for high-end preview
const DEMO_REPORTS = [
  {
    _id: 'rep-demo-1',
    date: new Date().toISOString(),
    workLocation: 'Work From Office',
    shiftType: 'Day Shift',
    hoursWorked: 8.5,
    tasksWorked: 'TASK-101, TASK-104',
    workSummary: 'Architected & engineered modern Daily Worklogs Workspace UI with responsive metric cards, view toggles (Cards, Data Grid, Timeline), and framer-motion micro-animations.',
    completedWork: 'Dashboard metrics integration, glassmorphic layout styling, and task filter state management.',
    pendingWork: 'Final regression testing across mobile viewports and edge-case browser validations.',
    issuesFaced: 'None. All REST API endpoints responding well within 110ms threshold.',
    tomorrowsPlan: 'Initiate work on Admin Worklog Approval & Feedback Module.',
    productivityRating: 5,
    status: 'Reviewed',
    teamLeadComments: 'Outstanding work! The UI animations and workspace layout are exceptionally clean and professional. Approved!'
  },
  {
    _id: 'rep-demo-2',
    date: new Date(Date.now() - 86400000).toISOString(),
    workLocation: 'Remote / WFH',
    shiftType: 'Day Shift',
    hoursWorked: 8.0,
    tasksWorked: 'TASK-102',
    workSummary: 'Optimized MongoDB database indexing strategies for employee daily report logs and attendance sessions.',
    completedWork: 'Created compound index on employee ID and submission timestamp in AttendanceSession collection.',
    pendingWork: 'Execute load test suite simulating 1,500 simultaneous user interactions.',
    issuesFaced: 'Minor rate-limiting restriction encountered during local load testing; threshold recalculated.',
    tomorrowsPlan: 'Refactor AuthContext login token persistence and automatic session refresh.',
    productivityRating: 4,
    status: 'Submitted',
    teamLeadComments: null
  },
  {
    _id: 'rep-demo-3',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    workLocation: 'Work From Office',
    shiftType: 'Day Shift',
    hoursWorked: 9.0,
    tasksWorked: 'TASK-098, TASK-099',
    workSummary: 'Designed and deployed employee profile credential setup module and interactive attendance logger.',
    completedWork: 'Profile state synchronization, QR check-in utility, and JWT payload validation.',
    pendingWork: 'Documentation update for REST API endpoints.',
    issuesFaced: 'None.',
    tomorrowsPlan: 'Begin tasks sprint planning for Q4 platform enhancements.',
    productivityRating: 5,
    status: 'Reviewed',
    teamLeadComments: 'Great efficiency and code quality. Keep up the high standard!'
  }
];

const DailyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // View state: 'grid' | 'table' | 'timeline'
  const [viewMode, setViewMode] = useState('grid');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('All'); // 'All' | 'Submitted' | 'Reviewed'

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workLocation: 'Work From Office',
    shiftType: 'Day Shift',
    hoursWorked: 8,
    tasksWorked: '',
    workSummary: '',
    completedWork: '',
    pendingWork: '',
    issuesFaced: '',
    tomorrowsPlan: '',
    productivityRating: 5
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/daily-reports/my-reports');
      const fetched = res.data?.data || [];

      if (fetched.length > 0) {
        setReports(fetched);
        setUsingDemoData(false);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.warn('Backend API offline or empty, initializing daily reports workspace', err);
      setReports([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
  };

  const loadDemoReports = () => {
    setReports(DEMO_REPORTS);
    setUsingDemoData(true);
  };

  const clearDemoReports = () => {
    setUsingDemoData(false);
    fetchReports();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      workLocation: 'Work From Office',
      shiftType: 'Day Shift',
      hoursWorked: 8,
      tasksWorked: '',
      workSummary: '',
      completedWork: '',
      pendingWork: '',
      issuesFaced: '',
      tomorrowsPlan: '',
      productivityRating: 5
    });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (usingDemoData) {
      const newReport = {
        _id: 'rep-local-' + Date.now(),
        ...formData,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
        teamLeadComments: null
      };
      setReports([newReport, ...reports]);
      setIsSubmitModalOpen(false);
      resetForm();
      setIsSubmitting(false);
      return;
    }

    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) payload.append(key, formData[key]);
    });

    try {
      const res = await api.post('/daily-reports', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setReports([res.data.data, ...reports]);
      } else {
        const fallbackRep = {
          _id: 'rep-' + Date.now(),
          ...formData,
          status: 'Submitted',
          createdAt: new Date().toISOString()
        };
        setReports([fallbackRep, ...reports]);
      }
      setIsSubmitModalOpen(false);
      resetForm();
    } catch (err) {
      console.warn('API error, saving report locally:', err);
      const fallbackRep = {
        _id: 'rep-' + Date.now(),
        ...formData,
        status: 'Submitted',
        createdAt: new Date().toISOString()
      };
      setReports([fallbackRep, ...reports]);
      setIsSubmitModalOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeReports = Array.isArray(reports) ? reports : [];

  const filteredReports = safeReports.filter(rep => {
    const summary = rep?.workSummary || '';
    const tasks = rep?.tasksWorked || '';
    const dateStr = rep?.date ? new Date(rep.date).toLocaleDateString() : '';

    const matchesSearch = summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tasks.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dateStr.includes(searchQuery);

    const matchesTab = activeFilterTab === 'All' || rep?.status === activeFilterTab;

    return matchesSearch && matchesTab;
  });

  // Calculate Metrics
  const totalReportsCount = safeReports.length;
  const totalHoursLogged = safeReports.reduce((acc, r) => acc + (parseFloat(r.hoursWorked) || 0), 0);
  const reviewedCount = safeReports.filter(r => r.status === 'Reviewed' || r.status === 'Approved').length;
  const pendingReviewCount = safeReports.filter(r => r.status === 'Submitted').length;
  const avgRating = totalReportsCount > 0 
    ? (safeReports.reduce((acc, r) => acc + (parseInt(r.productivityRating) || 5), 0) / totalReportsCount).toFixed(1) 
    : '5.0';

  // Check today's submission status
  const todayStr = new Date().toDateString();
  const todayReport = safeReports.find(r => r.date && new Date(r.date).toDateString() === todayStr);

  const currentDateDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) return (
    <div className="reports-loader-screen">
      <div className="loader-ring-pulse"></div>
      <p>Initializing Daily Worklog Intelligence Workspace...</p>
    </div>
  );

  return (
    <motion.div 
      className="executive-reports-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* --------------------------------------------------------------------------
          1. HERO & WORKSPACE HEADER
         -------------------------------------------------------------------------- */}
      <div className="reports-hero-banner">
        <div className="hero-left-content">
          <div className="hero-badge-pill">
            <Sparkles size={14} className="sparkle-icon" />
            <span>DAILY WORKLOG INTELLIGENCE</span>
          </div>
          <h1 className="hero-main-title">Today's Work & Daily Logs</h1>
          <p className="hero-subtext">
            Track daily accomplishments, log hours worked, review manager comments, and document tomorrow's roadmap.
          </p>
          <div className="hero-date-strip">
            <Calendar size={14} />
            <span>{currentDateDisplay}</span>
            <span className="dot-divider">•</span>
            {todayReport ? (
              <span className="today-logged-tag success">
                <CheckCircle2 size={13} /> Today's Logged ({todayReport.hoursWorked} hrs)
              </span>
            ) : (
              <span className="today-logged-tag warning">
                <Clock size={13} /> Today's Log Pending
              </span>
            )}
          </div>
        </div>

        <div className="hero-right-actions">
          <button 
            onClick={handleRefresh} 
            className="btn-glass-icon"
            title="Refresh workspace logs"
          >
            <RefreshCw size={17} className={isRefreshing ? 'spin' : ''} />
          </button>

          <button 
            className="btn-primary-glow"
            onClick={() => { resetForm(); setIsSubmitModalOpen(true); }}
          >
            <PlusCircle size={19} />
            <span>{todayReport ? "Update Today's Log" : "+ Log Today's Work"}</span>
          </button>
        </div>
      </div>



      {/* --------------------------------------------------------------------------
          3. WORKSPACE CONTROL TOOLBAR (SEARCH + FILTER TABS + VIEW TOGGLE)
         -------------------------------------------------------------------------- */}
      <div className="reports-toolbar-card">
        {/* Search Field */}
        <div className="reports-search-box">
          <Search size={17} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search worklogs by task code, summary keywords, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Filter Status Tabs */}
        <div className="reports-filter-tabs">
          <button 
            className={`tab-btn-pill ${activeFilterTab === 'All' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('All')}
          >
            All Worklogs ({totalReportsCount})
          </button>
          <button 
            className={`tab-btn-pill ${activeFilterTab === 'Submitted' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('Submitted')}
          >
            Pending ({pendingReviewCount})
          </button>
          <button 
            className={`tab-btn-pill ${activeFilterTab === 'Reviewed' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('Reviewed')}
          >
            Reviewed ({reviewedCount})
          </button>
        </div>

        {/* Presentation View Switcher (Cards | Grid Table | Timeline) */}
        <div className="view-mode-switcher">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Executive Cards View"
          >
            <Grid size={16} />
            <span>Cards</span>
          </button>
          <button 
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Data Table View"
          >
            <List size={16} />
            <span>Table</span>
          </button>
          <button 
            className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
            title="Activity Timeline View"
          >
            <Activity size={16} />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          4. WORKLOGS CONTENT DISPLAY
         -------------------------------------------------------------------------- */}
      {safeReports.length === 0 ? (
        <div className="reports-empty-state">
          <div className="empty-icon-glow">
            <FileText size={42} />
          </div>
          <h2>No Daily Worklogs Found</h2>
          <p>
            You haven't logged any daily reports yet. Submit your daily accomplishments to inform your manager and track performance.
          </p>
          <div className="empty-actions-row">
            <button 
              onClick={() => { resetForm(); setIsSubmitModalOpen(true); }}
              className="btn-primary-glow"
            >
              <PlusCircle size={18} /> + Log Today's Work
            </button>

            {!usingDemoData ? (
              <button onClick={loadDemoReports} className="btn-outline-glass">
                <Sparkles size={16} /> Preview Sample Logs
              </button>
            ) : (
              <button onClick={clearDemoReports} className="btn-outline-glass">
                Clear Sample Preview
              </button>
            )}
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="reports-empty-state">
          <p>No worklogs matched your search parameters.</p>
          <button onClick={() => { setSearchQuery(''); setActiveFilterTab('All'); }} className="btn-outline-glass">
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* VIEW 1: EXECUTIVE CARDS VIEW */}
          {viewMode === 'grid' && (
            <motion.div className="reports-cards-grid" layout>
              <AnimatePresence>
                {filteredReports.map(rep => {
                  const repDateStr = rep.date 
                    ? new Date(rep.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Today';

                  return (
                    <motion.div 
                      key={rep._id}
                      className="worklog-card-pro"
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.25 }}
                    >
                      {/* Top Card Header */}
                      <div className="card-top-row">
                        <div className="date-badge-box">
                          <Calendar size={14} className="cal-icon" />
                          <span className="date-text">{repDateStr}</span>
                        </div>
                        <StatusBadge status={rep.status} />
                      </div>

                      {/* Meta Tags Row */}
                      <div className="card-meta-tags">
                        <span className="tag-pill hours">
                          <Clock size={12} /> {rep.hoursWorked || 8} hrs logged
                        </span>
                        <span className="tag-pill location">
                          <MapPin size={12} /> {rep.workLocation || 'Office'}
                        </span>
                        {rep.shiftType && (
                          <span className="tag-pill shift">{rep.shiftType}</span>
                        )}
                      </div>

                      {/* Tasks Worked */}
                      {rep.tasksWorked && (
                        <div className="task-codes-row">
                          <span className="task-label">Tasks:</span>
                          {rep.tasksWorked.split(',').map((taskCode, i) => (
                            <span key={i} className="task-code-pill">{taskCode.trim()}</span>
                          ))}
                        </div>
                      )}

                      {/* Work Summary Main Paragraph */}
                      <p className="work-summary-body">
                        {rep.workSummary}
                      </p>

                      {/* Breakdown Box (Completed / Pending) */}
                      {(rep.completedWork || rep.pendingWork) && (
                        <div className="card-breakdown-box">
                          {rep.completedWork && (
                            <div className="breakdown-col">
                              <span className="col-title green"><CheckCircle2 size={12} /> Completed</span>
                              <p className="col-text">{rep.completedWork}</p>
                            </div>
                          )}
                          {rep.pendingWork && (
                            <div className="breakdown-col">
                              <span className="col-title amber"><Clock size={12} /> In Progress</span>
                              <p className="col-text">{rep.pendingWork}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manager Review Callout Banner */}
                      {rep.teamLeadComments && (
                        <div className="manager-feedback-banner">
                          <div className="banner-title">
                            <MessageSquare size={13} /> Manager Feedback & Notes
                          </div>
                          <p className="banner-text">{rep.teamLeadComments}</p>
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="card-footer-row">
                        <div className="stars-rating-wrap">
                          {[...Array(rep.productivityRating || 5)].map((_, idx) => (
                            <Star key={idx} size={13} fill="#fbbf24" color="#fbbf24" />
                          ))}
                        </div>

                        <button 
                          className="btn-view-doc"
                          onClick={() => { setSelectedReport(rep); setIsViewModalOpen(true); }}
                        >
                          <span>View Full Document</span>
                          <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* VIEW 2: DATA TABLE VIEW */}
          {viewMode === 'table' && (
            <motion.div 
              className="reports-table-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <table className="reports-data-table">
                <thead>
                  <tr>
                    <th>Date & Shift</th>
                    <th>Tasks Worked</th>
                    <th>Work Summary & Accomplishments</th>
                    <th>Hours</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(rep => {
                    const repDateStr = rep.date 
                      ? new Date(rep.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Today';

                    return (
                      <tr key={rep._id}>
                        <td>
                          <div className="table-date-cell">
                            <span className="t-date">{repDateStr}</span>
                            <span className="t-loc">{rep.workLocation || 'Office'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-tasks-cell">
                            {rep.tasksWorked ? (
                              rep.tasksWorked.split(',').map((t, idx) => (
                                <span key={idx} className="t-task-badge">{t.trim()}</span>
                              ))
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="table-summary-cell">
                          <p className="t-summary-text">{rep.workSummary}</p>
                        </td>
                        <td>
                          <span className="t-hours-badge">{rep.hoursWorked} hrs</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                            {[...Array(rep.productivityRating || 5)].map((_, i) => (
                              <Star key={i} size={12} fill="#fbbf24" color="#fbbf24" />
                            ))}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={rep.status} />
                        </td>
                        <td>
                          <button 
                            className="t-action-btn"
                            onClick={() => { setSelectedReport(rep); setIsViewModalOpen(true); }}
                            title="View Document"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* VIEW 3: ACTIVITY TIMELINE VIEW */}
          {viewMode === 'timeline' && (
            <motion.div 
              className="reports-timeline-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="timeline-connector-line"></div>
              {filteredReports.map((rep, idx) => {
                const d = rep.date ? new Date(rep.date) : new Date();
                const dayNum = d.getDate();
                const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                const weekDay = d.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <motion.div 
                    key={rep._id}
                    className="timeline-item-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="timeline-date-node">
                      <span className="node-day-num">{dayNum}</span>
                      <span className="node-month-name">{monthName}</span>
                      <span className="node-weekday-name">{weekDay}</span>
                    </div>

                    <div className="timeline-card-wrapper">
                      <div className="timeline-card-header">
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                          <span className="tag-pill hours">{rep.hoursWorked} hrs</span>
                          <span className="tag-pill location"><MapPin size={12} /> {rep.workLocation || 'Office'}</span>
                        </div>
                        <StatusBadge status={rep.status} />
                      </div>

                      <p className="timeline-card-body">{rep.workSummary}</p>

                      <div className="timeline-card-footer">
                        {rep.tasksWorked && (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {rep.tasksWorked.split(',').map((t, i) => (
                              <span key={i} className="task-code-pill">{t.trim()}</span>
                            ))}
                          </div>
                        )}
                        <button 
                          className="btn-view-doc"
                          onClick={() => { setSelectedReport(rep); setIsViewModalOpen(true); }}
                        >
                          Details <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}

      {/* --------------------------------------------------------------------------
          5. SUBMIT / LOG WORK FORM MODAL
         -------------------------------------------------------------------------- */}
      <Modal 
        isOpen={isSubmitModalOpen} 
        onClose={() => { setIsSubmitModalOpen(false); resetForm(); }}
        title="Log Today's Work & Accomplishments"
      >
        <form onSubmit={handleSubmitReport} className="exec-modal-form">
          <div className="form-row-2col">
            <div>
              <label className="form-label-pro">Date</label>
              <input 
                type="date" 
                className="input-field-pro" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="form-label-pro">Hours Logged</label>
              <input 
                type="number" 
                step="0.5" 
                min="0.5" 
                max="24"
                className="input-field-pro" 
                value={formData.hoursWorked}
                onChange={e => setFormData({...formData, hoursWorked: parseFloat(e.target.value) || 0})}
                required
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div>
              <label className="form-label-pro">Work Location</label>
              <select 
                className="input-field-pro"
                value={formData.workLocation}
                onChange={e => setFormData({...formData, workLocation: e.target.value})}
              >
                <option value="Work From Office">🏢 Work From Office</option>
                <option value="Remote / WFH">🏠 Remote / WFH</option>
                <option value="Client Site">🌐 Client Site</option>
              </select>
            </div>

            <div>
              <label className="form-label-pro">Tasks Worked On (IDs/Titles)</label>
              <input 
                type="text" 
                className="input-field-pro" 
                placeholder="e.g. TASK-101, Auth Redesign"
                value={formData.tasksWorked}
                onChange={e => setFormData({...formData, tasksWorked: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label-pro">Today's Summary & Accomplishments</label>
            <textarea 
              className="input-field-pro" 
              rows="3"
              placeholder="Describe key features built, code committed, meetings attended, or issues resolved..."
              value={formData.workSummary}
              onChange={e => setFormData({...formData, workSummary: e.target.value})}
              required
            ></textarea>
          </div>

          <div className="form-row-2col">
            <div>
              <label className="form-label-pro">Completed Items</label>
              <textarea 
                className="input-field-pro" 
                rows="2"
                placeholder="Completed deliverables..."
                value={formData.completedWork}
                onChange={e => setFormData({...formData, completedWork: e.target.value})}
              ></textarea>
            </div>

            <div>
              <label className="form-label-pro">Pending / Carried Over</label>
              <textarea 
                className="input-field-pro" 
                rows="2"
                placeholder="Items pending..."
                value={formData.pendingWork}
                onChange={e => setFormData({...formData, pendingWork: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="form-row-2col">
            <div>
              <label className="form-label-pro">Issues / Blockers (if any)</label>
              <input 
                type="text"
                className="input-field-pro" 
                placeholder="None"
                value={formData.issuesFaced}
                onChange={e => setFormData({...formData, issuesFaced: e.target.value})}
              />
            </div>

            <div>
              <label className="form-label-pro">Tomorrow's Roadmap / Plan</label>
              <input 
                type="text"
                className="input-field-pro" 
                placeholder="Planned deliverables for tomorrow..."
                value={formData.tomorrowsPlan}
                onChange={e => setFormData({...formData, tomorrowsPlan: e.target.value})}
              />
            </div>
          </div>

          <div className="modal-actions-footer">
            <button 
              type="button" 
              className="btn-outline-glass" 
              onClick={() => { setIsSubmitModalOpen(false); resetForm(); }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary-glow" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Activity...' : 'Submit Worklog'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------------------------
          6. VIEW REPORT DOCUMENT MODAL
         -------------------------------------------------------------------------- */}
      {selectedReport && (
        <Modal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)} 
          title={`Work Activity Brief • ${new Date(selectedReport.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'})}`}
        >
          <div className="doc-view-content">
            <div className="doc-meta-strip">
              <StatusBadge status={selectedReport.status} />
              <span className="doc-meta-item"><MapPin size={13} /> {selectedReport.workLocation || 'Office'}</span>
              <span className="doc-meta-item highlight"><Clock size={13} /> {selectedReport.hoursWorked} hrs logged</span>
            </div>

            {selectedReport.tasksWorked && (
              <div className="doc-section-box">
                <span className="doc-section-title">Associated Task Identifiers</span>
                <div className="doc-task-pills">
                  {selectedReport.tasksWorked.split(',').map((t, idx) => (
                    <span key={idx} className="task-code-pill">{t.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="doc-section-box">
              <span className="doc-section-title">Accomplishments & Summary</span>
              <p className="doc-summary-text">{selectedReport.workSummary}</p>
            </div>

            <div className="doc-grid-2col">
              <div className="doc-mini-card">
                <span className="mini-card-title green"><CheckCircle2 size={13} /> Completed Work</span>
                <p className="mini-card-desc">{selectedReport.completedWork || 'None documented'}</p>
              </div>

              <div className="doc-mini-card">
                <span className="mini-card-title amber"><Clock size={13} /> Pending Work</span>
                <p className="mini-card-desc">{selectedReport.pendingWork || 'None documented'}</p>
              </div>
            </div>

            {selectedReport.issuesFaced && (
              <div className="doc-section-box blocker">
                <span className="doc-section-title red">Blockers & Issues Faced</span>
                <p className="doc-summary-text">{selectedReport.issuesFaced}</p>
              </div>
            )}

            {selectedReport.tomorrowsPlan && (
              <div className="doc-section-box">
                <span className="doc-section-title purple">Tomorrow's Planned Activities</span>
                <p className="doc-summary-text">{selectedReport.tomorrowsPlan}</p>
              </div>
            )}

            {selectedReport.teamLeadComments && (
              <div className="manager-feedback-banner">
                <div className="banner-title">
                  <MessageSquare size={13} /> Manager Feedback & Notes
                </div>
                <p className="banner-text">{selectedReport.teamLeadComments}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

    </motion.div>
  );
};

export default DailyReports;
