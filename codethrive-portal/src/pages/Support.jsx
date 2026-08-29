import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { 
  LifeBuoy, PlusCircle, MessageSquare, AlertCircle, 
  CheckCircle2, Clock, CheckSquare, Download
} from 'lucide-react';
import './Modules.css';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [formData, setFormData] = useState({
    subject: '',
    category: 'IT Support',
    priority: 'Medium',
    description: '',
    attachment: null
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/support/my-tickets');
      setTickets(res.data.data);
    } catch (err) {
      console.error('Failed to fetch support tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) data.append(key, formData[key]);
    });

    try {
      const res = await api.post('/support', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTickets([res.data.data, ...tickets]);
      setIsModalOpen(false);
      setFormData({ subject: '', category: 'IT Support', priority: 'Medium', description: '', attachment: null });
      alert('Support ticket created successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create ticket');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Support Tickets...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Help & Support</h1>
          <p style={{ color: 'var(--text-muted)' }}>Raise issues and track their resolution status.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={16} style={{marginRight: '0.5rem'}} /> Raise Ticket
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)' }}>
              <LifeBuoy size={24} color="var(--primary-light)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Tickets</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{tickets.length}</h3>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
              <Clock size={24} color="var(--warning)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Open</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{tickets.filter(t => t.status === 'Open').length}</h3>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={24} color="var(--success)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Resolved</p>
              <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card title="My Tickets" style={{ padding: 0 }}>
        {tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <CheckSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3>No Tickets Found</h3>
            <p>You haven't raised any support tickets yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket._id}>
                    <td style={{ fontWeight: 500 }}>{ticket.ticketId}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.subject}</td>
                    <td>{ticket.category}</td>
                    <td><StatusBadge status={ticket.priority} /></td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setSelectedTicket(ticket)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View Ticket Modal */}
      {selectedTicket && (
        <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title={`Ticket: ${selectedTicket.ticketId}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0' }}>{selectedTicket.subject}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedTicket.category} • {new Date(selectedTicket.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <StatusBadge status={selectedTicket.priority} />
                <StatusBadge status={selectedTicket.status} />
              </div>
            </div>

            <div style={{ background: 'var(--glass-bg)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Description</span>
              <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
            </div>

            {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Attachments</span>
                {selectedTicket.attachments.map((url, i) => (
                  <a key={i} href={url.startsWith('http') ? url : `http://localhost:5000/${url}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                    <Download size={14} /> Download File
                  </a>
                ))}
              </div>
            )}

            {selectedTicket.resolution && (
              <div style={{ borderLeft: '3px solid var(--success)', paddingLeft: '1rem' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--success)', marginBottom: '0.5rem', fontWeight: 600 }}>Resolution Provided</span>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{selectedTicket.resolution}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Ticket Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Raise Support Ticket">
        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label>Subject / Issue Title</label>
            <input type="text" className="input-field" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Brief summary of the issue" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Category</label>
              <select className="input-field" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="IT Support">IT Support (Hardware/Software)</option>
                <option value="HR Issue">HR Issue</option>
                <option value="Payroll">Payroll / Salary</option>
                <option value="Facilities">Facilities / Office</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="input-field" required value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea className="input-field" rows="4" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Please describe the issue in detail..."></textarea>
          </div>

          <div className="form-group">
            <label>Attachment (Optional)</label>
            <input type="file" className="input-field" onChange={e => setFormData({...formData, attachment: e.target.files[0]})} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>Screenshots or relevant documents</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Ticket</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Support;
