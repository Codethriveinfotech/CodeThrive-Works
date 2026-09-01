import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { 
  Plus, MoreVertical, MessageSquare, Paperclip, Calendar as CalIcon, 
  CheckCircle2, Clock, List, LayoutGrid 
} from 'lucide-react';
import './Modules.css';

const TeamTasks = () => {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', status: 'To Do', assignee: '' });

  useEffect(() => {
    // Simulating API
    setTimeout(() => {
      setTasks([
        { id: 'TSK-101', title: 'Design Enterprise UI System', description: 'Create tokens and components', status: 'In Progress', priority: 'High', comments: 3, attachments: 2, due: 'Oct 25' },
        { id: 'TSK-102', title: 'API Integration for HRMS', description: 'Connect frontend to backend endpoints', status: 'To Do', priority: 'Urgent', comments: 0, attachments: 1, due: 'Oct 26' },
        { id: 'TSK-103', title: 'Fix Login Screen Bug', description: 'Resolve the padding issue on mobile', status: 'Review', priority: 'Medium', comments: 5, attachments: 0, due: 'Oct 24' },
        { id: 'TSK-104', title: 'Deploy Staging Environment', description: 'Push latest docker image', status: 'Done', priority: 'Low', comments: 1, attachments: 0, due: 'Oct 23' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleAddTask = (e) => {
    e.preventDefault();
    setTasks([...tasks, { id: `TSK-${Math.floor(Math.random() * 1000)}`, ...newTask, comments: 0, attachments: 0, due: 'TBD' }]);
    setIsModalOpen(false);
    setNewTask({ title: '', description: '', priority: 'Medium', status: 'To Do', assignee: '' });
  };

  const columns = ['To Do', 'In Progress', 'Review', 'Done'];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'var(--danger)';
      case 'High': return 'var(--warning)';
      case 'Medium': return 'var(--primary)';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Tasks...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Project Tasks</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage workflow, assign tasks and track progress.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button 
              style={{ padding: '0.5rem 1rem', background: viewMode === 'kanban' ? 'var(--primary-bg)' : 'transparent', border: 'none', color: viewMode === 'kanban' ? 'var(--primary-light)' : 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              style={{ padding: '0.5rem 1rem', background: viewMode === 'list' ? 'var(--primary-bg)' : 'transparent', border: 'none', color: viewMode === 'list' ? 'var(--primary-light)' : 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Task</button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', flex: 1 }}>
          {columns.map(col => (
            <div key={col} style={{ minWidth: '320px', width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{col} <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{tasks.filter(t => t.status === col).length}</span></h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Plus size={16} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '500px' }}>
                {tasks.filter(t => t.status === col).map(task => (
                  <div key={task.id} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }} className="kanban-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: getPriorityColor(task.priority), background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{task.priority}</span>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}><MoreVertical size={16} /></button>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', lineHeight: 1.3 }}>{task.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {task.comments > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MessageSquare size={14} /> {task.comments}</span>}
                        {task.attachments > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Paperclip size={14} /> {task.attachments}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <CalIcon size={12} /> {task.due}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="ct-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{task.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td><StatusBadge status={task.status} /></td>
                    <td><span style={{ color: getPriorityColor(task.priority), fontSize: '0.85rem', fontWeight: 600 }}>{task.priority}</span></td>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{task.due}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Task Title</label>
            <input type="text" className="input-field" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="input-field" rows="3" required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Priority</label>
              <select className="input-field" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} style={{ backgroundColor: 'var(--bg-card)' }}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Status</label>
              <select className="input-field" value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})} style={{ backgroundColor: 'var(--bg-card)' }}>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default TeamTasks;
