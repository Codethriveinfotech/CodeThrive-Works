import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { 
  FileText, Send, CheckCircle2, Clock, 
  AlertCircle, Download, FilePlus
} from 'lucide-react';
import './Modules.css';

const DailyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    tasksWorked: '',
    hoursWorked: 8,
    workSummary: '',
    completedWork: '',
    pendingWork: '',
    issuesFaced: '',
    tomorrowsPlan: '',
    attachment: null
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/daily-reports/my-reports');
      setReports(res.data.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) data.append(key, formData[key]);
    });

    try {
      const res = await api.post('/daily-reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReports([res.data.data, ...reports]);
      setIsSubmitModalOpen(false);
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report');
    }
  };

  const resetForm = () => {
    setFormData({
      tasksWorked: '',
      hoursWorked: 8,
      workSummary: '',
      completedWork: '',
      pendingWork: '',
      issuesFaced: '',
      tomorrowsPlan: '',
      attachment: null
    });
  };

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Reports...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Daily Work Reports</h1>
          <p style={{ color: 'var(--text-muted)' }}>Submit and track your daily work progress.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsSubmitModalOpen(true)}>
          <FilePlus size={16} style={{marginRight: '0.5rem'}} /> Submit Today's Report
        </button>
      </div>

      <Card style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Hours Logged</th>
                <th>Tasks Worked</th>
                <th>Status</th>
                <th>Manager Comments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No daily reports submitted yet.
                  </td>
                </tr>
              ) : (
                reports.map(report => (
                  <tr key={report._id}>
                    <td style={{ fontWeight: 500 }}>{new Date(report.date).toLocaleDateString()}</td>
                    <td>{report.hoursWorked} hrs</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {report.tasksWorked}
                    </td>
                    <td><StatusBadge status={report.status} /></td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: report.teamLeadComments ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {report.teamLeadComments || 'No comments yet'}
                    </td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => viewReportDetails(report)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Submit Report Modal */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => { setIsSubmitModalOpen(false); resetForm(); }} title="Submit Daily Work Report">
        <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Tasks Worked On (IDs/Titles)</label>
              <input type="text" className="input-field" placeholder="e.g. TSK-101, TSK-105" required
                value={formData.tasksWorked} onChange={e => setFormData({...formData, tasksWorked: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Hours Logged</label>
              <input type="number" className="input-field" step="0.5" required
                value={formData.hoursWorked} onChange={e => setFormData({...formData, hoursWorked: parseFloat(e.target.value)})} />
            </div>
          </div>

          <div className="form-group">
            <label>Work Summary (What did you achieve today?)</label>
            <textarea className="input-field" rows="3" required
              value={formData.workSummary} onChange={e => setFormData({...formData, workSummary: e.target.value})}></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Completed Work</label>
              <textarea className="input-field" rows="2"
                value={formData.completedWork} onChange={e => setFormData({...formData, completedWork: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label>Pending Work</label>
              <textarea className="input-field" rows="2"
                value={formData.pendingWork} onChange={e => setFormData({...formData, pendingWork: e.target.value})}></textarea>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Issues or Blockers Faced</label>
              <textarea className="input-field" rows="2"
                value={formData.issuesFaced} onChange={e => setFormData({...formData, issuesFaced: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label>Tomorrow's Plan</label>
              <textarea className="input-field" rows="2"
                value={formData.tomorrowsPlan} onChange={e => setFormData({...formData, tomorrowsPlan: e.target.value})}></textarea>
            </div>
          </div>

          <div className="form-group">
            <label>Attachment (Optional)</label>
            <input type="file" className="input-field" onChange={e => setFormData({...formData, attachment: e.target.files[0]})} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => { setIsSubmitModalOpen(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Report</button>
          </div>
        </form>
      </Modal>

      {/* View Report Modal */}
      {selectedReport && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Report: ${new Date(selectedReport.date).toLocaleDateString()}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</span>
                <div style={{ marginTop: '0.25rem' }}><StatusBadge status={selectedReport.status} /></div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hours Logged</span>
                <div style={{ fontWeight: 600, fontSize: '1.2rem', marginTop: '0.25rem' }}>{selectedReport.hoursWorked} hrs</div>
              </div>
            </div>

            <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Tasks Worked</span>
              <div style={{ fontWeight: 500 }}>{selectedReport.tasksWorked}</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Work Summary</span>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{selectedReport.workSummary}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Completed Work</span>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{selectedReport.completedWork || 'N/A'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Pending Work</span>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{selectedReport.pendingWork || 'N/A'}</p>
              </div>
            </div>

            {selectedReport.issuesFaced && (
              <div style={{ borderLeft: '3px solid var(--danger)', paddingLeft: '1rem' }}>
                <span style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Issues Faced</span>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{selectedReport.issuesFaced}</p>
              </div>
            )}

            {selectedReport.teamLeadComments && (
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Manager Comments</span>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{selectedReport.teamLeadComments}</p>
              </div>
            )}

            {selectedReport.attachments && selectedReport.attachments.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Attachments</span>
                {selectedReport.attachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    <Download size={14} style={{marginRight: '0.5rem'}}/> Download File {i+1}
                  </a>
                ))}
              </div>
            )}

          </div>
        </Modal>
      )}

    </div>
  );
};

export default DailyReports;
