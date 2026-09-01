import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import { FolderOpen, Search, Download, Trash2, Globe } from 'lucide-react';
import './Payroll.css';

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/documents/${docId}`);
        fetchDocuments();
      } catch (err) {
        console.error('Failed to delete document', err);
        alert('Failed to delete document');
      }
    }
  };

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    return documents.filter(d => 
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.documentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.owner?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  const columns = [
    { header: 'Title', accessor: 'title', render: (row) => <span style={{ fontWeight: 600 }}>{row.title}</span> },
    { header: 'Type', accessor: 'documentType', render: (row) => <span style={{ color: 'var(--text-muted)' }}>{row.documentType}</span> },
    { header: 'Owner', accessor: 'owner', render: (row) => (
      <div>
        {row.isPublic ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)' }}>
            <Globe size={14} /> Public
          </span>
        ) : (
          <span style={{ fontWeight: 500 }}>{row.owner?.fullName || 'Unknown'}</span>
        )}
      </div>
    )},
    { header: 'Uploaded', accessor: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { header: 'Actions', accessor: 'actions', render: (row) => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <a href={`http://localhost:5000/${row.fileUrl}`} target="_blank" rel="noreferrer" className="icon-btn-subtle" title="Download">
          <Download size={16} />
        </a>
        <button className="icon-btn-subtle" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(row._id)} title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    )}
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Documents...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Document Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>View and manage all employee uploads and company policies.</p>
        </div>
      </div>

      <Card style={{ padding: 0 }} className="premium-card">
        <div className="payslip-filters">
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="filter-input" 
              placeholder="Search documents by title, type, or owner..." 
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {!filteredDocs || filteredDocs.length === 0 ? (
          <div className="empty-state-premium" style={{ margin: '2rem' }}>
            <FolderOpen size={64} className="icon" />
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No Documents Found</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
              There are no documents matching your search criteria.
            </p>
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            <DataTable columns={columns} data={filteredDocs} searchable={false} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDocuments;
