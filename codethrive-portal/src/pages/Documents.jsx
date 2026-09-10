import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, Download, Trash2, 
  FolderLock, FolderOpen, ShieldCheck, Search, RefreshCw, Sparkles, 
  UserCheck, GraduationCap, FileCheck, DollarSign, HeartPulse, 
  CheckCircle2, Globe, Eye, Lock, Filter, FileSpreadsheet, AlertCircle
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
    id: 'Contract',
    name: 'Employment Contracts',
    icon: FileCheck,
    colorClass: 'contract',
    description: 'Offer Letter, Appointment Letter, NDA, Non-Compete Agreements',
    examples: 'Offer Letter, NDA, Agreement'
  },
  {
    id: 'Financial',
    name: 'Tax & Financial Docs',
    icon: DollarSign,
    colorClass: 'financial',
    description: 'Form 16, Income Tax Declarations, Bank Statement, Cancelled Cheque',
    examples: 'Form 16, Bank Statement, Payslip'
  },
  {
    id: 'Health',
    name: 'Medical & Benefits',
    icon: HeartPulse,
    colorClass: 'health',
    description: 'Health Insurance Policy, Medical Fitness Certificate, Vaccination Proof',
    examples: 'Insurance Card, Fitness Cert'
  },
  {
    id: 'Policy',
    name: 'Company Policies',
    icon: FolderOpen,
    colorClass: 'policy',
    description: 'HR Handbook, Code of Conduct, IT Policy, Travel Guidelines (Public)',
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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      const docsList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setDocuments(docsList);
    } catch (err) {
      console.error('Failed to fetch documents', err);
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
    if (!formData.file) return alert('Please select a file to upload');

    setUploading(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('documentType', formData.documentType);
    data.append('file', formData.file);
    data.append('isPublic', formData.isPublic);

    try {
      const res = await api.post('/documents', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newDoc = res.data?.data || res.data;
      setDocuments([newDoc, ...documents]);
      setIsUploadModalOpen(false);
      setFormData({ title: '', documentType: 'ID Proof', file: null, isPublic: false });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
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
          <div className="hero-badge-pill">
            <Sparkles size={14} className="sparkle-icon" />
            <span>SECURE ENCRYPTED VAULT</span>
          </div>
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
          3. SUPPORTED DOCUMENT CATEGORIES GUIDE (Answers "What can be added?")
         -------------------------------------------------------------------------- */}
      <div className="doc-guide-card">
        <div className="doc-guide-header">
          <div className="doc-guide-title">
            <Sparkles size={20} />
            <span>Supported Document Categories (Enna Mari Documents Upload Palam)</span>
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
          {['All', 'ID Proof', 'Certificate', 'Contract', 'Financial', 'Health', 'Policy', 'Public', 'Private'].map(tab => (
            <button
              key={tab}
              className={`tab-pill ${activeCategory === tab ? 'active' : ''}`}
              onClick={() => setActiveCategory(tab)}
            >
              {tab === 'ID Proof' ? 'Identity' : tab}
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
            const fileUrl = doc.fileUrl?.startsWith('http') ? doc.fileUrl : `http://localhost:5000/${doc.fileUrl}`;

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

                <div className="doc-actions-footer">
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-outline-glass"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.825rem', width: '100%', justifyContent: 'center' }}
                  >
                    <Download size={15} /> Download / View File
                  </a>

                  {(doc.uploadedBy === user?._id || isAdmin) && (
                    <button 
                      onClick={() => handleDelete(doc._id)}
                      className="btn-glass-icon"
                      style={{ width: '38px', height: '38px', marginLeft: '0.6rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
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
            <label style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem', display: 'block' }}>Document Title</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              placeholder="e.g. Aadhaar Card Front & Back, B.Tech Degree Certificate" 
            />
          </div>

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
              <option value="Contract">📑 Employment Contract (Offer Letter, NDA, Appointment)</option>
              <option value="Financial">💰 Tax & Financial (Form 16, Bank Statement, Tax Return)</option>
              <option value="Health">🏥 Medical & Health (Insurance, Fitness Certificate)</option>
              {isAdmin && <option value="Policy">🏢 Company Policy (Public Policy Document)</option>}
              <option value="Other">📁 Other Personal Document</option>
            </select>
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

    </motion.div>
  );
};

export default Documents;
