import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils/dateUtils';
import { 
  Download, FileText, Search, CreditCard, ChevronRight, 
  Calendar, CheckCircle2, DollarSign, TrendingUp, ShieldCheck, 
  Sparkles, RefreshCw, Eye, Landmark, ArrowUpRight, Award,
  Plus, Receipt, Upload, Paperclip, X, Clock
} from 'lucide-react';
import './Payroll.css';

const DEFAULT_EXPENSE_CLAIMS = [
  {
    _id: 'clm-1',
    claimId: 'EXP-2026-001',
    employeeName: 'Kirubakaran',
    employeeId: 'CTI-EMP-002',
    category: 'Travel Expense',
    amount: 2500,
    expenseDate: '2026-09-28',
    description: 'On-site Client Visit Taxi & Conveyance Charges',
    fileName: 'Travel_Ticket_Receipt_CTI002.pdf',
    fileData: null,
    status: 'Approved',
    submittedAt: '2026-09-28'
  },
  {
    _id: 'clm-2',
    claimId: 'EXP-2026-002',
    employeeName: 'Alex Rivera',
    employeeId: 'CTI-EMP-007',
    category: 'Medical Expense',
    amount: 1500,
    expenseDate: '2026-10-01',
    description: 'Annual Executive Health Checkup & Prescriptions',
    fileName: 'Medical_Consultation_Bill_CTI007.pdf',
    fileData: null,
    status: 'Pending',
    submittedAt: '2026-10-01'
  }
];

const DEFAULT_DEMO_PAYSLIPS = [
  {
    _id: 'demo-ps-1',
    payslipId: 'PSL-2026-009',
    month: 'September 2026',
    paymentDate: '2026-09-30',
    status: 'Paid',
    grossSalary: 85000,
    netPayable: 76200,
    basicSalary: 55000,
    deductions: 8800,
    allowanceDetails: { hra: 22000, travel: 3000, medical: 2000, other: 3000 },
    deductionDetails: { pf: 6600, esi: 0, professionalTax: 200, incomeTax: 2000, leaveDeduction: 0, loanAdvance: 0, other: 0 }
  },
  {
    _id: 'demo-ps-2',
    payslipId: 'PSL-2026-008',
    month: 'August 2026',
    paymentDate: '2026-08-31',
    status: 'Paid',
    grossSalary: 85000,
    netPayable: 76200,
    basicSalary: 55000,
    deductions: 8800,
    allowanceDetails: { hra: 22000, travel: 3000, medical: 2000, other: 3000 },
    deductionDetails: { pf: 6600, esi: 0, professionalTax: 200, incomeTax: 2000, leaveDeduction: 0, loanAdvance: 0, other: 0 }
  },
  {
    _id: 'demo-ps-3',
    payslipId: 'PSL-2026-007',
    month: 'July 2026',
    paymentDate: '2026-07-31',
    status: 'Paid',
    grossSalary: 85000,
    netPayable: 76200,
    basicSalary: 55000,
    deductions: 8800,
    allowanceDetails: { hra: 22000, travel: 3000, medical: 2000, other: 3000 },
    deductionDetails: { pf: 6600, esi: 0, professionalTax: 200, incomeTax: 2000, leaveDeduction: 0, loanAdvance: 0, other: 0 }
  }
];

