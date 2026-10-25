import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, Download, Trash2, 
  FolderLock, FolderOpen, ShieldCheck, Search, RefreshCw, Sparkles, 
  UserCheck, GraduationCap, Globe, Eye, Lock, AlertCircle, CheckCircle2, Layers, Calendar, Plus
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
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

  // Automatic Compression & Drag-Drop State
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressImageFile = (file, quality = 0.75, maxWidth = 1600) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/') || file.size < 300 * 1024) {
        resolve({ compressedFile: file, originalSize: file?.size || 0, compressedSize: file?.size || 0, ratio: 0 });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ compressedFile: file, originalSize: file.size, compressedSize: file.size, ratio: 0 });
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type || 'image/jpeg',
                lastModified: Date.now()
              });
              const ratio = Math.round(((file.size - compressedFile.size) / file.size) * 100);
              resolve({
                compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                ratio: ratio > 0 ? ratio : 0
              });
            },
            file.type || 'image/jpeg',
            quality
          );
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileProcess = async (selectedFile) => {
    if (!selectedFile) return;
    setIsCompressing(true);
    setCompressionInfo(null);

    const result = await compressImageFile(selectedFile);

    setFormData(prev => ({
      ...prev,
      file: result.compressedFile
    }));

    setCompressionInfo({
      originalName: selectedFile.name,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      ratio: result.ratio
    });

    setIsCompressing(false);
  };

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
    setCompressionInfo(null);
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
    } catch (err) {
      console.warn('Backend delete API fallback, deleting from local state:', err);
    } finally {
      const localDocs = JSON.parse(localStorage.getItem('cti_local_docs') || '[]');
      localStorage.setItem('cti_local_docs', JSON.stringify(localDocs.filter(d => d._id !== id && d.id !== id)));
      setDocuments(prev => prev.filter(d => d._id !== id && d.id !== id));
    }
  };

  const isAdmin = ['admin', 'superadmin', 'hr'].includes(user?.role?.toLowerCase());

  const isImageDoc = (doc) => {
    if (!doc) return false;
    const url = (doc.fileUrl || doc.fileName || '').toLowerCase();
    return url.startsWith('blob:') || 
           url.startsWith('data:image/') || 
           /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url);
  };

  const getDocUrl = (doc) => {
    if (!doc || !doc.fileUrl) return '';
    if (doc.fileUrl.startsWith('http') || doc.fileUrl.startsWith('blob:') || doc.fileUrl.startsWith('data:')) {
      return doc.fileUrl;
    }
    return `http://localhost:5000/${doc.fileUrl}`;
  };

  const [selectedViewDoc, setSelectedViewDoc] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleViewDoc = (doc) => {
    setSelectedViewDoc(doc);
    setIsViewModalOpen(true);
  };

  const handleDownloadDoc = async (doc) => {
    if (!doc) return;

    const rawFileName = doc.fileName || `${doc.title ? doc.title.replace(/\s+/g, '_') : 'Document'}.pdf`;
    const fileUrl = doc.fileUrl?.startsWith('http') || doc.fileUrl?.startsWith('blob:') || doc.fileUrl?.startsWith('data:')
      ? doc.fileUrl 
      : (doc.fileUrl ? `http://localhost:5000/${doc.fileUrl}` : null);

    const triggerDownload = (blobOrUrl, name) => {
      const link = document.createElement('a');
      link.href = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (fileUrl) {
      try {
        if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
          triggerDownload(fileUrl, rawFileName);
          return;
        }
        const res = await fetch(fileUrl);
        if (res.ok) {
          const blob = await res.blob();
          triggerDownload(blob, rawFileName);
          return;
        }
      } catch (err) {
        console.warn('Direct fetch download failed, falling back to link click:', err);
      }
      triggerDownload(fileUrl, rawFileName);
    } else {
      const content = `CodeThrive Portal - Official Document\n\nTitle: ${doc.title}\nCategory: ${doc.documentType}\nUploaded Date: ${formatDate(doc.createdAt)}\nOwner: ${doc.owner?.fullName || 'Employee'}\nStatus: Verified Document\n\nThis is an official document stored in the CodeThrive Credentials Vault.`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, `${doc.title.replace(/\s+/g, '_')}.txt`);
    }
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
                <div className="chip-top-row">
                  <div className={`type-chip-icon ${cat.colorClass}`}>
                    <IconComp size={22} />
                  </div>
                  <span className="chip-upload-btn">
                    <Plus size={13} /> Quick Upload
                  </span>
                </div>
                <div className="chip-body">
                  <span className="type-chip-name">{cat.name}</span>
                  <span className="type-chip-examples">{cat.examples}</span>
                </div>
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
          {[
            { id: 'All', label: 'All', icon: Layers },
            { id: 'ID Proof', label: 'Identity Proofs', icon: UserCheck },
            { id: 'Certificate', label: 'Certificates', icon: GraduationCap },
            { id: 'Policy', label: 'Policies', icon: FolderOpen },
            { id: 'Public', label: 'Public', icon: Globe },
            { id: 'Private', label: 'Private', icon: Lock }
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                className={`tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(tab.id)}
              >
                <IconComp size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
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
          {filteredDocs.map((doc, index) => {
            const catObj = SUPPORTED_CATEGORIES.find(c => c.id === doc.documentType) || {
              colorClass: 'other',
              icon: FileText
            };
            const IconComponent = catObj.icon || FileText;
            const hasImage = isImageDoc(doc);
            const docUrl = getDocUrl(doc);

            return (
              <motion.div 
                key={doc._id ? `${doc._id}-${index}` : index}
                className="document-item-card"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                {/* Image Thumbnail Container or Category Header Bar */}
                {hasImage && docUrl ? (
                  <div className="doc-card-image-preview" onClick={() => handleViewDoc(doc)}>
                    <img 
                      src={docUrl} 
                      alt={doc.title} 
                      onError={(e) => { e.target.parentElement.style.display = 'none'; }} 
                    />
                    <div className="doc-image-overlay">
                      <Eye size={22} />
                      <span>Preview Image</span>
                    </div>
                    <span className="doc-img-badge">IMAGE</span>
                  </div>
                ) : (
                  <div className="doc-card-header-compact">
                    <div className={`doc-icon-wrapper ${catObj.colorClass}`}>
                      <IconComponent size={24} />
                    </div>
                    <span className={`doc-type-badge ${catObj.colorClass}`}>{doc.documentType}</span>
                  </div>
                )}

                {/* Card Main Body */}
                <div className="doc-card-body">
                  <div className="doc-info-main">
                    <h4 className="doc-title-text" title={doc.title}>{doc.title}</h4>

                    <div className="doc-meta-row">
                      <span className="doc-date-pill">
                        <Calendar size={13} color="#818cf8" /> {formatDate(doc.createdAt)}
                      </span>
                      {doc.owner && (
                        <span className="doc-owner-pill">
                          <ShieldCheck size={13} color="#60a5fa" /> {doc.owner.fullName || 'Employee'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Separate View, Download, and Delete Actions */}
                <div className="doc-actions-footer">
                  <button 
                    type="button"
                    onClick={() => handleViewDoc(doc)}
                    className="btn-card-action btn-view-action"
                    title="View Document"
                  >
                    <Eye size={15} /> View
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="btn-card-action btn-download-action"
                    title="Download File to Device"
                  >
                    <Download size={15} /> Download
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleDelete(doc._id || doc.id)}
                    className="btn-card-action btn-delete-action"
                    title="Delete Document"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
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
            <label style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem', display: 'block' }}>Document Title / Folder Name</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              placeholder="e.g. Degree Certificate, HSC Marksheet, Relieving Letter, ID Proof" 
            />
          </div>

          {/* Custom Drag & Drop / File Dropzone */}
          <div className="form-group">
            <label style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem', display: 'block' }}>
              Choose or Drag File Attachment
            </label>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileProcess(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => document.getElementById('vault-file-input').click()}
              style={{
                border: isDragging ? '2px dashed #3b82f6' : '2px dashed rgba(59, 130, 246, 0.35)',
                background: isDragging ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.7)',
                borderRadius: '14px',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <input 
                id="vault-file-input"
                type="file" 
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }} 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx"
              />

              {isCompressing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="loader" style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <span style={{ color: '#60a5fa', fontSize: '0.875rem', fontWeight: 600 }}>
                    Processing file attachment...
                  </span>
                </div>
              ) : compressionInfo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.875rem' }}>
                      {compressionInfo.originalName} ({formatBytes(compressionInfo.compressedSize || compressionInfo.originalSize)})
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'underline', marginTop: '0.1rem' }}>
                    Click or drop another file to replace
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={32} color="#60a5fa" style={{ marginBottom: '0.2rem' }} />
                  <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem' }}>
                    Click to Choose File or Drag & Drop Here
                  </span>
                  <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                    Supported formats: PDF, JPG, PNG, DOCX, XLSX
                  </span>
                </div>
              )}
            </div>
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
            <button type="submit" className="btn-primary-glow" disabled={uploading || isCompressing}>
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
                  <span>{formatDate(selectedViewDoc.createdAt)}</span>
                  <span>•</span>
                  <span>Owner: {selectedViewDoc.owner?.fullName || 'Employee'}</span>
                </div>
              </div>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldCheck size={14} color="#34d399" /> Verified Document
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
