import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, Search, Download, Trash2, Globe, Plus, 
  FileText, Shield, File, Eye, Lock, Upload, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import './Payroll.css';

const DEFAULT_DOCUMENTS = [
  {
    _id: 'doc-1',
    title: 'CodeThrive Employee Handbook 2026',
    documentType: 'Company Policy',
    fileUrl: 'docs/handbook.pdf',
    isPublic: true,
    fileSize: '2.4 MB',
    owner: { fullName: 'HR Team', employeeId: 'HR-OFFICIAL' },
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    _id: 'doc-2',
    title: 'Information Security & NDA Guidelines',
    documentType: 'Legal Document',
    fileUrl: 'docs/nda_policy.pdf',
    isPublic: true,
    fileSize: '1.1 MB',
    owner: { fullName: 'Mahadevan', employeeId: 'CTI-EMP-001' },
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    _id: 'doc-3',
    title: 'Offer Letter & Employment Agreement - Sarah Jenkins',
    documentType: 'Employee Contract',
    fileUrl: 'docs/contract_sarah.pdf',
    isPublic: false,
    fileSize: '850 KB',
    owner: { fullName: 'Sarah Jenkins', employeeId: 'CTI-EMP-004' },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    _id: 'doc-4',
    title: 'Form 16 Tax Declaration Statement 2025-26',
    documentType: 'Tax Document',
    fileUrl: 'docs/form16_tax.pdf',
    isPublic: false,
    fileSize: '540 KB',
    owner: { fullName: 'Alex Rivera', employeeId: 'CTI-EMP-007' },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [_viewMode, _setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Upload Form State
  const [uploadData, setUploadData] = useState({
    title: '',
    documentType: 'Company Policy',
    isPublic: true,
    file: null
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let apiDocs = [];
      try {
        const res = await api.get('/documents');
        if (res.data?.success && Array.isArray(res.data.data)) {
          apiDocs = res.data.data;
        }
      } catch (err) {
        console.warn('Backend API offline. Using fallback demo documents.', err);
      }

      const localDocs = JSON.parse(localStorage.getItem('cti_shared_documents') || '[]');
      const combined = [...localDocs, ...apiDocs];
      
      if (combined.length === 0) {
        localStorage.setItem('cti_shared_documents', JSON.stringify(DEFAULT_DOCUMENTS));
        setDocuments(DEFAULT_DOCUMENTS);
      } else {
        const map = new Map();
        combined.forEach(d => map.set(d._id, d));
        setDocuments(Array.from(map.values()));
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
      setDocuments(DEFAULT_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/documents/${docId}`);
      } catch (err) {
        console.warn('Backend delete skipped', err);
      }

      const updated = documents.filter(d => d._id !== docId);
      setDocuments(updated);
      localStorage.setItem('cti_shared_documents', JSON.stringify(updated));
      showToast('Document deleted successfully.');
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadData.title) return;

    const newDoc = {
      _id: 'doc_' + Date.now(),
      title: uploadData.title,
      documentType: uploadData.documentType,
      fileUrl: 'docs/' + uploadData.title.toLowerCase().replace(/\s+/g, '_') + '.pdf',
      isPublic: uploadData.isPublic,
      fileSize: '1.2 MB',
      owner: { fullName: 'Management Admin', employeeId: 'CTI-ADMIN-01' },
      createdAt: new Date().toISOString()
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem('cti_shared_documents', JSON.stringify(updated));

    setIsUploadModalOpen(false);
    setUploadData({ title: '', documentType: 'Company Policy', isPublic: true, file: null });
    showToast('New document uploaded to enterprise storage!');
  };

  const stats = useMemo(() => {
    const total = documents.length;
    const publicCount = documents.filter(d => d.isPublic).length;
    const privateCount = total - publicCount;
    return { total, publicCount, privateCount };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || 
        d.title?.toLowerCase().includes(q) || 
        d.documentType?.toLowerCase().includes(q) ||
        d.owner?.fullName?.toLowerCase().includes(q);
      const matchesType = typeFilter === 'ALL' || 
        (typeFilter === 'PUBLIC' && d.isPublic) ||
        (typeFilter === 'PRIVATE' && !d.isPublic) ||
        d.documentType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [documents, searchTerm, typeFilter]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="loader" style={{ width: '45px', height: '45px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading Enterprise Document Vault...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative' }}
    >
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{
              position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.95))',
              color: '#fff', padding: '12px 20px', borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
              display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, backdropFilter: 'blur(10px)'
            }}
          >
            <Sparkles size={20} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1), rgba(15, 23, 42, 0.6))',
        borderRadius: '20px', padding: '2rem 2.2rem',
        border: '1px solid rgba(99, 102, 241, 0.25)', backdropFilter: 'blur(16px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
            }}>
              <FolderOpen size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Document Vault
              </h1>
              <span style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 500 }}>Enterprise Files & Policy Repository</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0 0', fontSize: '0.95rem', maxWidth: '600px' }}>
            Centralized document hub for staff contracts, NDA agreements, company compliance policies, and public resources.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              padding: '0.75rem 1.4rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff', fontWeight: 700, border: 'none',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
              display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          >
            <Upload size={18} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <motion.div whileHover={{ y: -4 }} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.3rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Vault Files</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}><FileText size={18} /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{stats.total}</div>
          <div style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: '0.3rem' }}>All active records</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.3rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Public Company Policies</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}><Globe size={18} /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{stats.publicCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '0.3rem' }}>Visible to all staff</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.3rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Private Staff Contracts</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><Lock size={18} /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{stats.privateCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#fde68a', marginTop: '0.3rem' }}>Confidential access only</div>
        </motion.div>
      </div>

      {/* Main Content Card */}
      <Card style={{ background: 'rgba(15, 23, 42, 0.75)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', backdropFilter: 'blur(16px)' }}>
        {/* Controls Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '4px' }}>
            {[
              { key: 'ALL', label: 'All Files' },
              { key: 'PUBLIC', label: 'Public Policies' },
              { key: 'PRIVATE', label: 'Confidential Documents' },
              { key: 'Company Policy', label: 'Policies' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                style={{
                  padding: '0.55rem 1.1rem', borderRadius: '9px', border: 'none',
                  background: typeFilter === tab.key ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: typeFilter === tab.key ? '#fff' : 'var(--text-muted)',
                  fontWeight: typeFilter === tab.key ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '0 1rem', width: '280px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text"
              placeholder="Search file title or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.65rem 0.75rem', outline: 'none', width: '100%', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {/* Documents Grid View */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filteredDocs.map((doc, idx) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: doc.isPublic ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  color: doc.isPublic ? '#10b981' : '#818cf8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FileText size={22} />
                </div>

                <span style={{
                  padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                  background: doc.isPublic ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: doc.isPublic ? '#34d399' : '#fbbf24',
                  border: doc.isPublic ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex', alignItems: 'center', gap: '0.3rem'
                }}>
                  {doc.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                  <span>{doc.isPublic ? 'Public' : 'Confidential'}</span>
                </span>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.4rem 0', color: '#fff', fontSize: '1.02rem', fontWeight: 700, lineHeight: 1.4 }}>
                  {doc.title}
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{doc.documentType}</span>
                  <span>•</span>
                  <span>{doc.fileSize || '1.0 MB'}</span>
                </div>
              </div>

              <div style={{
                paddingTop: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded By</span>
                  <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>{doc.owner?.fullName || 'HR Admin'}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <a
                    href={doc.fileUrl?.startsWith('http') ? doc.fileUrl : `http://localhost:5000/${doc.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '0.45rem 0.65rem', borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff', fontSize: '0.8rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none'
                    }}
                    title="View Document in Browser"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </a>

                  <a
                    href={doc.fileUrl?.startsWith('http') ? doc.fileUrl : `http://localhost:5000/${doc.fileUrl}`}
                    download={doc.title ? `${doc.title.replace(/\s+/g, '_')}.pdf` : 'document.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '0.45rem 0.65rem', borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none'
                    }}
                    title="Download File to Computer"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => handleDelete(doc._id)}
                    style={{
                      padding: '0.45rem', borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171', cursor: 'pointer'
                    }}
                    title="Delete File"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredDocs.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px' }}>
              <FolderOpen size={44} color="var(--text-muted)" style={{ marginBottom: '0.8rem' }} />
              <h3 style={{ margin: 0, color: '#fff' }}>No Documents Matching Query</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
                Try adjusting search terms or changing tab filters.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Upload Document Modal */}
      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Upload size={20} color="#818cf8" />
            <span>Upload New Vault Document</span>
          </div>
        }
      >
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
          <div className="form-group">
            <label className="field-label">Document Title *</label>
            <input 
              type="text" className="input-box" 
              placeholder="e.g. CodeThrive IT Policy 2026"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="field-label">Document Type</label>
              <select 
                className="input-box"
                value={uploadData.documentType}
                onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
              >
                <option value="Company Policy">Company Policy</option>
                <option value="Legal Document">Legal Document</option>
                <option value="Employee Contract">Employee Contract</option>
                <option value="Tax Document">Tax Document</option>
                <option value="Training Material">Training Material</option>
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Access Level</label>
              <select 
                className="input-box"
                value={uploadData.isPublic ? 'public' : 'private'}
                onChange={(e) => setUploadData({ ...uploadData, isPublic: e.target.value === 'public' })}
              >
                <option value="public">🌐 Public (All Staff Access)</option>
                <option value="private">🔒 Private / Confidential</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="field-label">Select File (PDF, DOCX, PNG)</label>
            <div style={{
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              padding: '1.8rem',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.2)',
              cursor: 'pointer'
            }}>
              <Upload size={32} color="#818cf8" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>Click to browse or drop file here</p>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Max file size 25 MB</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Sparkles size={16} />
              <span>Confirm Upload</span>
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default AdminDocuments;
