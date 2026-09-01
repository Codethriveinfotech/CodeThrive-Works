import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Upload, Download, Trash2, 
  FolderLock, FolderOpen, ShieldCheck 
} from 'lucide-react';
import './Modules.css';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    documentType: 'Other',
    file: null,
    isPublic: false
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) return alert('Please select a file');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('documentType', formData.documentType);
    data.append('file', formData.file);
    data.append('isPublic', formData.isPublic);

    try {
      const res = await api.post('/documents', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocuments([res.data, ...documents]);
      setIsUploadModalOpen(false);
      setFormData({ title: '', documentType: 'Other', file: null, isPublic: false });
      alert('Document uploaded successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter(d => d._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Documents...</p>
    </div>
  );

  const publicDocs = documents.filter(d => d.isPublic);
  const privateDocs = documents.filter(d => !d.isPublic);

  const isAdmin = ['admin', 'superadmin', 'hr'].includes(user?.role);

  const DocumentCard = ({ doc }) => (
    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'all 0.2s', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--primary-light)' }}>
          <FileText size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', paddingRight: '2rem' }}>{doc.title}</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.documentType} • {new Date(doc.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      
      {doc.owner && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} /> Owner: {doc.owner.fullName}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
        <a href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000/${doc.fileUrl}`} 
           target="_blank" rel="noopener noreferrer" 
           className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}>
          <Download size={14} style={{marginRight: '0.4rem'}}/> Download
        </a>
        
        {(doc.uploadedBy === user?._id || isAdmin) && (
          <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.4rem' }} onClick={() => handleDelete(doc._id)}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Document Center</h1>
          <p style={{ color: 'var(--text-muted)' }}>Securely store and access your files and company policies.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
          <Upload size={16} style={{marginRight: '0.5rem'}} /> Upload Document
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Company Policies (Public) */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderOpen size={20} color="var(--primary)" /> Company Policies & Guidelines
          </div>
        }>
          {publicDocs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No company documents available.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {publicDocs.map(d => <DocumentCard key={d._id} doc={d} />)}
            </div>
          )}
        </Card>

        {/* Private Documents */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderLock size={20} color="var(--warning)" /> My Private Documents
          </div>
        }>
          {privateDocs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>You haven't uploaded any private documents yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {privateDocs.map(d => <DocumentCard key={d._id} doc={d} />)}
            </div>
          )}
        </Card>

      </div>

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Document">
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label>Document Title</label>
            <input type="text" className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Identity Proof, Relieving Letter" />
          </div>

          <div className="form-group">
            <label>Document Type</label>
            <select className="input-field" required value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value})}>
              <option value="ID Proof">ID Proof</option>
              <option value="Certificate">Certificate</option>
              <option value="Contract">Contract</option>
              <option value="Payslip">Payslip</option>
              {isAdmin && <option value="Policy">Company Policy</option>}
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>File Attachment</label>
            <input type="file" className="input-field" required onChange={e => setFormData({...formData, file: e.target.files[0]})} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>PDF, JPG, PNG allowed (Max 5MB)</span>
          </div>

          {isAdmin && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="isPublic" checked={formData.isPublic} onChange={e => setFormData({...formData, isPublic: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
              <label htmlFor="isPublic" style={{ margin: 0, cursor: 'pointer' }}>Make this a public company document (Visible to everyone)</label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Upload</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Documents;
