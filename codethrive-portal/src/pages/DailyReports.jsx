import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Send, CheckCircle2, Clock, 
  PlusCircle, Search, Calendar, Star, 
  Sparkles, RefreshCw, MessageSquare, 
  ArrowUpRight, Grid, List, Award, Eye, ShieldCheck, Activity, Download,
  UploadCloud, FolderArchive, FileCode, X, Check, Paperclip,
  Zap, Loader2, Briefcase, ChevronUp, ChevronDown
} from 'lucide-react';
import { zipSync } from 'fflate';
import { formatDate } from '../utils/dateUtils';
import DateInput from '../components/common/DateInput';
import './DailyReports.css';

const DEMO_REPORTS = [];


const DailyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // View state: 'grid' | 'table' | 'timeline'
  const [viewMode, setViewMode] = useState('grid');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('All'); // 'All' | 'Submitted' | 'Reviewed'

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dedicated SRC Document Modal State (Separate Feature)
  const [isSrcModalOpen, setIsSrcModalOpen] = useState(false);
  const [srcSelectedFile, setSrcSelectedFile] = useState(null);
  const [srcCompressionInfo, setSrcCompressionInfo] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSrcSubmitting, setIsSrcSubmitting] = useState(false);
  const srcFileInputRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(() => 
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const initialSrcFormState = {
    projectTitle: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8,
    workSummary: '',
    progressStatus: 'Completed'
  };
  const [srcFormData, setSrcFormData] = useState(initialSrcFormState);

  const resetSrcModal = () => {
    setSrcFormData(initialSrcFormState);
    setSrcSelectedFile(null);
    setSrcCompressionInfo(null);
    setIsCompressing(false);
    setIsDragOver(false);
    if (srcFileInputRef.current) srcFileInputRef.current.value = '';
  };

  // Auto-compress large files (PDF, Word, Code) using fflate silently in background if size is high (> 1.5MB)
  const handleProcessSrcFile = async (file) => {
    if (!file) return;

    const fileName = file.name;
    const isAlreadyArchive = /\.(zip|rar|7z|tar|gz)$/i.test(fileName);
    const COMPRESSION_THRESHOLD = 1.5 * 1024 * 1024; // 1.5 MB

    if (file.size > COMPRESSION_THRESHOLD && !isAlreadyArchive) {
      try {
        setIsCompressing(true);
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        // Compress file into standard ZIP container
        const zipped = zipSync({ [fileName]: uint8 }, { level: 6 });
        const compressedBlob = new Blob([zipped], { type: 'application/zip' });

        const baseName = fileName.replace(/\.[^/.]+$/, '');
        const zipFileName = `${baseName}.zip`;
        const compressedFile = new File([compressedBlob], zipFileName, { type: 'application/zip' });

        setSrcSelectedFile(compressedFile);
      } catch (err) {
        console.warn('Auto compression fallback, using original file:', err);
        setSrcSelectedFile(file);
      } finally {
        setIsCompressing(false);
      }
    } else {
      setSrcSelectedFile(file);
    }
  };

  // Optional file upload inside standard daily log
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Clean form state without workLocation & tomorrowsPlan; Tasks Worked On is 2nd field
  const initialFormState = {
    projectTitle: '',
    tasksWorked: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8,
    workSummary: '',
    issuesFaced: 'None',
    progressStatus: 'Completed',
    productivityRating: 5
  };

  const [formData, setFormData] = useState(initialFormState);



  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/daily-reports/my-reports');
      const fetched = res.data?.data || [];

      if (fetched.length > 0) {
        setReports(fetched);
        setUsingDemoData(false);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.warn('Backend API offline or empty, initializing daily reports workspace', err);
      setReports([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
  };

  const loadDemoReports = () => {
    setReports(DEMO_REPORTS);
    setUsingDemoData(true);
  };

  const clearDemoReports = () => {
    setUsingDemoData(false);
    fetchReports();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const isAlreadyArchive = /\.(zip|rar|7z|tar|gz)$/i.test(fileName);
    const COMPRESSION_THRESHOLD = 1.5 * 1024 * 1024; // 1.5 MB

    if (file.size > COMPRESSION_THRESHOLD && !isAlreadyArchive) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const zipped = zipSync({ [fileName]: uint8 }, { level: 6 });
        const compressedBlob = new Blob([zipped], { type: 'application/zip' });

        const baseName = fileName.replace(/\.[^/.]+$/, '');
        const zipFileName = `${baseName}.zip`;
        const compressedFile = new File([compressedBlob], zipFileName, { type: 'application/zip' });

        setSelectedFile(compressedFile);
      } catch (err) {
        console.warn('Auto compression fallback, using original file:', err);
        setSelectedFile(file);
      }
    } else {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fileSizeStr = selectedFile 
      ? (selectedFile.size < 1024 * 1024 
          ? `${(selectedFile.size / 1024).toFixed(1)} KB` 
          : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`)
      : null;

    if (usingDemoData) {
      const newReport = {
        _id: 'rep-local-' + Date.now(),
        ...formData,
        tasksWorked: formData.tasksWorked || formData.projectTitle || 'Project Deliverables',
        srcFileName: selectedFile ? selectedFile.name : null,
        srcFileSize: fileSizeStr,
        srcFileUrl: selectedFile ? URL.createObjectURL(selectedFile) : null,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
        teamLeadComments: null
      };
      setReports([newReport, ...reports]);
      setIsSubmitModalOpen(false);
      resetForm();
      setIsSubmitting(false);
      return;
    }

    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && key !== 'tasksWorked') payload.append(key, formData[key]);
    });
    payload.append('tasksWorked', formData.tasksWorked || formData.projectTitle || 'Project Deliverables');

    if (selectedFile) {
      payload.append('srcFile', selectedFile);
      payload.append('srcFileName', selectedFile.name);
      payload.append('srcFileSize', fileSizeStr);
    }

    try {
      const res = await api.post('/daily-reports', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setReports([res.data.data, ...reports]);
      } else {
        const fallbackRep = {
          _id: 'rep-' + Date.now(),
          ...formData,
          srcFileName: selectedFile ? selectedFile.name : null,
          srcFileSize: fileSizeStr,
          srcFileUrl: selectedFile ? URL.createObjectURL(selectedFile) : null,
          status: 'Submitted',
          createdAt: new Date().toISOString()
        };
        setReports([fallbackRep, ...reports]);
      }
      setIsSubmitModalOpen(false);
      resetForm();
    } catch (err) {
      console.warn('API error, saving report locally:', err);
      const fallbackRep = {
        _id: 'rep-' + Date.now(),
        ...formData,
        srcFileName: selectedFile ? selectedFile.name : null,
        srcFileSize: fileSizeStr,
        srcFileUrl: selectedFile ? URL.createObjectURL(selectedFile) : null,
        status: 'Submitted',
        createdAt: new Date().toISOString()
      };
      setReports([fallbackRep, ...reports]);
      setIsSubmitModalOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSubmitSrcDocument = async (e) => {
    e.preventDefault();
    if (!srcSelectedFile) {
      alert('Please select or upload a document or code archive file.');
      return;
    }
    setIsSrcSubmitting(true);

    const fileSizeStr = srcSelectedFile.size < 1024 * 1024 
      ? `${(srcSelectedFile.size / 1024).toFixed(1)} KB` 
      : `${(srcSelectedFile.size / (1024 * 1024)).toFixed(2)} MB`;

    const deliverableSummary = srcFormData.workSummary || 
      (srcFormData.projectTitle ? `Project Deliverable: ${srcFormData.projectTitle}` : `Submitted Project Deliverable: ${srcSelectedFile.name}`);

    const payload = new FormData();
    payload.append('projectTitle', srcFormData.projectTitle || 'Project Deliverable');
    payload.append('tasksWorked', srcFormData.projectTitle || 'Project Documentation & Code');
    payload.append('date', srcFormData.date);
    payload.append('hoursWorked', srcFormData.hoursWorked || 8);
    payload.append('workSummary', deliverableSummary);
    payload.append('progressStatus', srcFormData.progressStatus || 'Completed');
    payload.append('issuesFaced', 'None');
    payload.append('srcFile', srcSelectedFile);
    payload.append('srcFileName', srcSelectedFile.name);
    payload.append('srcFileSize', fileSizeStr);

    try {
      const res = await api.post('/daily-reports', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setReports([res.data.data, ...reports]);
      } else {
        const fallbackRep = {
          _id: 'src-' + Date.now(),
          ...srcFormData,
          workSummary: deliverableSummary,
          tasksWorked: srcFormData.projectTitle || 'Project Documentation & Code',
          srcFileName: srcSelectedFile.name,
          srcFileSize: fileSizeStr,
          srcFileUrl: URL.createObjectURL(srcSelectedFile),
          status: 'Submitted',
          createdAt: new Date().toISOString()
        };
        setReports([fallbackRep, ...reports]);
      }
      setIsSrcModalOpen(false);
      resetSrcModal();
      alert('✅ Project document/code archive submitted successfully to Admin!');
    } catch (err) {
      console.warn('API error, saving report locally:', err);
      const fallbackRep = {
        _id: 'src-' + Date.now(),
        ...srcFormData,
        workSummary: deliverableSummary,
        tasksWorked: srcFormData.projectTitle || 'Project Documentation & Code',
        srcFileName: srcSelectedFile.name,
        srcFileSize: fileSizeStr,
        srcFileUrl: URL.createObjectURL(srcSelectedFile),
        status: 'Submitted',
        createdAt: new Date().toISOString()
      };
      setReports([fallbackRep, ...reports]);
      setIsSrcModalOpen(false);
      resetSrcModal();
      alert('✅ Project document/code archive submitted successfully!');
    } finally {
      setIsSrcSubmitting(false);
    }
  };

  const safeReports = Array.isArray(reports) ? reports : [];

  const filteredReports = safeReports.filter(rep => {
    const summary = rep?.workSummary || '';
    const project = rep?.projectTitle || '';
    const tasks = rep?.tasksWorked || '';
    const dateStr = rep?.date ? formatDate(rep.date) : '';

    const matchesSearch = summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tasks.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dateStr.includes(searchQuery);

    const matchesTab = activeFilterTab === 'All' 
      ? true 
      : activeFilterTab === 'SRC' 
        ? Boolean(rep?.srcFileUrl || rep?.srcFileName) 
        : (rep?.status === activeFilterTab || rep?.progressStatus === activeFilterTab);

    return matchesSearch && matchesTab;
  });

  // Calculate Metrics
  const totalReportsCount = safeReports.length;
  const totalHoursLogged = safeReports.reduce((acc, r) => acc + (parseFloat(r.hoursWorked) || 0), 0);
  const srcFilesCount = safeReports.filter(r => r.srcFileUrl || r.srcFileName).length;
  const reviewedCount = safeReports.filter(r => r.status === 'Reviewed' || r.status === 'Approved').length;
  const pendingReviewCount = safeReports.filter(r => r.status === 'Submitted' || r.progressStatus === 'Pending').length;
  const activeProjectsCount = new Set(safeReports.map(r => (r.projectTitle || '').trim()).filter(Boolean)).size;
  const avgRating = totalReportsCount > 0 
    ? (safeReports.reduce((acc, r) => acc + (parseInt(r.productivityRating) || 5), 0) / totalReportsCount).toFixed(1) 
    : '5.0';

  // Check today's submission status
  const todayStr = new Date().toDateString();
  const todayReport = safeReports.find(r => r.date && new Date(r.date).toDateString() === todayStr);

  const currentDateDisplay = formatDate(new Date());

  if (loading) return (
    <div className="reports-loader-screen">
      <div className="loader-ring-pulse"></div>
      <p>Initializing Project Reports Workspace...</p>
    </div>
  );

  return (
    <motion.div 
      className="executive-reports-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* --------------------------------------------------------------------------
          1. HERO & WORKSPACE HEADER
         -------------------------------------------------------------------------- */}
      <div className="reports-hero-banner">
        <div className="hero-left-content">
          <h1 className="hero-main-title">Project Reports</h1>
          <p className="hero-subtext">
            Log project progress, daily task activities, work summaries, hours, and submit SRC project deliverables directly to administration.
          </p>
          <div className="hero-date-strip">
            <Calendar size={14} />
            <span>{currentDateDisplay}</span>
            <span className="dot-divider">•</span>
            {todayReport ? (
              <span className="today-logged-tag success">
                <CheckCircle2 size={13} /> Today's Report Submitted ({todayReport.hoursWorked} hrs)
              </span>
            ) : (
              <span className="today-logged-tag warning">
                <Clock size={13} /> Today's Report Pending
              </span>
            )}
          </div>
        </div>

        <div className="hero-right-actions">
          {/* Standard Project Report Submission Button */}
          <button 
            className="btn-primary-glow"
            onClick={() => { resetForm(); setIsSubmitModalOpen(true); }}
          >
            <PlusCircle size={19} />
            <span>{todayReport ? "Update Today's Report" : "+ Submit Project Report"}</span>
          </button>
        </div>
      </div>


      {/* --------------------------------------------------------------------------
          2. METRIC CARDS OVERVIEW (4 INTERACTIVE CARDS)
         -------------------------------------------------------------------------- */}
      <div className="reports-metrics-grid">
        <div 
          className={`metric-card-exec ${activeFilterTab === 'All' ? 'active-filter' : ''}`}
          onClick={() => setActiveFilterTab('All')}
          title="Click to view all project reports"
        >
          <div className="metric-icon-box blue">
            <FileText size={22} />
          </div>
          <div className="metric-info-body">
            <span className="metric-label">Total Reports</span>
            <div className="metric-value-row">
              <span className="metric-value">{totalReportsCount}</span>
              <span className="metric-unit">submitted</span>
            </div>
            <span className="metric-footer-text">All project submissions</span>
          </div>
        </div>

        <div 
          className={`metric-card-exec ${activeFilterTab === 'Submitted' ? 'active-filter' : ''}`}
          onClick={() => setActiveFilterTab('Submitted')}
          title="Click to view reports pending review"
        >
          <div className="metric-icon-box amber">
            <Clock size={22} color="#fbbf24" />
          </div>
          <div className="metric-info-body">
            <span className="metric-label">Pending Review</span>
            <div className="metric-value-row">
              <span className="metric-value">{pendingReviewCount}</span>
              <span className="metric-unit">pending</span>
            </div>
            <span className="metric-footer-text">Awaiting manager review</span>
          </div>
        </div>

        <div 
          className={`metric-card-exec ${activeFilterTab === 'Reviewed' ? 'active-filter' : ''}`}
          onClick={() => setActiveFilterTab('Reviewed')}
          title="Click to view approved reports"
        >
          <div className="metric-icon-box emerald">
            <ShieldCheck size={22} color="#34d399" />
          </div>
          <div className="metric-info-body">
            <span className="metric-label">Approved Reports</span>
            <div className="metric-value-row">
              <span className="metric-value">{reviewedCount}</span>
              <span className="metric-unit">verified</span>
            </div>
            <span className="metric-footer-text">Management approved</span>
          </div>
        </div>

        <div 
          className="metric-card-exec"
          title="Total distinct projects reported"
        >
          <div className="metric-icon-box purple">
            <Briefcase size={22} color="#c084fc" />
          </div>
          <div className="metric-info-body">
            <span className="metric-label">Active Projects</span>
            <div className="metric-value-row">
              <span className="metric-value">{activeProjectsCount}</span>
              <span className="metric-unit">projects</span>
            </div>
            <span className="metric-footer-text">Distinct project assignments</span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          3. WORKSPACE CONTROL TOOLBAR (SEARCH + FILTER TABS + VIEW TOGGLE)
         -------------------------------------------------------------------------- */}
      <div className="reports-toolbar-card">
        {/* Search Field */}
        <div className="reports-search-box">
          <Search size={17} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search reports by project title, tasks, status, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Filter Status Tabs */}
        <div className="reports-filter-tabs">
          <button 
            className={`tab-btn-pill ${activeFilterTab === 'All' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('All')}
          >
            All Reports ({totalReportsCount})
          </button>
          <button 
            className={`tab-btn-pill ${activeFilterTab === 'SRC' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('SRC')}
            style={activeFilterTab === 'SRC' ? { borderColor: '#c084fc', color: '#e9d5ff', background: 'rgba(147, 51, 234, 0.25)' } : {}}
          >
            <FolderArchive size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            SRC Deliverables ({srcFilesCount})
          </button>
          <button 
            className={`tab-btn-pill ${activeFilterTab === 'Submitted' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('Submitted')}
          >
            Pending Review ({pendingReviewCount})
          </button>
          <button 
            className={`tab-btn-pill ${activeFilterTab === 'Reviewed' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('Reviewed')}
          >
            Reviewed ({reviewedCount})
          </button>
        </div>

        {/* Dedicated Submit SRC Deliverable Action */}
        <button 
          type="button"
          className="toolbar-src-btn"
          onClick={() => { resetSrcModal(); setIsSrcModalOpen(true); }}
          title="Submit Project Source Code & Documentation Archive"
        >
          <FolderArchive size={16} />
          <span>Submit SRC</span>
        </button>
      </div>


      {/* --------------------------------------------------------------------------
          4. CONTENT DISPLAY
         -------------------------------------------------------------------------- */}
      {safeReports.length === 0 ? (
        <div className="reports-empty-state">
          <div className="empty-icon-glow">
            <FileText size={42} />
          </div>
          <h2>No Project Reports Found</h2>
          <p>
            You haven't submitted any project reports yet. Submit your project deliverables, working hours, work summary, and process status.
          </p>
          <div className="empty-actions-row">
            <button 
              onClick={() => { resetForm(); setIsSubmitModalOpen(true); }}
              className="btn-primary-glow"
            >
              <PlusCircle size={18} /> + Submit Project Report
            </button>

            <button 
              onClick={() => { resetSrcModal(); setIsSrcModalOpen(true); }}
              className="toolbar-src-btn"
              style={{ padding: '0.75rem 1.4rem' }}
            >
              <FolderArchive size={16} /> Submit SRC Deliverable
            </button>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="reports-empty-state">
          <p>No reports matched your search parameters.</p>
          <button onClick={() => { setSearchQuery(''); setActiveFilterTab('All'); }} className="btn-outline-glass">
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* VIEW 1: EXECUTIVE CARDS VIEW */}
          {viewMode === 'grid' && (
            <motion.div className="reports-cards-grid" layout>
              <AnimatePresence>
                {filteredReports.map(rep => {
                  const repDateStr = rep.date 
                    ? formatDate(rep.date)
                    : 'Today';

                  return (
                    <motion.div 
                      key={rep._id}
                      className="worklog-card-pro"
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.25 }}
                    >
                      {/* Top Card Header */}
                      <div className="card-top-row">
                        <div className="date-badge-box">
                          <Calendar size={14} className="cal-icon" />
                          <span className="date-text">{repDateStr}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <StatusBadge status={rep.progressStatus || 'Completed'} />
                          <StatusBadge status={rep.status || 'Submitted'} />
                        </div>
                      </div>

                      {/* Project Title Header */}
                      {rep.projectTitle && (
                        <div style={{ margin: '0.2rem 0' }}>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>
                            PROJECT TITLE:
                          </span>
                          <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem', color: '#60a5fa', fontWeight: 700 }}>
                            {rep.projectTitle}
                          </h4>
                        </div>
                      )}

                      {/* Meta Tags Row */}
                      <div className="card-meta-tags">
                        <span className="tag-pill hours">
                          <Clock size={12} /> {rep.hoursWorked || 8} working hrs
                        </span>
                        {rep.progressStatus && (
                          <span className="tag-pill shift">
                            Process: {rep.progressStatus}
                          </span>
                        )}
                      </div>

                      {/* Tasks Worked */}
                      {rep.tasksWorked && (
                        <div className="task-codes-row">
                          <span className="task-label">Tasks Worked On:</span>
                          {rep.tasksWorked.split(',').map((taskCode, i) => (
                            <span key={i} className="task-code-pill">{taskCode.trim()}</span>
                          ))}
                        </div>
                      )}

                      {/* Work Summary Main Paragraph */}
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                          Work Summary:
                        </span>
                        <p className="work-summary-body">
                          {rep.workSummary}
                        </p>
                      </div>

                      {/* SRC File Attachment Badge */}
                      {(rep.srcFileName || rep.srcFileUrl) && (
                        <div className="card-src-attachment-badge">
                          <FolderArchive size={14} color="#c084fc" />
                          <span className="src-name-truncate">{rep.srcFileName || 'Source Archive'}</span>
                          {rep.srcFileSize && <span style={{ opacity: 0.75, fontSize: '0.72rem' }}>({rep.srcFileSize})</span>}
                          <a 
                            href={rep.srcFileUrl?.startsWith('http') ? rep.srcFileUrl : `http://localhost:5000${rep.srcFileUrl}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="src-quick-dl"
                            title="Download SRC File"
                            download={rep.srcFileName || 'source_code.zip'}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      )}

                      {/* Issues & Blockers */}
                      {rep.issuesFaced && rep.issuesFaced !== 'None' && (
                        <div className="doc-section-box blocker" style={{ padding: '0.65rem 0.85rem', margin: '0' }}>
                          <span className="doc-section-title red" style={{ fontSize: '0.7rem' }}>
                            Issues / Blockers:
                          </span>
                          <p className="doc-summary-text" style={{ fontSize: '0.825rem' }}>
                            {rep.issuesFaced}
                          </p>
                        </div>
                      )}


                      {/* Manager Review Callout Banner */}
                      {rep.teamLeadComments && (
                        <div className="manager-feedback-banner">
                          <div className="banner-title">
                            <MessageSquare size={13} /> Manager Feedback & Notes
                          </div>
                          <p className="banner-text">{rep.teamLeadComments}</p>
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="card-footer-row">
                        <div className="stars-rating-wrap">
                          {[...Array(rep.productivityRating || 5)].map((_, idx) => (
                            <Star key={idx} size={13} fill="#fbbf24" color="#fbbf24" />
                          ))}
                        </div>

                        <button 
                          className="btn-view-doc"
                          onClick={() => { setSelectedReport(rep); setIsViewModalOpen(true); }}
                        >
                          <span>Full Details</span>
                          <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* VIEW 2: DATA TABLE VIEW */}
          {viewMode === 'table' && (
            <motion.div 
              className="reports-table-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <table className="reports-data-table">
                <thead>
                  <tr>
                    <th>Project Title</th>
                    <th>Tasks Worked On</th>
                    <th>Submitting Date</th>
                    <th>Working Hours</th>
                    <th>Work Summary</th>
                    <th>Issues / Blockers</th>
                    <th>Process Status</th>
                    <th>SRC File</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(rep => {
                    const repDateStr = rep.date 
                      ? formatDate(rep.date)
                      : 'Today';

                    return (
                      <tr key={rep._id}>
                        <td>
                          <span style={{ fontWeight: '700', color: '#60a5fa' }}>
                            {rep.projectTitle || 'General Project'}
                          </span>
                        </td>
                        <td>
                          <div className="table-tasks-cell">
                            {rep.tasksWorked ? (
                              rep.tasksWorked.split(',').map((t, idx) => (
                                <span key={idx} className="t-task-badge">{t.trim()}</span>
                              ))
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>N/A</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="t-date">{repDateStr}</span>
                        </td>
                        <td>
                          <span className="t-hours-badge">{rep.hoursWorked || 8} hrs</span>
                        </td>
                        <td className="table-summary-cell">
                          <p className="t-summary-text">{rep.workSummary}</p>
                        </td>
                        <td>
                          <span style={{ color: rep.issuesFaced && rep.issuesFaced !== 'None' ? '#f87171' : '#94a3b8', fontSize: '0.85rem' }}>
                            {rep.issuesFaced || 'None'}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={rep.progressStatus || 'Completed'} />
                        </td>
                        <td>
                          {(rep.srcFileName || rep.srcFileUrl) ? (
                            <a 
                              href={rep.srcFileUrl?.startsWith('http') ? rep.srcFileUrl : `http://localhost:5000${rep.srcFileUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              download={rep.srcFileName || 'source_code.zip'}
                              className="card-src-attachment-badge"
                              style={{ margin: 0, textDecoration: 'none', padding: '0.25rem 0.5rem' }}
                              title="Download SRC File"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FolderArchive size={13} color="#c084fc" />
                              <span className="src-name-truncate" style={{ maxWidth: '85px' }}>{rep.srcFileName || 'SRC'}</span>
                              <Download size={12} />
                            </a>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>-</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="t-action-btn"
                            onClick={() => { setSelectedReport(rep); setIsViewModalOpen(true); }}
                            title="View Document"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </motion.div>
          )}

          {/* VIEW 3: ACTIVITY TIMELINE VIEW */}
          {viewMode === 'timeline' && (
            <motion.div 
              className="reports-timeline-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="timeline-connector-line"></div>
              {filteredReports.map((rep, idx) => {
                const d = rep.date ? new Date(rep.date) : new Date();
                const dayNum = d.getDate();
                const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                const weekDay = d.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <motion.div 
                    key={rep._id}
                    className="timeline-item-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="timeline-date-node">
                      <span className="node-day-num">{dayNum}</span>
                      <span className="node-month-name">{monthName}</span>
                      <span className="node-weekday-name">{weekDay}</span>
                    </div>

                    <div className="timeline-card-wrapper">
                      <div className="timeline-card-header">
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', color: '#60a5fa' }}>{rep.projectTitle || 'Project'}</span>
                          <span className="tag-pill hours">{rep.hoursWorked} hrs</span>
                        </div>
                        <StatusBadge status={rep.progressStatus || rep.status} />
                      </div>

                      <p className="timeline-card-body">{rep.workSummary}</p>

                      <div className="timeline-card-footer">
                        {rep.tasksWorked && (
                          <span style={{ color: '#c084fc', fontSize: '0.8rem', fontWeight: 600 }}>Tasks: {rep.tasksWorked}</span>
                        )}
                        <button 
                          className="btn-view-doc"
                          onClick={() => { setSelectedReport(rep); setIsViewModalOpen(true); }}
                        >
                          Details <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}

      {/* --------------------------------------------------------------------------
          5. SUBMIT / LOG WORK FORM MODAL (Updated order: 1. Project Title, 2. Tasks Worked On, 3. Date, 4. Hours, 5. Summary, 6. Issues, 7. Process Status)
         -------------------------------------------------------------------------- */}
      <Modal 
        isOpen={isSubmitModalOpen} 
        onClose={() => { setIsSubmitModalOpen(false); resetForm(); }}
        title="Submit Project Report"
      >
        <form onSubmit={handleSubmitReport} className="exec-modal-form">
          {/* 1st Field: Project Title */}
          <div className="form-group-pro">
            <label className="form-label-pro">1. Project Title *</label>
            <input 
              type="text" 
              className="input-field-pro" 
              placeholder=""
              value={formData.projectTitle}
              onChange={e => setFormData({...formData, projectTitle: e.target.value})}
              required
            />
          </div>

          {/* 2nd Field: Submitting Date & 3rd Field: Working Hours */}
          <div className="form-row-2col">
            <div className="form-group-pro">
              <label className="form-label-pro">2. Submitting Date *</label>
              <DateInput 
                className="input-field-pro" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div className="form-group-pro">
              <label className="form-label-pro">3. Working Hours *</label>
              <div className="hours-stepper-wrapper">
                <input 
                  type="number" 
                  step="0.5" 
                  min="0.5" 
                  max="24"
                  className="input-field-pro hours-input" 
                  placeholder=""
                  value={formData.hoursWorked}
                  onChange={e => setFormData({...formData, hoursWorked: parseFloat(e.target.value) || 0})}
                  required
                />
                <div className="hours-controls-group">
                  <div className="stepper-buttons">
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={() => setFormData(prev => ({...prev, hoursWorked: Math.min(24, ((parseFloat(prev.hoursWorked) || 0) + 0.5))}))}
                      title="Increase hours (+0.5h)"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={() => setFormData(prev => ({...prev, hoursWorked: Math.max(0.5, ((parseFloat(prev.hoursWorked) || 0) - 0.5))}))}
                      title="Decrease hours (-0.5h)"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>
                  <span className="input-unit-tag-inline">hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4th Field: Work Summary */}
          <div className="form-group-pro">
            <label className="form-label-pro">4. Work Summary & Accomplishments *</label>
            <textarea 
              className="input-field-pro" 
              rows="3"
              placeholder="Describe key features built, code committed, meetings attended, or work accomplished..."
              value={formData.workSummary}
              onChange={e => setFormData({...formData, workSummary: e.target.value})}
              required
            ></textarea>
          </div>

          {/* 5th Field: Issues / Blockers */}
          <div className="form-group-pro">
            <label className="form-label-pro">5. Issues / Blockers (If Any)</label>
            <textarea 
              className="input-field-pro" 
              rows="2"
              placeholder="State any technical blockers, API issues, or dependency delays (or enter 'None')..."
              value={formData.issuesFaced}
              onChange={e => setFormData({...formData, issuesFaced: e.target.value})}
            ></textarea>
          </div>

          {/* 6th Field: Work Process Status Dropdown */}
          <div className="form-group-pro">
            <label className="form-label-pro">6. Work Process Status *</label>
            <select 
              className="input-field-pro"
              value={formData.progressStatus || 'Completed'}
              onChange={e => setFormData({...formData, progressStatus: e.target.value})}
              required
            >
              <option value="Completed">✅ Completed</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Not Completed">❌ Not Completed</option>
              <option value="In Progress">🔄 In Progress</option>
            </select>
          </div>

          {/* 7th Field: Simple Clean File Upload */}
          <div className="form-group-pro">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label-pro" style={{ margin: 0 }}>
                7. Project File / Document (Optional)
              </label>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                ZIP, PDF, DOCX, Code files
              </span>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".zip,.rar,.7z,.tar,.gz,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.txt,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              id="src-file-input"
            />

            {!selectedFile ? (
              <div 
                className="simple-upload-bar"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="simple-upload-info">
                  <UploadCloud size={20} className="simple-upload-icon" />
                  <span className="simple-upload-text">Choose file or drag & drop</span>
                </div>
                <span className="simple-upload-btn-chip">Browse File</span>
              </div>
            ) : (
              <div className="simple-upload-file-ready">
                <div className="simple-upload-info">
                  <FolderArchive size={18} color="#c084fc" />
                  <span className="simple-upload-name">{selectedFile.name}</span>
                  <span className="simple-upload-size">
                    ({selectedFile.size < 1024 * 1024 
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB` 
                      : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="src-ready-badge"><Check size={12} /> Ready</span>
                  <button 
                    type="button" 
                    className="src-remove-btn" 
                    onClick={removeFile}
                    title="Remove selected file"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions-footer">
            <button 
              type="button" 
              className="btn-outline-glass" 
              onClick={() => { setIsSubmitModalOpen(false); resetForm(); }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary-glow" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Activity & Uploading...' : 'Submit Project Report'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------------------------
          6. VIEW REPORT DOCUMENT MODAL
         -------------------------------------------------------------------------- */}
      {selectedReport && (
        <Modal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)} 
          title={`Work Activity Brief • ${selectedReport.projectTitle || 'Project Brief'}`}
        >
          <div className="doc-view-content">
            <div className="doc-meta-strip">
              <StatusBadge status={selectedReport.progressStatus || 'Completed'} />
              <StatusBadge status={selectedReport.status || 'Submitted'} />
              <span className="doc-meta-item highlight"><Clock size={13} /> {selectedReport.hoursWorked} hrs logged</span>
            </div>

            {selectedReport.projectTitle && (
              <div className="doc-section-box">
                <span className="doc-section-title">Project Title</span>
                <p className="doc-summary-text" style={{ fontWeight: '700', color: '#60a5fa' }}>{selectedReport.projectTitle}</p>
              </div>
            )}

            {/* SRC File Download Box */}
            {(selectedReport.srcFileUrl || selectedReport.srcFileName) && (
              <div className="doc-section-box src-file-highlight-box">
                <div className="src-highlight-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderArchive size={18} color="#c084fc" />
                    <span className="doc-section-title" style={{ margin: 0, color: '#c084fc' }}>
                      Project Source Code (SRC) File
                    </span>
                  </div>
                  {selectedReport.srcFileSize && (
                    <span className="tag-pill" style={{ background: 'rgba(192, 132, 252, 0.15)', color: '#d8b4fe' }}>
                      {selectedReport.srcFileSize}
                    </span>
                  )}
                </div>

                <div className="src-highlight-body">
                  <div className="src-file-name-display">
                    <FileCode size={18} color="#60a5fa" />
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                      {selectedReport.srcFileName || 'project_source.zip'}
                    </span>
                  </div>

                  <a
                    href={selectedReport.srcFileUrl?.startsWith('http') 
                      ? selectedReport.srcFileUrl 
                      : `http://localhost:5000${selectedReport.srcFileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={selectedReport.srcFileName || 'source_code.zip'}
                    className="btn-download-src-glow"
                  >
                    <Download size={15} /> Download SRC File
                  </a>
                </div>
              </div>
            )}

            {selectedReport.tasksWorked && (
              <div className="doc-section-box">
                <span className="doc-section-title">Tasks Worked On</span>
                <div className="doc-task-pills">
                  {selectedReport.tasksWorked.split(',').map((t, idx) => (
                    <span key={idx} className="task-code-pill">{t.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="doc-section-box">
              <span className="doc-section-title">Accomplishments & Work Summary</span>
              <p className="doc-summary-text">{selectedReport.workSummary}</p>
            </div>

            <div className="doc-grid-2col">
              <div className="doc-mini-card">
                <span className="mini-card-title green"><CheckCircle2 size={13} /> Process Status</span>
                <p className="mini-card-desc">{selectedReport.progressStatus || 'Completed'}</p>
              </div>

              <div className="doc-mini-card">
                <span className="mini-card-title amber"><Clock size={13} /> Working Hours</span>
                <p className="mini-card-desc">{selectedReport.hoursWorked} Hours</p>
              </div>
            </div>

            {selectedReport.issuesFaced && (
              <div className="doc-section-box blocker">
                <span className="doc-section-title red">Blockers & Issues Faced</span>
                <p className="doc-summary-text">{selectedReport.issuesFaced}</p>
              </div>
            )}

            {selectedReport.teamLeadComments && (
              <div className="manager-feedback-banner">
                <div className="banner-title">
                  <MessageSquare size={13} /> Manager Feedback & Notes
                </div>
                <p className="banner-text">{selectedReport.teamLeadComments}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* --------------------------------------------------------------------------
          7. DEDICATED SEPARATE MODAL: SUBMIT PROJECT SRC DOCUMENTS / CODE DELIVERABLE
         -------------------------------------------------------------------------- */}
      <Modal 

        isOpen={isSrcModalOpen} 
        onClose={() => { setIsSrcModalOpen(false); resetSrcModal(); }}
        title="Submit Project SRC Documents / Code Archive"
      >
        <form onSubmit={handleSubmitSrcDocument} className="exec-modal-form">
          {/* 1. Project Title */}
          <div className="form-group-pro">
            <label className="form-label-pro">1. Project / Deliverable Name *</label>
            <input 
              type="text" 
              className="input-field-pro" 
              placeholder=""
              value={srcFormData.projectTitle}
              onChange={e => setSrcFormData({...srcFormData, projectTitle: e.target.value})}
              required
            />
          </div>

          {/* 2. Submitting Date & Submitting Time (Live) */}
          <div className="form-row-2col">
            <div className="form-group-pro">
              <label className="form-label-pro">2. Submitting Date *</label>
              <DateInput 
                className="input-field-pro" 
                value={srcFormData.date}
                onChange={e => setSrcFormData({...srcFormData, date: e.target.value})}
                required
              />
            </div>

            <div className="form-group-pro">
              <label className="form-label-pro">Submitting Time (Live)</label>
              <div className="live-time-wrapper">
                <input 
                  type="text" 
                  className="input-field-pro live-time-input" 
                  value={currentTime}
                  readOnly
                  title="Current live submission time"
                />
                <span className="live-pulse-badge">
                  <span className="live-dot"></span> LIVE
                </span>
              </div>
            </div>
          </div>

          {/* 3. Document / Code File Upload Zone (Clean Compact Bar) */}
          <div className="form-group-pro">
            <label className="form-label-pro">
              3. Upload Document / Code Archive (PDF, Word, ZIP, RAR, Code) *
            </label>

            <input 
              type="file" 
              ref={srcFileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleProcessSrcFile(f);
              }}
              accept=".pdf,.doc,.docx,.zip,.rar,.7z,.tar,.gz,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed"
              style={{ display: 'none' }}
              id="standalone-src-file-input"
            />

            {isCompressing ? (
              <div className="simple-upload-bar" style={{ opacity: 0.8, cursor: 'wait' }}>
                <div className="simple-upload-info">
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} color="#c084fc" />
                  <span className="simple-upload-text">Processing file...</span>
                </div>
              </div>
            ) : !srcSelectedFile ? (
              <div 
                className="simple-upload-bar"
                onClick={() => srcFileInputRef.current?.click()}
                style={{ borderColor: 'rgba(168, 85, 247, 0.35)' }}
              >
                <div className="simple-upload-info">
                  <UploadCloud size={20} className="simple-upload-icon" style={{ color: '#c084fc' }} />
                  <span className="simple-upload-text">Choose file (PDF, Word, ZIP, Code) or drag & drop</span>
                </div>
                <span className="simple-upload-btn-chip" style={{ background: 'rgba(147, 51, 234, 0.25)', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#e9d5ff' }}>Browse File</span>
              </div>
            ) : (
              <div className="simple-upload-file-ready" style={{ borderColor: '#a855f7' }}>
                <div className="simple-upload-info">
                  <FolderArchive size={18} color="#c084fc" />
                  <span className="simple-upload-name">{srcSelectedFile.name}</span>
                  <span className="simple-upload-size">
                    ({srcSelectedFile.size < 1024 * 1024 
                      ? `${(srcSelectedFile.size / 1024).toFixed(1)} KB` 
                      : `${(srcSelectedFile.size / (1024 * 1024)).toFixed(2)} MB`})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="src-ready-badge"><Check size={12} /> Ready</span>
                  <button 
                    type="button" 
                    className="src-remove-btn" 
                    onClick={() => {
                      setSrcSelectedFile(null);
                      if (srcFileInputRef.current) srcFileInputRef.current.value = '';
                    }}
                    title="Remove selected file"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions-footer">
            <button 
              type="button" 
              className="btn-outline-glass" 
              onClick={() => { setIsSrcModalOpen(false); resetSrcModal(); }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary-glow" 
              disabled={isSrcSubmitting || isCompressing}
              style={{ background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)', border: 'none' }}
            >
              {isSrcSubmitting ? 'Uploading to Admin...' : (isCompressing ? 'Compressing...' : 'Submit SRC Document')}
            </button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
};

export default DailyReports;

