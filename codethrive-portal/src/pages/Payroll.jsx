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
import './Payroll.css';

// Fallback demo payslips for high-end preview if server is empty
const DEMO_PAYSLIPS = [
  {
    _id: 'ps-demo-1',
    payslipId: 'PAY-2026-08',
    month: 'August 2026',
    basicSalary: 65000,
    grossSalary: 85000,
    deductions: 6200,
    netPayable: 78800,
    status: 'Paid',
    createdAt: new Date().toISOString(),
    allowanceDetails: { hra: 12000, travel: 3500, medical: 2500, other: 2000 },
    deductionDetails: { pf: 3200, esi: 0, professionalTax: 200, incomeTax: 2800 }
  },
  {
    _id: 'ps-demo-2',
    payslipId: 'PAY-2026-07',
    month: 'July 2026',
    basicSalary: 65000,
    grossSalary: 85000,
    deductions: 6200,
    netPayable: 78800,
    status: 'Paid',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    allowanceDetails: { hra: 12000, travel: 3500, medical: 2500, other: 2000 },
    deductionDetails: { pf: 3200, esi: 0, professionalTax: 200, incomeTax: 2800 }
  },
  {
    _id: 'ps-demo-3',
    payslipId: 'PAY-2026-06',
    month: 'June 2026',
    basicSalary: 65000,
    grossSalary: 85000,
    deductions: 6200,
    netPayable: 78800,
    status: 'Paid',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    allowanceDetails: { hra: 12000, travel: 3500, medical: 2500, other: 2000 },
    deductionDetails: { pf: 3200, esi: 0, professionalTax: 200, incomeTax: 2800 }
  }
];

const Payroll = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll/my-payslips');
      const fetched = res.data?.data || [];

      if (fetched.length > 0) {
        setPayslips(fetched);
      } else {
        setPayslips(DEMO_PAYSLIPS);
      }
    } catch (err) {
      console.warn('Backend API offline or empty, using fallback demo payslips', err);
      setPayslips(DEMO_PAYSLIPS);
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
      
      doc.autoTable({
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

      const currentY = doc.lastAutoTable.finalY + 8;
      
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

      doc.autoTable({
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

      const finalY = doc.lastAutoTable.finalY + 10;

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
            onClick={handleRefresh} 
            className="btn-glass-icon"
            title="Refresh Payslips"
          >
            <RefreshCw size={17} className={isRefreshing ? 'spin' : ''} />
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
