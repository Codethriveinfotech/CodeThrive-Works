import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import { Clock, Plus, CheckCircle2, MoreVertical } from 'lucide-react';
import './Timesheet.css';

const Timesheet = () => {
  const [entries, setEntries] = useState([]);
  const [task, setTask] = useState('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimesheet();
  }, []);

  const fetchTimesheet = async () => {
    try {
      setLoading(true);
      // const res = await api.get('/timesheet/my-timesheet');
      // setEntries(res.data);
      setTimeout(() => {
        setEntries([
          { _id: '1', task: 'Implemented Auth Context', hours: '4.5', date: new Date().toLocaleDateString() },
          { _id: '2', task: 'Built Employee Dashboard', hours: '3.5', date: new Date().toLocaleDateString() }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.warn('Backend unavailable');
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!task || !hours) return;

    const payload = {
      task,
      hours: parseFloat(hours).toFixed(1),
      date: new Date().toLocaleDateString()
    };

    try {
      // await api.post('/timesheet', payload);
      const newEntry = { _id: Date.now().toString(), ...payload };
      setEntries([newEntry, ...entries]);
    } catch (err) {
      console.error(err);
    }
    
    setTask('');
    setHours('');
  };

  const totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.hours), 0).toFixed(1);

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Task Description', accessor: 'task' },
    { header: 'Hours Spent', accessor: 'hours', render: row => <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{row.hours} hrs</span> },
    { header: 'Actions', render: () => <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }}><MoreVertical size={14}/></button> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Timesheet</h1>
        <p style={{ color: 'var(--text-muted)' }}>Log your daily tasks and working time for project tracking.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <Card title="Log Working Time">
          <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Task Description</label>
              <textarea 
                className="input-field" 
                rows="3"
                placeholder="What did you work on?" 
                value={task}
                onChange={(e) => setTask(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Hours Spent</label>
              <input 
                type="number" 
                step="0.1" 
                min="0.1" 
                max="24"
                className="input-field" 
                placeholder="e.g. 4.5" 
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={16} /> Add Entry
            </button>
          </form>
        </Card>

        <Card title="Recent Entries" action={
          <div style={{ background: 'var(--primary-bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: 'var(--primary-light)', fontWeight: 600, fontSize: '0.9rem' }}>
            Total Today: {totalHours} hrs
          </div>
        } style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>Loading entries...</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No tasks logged today.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={entries} searchable={false} itemsPerPage={5} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Timesheet;
