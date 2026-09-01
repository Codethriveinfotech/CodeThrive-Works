import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { CheckSquare, Plus, Search, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import './Payroll.css'; // Reusing premium layout styles

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  
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
      setTasks(taskRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
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
      description: task.description,
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      status: task.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete task', err);
        alert('Failed to delete task');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isEditing) {
        await api.put(`/tasks/${formData._id}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save task', err);
      alert('Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.assignedTo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const columns = [
    { header: 'Task ID', accessor: 'taskId', render: (row) => <span style={{ fontWeight: 500 }}>{row.taskId}</span> },
    { header: 'Title', accessor: 'title', render: (row) => <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.title}</span> },
    { header: 'Assigned To', accessor: 'assignedTo', render: (row) => (
      <div>
        <span style={{ fontWeight: 600, display: 'block' }}>{row.assignedTo?.fullName || 'Unassigned'}</span>
      </div>
    )},
    { header: 'Priority', accessor: 'priority', render: (row) => (
      <span style={{ 
        color: row.priority === 'High' ? 'var(--danger)' : row.priority === 'Medium' ? 'var(--warning)' : 'var(--success)' 
      }}>{row.priority}</span>
    )},
    { header: 'Due Date', accessor: 'dueDate', render: (row) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <Calendar size={14} /> {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'None'}
      </span>
    )},
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Progress', accessor: 'progress', render: (row) => (
      <div style={{ width: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', height: '6px' }}>
        <div style={{ width: `${row.progressPercentage || 0}%`, background: 'var(--primary)', height: '100%' }}></div>
      </div>
    )},
    { header: 'Actions', accessor: 'actions', render: (row) => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="icon-btn-subtle" onClick={() => openEditModal(row)}><Edit size={16} /></button>
        <button className="icon-btn-subtle" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(row._id)}><Trash2 size={16} /></button>
      </div>
    )}
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Tasks...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Task Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create, assign, and track employee tasks.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Create Task
        </button>
      </div>

      <Card style={{ padding: 0 }} className="premium-card">
        <div className="payslip-filters">
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="filter-input" 
              placeholder="Search tasks by title or assignee..." 
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {!filteredTasks || filteredTasks.length === 0 ? (
          <div className="empty-state-premium" style={{ margin: '2rem', padding: '4rem 2rem' }}>
            <CheckSquare size={64} className="icon" style={{ marginBottom: '1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No Tasks Available</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              Create and assign tasks to employees to manage their work efficiently.
            </p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} /> Create Task
            </button>
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            <DataTable columns={columns} data={filteredTasks} searchable={false} />
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Task' : 'Create Task'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Task Title</label>
            <input type="text" className="input-field" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea className="input-field" name="description" rows="3" value={formData.description} onChange={handleChange}></textarea>
          </div>
          
          <div className="form-group">
            <label>Assign To</label>
            <select className="input-field" name="assignedTo" value={formData.assignedTo} onChange={handleChange} required>
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeId})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Priority</label>
              <select className="input-field" name="priority" value={formData.priority} onChange={handleChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" className="input-field" name="dueDate" value={formData.dueDate} onChange={handleChange} />
            </div>
          </div>

          {isEditing && (
            <div className="form-group">
              <label>Status</label>
              <select className="input-field" name="status" value={formData.status} onChange={handleChange}>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready for Review">Ready for Review</option>
                <option value="Changes Requested">Changes Requested</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTasks;
