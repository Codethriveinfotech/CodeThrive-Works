import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { 
  FileText, Search, Calendar, Eye, Check, X, 
  Sparkles, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';
import './Admin.css';

const DEFAULT_DEMO_REPORTS = [];

const AdminReports = () => {
  const [reports, setReports] = useState(DEFAULT_DEMO_REPORTS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/daily-reports');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setReports(res.data.data);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.warn('API error fetching reports:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleReportAction = (reportId, newStatus) => {
    setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: newStatus } : r));
    if (selectedReport && selectedReport._id === reportId) {
      setSelectedReport(prev => ({ ...prev, status: newStatus }));
    }
    alert(`Report marked as ${newStatus}!`);
  };

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter(r => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || 
        r.employee?.fullName?.toLowerCase().includes(q) || 
        r.employee?.department?.toLowerCase().includes(q) ||
        r.summary?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, statusFilter]);

  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'Pending').length;
  const approvedReports = reports.filter(r => r.status === 'Approved').length;
  const totalHours = reports.reduce((acc, r) => acc + (parseFloat(r.hoursLogged) || 0), 0);

  const columns = [
    { 
      header: 'Date', 
      accessor: 'date', 
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'monospace', fontWeight: 600, color: '#818cf8' }}>
          <Calendar size={14} color="#818cf8" /> {new Date(row.date).toLocaleDateString()}
        </span>
      )
    },
    { 
      header: 'Employee Details', 
      accessor: 'employee', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="emp-avatar-big" style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}>
            {row.employee?.fullName ? row.employee.fullName.charAt(0).toUpperCase() : 'E'}
          </div>
          <div>
            <span style={{ fontWeight: 700, color: '#ffffff', display: 'block', fontSize: '0.9rem' }}>{row.employee?.fullName}</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.employee?.department}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Work Summary', 
      accessor: 'summary', 
      render: (row) => (
        <span style={{ display: 'block', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#cbd5e1', fontSize: '0.88rem' }}>
          {row.summary}
        </span>
      )
    },
    { 
      header: 'Hours Logged', 
      accessor: 'hoursLogged', 
      render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#34d399' }}>{row.hoursLogged} hrs</span> 
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row) => <StatusBadge status={row.status} /> 
    },
    { 
      header: 'Actions & Approval', 
      accessor: 'actions', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ padding: '0.35rem 0.65rem' }} onClick={() => handleView(row)} title="View Details">
            <Eye size={14} /> Preview
          </button>

          {row.status === 'Pending' && (
            <>
              <button className="action-btn-approve" onClick={() => handleReportAction(row._id, 'Approved')} title="Approve Report">
                <Check size={14} /> Approve
              </button>
              <button className="action-btn-reject" onClick={() => handleReportAction(row._id, 'Rejected')} title="Reject Report">
                <X size={14} /> Reject
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Daily Reports Console...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. HERO HEADER */}
      <div className="ultra-premium-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 className="welcome-title-glowing">Daily Work Reports Audit</h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0 0', fontSize: '0.95rem' }}>
              Audit & Review End-of-Day Work Reports Submitted by Employees with One-Click Approvals
            </p>
          </div>
        </div>
      </div>

      {/* 2. METRICS CARDS GRID */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('ALL')}>
          <div className="metric-icon bg-primary-light">
            <FileText size={26} color="#818cf8" />
          </div>
          <div className="metric-data">
            <p>Total Submitted Reports</p>
            <h3>{totalReports}</h3>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('Pending')}>
          <div className="metric-icon bg-warning-light">
            <AlertCircle size={26} color="#fbbf24" />
          </div>
          <div className="metric-data">
            <p>Pending Approval</p>
            <h3>{pendingReports}</h3>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('Approved')}>
          <div className="metric-icon bg-success-light">
            <CheckCircle2 size={26} color="#34d399" />
          </div>
          <div className="metric-data">
            <p>Approved Reports</p>
            <h3>{approvedReports}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-info-light">
            <Clock size={26} color="#38bdf8" />
          </div>
          <div className="metric-data">
            <p>Total Hours Logged</p>
            <h3>{totalHours.toFixed(1)}h</h3>
          </div>
        </div>
      </div>

      {/* 3. REPORTS TABLE */}
      <Card style={{ padding: 0 }}>
        <div className="admin-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Search size={16} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search reports by employee or summary..." 
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem', width: '300px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.8)', padding: '3px', borderRadius: '10px' }}>
            {['ALL', 'Pending', 'Approved', 'Rejected'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: statusFilter === st ? '#818cf8' : '#94a3b8',
                  border: statusFilter === st ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <DataTable columns={columns} data={filteredReports} searchable={false} itemsPerPage={10} />
      </Card>

      {/* REPORT PREVIEW MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Daily Work Report Details">
        {selectedReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#ffffff' }}>{selectedReport.employee?.fullName}</h3>
                <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>{selectedReport.employee?.department} &bull; ID: {selectedReport.employee?.employeeId}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontWeight: 700, color: '#818cf8', fontFamily: 'monospace', marginBottom: '4px' }}>Date: {new Date(selectedReport.date).toLocaleDateString()}</span>
                <StatusBadge status={selectedReport.status} />
              </div>
            </div>

            <div>
              <h5 style={{ color: '#818cf8', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Work Summary</h5>
              <div style={{ lineHeight: 1.6, padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#ffffff' }}>
                {selectedReport.summary}
              </div>
            </div>

            {selectedReport.completedTasks && (
              <div>
                <h5 style={{ color: '#818cf8', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completed Tasks Breakdown</h5>
                <div style={{ lineHeight: 1.6, padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#ffffff', whiteSpace: 'pre-wrap' }}>
                  {selectedReport.completedTasks}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedReport.status !== 'Approved' && (
                  <button className="action-btn-approve" onClick={() => handleReportAction(selectedReport._id, 'Approved')}>
                    <Check size={16} /> Approve Report
                  </button>
                )}
                {selectedReport.status !== 'Rejected' && (
                  <button className="action-btn-reject" onClick={() => handleReportAction(selectedReport._id, 'Rejected')}>
                    <X size={16} /> Reject Report
                  </button>
                )}
              </div>
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReports;
