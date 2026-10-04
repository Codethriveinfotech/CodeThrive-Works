import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  FileText, Search, Calendar, Eye, Check, X, 
  Sparkles, Clock, CheckCircle2, AlertCircle, Download, Printer, Filter
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import './Admin.css';

const DEFAULT_DEMO_REPORTS = [];

const AdminReports = () => {
  const [reports, setReports] = useState(DEFAULT_DEMO_REPORTS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('All');
  
  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const exportDailyReportsPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('CODETHRIVE INFOTECH PVT LTD', 14, 16);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(167, 243, 208);
      doc.text(`DAILY WORK REPORTS AUDIT STATEMENT (${selectedMonth})`, 14, 25);

      const tableColumn = ["Date", "Employee Name", "Department", "Work Summary", "Hours", "Status"];
      const tableRows = filteredReports.map(r => [
        r.date ? formatDate(r.date) : '-',
        r.employee?.fullName || 'Employee',
        r.employee?.department || '-',
        r.summary || '-',
        `${r.hoursLogged || 0} hrs`,
        r.status || 'Approved'
      ]);

      const renderTable = typeof autoTable === 'function' ? autoTable : (autoTable.default || doc.autoTable);
      if (typeof renderTable === 'function') {
        renderTable(doc, {
          startY: 40,
          head: [tableColumn],
          body: tableRows,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2.5 }
        });
      } else {
        throw new Error('PDF autoTable renderer could not be initialized');
      }

      doc.save(`Daily_Work_Reports_${selectedMonth}.pdf`);
    } catch (e) {
      alert('Error exporting PDF: ' + e.message);
    }
  };

  const exportDailyReportsExcel = () => {
    try {
      const exportData = filteredReports.map(r => ({
        Date: r.date ? formatDate(r.date) : '-',
        'Employee Name': r.employee?.fullName || 'Employee',
        'Department': r.employee?.department || '-',
        'Work Summary': r.summary || '-',
        'Hours Logged': r.hoursLogged || 0,
        Status: r.status || 'Approved'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Reports");
      XLSX.writeFile(workbook, `Daily_Work_Reports_${selectedMonth}.xlsx`);
    } catch (e) {
      alert('Error exporting Excel: ' + e.message);
    }
  };

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
          <Calendar size={14} color="#818cf8" /> {formatDate(row.date)}
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

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={exportDailyReportsPDF} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Printer size={15} /> Download PDF Report
            </button>
            <button className="btn btn-primary" onClick={exportDailyReportsExcel} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={15} /> Export Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* 2. METRICS CARDS GRID */}
      <div className="metrics-grid">
        <div 
          className={`stat-card stat-card-indigo ${statusFilter === 'ALL' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('ALL')}
          title="Click to view all reports"
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-indigo">
              <FileText size={18} />
            </div>
            <span className="stat-tag tag-indigo">
              <span className="beacon-dot"></span> ALL REPORTS
            </span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{totalReports}</h3>
            <p className="stat-title">Total Submitted Reports</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">System Submissions</span>
            <span className="stat-active-pill pill-indigo">Total</span>
          </div>
        </div>

        <div 
          className={`stat-card stat-card-amber ${statusFilter === 'Pending' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('Pending')}
          title="Click to filter Pending reports"
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-amber">
              <AlertCircle size={18} />
            </div>
            <span className="stat-tag tag-amber">REVIEW REQ</span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{pendingReports}</h3>
            <p className="stat-title">Pending Approval</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Awaiting Lead Action</span>
            <span className="stat-active-pill pill-amber">Pending</span>
          </div>
        </div>

        <div 
          className={`stat-card stat-card-emerald ${statusFilter === 'Approved' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('Approved')}
          title="Click to filter Approved reports"
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-emerald">
              <CheckCircle2 size={18} />
            </div>
            <span className="stat-tag tag-emerald">VERIFIED</span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{approvedReports}</h3>
            <p className="stat-title">Approved Reports</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Lead Verified</span>
            <span className="stat-active-pill pill-emerald">Approved</span>
          </div>
        </div>

        <div 
          className="stat-card stat-card-cyan"
          title="Total Work Hours Logged"
        >
          <div className="stat-card-glow"></div>
          <div className="stat-card-top">
            <div className="stat-icon-wrapper icon-cyan">
              <Clock size={18} />
            </div>
            <span className="stat-tag tag-cyan">TIME TRACKED</span>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-number">{totalHours.toFixed(1)}h</h3>
            <p className="stat-title">Total Hours Logged</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Productive Time</span>
            <span className="stat-active-pill pill-cyan">Hours</span>
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
                <span style={{ display: 'block', fontWeight: 700, color: '#818cf8', fontFamily: 'monospace', marginBottom: '4px' }}>Date: {formatDate(selectedReport.date)}</span>
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
