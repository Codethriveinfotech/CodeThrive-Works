import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, Clock, AlertCircle, FileText, 
  MessageSquare, LayoutGrid, List, Play, Square, FastForward,
  Search, Filter, Calendar
} from 'lucide-react';
import './Modules.css';

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/my-tasks');
      setTasks(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
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
    try {
      const res = await api.put(`/tasks/${selectedTask._id}/progress`, updateData);
      setTasks(prev => prev.map(t => t._id === selectedTask._id ? res.data.data : t));
      setIsUpdateModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Filtered and Searched Tasks
  const filteredTasks = safeTasks.filter(task => {
    const title = task?.title || '';
    const desc = task?.description || '';
    const id = task?.taskId || '';
    
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || task?.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || task?.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Metrics
  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter(t => t?.status === 'Completed' || t?.status === 'Approved').length;
  const inProgressTasks = safeTasks.filter(t => t?.status === 'In Progress' || t?.status === 'Ready for Review').length;
  const pendingTasks = safeTasks.filter(t => t?.status === 'Not Started' || t?.status === 'Assigned' || t?.status === 'Blocked' || t?.status === 'On Hold').length;
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Tasks...</p>
    </div>
  );

  return (
    <div className="module-page">
      {/* Header */}
      <div className="welcome-hero-section ultra-premium-hero" style={{ marginBottom: '1rem', padding: '1.5rem 2rem' }}>
        <div className="welcome-content">
          <h1 className="welcome-title">My Tasks</h1>
          <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-muted)' }}>Manage, track, and complete your assigned tasks efficiently.</p>
        </div>
        <div className="tasks-user-greeting">
          <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Welcome, </span>
          <span className="highlight-name" style={{ fontSize: '1.2rem' }}>{user?.name || 'Employee'}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="task-summary-grid">
        <Card className="summary-card premium-hover">
          <div className="summary-icon-box bg-primary-light">
            <List size={24} color="var(--primary-light)" />
          </div>
          <div className="summary-info">
            <p>Total Tasks</p>
            <h3>{totalTasks}</h3>
          </div>
        </Card>
        <Card className="summary-card premium-hover">
          <div className="summary-icon-box bg-warning-light">
            <Clock size={24} color="var(--warning)" />
          </div>
          <div className="summary-info">
            <p>Pending</p>
            <h3>{pendingTasks}</h3>
          </div>
        </Card>
        <Card className="summary-card premium-hover">
          <div className="summary-icon-box bg-info-light" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
            <Play size={24} color="var(--info)" />
          </div>
          <div className="summary-info">
            <p>In Progress</p>
            <h3>{inProgressTasks}</h3>
          </div>
        </Card>
        <Card className="summary-card premium-hover">
          <div className="summary-icon-box bg-success-light">
            <CheckCircle2 size={24} color="var(--success)" />
          </div>
          <div className="summary-info">
            <p>Completed</p>
            <h3>{completedTasks}</h3>
          </div>
        </Card>
      </div>

      {/* Progress Section */}
      <Card className="progress-section premium-card-bg">
        <div className="progress-header">
          <h3>Overall Task Completion</h3>
          <span className="progress-percentage">{completionPercentage}%</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${completionPercentage}%`, background: completionPercentage === 100 ? 'var(--success)' : 'var(--primary)' }}></div>
        </div>
        <div className="progress-stats">
          <span><CheckCircle2 size={14} color="var(--success)"/> {completedTasks} Completed</span>
          <span><Clock size={14} color="var(--warning)"/> {totalTasks - completedTasks} Remaining</span>
        </div>
      </Card>

      {/* Search & Filters */}
      <div className="task-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tasks by title, ID, or description..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="task-search-input"
          />
        </div>
        <div className="filter-dropdowns">
          <div className="filter-group">
            <Filter size={16} color="var(--text-muted)" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="task-filter-select">
              <option value="All">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Ready for Review">Ready for Review</option>
              <option value="Completed">Completed</option>
              <option value="Approved">Approved</option>
              <option value="Blocked">Blocked</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
          <div className="filter-group">
            <AlertCircle size={16} color="var(--text-muted)" />
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="task-filter-select">
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <Card className="empty-state-card premium-card-bg">
          <div className="empty-state-content">
            <div className="empty-icon-wrapper">
              <CheckCircle2 size={64} className="empty-icon text-success" />
            </div>
            <h2>No Tasks Assigned Yet</h2>
            <p>You currently don't have any assigned tasks. Please check back later.</p>
          </div>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card className="empty-state-card premium-card-bg">
          <div className="empty-state-content">
             <div className="empty-icon-wrapper">
              <Search size={64} className="empty-icon text-muted" />
            </div>
            <h2>No Results Found</h2>
            <p>No tasks match your current search or filter criteria. Try adjusting your filters.</p>
          </div>
        </Card>
      ) : (
        <div className="task-list-container">
          {filteredTasks.map(task => (
            <Card key={task._id} className="premium-task-row premium-hover">
              <div className="task-row-content">
                <div className="task-main-info">
                  <div className="task-header-meta">
                    <span className="task-id-badge">{task.taskId}</span>
                    <StatusBadge status={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                  <h3 className="task-title-text">{task.title}</h3>
                  <p className="task-description-text">{task.description ? (task.description.length > 120 ? task.description.substring(0, 120) + '...' : task.description) : 'No description provided.'}</p>
                </div>
                
                <div className="task-side-info">
                  <div className="task-dates">
                    <div className="date-item">
                      <span className="date-label">Assigned:</span>
                      <span className="date-value"><Calendar size={12}/> {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    {task.dueDate && (
                      <div className="date-item">
                        <span className="date-label">Due:</span>
                        <span className="date-value text-warning"><Clock size={12}/> {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="task-action-box">
                    <div className="task-progress-mini">
                       <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Progress: {task.progressPercentage || 0}%</span>
                    </div>
                    <button className="btn btn-primary btn-sm update-btn" onClick={() => openUpdateModal(task)}>
                      Update Status
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Update Progress Modal */}
      {selectedTask && (
        <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title={`Update Task: ${selectedTask.taskId}`}>
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>{selectedTask.title}</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedTask.description || 'No description provided.'}</p>
          </div>
          
          <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Status</label>
                <select className="input-field" value={updateData.status} onChange={e => setUpdateData({...updateData, status: e.target.value})} required>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Ready for Review">Ready for Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Progress: {updateData.progressPercentage}%</label>
                <input 
                  type="range" 
                  min="0" max="100" step="5"
                  value={updateData.progressPercentage} 
                  onChange={e => setUpdateData({...updateData, progressPercentage: parseInt(e.target.value)})}
                  style={{ width: '100%', accentColor: 'var(--primary)', marginTop: '0.5rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Update Notes (Optional)</label>
              <textarea 
                className="input-field" rows="3" 
                placeholder="What did you work on? Any blockers?"
                value={updateData.comment} 
                onChange={e => setUpdateData({...updateData, comment: e.target.value})}
              ></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Update</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MyTasks;
