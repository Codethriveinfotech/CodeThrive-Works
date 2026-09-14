import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, Download, Trash2, 
  FolderLock, FolderOpen, ShieldCheck, Search, RefreshCw, Sparkles, 
  UserCheck, GraduationCap, Globe, Eye, Lock, AlertCircle
} from 'lucide-react';
import './Documents.css';

const SUPPORTED_CATEGORIES = [
  {
    id: 'ID Proof',
    name: 'Identity Proofs',
    icon: UserCheck,
    colorClass: 'identity',
    description: 'Aadhaar Card, PAN Card, Passport, Voter ID, Driving License',
    examples: 'Aadhaar, PAN, Passport'
  },
  {
    id: 'Certificate',
    name: 'Educational Certificates',
    icon: GraduationCap,
    colorClass: 'education',
    description: 'Degree Certificates, Marksheets, Relieving & Experience Letters',
    examples: 'Degree, Marksheets, Experience'
  },
  {
    id: 'Policy',
    name: 'Company Policies',
    icon: FolderOpen,
    colorClass: 'policy',
    description: 'HR Handbook, Code of Conduct, IT Policy, Travel Guidelines',
    examples: 'HR Handbook, IT Policy'
  }
];

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    documentType: 'ID Proof',
    file: null,
    isPublic: false
  });

  const DEMO_DOCUMENTS = [];


  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      const docsList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const localDocs = JSON.parse(localStorage.getItem('cti_local_docs') || '[]');

      if (docsList.length > 0) {
        setDocuments([...docsList, ...localDocs]);
      } else {
        setDocuments(localDocs.length > 0 ? localDocs : DEMO_DOCUMENTS);
      }
    } catch (err) {
      console.warn('Failed to fetch documents from server, using local storage vault', err);
      const localDocs = JSON.parse(localStorage.getItem('cti_local_docs') || '[]');
      setDocuments(localDocs.length > 0 ? localDocs : DEMO_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDocuments();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenUploadWithCategory = (catId) => {
    setFormData(prev => ({
      ...prev,
      documentType: catId,
      title: '',
      file: null,
      isPublic: catId === 'Policy'
    }));
    setIsUploadModalOpen(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file && !formData.title) return alert('Please specify a document title and choose a file');

    setUploading(true);

    const newLocalDoc = {
      _id: 'doc-' + Date.now(),
      title: formData.title || 'Attached Document',
      documentType: formData.documentType,
      fileUrl: formData.file ? URL.createObjectURL(formData.file) : '',
      fileName: formData.file ? formData.file.name : 'document.pdf',
      isPublic: formData.isPublic,
      createdAt: new Date().toISOString(),
      owner: { fullName: user?.fullName || user?.name || 'Employee User' }
    };

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('documentType', formData.documentType);
      if (formData.file) data.append('file', formData.file);
      data.append('isPublic', formData.isPublic);

      const res = await api.post('/documents', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.data?._id) {
        newLocalDoc._id = res.data.data._id;
      }
    } catch (err) {
      console.warn('Backend API upload fallback, saving locally', err);
    } finally {
      const localDocs = JSON.parse(localStorage.getItem('cti_local_docs') || '[]');
      localStorage.setItem('cti_local_docs', JSON.stringify([newLocalDoc, ...localDocs]));
      
      setDocuments(prev => [newLocalDoc, ...prev]);
      setActiveCategory(formData.documentType);
      setIsUploadModalOpen(false);
      setFormData({ title: '', documentType: 'ID Proof', file: null, isPublic: false });
      setUploading(false);
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

  const isAdmin = ['admin', 'superadmin', 'hr'].includes(user?.role?.toLowerCase());

  const [selectedViewDoc, setSelectedViewDoc] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleViewDoc = (doc) => {
    setSelectedViewDoc(doc);
    setIsViewModalOpen(true);
  };

  const handleDownloadDoc = (doc) => {
    const fileUrl = doc.fileUrl?.startsWith('http') || doc.fileUrl?.startsWith('blob:')
      ? doc.fileUrl 
      : `http://localhost:5000/${doc.fileUrl || ''}`;
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = doc.fileName || `${doc.title.replace(/\s+/g, '_')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered documents calculation
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.documentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.owner?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Public') return doc.isPublic;
    if (activeCategory === 'Private') return !doc.isPublic;
    return doc.documentType === activeCategory;
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="loader"></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading Secure Document Vault...</p>
    </div>
  );

  return (
    <motion.div 
      className="documents-workspace-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* --------------------------------------------------------------------------
          1. HERO HEADER BANNER
         -------------------------------------------------------------------------- */}
      <div className="documents-hero-banner">
        <div className="hero-left-content">
          <h1 className="hero-main-title">Document & Credentials Hub</h1>
          <p className="hero-subtext">
            Upload, store, and organize your official identity proofs, educational certificates, employment contracts, tax filings, and company policies.
          </p>
        </div>

        <div className="hero-right-actions">
          <button 
            onClick={handleRefresh} 
            className="btn-glass-icon"
            title="Refresh Vault Data"
          >
            <RefreshCw size={17} className={isRefreshing ? 'spin' : ''} />
          </button>

          <button className="btn-primary-glow" onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={18} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          3. SUPPORTED DOCUMENT CATEGORIES GUIDE
         -------------------------------------------------------------------------- */}
      <div className="doc-guide-card">
        <div className="doc-guide-header">
          <div className="doc-guide-title">
            <Sparkles size={20} />
            <span>Supported Document Categories</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Click any category to quickly upload</span>
        </div>

        <div className="doc-types-grid">
          {SUPPORTED_CATEGORIES.map(cat => {
            const IconComp = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <div 
                key={cat.id}
                className={`doc-type-chip ${cat.colorClass} ${isActive ? 'active' : ''}`}
                onClick={() => handleOpenUploadWithCategory(cat.id)}
              >
                <div className={`type-chip-icon ${cat.colorClass}`}>
                  <IconComp size={20} />
                </div>
                <span className="type-chip-name">{cat.name}</span>
                <span className="type-chip-examples">{cat.examples}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          4. SEARCH & FILTER TOOLBAR
         -------------------------------------------------------------------------- */}
      <div className="doc-toolbar-card">
        <div className="doc-search-box">
          <Search size={17} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search documents by title, category, or owner..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="doc-filter-pills">
          {['All', 'ID Proof', 'Certificate', 'Policy', 'Public', 'Private'].map(tab => (
            <button
              key={tab}
              className={`tab-pill ${activeCategory === tab ? 'active' : ''}`}
              onClick={() => setActiveCategory(tab)}
            >
              {tab === 'ID Proof' ? 'Identity Proofs' : tab === 'Certificate' ? 'Certificates' : tab === 'Policy' ? 'Policies' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          5. DOCUMENT ITEMS GRID
         -------------------------------------------------------------------------- */}
      {filteredDocs.length === 0 ? (
        <div className="doc-guide-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FolderLock size={60} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: '#f8fafc', fontSize: '1.3rem', margin: '0 0 0.5rem 0' }}>No Documents Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            There are no documents stored under this filter or search query. Click below to add a new document.
          </p>
          <button className="btn-primary-glow" onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={18} /> Upload New Document
          </button>
        </div>
      ) : (
        <div className="doc-cards-grid">
          {filteredDocs.map(doc => {
            const catObj = SUPPORTED_CATEGORIES.find(c => c.id === doc.documentType) || {
              colorClass: 'other',
              icon: FileText
            };
            const IconComponent = catObj.icon || FileText;

            return (
              <motion.div 
                key={doc._id}
                className="document-item-card"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="doc-item-header">
                  <div className={`doc-icon-wrapper ${catObj.colorClass}`}>
                    <IconComponent size={24} />
                  </div>
                  <div className="doc-info-main">
                    <h4 className="doc-title-text" title={doc.title}>{doc.title}</h4>
                    <div className="doc-meta-row">
                      <span className={`doc-type-badge ${catObj.colorClass}`}>{doc.documentType}</span>
                      <span>•</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span className={`doc-visibility-tag ${doc.isPublic ? 'public' : 'private'}`}>
                    {doc.isPublic ? <Globe size={13} /> : <Lock size={13} />}
                    {doc.isPublic ? 'Public Company File' : 'Private Vault File'}
                  </span>
                  
                  {doc.owner && (
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldCheck size={13} color="#60a5fa" /> {doc.owner.fullName || 'Employee'}
                    </span>
                  )}
                </div>

                {/* Separate View and Download Buttons */}
                <div className="doc-actions-footer" style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => handleViewDoc(doc)}
                    className="btn-outline-glass"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem', flex: 1, justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}
                    title="View Document"
                  >
                    <Eye size={15} /> View
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="btn-outline-glass"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem', flex: 1, justifyContent: 'center', gap: '0.4rem', background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.35)', color: '#60a5fa', cursor: 'pointer' }}
                    title="Download File to Device"
                  >
                    <Download size={15} /> Download
                  </button>

                  {(doc.uploadedBy === user?._id || isAdmin) && (
                    <button 
                      onClick={() => handleDelete(doc._id)}
                      className="btn-glass-icon"
                      style={{ width: '36px', height: '36px', flexShrink: 0, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                      title="Delete Document"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* --------------------------------------------------------------------------
          6. UPLOAD DOCUMENT MODAL
         -------------------------------------------------------------------------- */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Document to Vault">
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="form-group">
            <label style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem', display: 'block' }}>Document Category</label>
            <select 
              className="input-field" 
              required 
              value={formData.documentType} 
              onChange={e => {
                const cat = e.target.value;
                setFormData({ ...formData, documentType: cat, isPublic: cat === 'Policy' });
              }}
              style={{ background: '#0f172a', color: '#f8fafc' }}
            >
              <option value="ID Proof">🪪 Identity Proof (Aadhaar, PAN, Passport, Voter ID)</option>
              <option value="Certificate">🎓 Educational Certificate (Degree, Marksheet, Experience)</option>
              <option value="Policy">🏢 Company Policy (HR Handbook, IT Policy)</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem', display: 'block' }}>Document Title</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              placeholder="e.g. Aadhaar Card Front & Back, B.Tech Degree Certificate" 
            />

            {/* Quick preset selector tags based on selected category */}
            {formData.documentType === 'ID Proof' && (
              <div style={{ marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Quick select document name:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {['Aadhaar Card', 'PAN Card', 'Passport', 'Voter ID', 'Driving License'].map(preset => (
                    <button 
                      key={preset} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, title: preset })}
                      style={{ background: formData.title === preset ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.documentType === 'Certificate' && (
              <div style={{ marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Quick select certificate name:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {['Degree Certificate', 'HSC Marksheet', 'SSLC Marksheet', 'Relieving Letter', 'Experience Certificate'].map(preset => (
                    <button 
                      key={preset} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, title: preset })}
                      style={{ background: formData.title === preset ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.documentType === 'Policy' && (
              <div style={{ marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Quick select policy document name:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {['HR Policy Handbook', 'IT & Security Policy', 'Code of Conduct', 'Leave & Attendance Policy'].map(preset => (
                    <button 
                      key={preset} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, title: preset })}
                      style={{ background: formData.title === preset ? 'rgba(6, 182, 212, 0.4)' : 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category Helper Info */}
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.825rem', color: '#93c5fd', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Recommended format for {formData.documentType}:</strong>
              <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                {SUPPORTED_CATEGORIES.find(c => c.id === formData.documentType)?.description || 'PDF or High Quality Image (JPG/PNG)'}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem', display: 'block' }}>Choose File Attachment</label>
            <input 
              type="file" 
              className="input-field" 
              required 
              onChange={e => setFormData({ ...formData, file: e.target.files[0] })} 
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx"
            />
            <span style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              Supported file types: PDF, JPG, PNG, DOCX, XLSX (Max 10MB)
            </span>
          </div>

          {isAdmin && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input 
                type="checkbox" 
                id="isPublic" 
                checked={formData.isPublic} 
                onChange={e => setFormData({ ...formData, isPublic: e.target.checked })} 
                style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} 
              />
              <label htmlFor="isPublic" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', color: '#e2e8f0' }}>
                Make this a public company document (Visible to all employees)
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
            <button type="button" className="btn-outline-glass" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-glow" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------------------------
          7. VIEW DOCUMENT PREVIEW MODAL
         -------------------------------------------------------------------------- */}
      {selectedViewDoc && (
        <Modal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)} 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Eye size={20} color="#3b82f6" />
              <span>Document Viewer • {selectedViewDoc.title}</span>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1.2rem', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem' }}>{selectedViewDoc.title}</h3>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.825rem', color: '#94a3b8' }}>
                  <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.15rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>{selectedViewDoc.documentType}</span>
                  <span>•</span>
                  <span>{new Date(selectedViewDoc.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Owner: {selectedViewDoc.owner?.fullName || 'Employee'}</span>
                </div>
              </div>
              <span className={`doc-visibility-tag ${selectedViewDoc.isPublic ? 'public' : 'private'}`}>
                {selectedViewDoc.isPublic ? <Globe size={13} /> : <Lock size={13} />}
                {selectedViewDoc.isPublic ? 'Public File' : 'Encrypted Vault File'}
              </span>
            </div>

            {/* Document Preview Box */}
            <div style={{ background: '#020617', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', height: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '1.5rem', textAlign: 'center' }}>
              {selectedViewDoc.fileUrl && (selectedViewDoc.fileUrl.endsWith('.jpg') || selectedViewDoc.fileUrl.endsWith('.png') || selectedViewDoc.fileUrl.startsWith('blob:')) ? (
                <img src={selectedViewDoc.fileUrl.startsWith('http') || selectedViewDoc.fileUrl.startsWith('blob:') ? selectedViewDoc.fileUrl : `http://localhost:5000/${selectedViewDoc.fileUrl}`} alt={selectedViewDoc.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                  <FileText size={64} color="#60a5fa" style={{ filter: 'drop-shadow(0 0 12px rgba(96, 165, 250, 0.4))' }} />
                  <div>
                    <h4 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0' }}>{selectedViewDoc.title}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Official Encrypted Document • Ready for Review</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                    <a 
                      href={selectedViewDoc.fileUrl?.startsWith('http') || selectedViewDoc.fileUrl?.startsWith('blob:') ? selectedViewDoc.fileUrl : `http://localhost:5000/${selectedViewDoc.fileUrl || ''}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-outline-glass"
                      style={{ fontSize: '0.825rem', padding: '0.4rem 0.9rem' }}
                    >
                      Open Full Browser View ↗
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn-outline-glass" onClick={() => setIsViewModalOpen(false)}>
                Close Preview
              </button>
              <button 
                type="button" 
                className="btn-primary-glow" 
                onClick={() => {
                  handleDownloadDoc(selectedViewDoc);
                  setIsViewModalOpen(false);
                }}
              >
                <Download size={16} /> Download File
              </button>
            </div>
          </div>
        </Modal>
      )}

    </motion.div>
  );
};

export default Documents;
