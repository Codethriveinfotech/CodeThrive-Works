import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { 
  CheckCircle2, Clock, AlertCircle, FileText, 
  MessageSquare, LayoutGrid, List, Play, Square, FastForward
} from 'lucide-react';
import './Modules.css';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
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
      setTasks(res.data.data);
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

  const renderKanbanColumn = (title, statuses) => {
    const columnTasks = tasks.filter(t => statuses.includes(t.status));
    
    return (
      <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--glass-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <h4 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
          {title} <span style={{ background: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', color: '#fff' }}>{columnTasks.length}</span>
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '600px', paddingRight: '5px' }}>
          {columnTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks here</div>
          ) : (
            columnTasks.map(task => (
              <div key={task._id} style={{ background: 'var(--bg-main)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => openUpdateModal(task)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.taskId}</span>
                  <StatusBadge status={task.priority} />
                </div>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{task.title}</h5>
                {task.dueDate && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                    <Clock size={14} /> Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1, background: 'var(--border-color)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${task.progressPercentage}%`, height: '100%', background: task.progressPercentage === 100 ? 'var(--success)' : 'var(--primary)' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.progressPercentage}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Tasks...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>My Tasks</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track and manage your assigned work.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setViewMode('list')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: viewMode === 'list' ? 'var(--primary)' : 'transparent', border: 'none', color: viewMode === 'list' ? '#fff' : 'var(--text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <List size={16} /> List
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: viewMode === 'kanban' ? 'var(--primary)' : 'transparent', border: 'none', color: viewMode === 'kanban' ? '#fff' : 'var(--text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <LayoutGrid size={16} /> Board
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle2 size={48} style={{ opacity: 0.2, margin: '0 auto 1rem', color: 'var(--success)' }} />
          <h3>No Assigned Tasks</h3>
          <p style={{ color: 'var(--text-muted)' }}>You currently have no tasks assigned to you. Enjoy your day!</p>
        </Card>
      ) : (
        viewMode === 'kanban' ? (
          <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {renderKanbanColumn('To Do', ['Assigned', 'Not Started'])}
            {renderKanbanColumn('In Progress', ['In Progress', 'Blocked', 'On Hold'])}
            {renderKanbanColumn('Review', ['Ready for Review', 'Changes Requested'])}
            {renderKanbanColumn('Completed', ['Completed', 'Approved'])}
          </div>
        ) : (
          <Card style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id}>
                      <td style={{ fontWeight: 500 }}>{task.taskId}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        {task.project && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project Task</div>}
                      </td>
                      <td><StatusBadge status={task.priority} /></td>
                      <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '100px' }}>
                          <div style={{ flex: 1, background: 'var(--border-color)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${task.progressPercentage}%`, height: '100%', background: task.progressPercentage === 100 ? 'var(--success)' : 'var(--primary)' }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem' }}>{task.progressPercentage}%</span>
                        </div>
                      </td>
                      <td><StatusBadge status={task.status} /></td>
                      <td>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openUpdateModal(task)}>
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
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
