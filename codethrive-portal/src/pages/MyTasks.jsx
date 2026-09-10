import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Clock, AlertCircle, Play, 
  Search, Filter, Calendar, RefreshCw, LayoutGrid, 
  List, ArrowUpRight, Sparkles, AlertTriangle, ChevronRight,
  Layers, CheckSquare, Edit3, X, SlidersHorizontal
} from 'lucide-react';
import './MyTasks.css';

// Fallback Demo Tasks shown when no live backend tasks exist, giving user immediate visual feedback
const DEMO_TASKS = [
  {
    _id: 'demo-1',
    taskId: 'TASK-101',
    title: 'Complete Portal UI Redesign & Micro-Animations',
    description: 'Implement glassmorphic themes, responsive layout, motion transitions and clean user dashboard flows.',
    status: 'In Progress',
    priority: 'Urgent',
    progressPercentage: 75,
    createdAt: '2026-09-01T10:00:00.000Z',
    dueDate: '2026-09-12T18:00:00.000Z'
  },
  {
    _id: 'demo-2',
    taskId: 'TASK-102',
    title: 'API Authentication & Token Refresh Handler',
    description: 'Review JWT cookie security, rate limiting middleware, and authorization state persistence.',
    status: 'Assigned',
    priority: 'High',
    progressPercentage: 20,
    createdAt: '2026-09-03T09:30:00.000Z',
    dueDate: '2026-09-15T18:00:00.000Z'
  },
  {
    _id: 'demo-3',
    taskId: 'TASK-103',
    title: 'Database Indexing & Query Optimization',
    description: 'Optimize MongoDB collection indices for attendance records and automated daily work reports.',
    status: 'Completed',
    priority: 'Medium',
    progressPercentage: 100,
    createdAt: '2026-08-28T14:00:00.000Z',
    dueDate: '2026-09-05T18:00:00.000Z'
  }
];

