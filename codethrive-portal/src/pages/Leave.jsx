import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { motion } from 'framer-motion';
import { Calendar, PlusCircle, CheckCircle2, Clock, AlertCircle, CalendarRange } from 'lucide-react';
import './Modules.css';

const Leave = () => {
  const [data, setData] = useState({ requests: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setData(res.data.data || { requests: [] });
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/leaves', formData);
      setData(prev => ({
        ...prev,
        requests: [res.data, ...prev.requests]
      }));
      setIsModalOpen(false);
      setFormData({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves(); // Refresh balances
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply leave');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Leave Data...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Leave & Attendance</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your time off and view leave balances.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={16} style={{marginRight: '0.5rem'}} /> Request Leave
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <Card className="hover-lift">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={24} color="var(--primary-light)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Casual Leave</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{data.casualLeaveBalance || 0}</h3>
            </div>
          </div>
        </Card>
        <Card className="hover-lift">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
              <AlertCircle size={24} color="var(--danger)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sick Leave</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{data.sickLeaveBalance || 0}</h3>
            </div>
          </div>
        </Card>
        <Card className="hover-lift">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)' }}>
              <CalendarRange size={24} color="var(--success)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Paid Leave</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{data.paidLeaveBalance || 0}</h3>
            </div>
          </div>
        </Card>
        <Card className="hover-lift">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
              <Clock size={24} color="var(--warning)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pending Requests</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{data.pendingRequests || 0}</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Leave History" style={{ padding: 0 }}>
        {data.requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3>No Leave Requests</h3>
            <p>You haven't requested any leaves yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Applied On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map(req => {
                  const start = new Date(req.startDate);
                  const end = new Date(req.endDate);
                  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 500 }}>{req.leaveType}</td>
                      <td>
                        {start.toLocaleDateString()} - {end.toLocaleDateString()} 
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({days} days)</span>
                      </td>
                      <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.reason}</td>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td><StatusBadge status={req.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label>Leave Type</label>
            <select className="input-field" required value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})}>
              <option value="Casual">Casual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Paid">Paid Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
              <option value="WFH">Work From Home</option>
              <option value="Permission">Short Permission</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" className="input-field" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" className="input-field" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>Reason</label>
            <textarea className="input-field" rows="3" required placeholder="Please state your reason..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
};

export default Leave;
