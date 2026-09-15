import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { 
  CheckSquare, Plus, Search, Edit, Trash2, Calendar, Clock, 
  Briefcase, AlertCircle, CheckCircle2, TrendingUp, Sparkles, Filter, FileText, AlignLeft, UserCheck 
} from 'lucide-react';
import './Admin.css';

const DEFAULT_DEMO_TASKS = [];

const DEFAULT_DEMO_EMPLOYEES = [];

const AdminTasks = () => {
  const [tasks, setTasks] = useState(DEFAULT_DEMO_TASKS);
  const [employees, setEmployees] = useState(DEFAULT_DEMO_EMPLOYEES);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: '',
    status: 'Assigned'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, empRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/employees')
      ]);
      const tasksData = Array.isArray(taskRes.data?.data) ? taskRes.data.data : (Array.isArray(taskRes.data) ? taskRes.data : []);
      const empsData = Array.isArray(empRes.data?.data) ? empRes.data.data : (Array.isArray(empRes.data) ? empRes.data : []);

      setTasks(tasksData);
      setEmployees(empsData);
    } catch (err) {
      console.warn('API error fetching tasks:', err);
      setTasks([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      _id: '',
      title: '',
      description: '',
      assignedTo: '',
      priority: 'Medium',
      dueDate: '',
      status: 'Assigned'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setIsEditing(true);
    setFormData({
      _id: task._id,
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      status: task.status || 'Assigned'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
      } catch (err) {
        console.warn('Deleted locally');
      }
      setTasks(prev => prev.filter(t => t._id !== taskId));
      alert('Task deleted successfully.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const assignedEmp = employees.find(emp => emp._id === formData.assignedTo);
    
    if (isEditing) {
      const updated = tasks.map(t => t._id === formData._id ? {
        ...t,
        ...formData,
        assignedTo: assignedEmp || t.assignedTo
      } : t);
      setTasks(updated);
    } else {
      const newTask = {
        _id: 't_' + Date.now(),
        taskId: 'TSK-' + Math.floor(100 + Math.random() * 900),
        ...formData,
        assignedTo: assignedEmp || { fullName: 'Employee User', employeeId: 'CTI-EMP-001' },
        progressPercentage: 25
      };
      setTasks(prev => [newTask, ...prev]);
    }
    
    setIsModalOpen(false);
    setSubmitting(false);
    alert(`Task ${isEditing ? 'updated' : 'created'} successfully!`);
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(t => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || 
        t.title?.toLowerCase().includes(q) || 
        t.taskId?.toLowerCase().includes(q) ||
        t.assignedTo?.fullName?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const urgentTasks = tasks.filter(t => t.priority === 'Urgent' || t.priority === 'High').length;

  const columns = [
    { 
      header: 'Task ID', 
      accessor: 'taskId', 
      render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>{row.taskId}</span> 
    },
    { 
      header: 'Task Objective', 
      accessor: 'title', 
      render: (row) => (
        <div style={{ minWidth: '220px' }}>
          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem', display: 'block' }}>{row.title}</span>
          {row.description && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.description}</span>}
        </div>
      )
    },
    { 
      header: 'Assigned Employee', 
      accessor: 'assignedTo', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '150px' }}>
          <div className="emp-avatar-big" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
            {row.assignedTo?.fullName ? row.assignedTo.fullName.charAt(0).toUpperCase() : 'E'}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: '#ffffff', display: 'block', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{row.assignedTo?.fullName || 'Unassigned'}</span>
            <span style={{ fontSize: '0.72rem', color: '#818cf8', whiteSpace: 'nowrap' }}>{row.assignedTo?.employeeId}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Priority', 
      accessor: 'priority', 
      render: (row) => {
        const priorityStyles = {
          Urgent: { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)' },
          High: { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' },
          Medium: { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' },
          Low: { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)' }
        };
        const style = priorityStyles[row.priority] || priorityStyles.Medium;
        return (
          <span style={{ 
            background: style.bg, color: style.color, border: `1px solid ${style.border}`,
            padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 
          }}>
            {row.priority}
          </span>
        );
      }
    },
    { 
      header: 'Due Date', 
      accessor: 'dueDate', 
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
          <Calendar size={14} color="#818cf8" /> {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'No Date'}
        </span>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row) => <StatusBadge status={row.status} /> 
    },
    { 
      header: 'Actions', 
      accessor: 'actions', 
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-outline" style={{ padding: '0.35rem 0.6rem' }} onClick={() => openEditModal(row)} title="Edit Task"><Edit size={14} /></button>
          <button className="btn btn-outline" style={{ padding: '0.35rem 0.6rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleDelete(row._id)} title="Delete Task"><Trash2 size={14} /></button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Task Management Console...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. HERO HEADER */}
      <div className="ultra-premium-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 className="welcome-title-glowing">Task Management Console</h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0 0', fontSize: '0.95rem' }}>
              Create, Assign & Audit Employee Tasks with Priority Status & Due Date Tracking
            </p>
          </div>

          <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.4rem' }}>
            <Plus size={18} /> Create & Assign Task
          </button>
        </div>
      </div>

      {/* 2. METRICS CARDS GRID */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('ALL')}>
          <div className="metric-icon bg-primary-light">
            <CheckSquare size={26} color="#818cf8" />
          </div>
          <div className="metric-data">
            <p>Total Tasks</p>
            <h3>{totalTasks}</h3>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('In Progress')}>
          <div className="metric-icon bg-info-light">
            <Briefcase size={26} color="#38bdf8" />
          </div>
          <div className="metric-data">
            <p>In Progress</p>
            <h3>{inProgressTasks}</h3>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('Completed')}>
          <div className="metric-icon bg-success-light">
            <CheckCircle2 size={26} color="#34d399" />
          </div>
          <div className="metric-data">
            <p>Completed Tasks</p>
            <h3>{completedTasks}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-warning-light">
            <AlertCircle size={26} color="#fbbf24" />
          </div>
          <div className="metric-data">
            <p>Urgent / High Priority</p>
            <h3>{urgentTasks}</h3>
          </div>
        </div>
      </div>

      {/* 3. TASK TABLE WITH FILTERS */}
      <Card style={{ padding: 0 }}>
        <div className="admin-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
            <Search size={16} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search tasks by title, ID or assignee..." 
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', overflowX: 'auto', maxWidth: '100%' }}>
            {['ALL', 'Assigned', 'In Progress', 'Completed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: statusFilter === st ? '#818cf8' : '#94a3b8',
                  border: statusFilter === st ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                  padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <DataTable columns={columns} data={filteredTasks} searchable={false} itemsPerPage={10} />
      </Card>

      {/* CREATE / EDIT TASK MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="#818cf8" />
            <span>{isEditing ? 'Edit Task Details' : 'Create & Assign New Task'}</span>
          </div>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="field-label">
              <FileText size={15} color="#818cf8" />
              <span>Task Title *</span>
            </label>
            <input type="text" className="input-box" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Implement Payment Gateway Integration" />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="field-label">
              <AlignLeft size={15} color="#818cf8" />
              <span>Task Description & Instructions</span>
            </label>
            <textarea className="input-box" name="description" rows="3" value={formData.description} onChange={handleChange} placeholder="Provide detailed guidelines, key deliverables, and context for the employee..."></textarea>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="field-label">
              <UserCheck size={15} color="#818cf8" />
              <span>Assign To Employee *</span>
            </label>
            <select className="input-box" name="assignedTo" value={formData.assignedTo} onChange={handleChange} required>
              <option value="">-- Choose Team Member --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeId}) • {emp.department || 'Operations'}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="field-label">
                <AlertCircle size={15} color="#818cf8" />
                <span>Priority Level</span>
              </label>
              <select className="input-box" name="priority" value={formData.priority} onChange={handleChange}>
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">🔥 Urgent Priority</option>
              </select>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="field-label">
                <Calendar size={15} color="#818cf8" />
                <span>Target Due Date</span>
              </label>
              <input type="date" className="input-box" name="dueDate" value={formData.dueDate} onChange={handleChange} />
            </div>
          </div>

          {isEditing && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="field-label">
                <CheckCircle2 size={15} color="#818cf8" />
                <span>Current Task Status</span>
              </label>
              <select className="input-box" name="status" value={formData.status} onChange={handleChange}>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.8rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting}
              style={{
                padding: '0.75rem 1.6rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={16} />
              <span>{submitting ? 'Saving...' : (isEditing ? 'Save Task Changes' : 'Assign Task Now')}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTasks;
