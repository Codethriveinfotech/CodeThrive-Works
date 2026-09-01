import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import './Modules.css';

const AdminLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves');
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this leave request?`)) return;
    
    try {
      await api.put(`/leaves/${id}`, { status });
      // Update local state instead of refetching everything for better UX
      setLeaves(leaves.map(l => l._id === id ? { ...l, status } : l));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredLeaves = leaves.filter(l => {
    const matchesSearch = l.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? l.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Leave Management...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Leave Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Review and manage employee leave requests.</p>
        </div>
      </div>

      <Card className="glass-3d">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '250px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 1rem', borderRadius: 'var(--radius-sm)' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by Employee Name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'white', padding: '0.75rem', width: '100%', outline: 'none' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '0 1rem', borderRadius: 'var(--radius-sm)' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'white', padding: '0.75rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map(req => {
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
                
                return (
                  <tr key={req._id} className="hover-lift" style={{ background: 'var(--bg-card)' }}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{req.employee?.fullName}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.employee?.employeeId}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{req.leaveType}</td>
                    <td>
                      {start.toLocaleDateString()} - {end.toLocaleDateString()} 
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({days} days)</span>
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.reason}</td>
                    <td><StatusBadge status={req.status} /></td>
                    <td>
                      {req.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleStatusUpdate(req._id, 'Approved')}
                            style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(req._id, 'Rejected')}
                            style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No leave requests found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

export default AdminLeave;