const MyTasks = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    progressPercentage: 0,
    status: '',
    comment: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  // Parse filter parameter from URL (e.g. /employee/tasks?filter=Pending)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    if (filterParam) {
      if (['Pending', 'Completed', 'In Progress', 'Urgent'].includes(filterParam)) {
        setActiveChip(filterParam);
      } else if (filterParam === 'Total' || filterParam === 'All') {
        setActiveChip('All');
      }
    }
  }, [location.search]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/my-tasks');
      const fetched = res.data?.data || [];
      
      if (fetched.length > 0) {
        setTasks(fetched);
        setUsingDemoData(false);
      } else {
        // If server returns empty array (no tasks assigned yet), store empty array
        setTasks([]);
      }
    } catch (err) {
      console.warn('API fetch failed or offline, initializing tasks state', err);
      setTasks([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTasks();
  };

  const loadDemoTasks = () => {
    setTasks(DEMO_TASKS);
    setUsingDemoData(true);
  };

  const clearDemoTasks = () => {
    setUsingDemoData(false);
    fetchTasks();
  };

  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setUpdateData({
      progressPercentage: task.progressPercentage || 0,
      status: task.status || 'In Progress',
      comment: ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (usingDemoData) {
      // Local update for demo tasks
      setTasks(prev => prev.map(t => t._id === selectedTask._id ? {
        ...t,
        progressPercentage: updateData.progressPercentage,
        status: updateData.status
      } : t));
      setIsUpdateModalOpen(false);
      return;
    }

    try {
      const res = await api.put(`/tasks/${selectedTask._id}/progress`, updateData);
      if (res.data?.success) {
        setTasks(prev => prev.map(t => t._id === selectedTask._id ? res.data.data : t));
      } else {
        // Fallback update local state
        setTasks(prev => prev.map(t => t._id === selectedTask._id ? {
          ...t,
          progressPercentage: updateData.progressPercentage,
          status: updateData.status
        } : t));
      }
      setIsUpdateModalOpen(false);
    } catch (err) {
      console.warn('API update failed, updating local view:', err);
      setTasks(prev => prev.map(t => t._id === selectedTask._id ? {
        ...t,
        progressPercentage: updateData.progressPercentage,
        status: updateData.status
      } : t));
      setIsUpdateModalOpen(false);
    }
  };

  // Filter Logic
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const filteredTasks = safeTasks.filter(task => {
    const title = task?.title || '';
    const desc = task?.description || '';
    const id = task?.taskId || '';
    
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status Filter Chip vs Dropdown
    let matchesStatus = true;
    if (activeChip === 'In Progress') {
      matchesStatus = task?.status === 'In Progress' || task?.status === 'Ready for Review';
    } else if (activeChip === 'Pending') {
      matchesStatus = task?.status === 'Not Started' || task?.status === 'Assigned' || task?.status === 'Blocked' || task?.status === 'On Hold';
    } else if (activeChip === 'Completed') {
      matchesStatus = task?.status === 'Completed' || task?.status === 'Approved';
    } else if (activeChip === 'Urgent') {
      matchesStatus = task?.priority === 'Urgent' || task?.priority === 'High';
    } else if (statusFilter !== 'All') {
      matchesStatus = task?.status === statusFilter;
    }

    const matchesPriority = priorityFilter === 'All' || task?.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Metrics
  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter(t => t?.status === 'Completed' || t?.status === 'Approved').length;
  const inProgressTasks = safeTasks.filter(t => t?.status === 'In Progress' || t?.status === 'Ready for Review').length;
  const pendingTasks = safeTasks.filter(t => t?.status === 'Not Started' || t?.status === 'Assigned' || t?.status === 'Blocked' || t?.status === 'On Hold').length;
  const urgentTasks = safeTasks.filter(t => (t?.priority === 'Urgent' || t?.priority === 'High') && t?.status !== 'Completed').length;
  const completionPct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="loader-small" style={{ width: '42px', height: '42px', borderWidth: '3px' }}></div>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading Workspace Tasks...</p>
    </div>
  );

  const userNameDisplay = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Employee';

  return (
    <motion.div 
      className="tasks-page-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --------------------------------------------------------------------------
          1. HERO HEADER BANNER
         -------------------------------------------------------------------------- */}
      <div className="tasks-hero">
        <div className="hero-main-content">
          <h1 className="tasks-hero-title">My Tasks</h1>
          <p className="tasks-hero-subtitle">
            Manage, track, and complete your assigned project deliverables with real-time status updates and progress tracking.
          </p>
        </div>

        <div className="hero-right-actions">
          <div className="tasks-user-pill">
            <div className="user-avatar-circle">
              {userNameDisplay.charAt(0).toUpperCase()}
            </div>
            <div className="user-pill-text">
              <span className="user-pill-label">Assigned To</span>
              <span className="user-pill-name">{userNameDisplay}</span>
            </div>
          </div>

          <button 
            onClick={handleRefresh} 
            className="btn btn-outline" 
            style={{ borderRadius: '14px', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)' }}
            title="Refresh Task List"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          2. STAT METRICS CARDS
         -------------------------------------------------------------------------- */}
      <div className="task-stats-grid">
        <motion.div 
          className={`task-stat-card clickable ${activeChip === 'All' && statusFilter === 'All' ? 'active' : ''}`} 
          variants={itemVariants}
          onClick={() => { setActiveChip('All'); setStatusFilter('All'); }}
          title="Click to view all assigned tasks"
        >
          <div className="stat-icon-wrapper total">
            <Layers size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Total Assigned</span>
            <span className="stat-count">{totalTasks}</span>
          </div>
          <div className="stat-action-icon">
            <ArrowUpRight size={14} />
          </div>
        </motion.div>

        <motion.div 
          className={`task-stat-card clickable ${activeChip === 'Pending' ? 'active' : ''}`} 
          variants={itemVariants}
          onClick={() => { setActiveChip('Pending'); setStatusFilter('All'); }}
          title="Click to view pending tasks"
        >
          <div className="stat-icon-wrapper pending">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Pending Action</span>
            <span className="stat-count">{pendingTasks}</span>
          </div>
          <div className="stat-action-icon">
            <ArrowUpRight size={14} />
          </div>
        </motion.div>

        <motion.div 
          className={`task-stat-card clickable ${activeChip === 'In Progress' ? 'active' : ''}`} 
          variants={itemVariants}
          onClick={() => { setActiveChip('In Progress'); setStatusFilter('All'); }}
          title="Click to view in-progress tasks"
        >
          <div className="stat-icon-wrapper progress">
            <Play size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-title">In Progress</span>
            <span className="stat-count">{inProgressTasks}</span>
          </div>
          <div className="stat-action-icon">
            <ArrowUpRight size={14} />
          </div>
        </motion.div>

        <motion.div 
          className={`task-stat-card clickable ${activeChip === 'Completed' ? 'active' : ''}`} 
          variants={itemVariants}
          onClick={() => { setActiveChip('Completed'); setStatusFilter('All'); }}
          title="Click to view completed tasks"
        >
          <div className="stat-icon-wrapper completed">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Completed</span>
            <span className="stat-count">{completedTasks}</span>
          </div>
          <div className="stat-action-icon">
            <ArrowUpRight size={14} />
          </div>
        </motion.div>
      </div>

      {/* --------------------------------------------------------------------------
          3. OVERALL PROGRESS WIDGET
         -------------------------------------------------------------------------- */}
      <motion.div className="overall-progress-card" variants={itemVariants}>
        <div className="progress-header-row">
          <div className="progress-header-title">
            <Sparkles size={20} color="#38bdf8" />
            <span>Overall Task Completion Rate</span>
          </div>
          <div className="progress-badge-pct">{completionPct}%</div>
        </div>

        <div className="progress-track-wrapper">
          <div 
            className="progress-track-fill" 
            style={{ width: `${completionPct}%` }}
          />
        </div>

        <div className="progress-stats-footer">
          <div className="progress-pill-info">
            <span className="pill-item done">
              <CheckCircle2 size={15} /> {completedTasks} Completed
            </span>
            <span className="pill-item active">
              <Play size={15} /> {inProgressTasks} In Progress
            </span>
            <span className="pill-item remaining">
              <Clock size={15} /> {totalTasks - completedTasks} Remaining
            </span>
          </div>

          <div className="milestone-markers">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </motion.div>

      {/* --------------------------------------------------------------------------
          4. FILTER & SEARCH CONTROL TOOLBAR
         -------------------------------------------------------------------------- */}
      <motion.div className="task-controls-toolbar" variants={itemVariants}>
        <div className="toolbar-top-row">
          {/* Search Box */}
          <div className="search-box-custom">
            <Search size={18} className="search-icon" />
            <input 
              type="text"
              placeholder="Search by Task Title, Task ID, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Select Dropdowns */}
          <div className="dropdown-filters-group">
            <div className="custom-select-wrapper">
              <Filter size={15} />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setActiveChip('All'); }}>
                <option value="All">All Statuses</option>
                <option value="Assigned">Assigned</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready for Review">Ready for Review</option>
                <option value="Completed">Completed</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            <div className="custom-select-wrapper">
              <AlertTriangle size={15} />
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* View Mode Switch */}
            <div className="view-toggle-btns">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips / Quick Tabs */}
        <div className="filter-chips-row">
          <button 
            className={`filter-chip ${activeChip === 'All' && statusFilter === 'All' ? 'active' : ''}`}
            onClick={() => { setActiveChip('All'); setStatusFilter('All'); }}
          >
            All Tasks <span className="chip-count-badge">{totalTasks}</span>
          </button>
          <button 
            className={`filter-chip ${activeChip === 'In Progress' ? 'active' : ''}`}
            onClick={() => { setActiveChip('In Progress'); setStatusFilter('All'); }}
          >
            In Progress <span className="chip-count-badge">{inProgressTasks}</span>
          </button>
          <button 
            className={`filter-chip ${activeChip === 'Pending' ? 'active' : ''}`}
            onClick={() => { setActiveChip('Pending'); setStatusFilter('All'); }}
          >
            Pending <span className="chip-count-badge">{pendingTasks}</span>
          </button>
          <button 
            className={`filter-chip ${activeChip === 'Completed' ? 'active' : ''}`}
            onClick={() => { setActiveChip('Completed'); setStatusFilter('All'); }}
          >
            Completed <span className="chip-count-badge">{completedTasks}</span>
          </button>
          <button 
            className={`filter-chip ${activeChip === 'Urgent' ? 'active' : ''}`}
            onClick={() => { setActiveChip('Urgent'); setStatusFilter('All'); }}
          >
            Urgent / High <span className="chip-count-badge">{urgentTasks}</span>
          </button>
        </div>
      </motion.div>

      {/* --------------------------------------------------------------------------
          5. TASKS LIST / GRID PRESENTATION OR MODERN EMPTY STATE
         -------------------------------------------------------------------------- */}
      {safeTasks.length === 0 ? (
        <motion.div className="tasks-empty-container" variants={itemVariants}>
          <div className="empty-graphic-ring">
            <CheckSquare size={48} />
          </div>
          <h2 className="tasks-empty-title">No Tasks Assigned Yet</h2>
          <p className="tasks-empty-desc">
            You currently have no tasks assigned in your queue. When project leads or administrators assign tasks to you, they will appear right here with full tracking capabilities.
          </p>

          <div className="empty-action-btns">
            {!usingDemoData ? (
              <button onClick={loadDemoTasks} className="btn btn-primary" style={{ padding: '0.75rem 1.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} /> Preview Sample Tasks
              </button>
            ) : (
              <button onClick={clearDemoTasks} className="btn btn-outline" style={{ padding: '0.75rem 1.6rem', borderRadius: '12px' }}>
                Clear Sample Preview
              </button>
            )}
            <button onClick={handleRefresh} className="btn btn-outline" style={{ padding: '0.75rem 1.6rem', borderRadius: '12px' }}>
              Check Server Updates
            </button>
          </div>
        </motion.div>
      ) : filteredTasks.length === 0 ? (
        <motion.div className="tasks-empty-container" variants={itemVariants}>
          <div className="empty-graphic-ring" style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <Search size={48} />
          </div>
          <h2 className="tasks-empty-title">No Tasks Match Filters</h2>
          <p className="tasks-empty-desc">
            No tasks matched your current search term or selected status/priority criteria.
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveChip('All'); setStatusFilter('All'); setPriorityFilter('All'); }} 
            className="btn btn-primary"
            style={{ padding: '0.7rem 1.5rem', borderRadius: '12px' }}
          >
            Reset All Filters
          </button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="tasks-grid-view">
          <AnimatePresence>
            {filteredTasks.map(task => (
              <motion.div 
                key={task._id} 
                className="task-card-modern"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                <div className="task-card-top">
                  <div className="task-card-header">
                    <span className="task-code-badge">{task.taskId || 'TSK-00'}</span>
                    <div className="task-badges-right">
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>

                  <h3 className="task-card-title">{task.title}</h3>
                  <p className="task-card-description">
                    {task.description || 'No detailed instructions provided for this task.'}
                  </p>
                </div>

                <div className="task-card-progress">
                  <div className="progress-label-flex">
                    <span>Task Progress</span>
                    <span style={{ color: '#38bdf8' }}>{task.progressPercentage || 0}%</span>
                  </div>
                  <div className="mini-track-bar">
                    <div 
                      className="mini-track-fill" 
                      style={{ width: `${task.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="task-card-bottom">
                  <div className="task-dates-group">
                    <div className="task-date-row">
                      <Calendar size={13} />
                      <span>Assigned: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Today'}</span>
                    </div>
                    {task.dueDate && (
                      <div className={`task-date-row ${new Date(task.dueDate) < new Date() ? 'overdue' : 'due'}`}>
                        <Clock size={13} />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <button className="btn-update-task" onClick={() => openUpdateModal(task)}>
                    <Edit3 size={14} /> Update
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="tasks-list-view">
          <AnimatePresence>
            {filteredTasks.map(task => (
              <motion.div 
                key={task._id} 
                className="task-row-modern"
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="task-row-left">
                  <div className="task-row-info">
                    <div className="task-row-header-meta">
                      <span className="task-code-badge">{task.taskId}</span>
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                    <h3 className="task-row-title">{task.title}</h3>
                    <p className="task-row-desc">{task.description}</p>
                  </div>
                </div>

                <div className="task-row-right">
                  <div className="task-row-progress-box">
                    <div className="progress-label-flex">
                      <span>Progress</span>
                      <span>{task.progressPercentage || 0}%</span>
                    </div>
                    <div className="mini-track-bar">
                      <div className="mini-track-fill" style={{ width: `${task.progressPercentage || 0}%` }} />
                    </div>
                  </div>

                  <div className="task-dates-group">
                    {task.dueDate && (
                      <div className="task-date-row due">
                        <Clock size={13} />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <button className="btn-update-task" onClick={() => openUpdateModal(task)}>
                    <Edit3 size={14} /> Update
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* --------------------------------------------------------------------------
          6. UPDATE PROGRESS MODAL
         -------------------------------------------------------------------------- */}
      {selectedTask && (
        <Modal 
          isOpen={isUpdateModalOpen} 
          onClose={() => setIsUpdateModalOpen(false)} 
          title={`Update Task: ${selectedTask.taskId}`}
        >
          <div className="task-modal-body">
            <div className="modal-task-summary">
              <h4 className="modal-task-title">{selectedTask.title}</h4>
              <p className="modal-task-desc">{selectedTask.description || 'No description provided.'}</p>
            </div>

            <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ color: '#f1f5f9', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>
                  Update Task Status
                </label>
                <select 
                  className="input-field" 
                  value={updateData.status} 
                  onChange={e => setUpdateData({...updateData, status: e.target.value})} 
                  required
                  style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fff', padding: '0.75rem', borderRadius: '10px' }}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Ready for Review">Ready for Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="range-slider-box">
                <div className="range-slider-label">
                  <span>Completion Percentage</span>
                  <span style={{ color: '#38bdf8', fontWeight: '700' }}>{updateData.progressPercentage}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={updateData.progressPercentage} 
                  onChange={e => setUpdateData({...updateData, progressPercentage: parseInt(e.target.value)})}
                  className="custom-range-slider"
                />
              </div>

              <div className="form-group">
                <label style={{ color: '#f1f5f9', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>
                  Update Notes / Remarks (Optional)
                </label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  placeholder="Describe your current work completed, test results, or blockers..."
                  value={updateData.comment} 
                  onChange={e => setUpdateData({...updateData, comment: e.target.value})}
                  style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fff', padding: '0.75rem', borderRadius: '10px' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsUpdateModalOpen(false)} style={{ borderRadius: '10px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px', padding: '0.65rem 1.5rem' }}>
                  Save & Apply Update
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default MyTasks;
