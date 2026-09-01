import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { FileText, Search, Calendar, Eye, Download } from 'lucide-react';
import './Payroll.css'; // Reusing premium layout styles

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/daily-reports'); // Admin endpoint
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter(r => 
      r.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.summary?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  const columns = [
    { header: 'Date', accessor: 'date', render: (row) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
        <Calendar size={14} color="var(--primary)" /> {new Date(row.date).toLocaleDateString()}
      </span>
    )},
    { header: 'Employee', accessor: 'employee', render: (row) => (
      <div>
        <span style={{ fontWeight: 600, display: 'block' }}>{row.employee?.fullName}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.employee?.department}</span>
      </div>
    )},
    { header: 'Summary', accessor: 'summary', render: (row) => (
      <span style={{ 
        display: 'block', 
        maxWidth: '300px', 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis' 
      }}>
        {row.summary}
      </span>
    )},
    { header: 'Hours Logged', accessor: 'hoursLogged', render: (row) => `${row.hoursLogged} hrs` },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Actions', accessor: 'actions', render: (row) => (
      <button className="icon-btn-subtle" onClick={() => handleView(row)}>
        <Eye size={16} />
      </button>
    )}
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Reports...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Daily Reports</h1>
          <p style={{ color: 'var(--text-muted)' }}>Review end-of-day reports submitted by employees.</p>
        </div>
      </div>

      <Card style={{ padding: 0 }} className="premium-card">
        <div className="payslip-filters">
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="filter-input" 
              placeholder="Search reports by employee name or summary..." 
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {!filteredReports || filteredReports.length === 0 ? (
          <div className="empty-state-premium" style={{ margin: '2rem' }}>
            <FileText size={64} className="icon" />
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No Reports Found</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
              No daily reports match your search criteria.
            </p>
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            <DataTable columns={columns} data={filteredReports} searchable={false} />
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report Details">
        {selectedReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0' }}>{selectedReport.employee?.fullName}</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedReport.employee?.department}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontWeight: 600 }}>{new Date(selectedReport.date).toLocaleDateString()}</span>
                <StatusBadge status={selectedReport.status} />
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Summary</h5>
              <p style={{ lineHeight: 1.6, margin: 0, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                {selectedReport.summary}
              </p>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Completed Tasks</h5>
              <p style={{ lineHeight: 1.6, margin: 0, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap' }}>
                {selectedReport.completedTasks || 'N/A'}
              </p>
            </div>

            {selectedReport.blockers && (
              <div>
                <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Blockers</h5>
                <p style={{ lineHeight: 1.6, margin: 0, padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', color: '#fca5a5' }}>
                  {selectedReport.blockers}
                </p>
              </div>
            )}

            {selectedReport.attachments && selectedReport.attachments.length > 0 && (
              <div>
                <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Attachments</h5>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedReport.attachments.map((att, idx) => (
                    <a key={idx} href={`http://localhost:5000/${att}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                      <Download size={14} /> Attachment {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReports;
