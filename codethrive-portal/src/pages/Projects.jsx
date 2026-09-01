import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { 
  FolderGit2, Plus, MoreVertical, LayoutGrid, List,
  Users, Calendar, CheckCircle2, Circle
} from 'lucide-react';
import './Modules.css';

const Projects = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newProject, setNewProject] = useState({
    name: '', client: '', status: 'Active', deadline: '', progress: 0
  });

  useEffect(() => {
    // Simulating API
    setTimeout(() => {
      setProjects([
        { id: 'PRJ-2026-01', name: 'CodeThrive HRMS Portal', client: 'Internal', status: 'Active', deadline: '2026-12-15', progress: 65, team: 8, tasks: { total: 124, completed: 82 } },
        { id: 'PRJ-2026-02', name: 'E-Commerce App Redesign', client: 'RetailCorp', status: 'Active', deadline: '2026-10-30', progress: 40, team: 5, tasks: { total: 56, completed: 22 } },
        { id: 'PRJ-2026-03', name: 'Legacy System Migration', client: 'BankInc', status: 'On Hold', deadline: '2027-02-28', progress: 15, team: 3, tasks: { total: 200, completed: 30 } },
        { id: 'PRJ-2025-45', name: 'Marketing Website', client: 'StartupX', status: 'Completed', deadline: '2026-01-15', progress: 100, team: 4, tasks: { total: 45, completed: 45 } }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleAddProject = (e) => {
    e.preventDefault();
    setProjects([...projects, { id: `PRJ-${new Date().getFullYear()}-${Math.floor(Math.random()*100)}`, ...newProject, team: 1, tasks: { total: 0, completed: 0 } }]);
    setIsModalOpen(false);
    setNewProject({ name: '', client: '', status: 'Active', deadline: '', progress: 0 });
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Projects...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Project Portfolio</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage client projects, timelines, and team allocations.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button 
              style={{ padding: '0.5rem 1rem', background: viewMode === 'grid' ? 'var(--primary-bg)' : 'transparent', border: 'none', color: viewMode === 'grid' ? 'var(--primary-light)' : 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setViewMode('grid')}
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
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Project</button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {projects.map(proj => (
            <div key={proj.id} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }} className="project-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{proj.id}</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}><MoreVertical size={16} /></button>
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', lineHeight: 1.3 }}>{proj.name}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Client: {proj.client}</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontWeight: 600, color: proj.progress === 100 ? 'var(--success)' : 'var(--primary)' }}>{proj.progress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--glass-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${proj.progress}%`, background: proj.progress === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: '3px' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <StatusBadge status={proj.status} />
                <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Team Size"><Users size={14} /> {proj.team}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Tasks"><CheckCircle2 size={14} /> {proj.tasks.completed}/{proj.tasks.total}</span>
                </div>
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
                  <th>Project ID</th>
                  <th>Name</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(proj => (
                  <tr key={proj.id}>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{proj.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{proj.name}</td>
                    <td>{proj.client}</td>
                    <td><StatusBadge status={proj.status} /></td>
                    <td style={{ width: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--glass-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${proj.progress}%`, background: proj.progress === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', width: '30px', textAlign: 'right' }}>{proj.progress}%</span>
                      </div>
                    </td>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{proj.deadline}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Project Name</label>
            <input type="text" className="input-field" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Client</label>
            <input type="text" className="input-field" required value={newProject.client} onChange={e => setNewProject({...newProject, client: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Status</label>
              <select className="input-field" value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})} style={{ backgroundColor: 'var(--bg-card)' }}>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Deadline</label>
              <input type="date" className="input-field" required value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Project</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Projects;