const Payroll = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Expense Claim State
  const [expenseClaims, setExpenseClaims] = useState(() => {
    try {
      const stored = localStorage.getItem('cti_expense_claims');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    localStorage.setItem('cti_expense_claims', JSON.stringify(DEFAULT_EXPENSE_CLAIMS));
    return DEFAULT_EXPENSE_CLAIMS;
  });

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    category: 'Travel Expense',
    amount: '',
    expenseDate: new Date().toISOString().substring(0, 10),
    description: '',
    fileName: '',
    fileData: null
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClaimForm(prev => ({
          ...prev,
          fileName: file.name,
          fileData: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    if (!claimForm.amount || Number(claimForm.amount) <= 0) {
      alert('Please enter a valid expense claim amount.');
      return;
    }

    const newClaim = {
      _id: 'clm_' + Date.now(),
      claimId: 'EXP-2026-' + Math.floor(100 + Math.random() * 900),
      employeeName: user?.fullName || user?.name || 'Kirubakaran',
      employeeId: user?.employeeId || 'CTI-EMP-002',
      category: claimForm.category,
      amount: Number(claimForm.amount),
      expenseDate: claimForm.expenseDate,
      description: claimForm.description,
      fileName: claimForm.fileName || `${claimForm.category.replace(/\s+/g, '_')}_Bill.pdf`,
      fileData: claimForm.fileData,
      status: 'Pending',
      submittedAt: new Date().toISOString().substring(0, 10)
    };

    const updated = [newClaim, ...expenseClaims];
    setExpenseClaims(updated);
    localStorage.setItem('cti_expense_claims', JSON.stringify(updated));
    setIsClaimModalOpen(false);
    setClaimForm({
      category: 'Travel Expense',
      amount: '',
      expenseDate: new Date().toISOString().substring(0, 10),
      description: '',
      fileName: '',
      fileData: null
    });
    alert('Expense Bill submitted successfully for HR & Admin reimbursement approval!');
  };

  const downloadExpenseBill = (claim) => {
    try {
      if (claim.fileData && claim.fileData.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = claim.fileData;
        link.download = claim.fileName || `${claim.claimId}_Bill.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // PDF Voucher Fallback
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CODETHRIVE INFOTECH PVT LTD', 14, 18);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(167, 243, 208);
      doc.text(`EXPENSE REIMBURSEMENT BILL RECEIPT • ${(claim.category || 'EXPENSE').toUpperCase()}`, 14, 28);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`CLAIM ID: ${claim.claimId || 'EXP-2026'}`, 196, 20, { align: 'right' });
      doc.text(`STATUS: ${(claim.status || 'Pending').toUpperCase()}`, 196, 28, { align: 'right' });

      const renderTable = typeof autoTable === 'function' ? autoTable : (autoTable?.default || doc?.autoTable);

      const billInfo = [
        ['Claim Reference:', claim.claimId || '-', 'Submitted Date:', formatDate(claim.submittedAt || claim.expenseDate)],
        ['Employee Name:', claim.employeeName || (user?.name || 'Kirubakaran'), 'Employee ID:', claim.employeeId || 'CTI-EMP-002'],
        ['Expense Category:', claim.category || 'Travel Expense', 'Expense Date:', formatDate(claim.expenseDate)],
        ['Reimbursement Amount:', `Rs. ${(claim.amount || 0).toLocaleString()}`, 'Attached Document:', claim.fileName || 'Official_Bill_Receipt.pdf']
      ];

      renderTable(doc, {
        startY: 50,
        body: billInfo,
        theme: 'plain',
        styles: { fontSize: 9.5, cellPadding: 3, textColor: [30, 41, 59] },
        columnStyles: {
          0: { fontStyle: 'bold', width: 45 },
          1: { width: 55 },
          2: { fontStyle: 'bold', width: 45 },
          3: { width: 45 }
        }
      });

      const currY = (doc.lastAutoTable?.finalY || 100) + 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('EXPENSE REASON / DESCRIPTION:', 14, currY);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(claim.description || 'Verified travel/medical reimbursement claim.', 14, currY + 6);

      const boxY = currY + 16;
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(14, boxY, 182, 18, 3, 3, 'FD');

      doc.setTextColor(6, 78, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('APPROVED REIMBURSEMENT AMOUNT:', 22, boxY + 11);

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${(claim.amount || 0).toLocaleString()}`, 190, boxY + 12, { align: 'right' });

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Verified digital expense claim voucher. Downloaded from CodeThrive Enterprise Portal.', 14, boxY + 28);

      doc.save(`${claim.claimId || 'Claim'}_${(claim.category || 'Expense').replace(/\s+/g, '_')}_Bill.pdf`);
    } catch (err) {
      alert('Failed to download bill: ' + err.message);
    }
  };

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      let fetched = [];
      try {
        const res = await api.get('/payroll/my-payslips');
        fetched = res.data?.data || [];
      } catch (e) {
        // Backend fallback
      }

      const shared = JSON.parse(localStorage.getItem('cti_shared_payrolls') || '[]');
      const combined = [...fetched, ...shared];

      if (combined.length > 0) {
        setPayslips(combined);
      } else {
        setPayslips(DEFAULT_DEMO_PAYSLIPS);
      }
    } catch (err) {
      const shared = JSON.parse(localStorage.getItem('cti_shared_payrolls') || '[]');
      if (shared.length > 0) {
        setPayslips(shared);
      } else {
        setPayslips(DEFAULT_DEMO_PAYSLIPS);
      }
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

  const downloadPayslip = (payslip) => {
    try {
      const doc = new jsPDF();
      
      // Dark Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 42, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('CODETHRIVE INFOTECH PVT LTD', 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(167, 243, 208);
      doc.text(`OFFICIAL SALARY STATEMENT • ${payslip.month}`, 14, 29);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`ID: ${payslip.payslipId || 'PAY-2026'}`, 196, 20, { align: 'right' });
      doc.text(`STATUS: ${payslip.status || 'Paid'}`, 196, 29, { align: 'right' });
      
      // Employee Details Table
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE INFORMATION', 14, 52);
      
      const empName = user?.fullName || user?.name || payslip.employee?.fullName || 'Kirubakaran';
      const empId = user?.employeeId || payslip.employee?.employeeId || 'CTI-EMP-001';
      const empRole = user?.role || user?.designation || payslip.employee?.designation || 'Software Engineer';
      const empEmail = user?.email || payslip.employee?.email || `${empId.toLowerCase()}@codethrive.com`;
      
      const employeeData = [
        ['Employee Name:', empName, 'Employee ID:', empId],
        ['Designation:', empRole, 'Pay Period:', payslip.month],
        ['Email ID:', empEmail, 'Payment Status:', payslip.status || 'Paid']
      ];
      
      const renderTable = typeof autoTable === 'function' ? autoTable : (autoTable?.default || doc?.autoTable);
      
      renderTable(doc, {
        startY: 56,
        body: employeeData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2.5, textColor: [51, 65, 85] },
        columnStyles: {
          0: { fontStyle: 'bold', width: 35 },
          1: { width: 65 },
          2: { fontStyle: 'bold', width: 35 },
          3: { width: 55 }
        }
      });

      const currentY = (doc.lastAutoTable?.finalY || 100) + 8;
      
      // Salary Breakdown Header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('EARNINGS & DEDUCTIONS BREAKDOWN', 14, currentY);

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

      renderTable(doc, {
        startY: currentY + 4,
        head: [['EARNINGS', 'AMOUNT', 'DEDUCTIONS', 'AMOUNT']],
        body: salaryTableBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 41, 59] },
        columnStyles: {
          0: { width: 55 },
          1: { width: 40, halign: 'right' },
          2: { width: 55 },
          3: { width: 40, halign: 'right' }
        },
        didParseCell: function(data) {
          if (data.row.index === 5) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
        }
      });

      const finalY = (doc.lastAutoTable?.finalY || 180) + 10;

      // Net Salary Callout Box
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(14, finalY, 182, 20, 3, 3, 'FD');

      doc.setTextColor(6, 78, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('NET SALARY PAYABLE:', 22, finalY + 12);

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${(payslip.netPayable || 0).toLocaleString()}`, 190, finalY + 13, { align: 'right' });

      // Footer
      const footerY = finalY + 30;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('This is an official computer-generated document issued by CodeThrive Infotech Pvt Ltd. No physical signature required.', 14, footerY);

      const fileName = `Payslip_${payslip.payslipId || '2026'}_${(payslip.month || 'Month').replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF Generation Failed', err);
      alert('Could not generate PDF. Please try again.');
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="loader-small" style={{ width: '42px', height: '42px', borderWidth: '3px' }}></div>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading Salary & Payslip Data...</p>
    </div>
  );

  return (
    <motion.div 
      className="payroll-workspace-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* --------------------------------------------------------------------------
          1. HERO HEADER BANNER
         -------------------------------------------------------------------------- */}
      <div className="payroll-hero-banner">
        <div className="hero-left-content">
          <h1 className="hero-main-title">My Payslips & Compensation</h1>
          <p className="hero-subtext">
            Access monthly itemized salary statements, tax deduction breakdowns, and download official PDF payslips.
          </p>
        </div>

        <div className="hero-right-actions">
          <button 
            className="btn-primary-glow" 
            onClick={() => setIsClaimModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', boxShadow: '0 4px 15px rgba(236,72,153,0.4)' }}
          >
            <Plus size={18} />
            <span>Submit Travel/Medical Bill</span>
          </button>

          {latestPayslip && (
            <button className="btn-primary-glow" onClick={() => downloadPayslip(latestPayslip)}>
              <Download size={18} />
              <span>Download Latest Slip ({latestPayslip.month})</span>
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          3. PAYSLIPS FILTER TOOLBAR
         -------------------------------------------------------------------------- */}
      <div className="payroll-toolbar-card">
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
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          4. PAYSLIPS DATA TABLE
         -------------------------------------------------------------------------- */}
      <div className="payroll-table-card">
        {(!payslips || payslips.length === 0) ? (
          <div className="payroll-empty-state">
            <div className="empty-icon-ring">
              <CreditCard size={40} />
            </div>
            <h3>No Payslips Available Yet</h3>
            <p>Your payslips will appear here once your monthly compensation is processed by HR.</p>
          </div>
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
                  <th style={{ whiteSpace: 'nowrap' }}>Payslip ID</th>
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
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="payslip-code-badge" style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>{ps.payslipId}</span>
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
                          <button className="action-btn-glass" title="Download PDF" onClick={() => downloadPayslip(ps)}>
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
      </div>

      {/* --------------------------------------------------------------------------
          5. SUBMITTED EXPENSE BILLS (TRAVEL & MEDICAL) SECTION
         -------------------------------------------------------------------------- */}
      <div className="payroll-table-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #ec4899, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>My Expense Reimbursement Bills</h3>
              <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Submit Travel & Medical expense bills to request reimbursement from HR & Admin.
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsClaimModalOpen(true)}
            style={{
              padding: '0.65rem 1.1rem', borderRadius: '10px',
              background: 'linear-gradient(135deg, #ec4899, #be185d)', border: 'none',
              color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 15px rgba(236,72,153,0.35)'
            }}
          >
            <Plus size={16} />
            <span>+ Submit Expense Bill</span>
          </button>
        </div>

        {(!expenseClaims || expenseClaims.length === 0) ? (
          <div className="payroll-empty-state">
            <Receipt size={36} style={{ opacity: 0.5 }} />
            <p>No expense bills submitted yet. Click above to submit Travel or Medical bills.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {/* Header Titles */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '140px 160px 105px 115px 1fr 100px 160px',
              gap: '0.8rem', padding: '0 1.1rem', color: 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
              alignItems: 'center'
            }}>
              <div>Claim Ref</div>
              <div>Expense Category</div>
              <div>Expense Date</div>
              <div>Claim Amount</div>
              <div>Description / Reason</div>
              <div style={{ textAlign: 'center' }}>Status</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {/* Claim Row Cards */}
            {expenseClaims.map((claim, idx) => (
              <div 
                key={claim._id || idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1rem 1.1rem',
                  display: 'grid',
                  gridTemplateColumns: '140px 160px 105px 115px 1fr 100px 160px',
                  alignItems: 'center',
                  gap: '0.8rem'
                }}
              >
                <div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ec4899', background: 'rgba(236, 72, 153, 0.15)', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {claim.claimId}
                  </span>
                </div>

                <div>
                  <span style={{
                    fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-block',
                    background: claim.category === 'Travel Expense' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                    color: claim.category === 'Travel Expense' ? '#38bdf8' : '#c084fc',
                    border: claim.category === 'Travel Expense' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)'
                  }}>
                    {claim.category}
                  </span>
                </div>

                <div style={{ color: '#e2e8f0', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                  {formatDate(claim.expenseDate)}
                </div>

                <div style={{ color: '#34d399', fontWeight: 800, fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
                  ₹{(claim.amount || 0).toLocaleString()}
                </div>

                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={claim.description}>
                  {claim.description || '-'}
                </div>

                <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <StatusBadge status={claim.status || 'Pending'} />
                </div>

                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => downloadExpenseBill(claim)}
                    className="action-btn-glass"
                    title="Download Submitted Bill Receipt Document"
                    style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Download size={14} />
                    <span>Download Bill</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------------
          6. SUBMIT EXPENSE BILL MODAL
         -------------------------------------------------------------------------- */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt size={22} color="#ec4899" />
            <span>Submit Travel or Medical Expense Bill</span>
          </div>
        }
      >
        <form onSubmit={handleClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#0f172a', padding: '1.5rem', borderRadius: '14px' }}>
          
          <div className="form-group">
            <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
              Expense Category *
            </label>
            <select
              value={claimForm.category}
              onChange={(e) => setClaimForm({...claimForm, category: e.target.value})}
              required
              style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(236, 72, 153, 0.35)', color: '#fff', padding: '0.7rem 0.9rem', borderRadius: '8px', outline: 'none' }}
            >
              <option value="Travel Expense">Travel Expense (Cab, Flight, Train, Conveyance)</option>
              <option value="Medical Expense">Medical Expense (Doctor, Pharmacy, Prescriptions)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                Expense Amount (₹) *
              </label>
              <input
                type="number"
                placeholder="e.g. 2500"
                value={claimForm.amount}
                onChange={(e) => setClaimForm({...claimForm, amount: e.target.value})}
                required
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#34d399', fontWeight: 700, padding: '0.7rem 0.9rem', borderRadius: '8px', outline: 'none' }}
              />
            </div>

            <div className="form-group">
              <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                Expense Date *
              </label>
              <input
                type="date"
                value={claimForm.expenseDate}
                onChange={(e) => setClaimForm({...claimForm, expenseDate: e.target.value})}
                required
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.7rem 0.9rem', borderRadius: '8px', outline: 'none' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
              Attach Expense Bill / Receipt Document (PDF / Image)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              onChange={handleFileUpload}
              style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px dashed rgba(236, 72, 153, 0.4)', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
            />
            {claimForm.fileName && (
              <span style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '0.3rem', display: 'block' }}>
                Attached File: {claimForm.fileName}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Describe the travel route, client visit details, or medical reason..."
              value={claimForm.description}
              onChange={(e) => setClaimForm({...claimForm, description: e.target.value})}
              style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.7rem 0.9rem', borderRadius: '8px', outline: 'none', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-outline-glass" onClick={() => setIsClaimModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-glow" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', border: 'none' }}>
              <Upload size={16} /> Submit Expense Claim
            </button>
          </div>
        </form>
      </Modal>

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
                <h3 className="company-title">CodeThrive Infotech Pvt Ltd</h3>
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

            {/* Modal Actions */}
            <div className="modal-actions-footer">
              <button className="btn-outline-glass" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
              <button className="btn-primary-glow" onClick={() => downloadPayslip(selectedPayslip)}>
                <Download size={16} /> Download Official PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

    </motion.div>
  );
};

export default Payroll;
