import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  Download, FileText, Search, CreditCard, ChevronRight, 
  Calendar, CheckCircle2, DollarSign, TrendingUp, ShieldCheck, 
  Sparkles, RefreshCw, Eye, Landmark, ArrowUpRight, Award
} from 'lucide-react';
import { createOfficialCodeThriveDoc, exportOfficialWordDoc, getCorporateTableStyles } from '../utils/pdfLetterhead';
import { generatePsgStylePayslipPdf } from '../utils/psgPayslipPdf.js';
import { Printer } from 'lucide-react';
import DateInput from '../components/common/DateInput';
import DailyQuoteBanner from '../components/common/DailyQuoteBanner';
import './Payroll.css';

const DEMO_PAYSLIPS = [];


const Payroll = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Date confirmation modal state for employee payslip download
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadTargetPayslip, setDownloadTargetPayslip] = useState(null);
  const [confirmedMonth, setConfirmedMonth] = useState('');
  const [confirmedDate, setConfirmedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [employeeProfile, setEmployeeProfile] = useState(null);

  useEffect(() => {
    fetchPayslips();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/employees/me');
      let data = res.data?.data || res.data;
      try {
        const localSaved = localStorage.getItem('cti_profile_manual_data');
        if (localSaved) {
          data = { ...data, ...JSON.parse(localSaved) };
        }
      } catch {}
      setEmployeeProfile(data);
    } catch (err) {
      try {
        const localSaved = localStorage.getItem('cti_profile_manual_data');
        if (localSaved) setEmployeeProfile(JSON.parse(localSaved));
      } catch {}
    }
  };

  const isSeedPayslip = (p) => {
    if (p?.payslipId === 'PAY-2026-09-001' || p?.month === 'September 2026') return true;
    return false;
  };

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll/my-payslips');
      const fetched = (res.data?.data || []).filter(p => !isSeedPayslip(p));

      setPayslips(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.warn("Backend API payroll fetch error:", err);
      setPayslips([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPayslips();
  };

  const viewPayslip = (payslip) => {
    setSelectedPayslip(payslip);
    setIsModalOpen(true);
  };

  const initiateDownloadConfirm = (payslip) => {
    setDownloadTargetPayslip(payslip);
    setConfirmedMonth(payslip.month || 'October 2026');
    setConfirmedDate(new Date().toISOString().split('T')[0]);
    setDownloadModalOpen(true);
  };

  const downloadPayslip = async (payslip, overrideMonth, overrideDate) => {
    try {
      setIsDownloading(true);
      const targetMonth = overrideMonth || payslip.month || 'October 2026';
      const targetDate = overrideDate ? new Date(overrideDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

      const empName = user?.fullName || user?.name || payslip.employee?.fullName || 'Kirubakaran';
      const empId = user?.employeeId || payslip.employee?.employeeId || 'CTI-EMP-001';
      const empRole = user?.role || user?.designation || payslip.employee?.designation || 'Software Engineer';
      const empEmail = user?.email || payslip.employee?.email || `${empId.toLowerCase()}@codethrive.com`;

      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'OFFICIAL SALARY STATEMENT',
        userName: empName,
        reportType: 'Payslip',
        metaFields: [
          { label: 'Employee Name', value: empName },
          { label: 'Employee ID', value: empId },
          { label: 'Designation', value: empRole },
          { label: 'Pay Period', value: targetMonth },
          { label: 'Statement Date', value: targetDate },
          { label: 'Bank Name', value: payslip.employeeInfo?.bankName || payslip.employee?.bankName || employeeProfile?.bankName || 'Direct Transfer' },
          { label: 'Bank A/C No', value: payslip.employeeInfo?.bankAcNo || payslip.employee?.accountNumber || employeeProfile?.accountNumber || '-' },
          { label: 'IFSC Code', value: payslip.employeeInfo?.ifscCode || payslip.employee?.ifscCode || employeeProfile?.ifscCode || '-' },
          { label: 'Email ID', value: empEmail },
          { label: 'Payslip Number', value: payslip.payslipId || 'PAY-2026' },
          { label: 'Disbursement Status', value: payslip.status || 'Paid' }
        ]
      });

      const hra = payslip.allowanceDetails?.hra || 12000;
      const travel = payslip.allowanceDetails?.travel || 3500;
      const medical = payslip.allowanceDetails?.medical || 2500;
      const otherAllowance = payslip.allowanceDetails?.other || 2000;

      const pf = payslip.deductionDetails?.pf || 3200;
      const esi = payslip.deductionDetails?.esi || 0;
      const profTax = payslip.deductionDetails?.professionalTax || 200;
      const incomeTax = payslip.deductionDetails?.incomeTax || 2800;

      const salaryTableBody = [
        ['Basic Salary', `Rs. ${(payslip.basicSalary || 0).toLocaleString()}`, 'Provident Fund (PF)', `Rs. ${pf.toLocaleString()}`],
        ['House Rent Allowance (HRA)', `Rs. ${hra.toLocaleString()}`, 'Professional Tax', `Rs. ${profTax.toLocaleString()}`],
        ['Travel & Conveyance', `Rs. ${travel.toLocaleString()}`, 'Income Tax (TDS)', `Rs. ${incomeTax.toLocaleString()}`],
        ['Medical Allowance', `Rs. ${medical.toLocaleString()}`, 'ESI Deduction', `Rs. ${esi.toLocaleString()}`],
        ['Special Allowances', `Rs. ${otherAllowance.toLocaleString()}`, '', ''],
        [
          'GROSS EARNINGS', 
          `Rs. ${(payslip.grossSalary || 0).toLocaleString()}`, 
          'TOTAL DEDUCTIONS', 
          `Rs. ${(payslip.deductions || 0).toLocaleString()}`
        ]
      ];

      doc.autoTable({
        startY: startY,
        head: [['EARNINGS COMPONENT', 'AMOUNT (INR)', 'DEDUCTIONS COMPONENT', 'AMOUNT (INR)']],
        body: salaryTableBody,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
        columnStyles: {
          0: { width: 55 },
          1: { width: 38, halign: 'right' },
          2: { width: 55 },
          3: { width: 38, halign: 'right' }
        },
        didParseCell: function(data) {
          if (data.row.index === 5) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
        }
      });

      const finalY = doc.lastAutoTable.finalY + 8;

      // Net Salary Callout Box
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(12, finalY, 186, 16, 2.5, 2.5, 'FD');

      doc.setTextColor(6, 78, 59);
      doc.setFontSize(9.5);
      doc.setFont('times', 'bold');
      doc.text('NET SALARY PAYABLE:', 18, finalY + 10.5);

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.text(`Rs. ${(payslip.netPayable || 0).toLocaleString()}`, 192, finalY + 11, { align: 'right' });

      finalizeDoc();
      setDownloadModalOpen(false);
    } catch (err) {
      console.error('PDF Generation Failed', err);
      alert('Could not generate PDF: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadPayslipWord = (payslip) => {
    try {
      const empName = user?.fullName || user?.name || payslip.employee?.fullName || 'Kirubakaran';
      const empId = user?.employeeId || payslip.employee?.employeeId || 'CTI-EMP-001';
      const empRole = user?.role || user?.designation || payslip.employee?.designation || 'Software Engineer';
      const empEmail = user?.email || payslip.employee?.email || `${empId.toLowerCase()}@codethrive.com`;

      const hra = payslip.allowanceDetails?.hra || 12000;
      const travel = payslip.allowanceDetails?.travel || 3500;
      const medical = payslip.allowanceDetails?.medical || 2500;
      const otherAllowance = payslip.allowanceDetails?.other || 2000;

      const pf = payslip.deductionDetails?.pf || 3200;
      const profTax = payslip.deductionDetails?.professionalTax || 200;
      const incomeTax = payslip.deductionDetails?.incomeTax || 2800;

      exportOfficialWordDoc({
        title: 'OFFICIAL SALARY STATEMENT',
        metaFields: [
          { label: 'Employee Name', value: empName },
          { label: 'Employee ID', value: empId },
          { label: 'Designation', value: empRole },
          { label: 'Pay Period', value: payslip.month },
          { label: 'Email ID', value: empEmail },
          { label: 'Payslip ID', value: payslip.payslipId || 'PAY-2026' },
          { label: 'Status', value: payslip.status || 'Paid' }
        ],
        tableHeaders: ['EARNINGS', 'AMOUNT', 'DEDUCTIONS', 'AMOUNT'],
        tableRows: [
          ['Basic Salary', `Rs. ${(payslip.basicSalary || 0).toLocaleString()}`, 'Provident Fund (PF)', `Rs. ${pf.toLocaleString()}`],
          ['House Rent Allowance (HRA)', `Rs. ${hra.toLocaleString()}`, 'Professional Tax', `Rs. ${profTax.toLocaleString()}`],
          ['Travel & Conveyance', `Rs. ${travel.toLocaleString()}`, 'Income Tax (TDS)', `Rs. ${incomeTax.toLocaleString()}`],
          ['Medical Allowance', `Rs. ${medical.toLocaleString()}`, 'Special Allowances', `Rs. ${otherAllowance.toLocaleString()}`],
          ['GROSS EARNINGS', `Rs. ${(payslip.grossSalary || 0).toLocaleString()}`, 'TOTAL DEDUCTIONS', `Rs. ${(payslip.deductions || 0).toLocaleString()}`],
          ['NET SALARY DISBURSED', `Rs. ${(payslip.netPayable || 0).toLocaleString()}`, 'PAYMENT MODE', 'Direct Bank Transfer']
        ],
        fileName: `Payslip_${payslip.payslipId || '2026'}_${(payslip.month || 'Month').replace(/\s+/g, '_')}.doc`
      });
    } catch (err) {
      alert('Could not export Word: ' + err.message);
    }
  };

  // Derived state for filters
  const filteredPayslips = useMemo(() => {
    if (!payslips || !Array.isArray(payslips)) return [];
    
    return payslips.filter(ps => {
      const psId = ps?.payslipId || '';
      const psMonthStr = ps?.month || '';

      const matchSearch = psId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          psMonthStr.toLowerCase().includes(searchTerm.toLowerCase());
      
      const psMonth = psMonthStr.split(' ')[0] || ''; 
      const psYear = psMonthStr.split(' ')[1] || ''; 

      const matchMonth = filterMonth ? psMonth === filterMonth : true;
      const matchYear = filterYear ? psYear === filterYear : true;

      return matchSearch && matchMonth && matchYear;
    });
  }, [payslips, searchTerm, filterMonth, filterYear]);

  // Latest Payslip
  const latestPayslip = payslips && payslips.length > 0 ? payslips[0] : null;

  // Financial Stats
  const _totalYTDNet = payslips.reduce((acc, p) => acc + (parseFloat(p.netPayable) || 0), 0);
  const _totalYTDGross = payslips.reduce((acc, p) => acc + (parseFloat(p.grossSalary) || 0), 0);
  const _totalYTDDeductions = payslips.reduce((acc, p) => acc + (parseFloat(p.deductions) || 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="loader-small" style={{ width: '42px', height: '42px', borderWidth: '3px' }}></div>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading Salary & Payslip Data...</p>
    </div>
  );

  return (
    <motion.div 
      className="payroll-workspace-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --------------------------------------------------------------------------
          1. HERO HEADER BANNER
         -------------------------------------------------------------------------- */}
      <motion.div className="payroll-hero-banner" variants={itemVariants}>
        <div className="hero-left-content">
          <div className="hero-meta-row">
            <span className="payroll-meta-badge">
              <ShieldCheck size={13} /> Official Compensation Hub
            </span>
            <span className="payroll-cycle-badge">
              <Calendar size={13} /> Active Pay Cycle • 2026
            </span>
          </div>
          <h1 className="hero-main-title">My Payslips & Compensation</h1>
          <p className="hero-subtext">
            Access monthly itemized salary statements, tax deduction breakdowns, and download official PDF payslips.
          </p>
          <DailyQuoteBanner variant="hero-quote" showBadge={false} />
        </div>

        <div className="hero-right-actions">
          {latestPayslip ? (
            <button className="btn-primary-glow" onClick={() => downloadPayslip(latestPayslip)}>
              <Download size={18} />
              <span>Download Latest Slip ({latestPayslip.month})</span>
            </button>
          ) : (
            <div className="payroll-user-badge">
              <div className="payroll-avatar-circle">
                <Landmark size={20} />
              </div>
              <div className="payroll-badge-info">
                <span className="p-tag">DIRECT TRANSFER</span>
                <span className="p-name">{user?.fullName || user?.name || 'Employee'}</span>
                <span className="p-sub">{user?.designation || 'Software Developer'}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* --------------------------------------------------------------------------
          2. FINANCIAL METRICS GRID (4 METRIC CARDS)
         -------------------------------------------------------------------------- */}
      <div className="payroll-metrics-grid">
        <motion.div className="payroll-metric-card emerald" variants={itemVariants} whileHover={{ y: -4 }}>
          <div className="metric-icon-wrapper emerald">
            <Landmark size={24} />
          </div>
          <div className="metric-info-col">
            <span className="metric-title">Total Disbursed (YTD)</span>
            <span className="metric-val">₹{_totalYTDNet.toLocaleString()}</span>
            <span className="metric-micro-tag">
              <CheckCircle2 size={11} /> {_totalYTDNet > 0 ? 'Verified Direct Credits' : 'Disbursement Active'}
            </span>
          </div>
          <div className="metric-ambient-accent emerald"></div>
        </motion.div>

        <motion.div className="payroll-metric-card blue" variants={itemVariants} whileHover={{ y: -4 }}>
          <div className="metric-icon-wrapper blue">
            <TrendingUp size={24} />
          </div>
          <div className="metric-info-col">
            <span className="metric-title">Gross Earnings</span>
            <span className="metric-val">₹{_totalYTDGross.toLocaleString()}</span>
            <span className="metric-micro-tag">
              <Sparkles size={11} /> Standard Pay Scale
            </span>
          </div>
          <div className="metric-ambient-accent blue"></div>
        </motion.div>

        <motion.div className="payroll-metric-card amber" variants={itemVariants} whileHover={{ y: -4 }}>
          <div className="metric-icon-wrapper amber">
            <ShieldCheck size={24} />
          </div>
          <div className="metric-info-col">
            <span className="metric-title">Statutory Deductions</span>
            <span className="metric-val">₹{_totalYTDDeductions.toLocaleString()}</span>
            <span className="metric-micro-tag">
              <ShieldCheck size={11} /> 100% PF & TDS Compliant
            </span>
          </div>
          <div className="metric-ambient-accent amber"></div>
        </motion.div>

        <motion.div className="payroll-metric-card purple" variants={itemVariants} whileHover={{ y: -4 }}>
          <div className="metric-icon-wrapper purple">
            <FileText size={24} />
          </div>
          <div className="metric-info-col">
            <span className="metric-title">Latest Statement</span>
            <span className="metric-val statement-month">{latestPayslip ? latestPayslip.month : 'November 2026'}</span>
            <span className="metric-micro-tag">
              <Calendar size={11} /> {latestPayslip ? 'Slip Available' : 'Current Pay Cycle'}
            </span>
          </div>
          <div className="metric-ambient-accent purple"></div>
        </motion.div>
      </div>

      {/* --------------------------------------------------------------------------
          3. PAYSLIPS FILTER TOOLBAR
         -------------------------------------------------------------------------- */}
      <motion.div className="payroll-toolbar-card" variants={itemVariants}>
        <div className="payroll-search-box">
          <Search size={17} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search payslips by ID or month..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="payroll-filter-selects">
          <select className="select-input-glass" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>

          <select className="select-input-glass" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          <button className="btn-refresh-toolbar" onClick={handleRefresh} disabled={isRefreshing} title="Refresh Payslips">
            <RefreshCw size={15} className={isRefreshing ? "spin-icon" : ""} />
          </button>
        </div>
      </motion.div>

      {/* --------------------------------------------------------------------------
          4. PAYSLIPS DATA TABLE & RICH EMPTY STATE
         -------------------------------------------------------------------------- */}
      <motion.div className="payroll-table-card" variants={itemVariants}>
        {(!payslips || payslips.length === 0) ? (
          <motion.div 
            className="payroll-rich-empty-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="empty-ambient-glow" />
            <div className="empty-icon-ring-glow">
              <CreditCard size={38} className="empty-card-icon" />
            </div>
            <h3 className="empty-title">No Payslips Available Yet</h3>
            <p className="empty-desc">
              Your itemized monthly compensation statements and official PDF payslips will appear here automatically once processed by HR & accounts.
            </p>

            <div className="payroll-highlights-row">
              <div className="highlight-pill">
                <div className="hp-icon"><Download size={14} /></div>
                <div className="hp-text">
                  <strong>Official PDF Downloads</strong>
                  <span>Standard verified corporate letterhead slips</span>
                </div>
              </div>
              <div className="highlight-pill">
                <div className="hp-icon"><ShieldCheck size={14} /></div>
                <div className="hp-text">
                  <strong>Tax & Deductions</strong>
                  <span>Itemized PF, TDS, HRA and special allowances</span>
                </div>
              </div>
              <div className="highlight-pill">
                <div className="hp-icon"><CheckCircle2 size={14} /></div>
                <div className="hp-text">
                  <strong>Direct Bank Transfer</strong>
                  <span>Direct NEFT / IMPS salary confirmations</span>
                </div>
              </div>
            </div>

            <div className="empty-action-row">
              <button className="btn-refresh-payroll" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw size={15} className={isRefreshing ? "spin-icon" : ""} />
                <span>{isRefreshing ? 'Checking Status...' : 'Check Payroll Status'}</span>
              </button>
            </div>
          </motion.div>
        ) : filteredPayslips.length === 0 ? (
          <div className="payroll-empty-state">
            <p>No payslips found matching your search parameters.</p>
            <button className="btn-outline-glass" onClick={() => { setSearchTerm(''); setFilterMonth(''); setFilterYear(''); }}>Reset Filters</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="payroll-data-table">
              <thead>
                <tr>
                  <th>Payslip ID</th>
                  <th>Month & Period</th>
                  <th>Basic Salary</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredPayslips.map(ps => (
                    <motion.tr 
                      key={ps._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      whileHover={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <td>
                        <span className="payslip-code-badge">{ps.payslipId}</span>
                      </td>
                      <td>
                        <span className="month-text">{ps.month}</span>
                      </td>
                      <td>₹{(ps.basicSalary || 0).toLocaleString()}</td>
                      <td>₹{(ps.grossSalary || 0).toLocaleString()}</td>
                      <td style={{ color: '#f87171' }}>- ₹{(ps.deductions || 0).toLocaleString()}</td>
                      <td>
                        <span className="net-salary-highlight">₹{(ps.netPayable || 0).toLocaleString()}</span>
                      </td>
                      <td>
                        <StatusBadge status={ps.status || 'Paid'} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-cell-row">
                          <button className="action-btn-glass" title="View Detailed Breakup" onClick={() => viewPayslip(ps)}>
                            <FileText size={15} />
                            <span>View</span>
                          </button>
                          <button className="action-btn-glass" title="Download PDF" onClick={() => initiateDownloadConfirm(ps)}>
                            <Download size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* --------------------------------------------------------------------------
          5. DETAILED PAYSLIP BREAKDOWN MODAL
         -------------------------------------------------------------------------- */}
      {selectedPayslip && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={`Salary Statement • ${selectedPayslip.month}`}
        >
          <div className="doc-payslip-breakdown">
            {/* Header Header Info */}
            <div className="payslip-doc-header">
              <div>
                <h3 className="company-title">CodeThrive Infotech</h3>
                <p className="company-sub">Official Salary Statement • {selectedPayslip.month}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={selectedPayslip.status} />
                <span className="doc-id-pill">ID: {selectedPayslip.payslipId}</span>
              </div>
            </div>

            {/* Employee Meta Grid */}
            <div className="employee-meta-grid">
              <div className="meta-col">
                <span className="m-label">Employee Name</span>
                <span className="m-val">{user?.name || 'Kirubakaran'}</span>
              </div>
              <div className="meta-col">
                <span className="m-label">Employee ID</span>
                <span className="m-val">{user?.employeeId || 'EMP-1002'}</span>
              </div>
              <div className="meta-col">
                <span className="m-label">Designation</span>
                <span className="m-val">{user?.designation || 'Software Engineer'}</span>
              </div>
              <div className="meta-col">
                <span className="m-label">Pay Period</span>
                <span className="m-val">{selectedPayslip.month}</span>
              </div>
            </div>

            {/* Earnings vs Deductions Breakdown Grid */}
            <div className="earnings-deductions-grid">
              {/* Earnings Column */}
              <div className="breakdown-card-col">
                <h4 className="col-header-title green">Earnings</h4>
                <div className="line-item-row">
                  <span>Basic Salary</span>
                  <span>₹{(selectedPayslip.basicSalary || 0).toLocaleString()}</span>
                </div>
                <div className="line-item-row">
                  <span>House Rent Allowance (HRA)</span>
                  <span>₹{(selectedPayslip.allowanceDetails?.hra || 12000).toLocaleString()}</span>
                </div>
                <div className="line-item-row">
                  <span>Conveyance / Travel Allowance</span>
                  <span>₹{(selectedPayslip.allowanceDetails?.travel || 3500).toLocaleString()}</span>
                </div>
                <div className="line-item-row">
                  <span>Medical Allowance</span>
                  <span>₹{(selectedPayslip.allowanceDetails?.medical || 2500).toLocaleString()}</span>
                </div>
                <div className="line-item-row">
                  <span>Special Allowances</span>
                  <span>₹{(selectedPayslip.allowanceDetails?.other || 2000).toLocaleString()}</span>
                </div>
                <div className="line-item-row total-row green">
                  <span>Gross Earnings</span>
                  <span>₹{(selectedPayslip.grossSalary || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="breakdown-card-col">
                <h4 className="col-header-title red">Deductions</h4>
                <div className="line-item-row">
                  <span>Provident Fund (PF)</span>
                  <span>₹{(selectedPayslip.deductionDetails?.pf || 3200).toLocaleString()}</span>
                </div>
                <div className="line-item-row">
                  <span>Employee State Insurance (ESI)</span>
                  <span>₹{(selectedPayslip.deductionDetails?.esi || 0).toLocaleString()}</span>
                </div>
                <div className="line-item-row">
                  <span>Professional Tax</span>
                  <span>₹{(selectedPayslip.deductionDetails?.professionalTax || 200).toLocaleString()}</span>
                </div>
                <div className="line-item-row">
                  <span>Income Tax / TDS</span>
                  <span>₹{(selectedPayslip.deductionDetails?.incomeTax || 2800).toLocaleString()}</span>
                </div>
                <div className="line-item-row total-row red">
                  <span>Total Deductions</span>
                  <span>₹{(selectedPayslip.deductions || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Payable Banner */}
            <div className="net-payable-banner">
              <div>
                <span className="net-label">Net Salary Payable</span>
                <span className="net-sub">Direct Credited to Salary Account</span>
              </div>
              <span className="net-amount">₹{(selectedPayslip.netPayable || 0).toLocaleString()}</span>
            </div>

            {/* Employee Bank Account Details */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(30, 41, 59, 0.6))',
              borderRadius: '14px',
              padding: '1.1rem 1.4rem',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              marginTop: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#60a5fa', fontWeight: 700, fontSize: '0.88rem' }}>
                <Landmark size={18} />
                <span>Salary Disbursement Bank Account Details</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.9rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase' }}>Operating Bank</span>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
                    {selectedPayslip.employeeInfo?.bankName || selectedPayslip.employee?.bankName || employeeProfile?.bankName || 'CodeThrive Salary Account'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase' }}>Bank Account Number</span>
                  <strong style={{ color: '#38bdf8', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                    {selectedPayslip.employeeInfo?.bankAcNo || selectedPayslip.employee?.accountNumber || employeeProfile?.accountNumber || 'Not Provided'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase' }}>IFSC Code</span>
                  <strong style={{ color: '#34d399', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                    {selectedPayslip.employeeInfo?.ifscCode || selectedPayslip.employee?.ifscCode || employeeProfile?.ifscCode || 'Not Provided'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase' }}>Account Holder</span>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
                    {selectedPayslip.employeeInfo?.accountHolderName || selectedPayslip.employee?.bankAccountHolderName || selectedPayslip.employee?.fullName || employeeProfile?.bankAccountHolderName || employeeProfile?.fullName || user?.fullName || 'Employee'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions-footer">
              <button className="btn-outline-glass" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
              
              <button className="btn-primary-glow" onClick={() => initiateDownloadConfirm(selectedPayslip)} title="Confirm Date & Download PDF">
                <Download size={16} /> Download Official PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* --------------------------------------------------------------------------
          6. PAYSLIP DATE CONFIRMATION MODAL
         -------------------------------------------------------------------------- */}
      {downloadTargetPayslip && (
        <Modal
          isOpen={downloadModalOpen}
          onClose={() => setDownloadModalOpen(false)}
          title="Confirm Pay Period & Download"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.4rem 0' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '0.8rem 1rem', borderRadius: '12px', fontSize: '0.85rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={18} color="#60a5fa" />
              <span>Confirm your salary pay period and statement issue date before downloading.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.825rem', color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>
                  Pay Period / Month:
                </label>
                <input 
                  type="text" 
                  className="input-field"
                  value={confirmedMonth} 
                  onChange={e => setConfirmedMonth(e.target.value)}
                  placeholder=""
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.825rem', color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>
                  Statement Issue Date:
                </label>
                <DateInput 
                  className="input-field"
                  value={confirmedDate} 
                  onChange={e => setConfirmedDate(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Payslip ID</span>
                <strong style={{ color: '#f8fafc' }}>{downloadTargetPayslip.payslipId || 'PAY-2026'}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Net Amount</span>
                <strong style={{ color: '#34d399' }}>₹{(downloadTargetPayslip.netPayable || 0).toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn-outline-glass" 
                onClick={() => setDownloadModalOpen(false)}
                disabled={isDownloading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary-glow"
                onClick={() => downloadPayslip(downloadTargetPayslip, confirmedMonth, confirmedDate)}
                disabled={isDownloading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={16} />
                {isDownloading ? 'Generating...' : 'Confirm & Download PDF'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </motion.div>
  );
};

export default Payroll;
