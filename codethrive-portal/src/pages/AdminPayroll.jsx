import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  Banknote, Plus, Search, CheckCircle2, X, Zap, Eye, Printer, Users, 
  Sparkles, DollarSign, TrendingUp, ShieldCheck, Download
} from 'lucide-react';
import './Payroll.css';

const _DEFAULT_PAYROLLS = [
  {
    _id: 'ps-1',
    payslipId: 'PSL-2026-001',
    month: 'September 2026',
    paymentDate: '2026-09-01',
    status: 'Paid',
    grossSalary: 85000,
    netPayable: 76200,
    basicSalary: 55000,
    bonus: 5000,
    allowanceDetails: { hra: 22000, travel: 3000, medical: 2000, other: 1500 },
    deductionDetails: { pf: 6600, esi: 0, professionalTax: 200, incomeTax: 5000, leaveDeduction: 0, loanAdvance: 0, other: 0 },
    employee: { fullName: 'Mahadevan', employeeId: 'CTI-EMP-001', department: 'Executive Management', designation: 'Chief Executive Officer' }
  },
  {
    _id: 'ps-2',
    payslipId: 'PSL-2026-002',
    month: 'September 2026',
    paymentDate: '2026-09-01',
    status: 'Paid',
    grossSalary: 80000,
    netPayable: 71800,
    basicSalary: 50000,
    bonus: 4000,
    allowanceDetails: { hra: 20000, travel: 3000, medical: 2000, other: 1000 },
    deductionDetails: { pf: 6000, esi: 0, professionalTax: 200, incomeTax: 4000, leaveDeduction: 0, loanAdvance: 0, other: 0 },
    employee: { fullName: 'Kirubakaran', employeeId: 'CTI-EMP-002', department: 'Executive Board', designation: 'Managing Director' }
  },
  {
    _id: 'ps-3',
    payslipId: 'PSL-2026-003',
    month: 'September 2026',
    paymentDate: '2026-09-01',
    status: 'Paid',
    grossSalary: 62000,
    netPayable: 55600,
    basicSalary: 40000,
    bonus: 2000,
    allowanceDetails: { hra: 16000, travel: 2500, medical: 1500, other: 1000 },
    deductionDetails: { pf: 4800, esi: 0, professionalTax: 200, incomeTax: 2400, leaveDeduction: 0, loanAdvance: 0, other: 0 },
    employee: { fullName: 'Sarah Jenkins', employeeId: 'CTI-EMP-004', department: 'UI/UX Design', designation: 'Lead Product Designer' }
  },
  {
    _id: 'ps-4',
    payslipId: 'PSL-2026-004',
    month: 'September 2026',
    paymentDate: '2026-09-01',
    status: 'Processing',
    grossSalary: 58000,
    netPayable: 52100,
    basicSalary: 38000,
    bonus: 1500,
    allowanceDetails: { hra: 15200, travel: 2000, medical: 1500, other: 1000 },
    deductionDetails: { pf: 4560, esi: 0, professionalTax: 200, incomeTax: 1800, leaveDeduction: 0, loanAdvance: 0, other: 0 },
    employee: { fullName: 'Alex Rivera', employeeId: 'CTI-EMP-007', department: 'Frontend Engineering', designation: 'Senior React Developer' }
  }
];

const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'individual', 'bulk'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payslip detail modal
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = monthsList[new Date().getMonth()];
  const currentYearStr = new Date().getFullYear().toString();
  const todayStr = new Date().toISOString().substring(0, 10);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    month: currentMonthName,
    year: currentYearStr,
    paymentDate: todayStr,
    status: 'Paid',
    basicSalary: 45000,
    bonus: 0,
    allowanceDetails: { hra: 18000, travel: 2500, medical: 1500, other: 1000 },
    deductionDetails: { pf: 5400, esi: 0, professionalTax: 200, incomeTax: 1500, leaveDeduction: 0, loanAdvance: 0, other: 0 }
  });

  const [bulkFormData, setBulkFormData] = useState({
    month: currentMonthName,
    year: currentYearStr,
    paymentDate: todayStr,
    status: 'Paid'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      let apiPayrolls = [];
      let apiEmps = [];

      try {
        const [payrollRes, empRes] = await Promise.all([
          api.get('/payroll'),
          api.get('/employees')
        ]);
        apiPayrolls = Array.isArray(payrollRes.data?.data) ? payrollRes.data.data : [];
        apiEmps = Array.isArray(empRes.data?.data) ? empRes.data.data : [];
      } catch (err) {
        console.warn('Backend API offline for payrolls', err);
      }

      setEmployees(apiEmps);

      const localPayrolls = JSON.parse(localStorage.getItem('cti_shared_payrolls') || '[]');
      const cleanLocalPayrolls = localPayrolls.filter(p => p && !String(p._id).startsWith('ps-'));
      localStorage.setItem('cti_shared_payrolls', JSON.stringify(cleanLocalPayrolls));
      
      const combined = [...cleanLocalPayrolls, ...apiPayrolls];
      const map = new Map();
      combined.forEach(p => map.set(p._id, p));
      setPayrolls(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to fetch payroll data', err);
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const _handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    if (empId) {
      let emp = employees.find(item => item._id === empId);
      if (!emp) {
        if (empId === 'emp-fallback-1') emp = { fullName: 'Kirubakaran', employeeId: 'CTI-EMP-002', department: 'Executive Board', designation: 'Managing Director' };
        else if (empId === 'emp-fallback-2') emp = { fullName: 'Mahadevan', employeeId: 'CTI-EMP-001', department: 'Executive Management', designation: 'Chief Executive Officer' };
        else if (empId === 'emp-fallback-3') emp = { fullName: 'Sarah Jenkins', employeeId: 'CTI-EMP-004', department: 'UI/UX Design', designation: 'Lead Product Designer' };
      }
      setSelectedEmployee(emp);
      
      const basic = emp?.salaryAmount || 45000;
      const hra = Math.round(basic * 0.4);
      const pf = Math.round(basic * 0.12);

      setFormData(prev => ({
        ...prev,
        basicSalary: basic,
        allowanceDetails: { hra, travel: 2500, medical: 1500, other: 1000 },
        deductionDetails: { pf, esi: 0, professionalTax: 200, incomeTax: 1500, leaveDeduction: 0, loanAdvance: 0, other: 0 }
      }));
    } else {
      setSelectedEmployee(null);
    }
  };

  const _handleAllowanceChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      allowanceDetails: { ...prev.allowanceDetails, [name]: Number(value) || 0 }
    }));
  };

  const _handleDeductionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      deductionDetails: { ...prev.deductionDetails, [name]: Number(value) || 0 }
    }));
  };

  const _handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'basicSalary' || name === 'bonus' ? (Number(value) || 0) : value 
    }));
  };

  const totalAllowances = Object.values(formData.allowanceDetails).reduce((acc, val) => acc + (val || 0), 0);
  const totalDeductions = Object.values(formData.deductionDetails).reduce((acc, val) => acc + (val || 0), 0);
  const totalEarnings = (formData.basicSalary || 0) + totalAllowances + (formData.bonus || 0);
  const netSalary = totalEarnings - totalDeductions;

  const _handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert("Please select an employee.");
      return;
    }

    try {
      setSubmitting(true);
      const newPayslip = {
        _id: 'ps_' + Date.now(),
        payslipId: 'PSL-2026-' + Math.floor(100 + Math.random() * 900),
        month: `${formData.month} ${formData.year}`,
        paymentDate: formData.paymentDate,
        status: formData.status,
        basicSalary: formData.basicSalary,
        bonus: formData.bonus,
        grossSalary: totalEarnings,
        netPayable: netSalary,
        deductions: totalDeductions,
        allowanceDetails: formData.allowanceDetails,
        deductionDetails: formData.deductionDetails,
        employee: selectedEmployee || { fullName: 'Employee User', employeeId: 'CTI-EMP-001' }
      };

      try {
        await api.post('/payroll', newPayslip);
      } catch (err) {
        console.warn('Backend single payroll API offline', err);
      }

      const updated = [newPayslip, ...payrolls];
      setPayrolls(updated);
      localStorage.setItem('cti_shared_payrolls', JSON.stringify(updated));

      alert('Single payroll generated successfully!');
      setViewMode('list');
    } catch (err) {
      console.error('Failed to generate payroll', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const generated = employees.map((emp, index) => ({
        _id: 'ps_bulk_' + Date.now() + '_' + index,
        payslipId: 'PSL-2026-' + (500 + index),
        month: `${bulkFormData.month} ${bulkFormData.year}`,
        paymentDate: bulkFormData.paymentDate,
        status: bulkFormData.status,
        grossSalary: emp.salaryAmount ? Math.round(emp.salaryAmount * 1.4) : 65000,
        netPayable: emp.salaryAmount ? Math.round(emp.salaryAmount * 1.25) : 58000,
        basicSalary: emp.salaryAmount || 45000,
        bonus: 1000,
        allowanceDetails: { hra: 18000, travel: 2500, medical: 1500, other: 1000 },
        deductionDetails: { pf: 5400, esi: 0, professionalTax: 200, incomeTax: 1500, leaveDeduction: 0, loanAdvance: 0, other: 0 },
        employee: emp
      }));

      const updated = [...generated, ...payrolls];
      setPayrolls(updated);
      localStorage.setItem('cti_shared_payrolls', JSON.stringify(updated));

      alert(`Bulk payroll generated successfully for ${generated.length > 0 ? generated.length : 'all'} active employees!`);
      setViewMode('list');
    } catch (err) {
      console.error('Failed bulk payroll generation', err);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPayslipPDF = (payslip) => {
    try {
      const doc = new jsPDF();
      
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
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE INFORMATION', 14, 52);
      
      const empName = payslip.employee?.fullName || 'Kirubakaran';
      const empId = payslip.employee?.employeeId || 'CTI-EMP-001';
      const empRole = payslip.employee?.designation || 'Software Engineer';
      const empEmail = payslip.employee?.email || `${empId.toLowerCase()}@codethrive.com`;
      
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
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('EARNINGS & DEDUCTIONS BREAKDOWN', 14, currentY);

      const hra = payslip.allowanceDetails?.hra || 18000;
      const travel = payslip.allowanceDetails?.travel || 2500;
      const medical = payslip.allowanceDetails?.medical || 1500;
      const otherAllowance = payslip.allowanceDetails?.other || 1000;

      const pf = payslip.deductionDetails?.pf || 5400;
      const esi = payslip.deductionDetails?.esi || 0;
      const profTax = payslip.deductionDetails?.professionalTax || 200;
      const incomeTax = payslip.deductionDetails?.incomeTax || 1500;

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

  const stats = useMemo(() => {
    const totalDisbursed = payrolls.reduce((acc, p) => acc + (p.netPayable || 0), 0);
    const paidCount = payrolls.filter(p => p.status === 'Paid').length;
    const processingCount = payrolls.filter(p => p.status === 'Processing' || p.status === 'Pending').length;
    const avgSalary = payrolls.length > 0 ? Math.round(totalDisbursed / payrolls.length) : 0;
    return { totalDisbursed, paidCount, processingCount, avgSalary };
  }, [payrolls]);

  const filteredPayrolls = useMemo(() => {
    if (!payrolls || !Array.isArray(payrolls)) return [];
    return payrolls.filter(ps => {
      const psId = ps?.payslipId || '';
      const empName = ps?.employee?.fullName || '';
      const q = searchTerm.toLowerCase();
      return psId.toLowerCase().includes(q) || empName.toLowerCase().includes(q);
    });
  }, [payrolls, searchTerm]);

  if (loading && viewMode === 'list') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loader" style={{ width: '45px', height: '45px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading Enterprise Payroll Engine...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}
    >
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.1), rgba(15, 23, 42, 0.6))',
        borderRadius: '20px', padding: '2rem 2.2rem',
        border: '1px solid rgba(16, 185, 129, 0.25)', backdropFilter: 'blur(16px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
            }}>
              <Banknote size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Payroll Management
              </h1>
              <span style={{ fontSize: '0.85rem', color: '#a7f3d0', fontWeight: 500 }}>Automated Salary Disbursement & Digital Payslips</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0 0', fontSize: '0.95rem', maxWidth: '600px' }}>
            Issue monthly salary statements, process statutory PF & Tax deductions, and execute 1-click bulk disbursements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {viewMode === 'list' ? (
            <>
              <button 
                onClick={() => setViewMode('bulk')}
                style={{
                  padding: '0.75rem 1.3rem', borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <Zap size={16} />
                <span>1-Click Bulk Payroll</span>
              </button>
              <button 
                onClick={() => setViewMode('individual')}
                style={{
                  padding: '0.75rem 1.3rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff', fontWeight: 700, border: 'none',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                }}
              >
                <Plus size={18} />
                <span>Create Single Payslip</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => setViewMode('list')}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px', padding: '0.7rem 1.2rem' }}
            >
              <X size={16} />
              <span>Back to Payroll Console</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      {viewMode === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <motion.div whileHover={{ y: -4 }} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.3rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Payroll Disbursed</span>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}><DollarSign size={18} /></div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34d399' }}>₹{stats.totalDisbursed.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '0.3rem' }}>Monthly net disbursement</div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.3rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Payslips Processed</span>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}><CheckCircle2 size={18} /></div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>{stats.paidCount}</div>
            <div style={{ fontSize: '0.8rem', color: '#a5b4fc', marginTop: '0.3rem' }}>Completed & released</div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.3rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending Release</span>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><Zap size={18} /></div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fbbf24' }}>{stats.processingCount}</div>
            <div style={{ fontSize: '0.8rem', color: '#fde68a', marginTop: '0.3rem' }}>Under processing approval</div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.3rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Average Employee Payout</span>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}><TrendingUp size={18} /></div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#e9d5ff' }}>₹{stats.avgSalary.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: '#d8b4fe', marginTop: '0.3rem' }}>Per staff net average</div>
          </motion.div>
        </div>
      )}

      {/* Main Content View */}
      {viewMode === 'list' && (
        <Card style={{ background: 'rgba(15, 23, 42, 0.75)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', backdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '0 1rem', width: '320px' }}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text"
                placeholder="Search by Payslip ID or Employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.65rem 0.75rem', outline: 'none', width: '100%', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: '#fff' }}>{filteredPayrolls.length}</strong> issued payslip records
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'left' }}>Payslip ID</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'left' }}>Employee</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'left' }}>Salary Month</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'left' }}>Gross Earnings</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'left' }}>Net Payable</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((ps, idx) => (
                  <motion.tr 
                    key={ps._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                    className="hover-lift"
                  >
                    <td style={{ padding: '1rem', borderRadius: '12px 0 0 12px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '8px' }}>
                        {ps.payslipId}
                      </span>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {ps.employee?.fullName?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: '#fff', display: 'block', fontSize: '0.92rem' }}>{ps.employee?.fullName}</span>
                          <span style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>{ps.employee?.employeeId}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem', fontWeight: 600, color: '#e2e8f0' }}>{ps.month}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>₹{(ps.grossSalary || 0).toLocaleString()}</td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem' }}>
                        ₹{(ps.netPayable || 0).toLocaleString()}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <StatusBadge status={ps.status || 'Paid'} />
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setSelectedPayslip(ps);
                            setIsPayslipModalOpen(true);
                          }}
                          style={{
                            padding: '0.45rem 0.85rem', borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                          }}
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => downloadPayslipPDF(ps)}
                          title="Download Official PDF"
                          style={{
                            padding: '0.45rem 0.85rem', borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                          }}
                        >
                          <Download size={14} />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bulk Generator View */}
      {viewMode === 'bulk' && (
        <Card style={{ background: 'rgba(15, 23, 42, 0.8)', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
            <Zap size={24} color="#f59e0b" />
            <div>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>1-Click Bulk Payroll Generator</h2>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Batch generate monthly salary slips for all active organization staff members simultaneously.
              </p>
            </div>
          </div>

          <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
              <div className="form-group">
                <label className="field-label">Salary Month *</label>
                <select 
                  className="input-box"
                  value={bulkFormData.month} 
                  onChange={(e) => setBulkFormData({...bulkFormData, month: e.target.value})}
                  required
                >
                  {monthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="field-label">Salary Year *</label>
                <input 
                  type="number" className="input-box" 
                  value={bulkFormData.year} 
                  onChange={(e) => setBulkFormData({...bulkFormData, year: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="field-label">Disbursement Date *</label>
                <input 
                  type="date" className="input-box" 
                  value={bulkFormData.paymentDate} 
                  onChange={(e) => setBulkFormData({...bulkFormData, paymentDate: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="field-label">Payment Status</label>
                <select 
                  className="input-box" 
                  value={bulkFormData.status} 
                  onChange={(e) => setBulkFormData({...bulkFormData, status: e.target.value})}
                >
                  <option value="Paid">Paid</option>
                  <option value="Processing">Processing</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setViewMode('list')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}>
                <Zap size={18} />
                <span>{submitting ? 'Processing Batch...' : 'Generate All Employee Payslips'}</span>
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Individual Single Payslip Generator View */}
      {viewMode === 'individual' && (
        <Card style={{ background: 'rgba(15, 23, 42, 0.85)', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '2rem', backdropFilter: 'blur(16px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1.25rem', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
              }}>
                <Plus size={24} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.45rem', fontWeight: 800 }}>Create Single Digital Payslip</h2>
                <p style={{ margin: '0.2rem 0 0 0', color: '#a7f3d0', fontSize: '0.88rem' }}>
                  Generate an itemized salary voucher with automated statutory allowances & deductions calculation.
                </p>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.55rem 1rem', borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
            >
              <X size={16} />
              <span>Cancel & Close</span>
            </button>
          </div>

          <form onSubmit={_handleSingleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* 1. Employee Selection & Basic Period */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.4rem' }}>
              <h3 style={{ margin: '0 0 1.2rem 0', color: '#fff', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="#10b981" />
                <span>1. Select Staff Member & Pay Period</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>
                    Employee Target *
                  </label>
                  <select 
                    className="input-box"
                    value={selectedEmployeeId} 
                    onChange={_handleEmployeeSelect}
                    required
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', outline: 'none' }}
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName} ({emp.employeeId || 'ID N/A'}) - {emp.designation || 'Staff'} ({emp.department || 'General'})
                      </option>
                    ))}
                    {employees.length === 0 && (
                      <>
                        <option value="emp-fallback-1">Kirubakaran (CTI-EMP-002) - Managing Director</option>
                        <option value="emp-fallback-2">Mahadevan (CTI-EMP-001) - Chief Executive Officer</option>
                        <option value="emp-fallback-3">Sarah Jenkins (CTI-EMP-004) - Lead Designer</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Salary Month *</label>
                  <select 
                    className="input-box"
                    name="month"
                    value={formData.month} 
                    onChange={_handleChange}
                    required
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', outline: 'none' }}
                  >
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Salary Year *</label>
                  <input 
                    type="number" 
                    name="year"
                    className="input-box" 
                    value={formData.year} 
                    onChange={_handleChange}
                    required 
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', outline: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Disbursement Date *</label>
                  <input 
                    type="date" 
                    name="paymentDate"
                    className="input-box" 
                    value={formData.paymentDate} 
                    onChange={_handleChange}
                    required 
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', outline: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label className="field-label" style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Payment Status</label>
                  <select 
                    className="input-box" 
                    name="status"
                    value={formData.status} 
                    onChange={_handleChange}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', outline: 'none' }}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Earnings & Allowances Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              
              {/* Allowances Card */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <h3 style={{ margin: 0, color: '#34d399', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={18} color="#34d399" />
                    <span>Earnings & Allowances</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                    Gross: ₹{totalEarnings.toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Basic Monthly Salary (₹) *</label>
                    <input 
                      type="number" 
                      name="basicSalary"
                      value={formData.basicSalary} 
                      onChange={_handleChange}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontWeight: 700, padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Performance Bonus (₹)</label>
                    <input 
                      type="number" 
                      name="bonus"
                      value={formData.bonus} 
                      onChange={_handleChange}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>House Rent Allowance (HRA ₹)</label>
                    <input 
                      type="number" 
                      name="hra"
                      value={formData.allowanceDetails.hra} 
                      onChange={_handleAllowanceChange}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Travel (₹)</label>
                      <input 
                        type="number" 
                        name="travel"
                        value={formData.allowanceDetails.travel} 
                        onChange={_handleAllowanceChange}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Medical (₹)</label>
                      <input 
                        type="number" 
                        name="medical"
                        value={formData.allowanceDetails.medical} 
                        onChange={_handleAllowanceChange}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions Card */}
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '16px', padding: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <h3 style={{ margin: 0, color: '#f87171', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="#f87171" />
                    <span>Statutory Deductions & Taxes</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                    Total: -₹{totalDeductions.toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Provident Fund (PF ₹)</label>
                    <input 
                      type="number" 
                      name="pf"
                      value={formData.deductionDetails.pf} 
                      onChange={_handleDeductionChange}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Income Tax (TDS ₹)</label>
                    <input 
                      type="number" 
                      name="incomeTax"
                      value={formData.deductionDetails.incomeTax} 
                      onChange={_handleDeductionChange}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Prof. Tax (₹)</label>
                      <input 
                        type="number" 
                        name="professionalTax"
                        value={formData.deductionDetails.professionalTax} 
                        onChange={_handleDeductionChange}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>ESI Tax (₹)</label>
                      <input 
                        type="number" 
                        name="esi"
                        value={formData.deductionDetails.esi} 
                        onChange={_handleDeductionChange}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Unpaid Leave Deductions (₹)</label>
                    <input 
                      type="number" 
                      name="leaveDeduction"
                      value={formData.deductionDetails.leaveDeduction} 
                      onChange={_handleDeductionChange}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Live Salary Calculation Callout Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(59, 130, 246, 0.15))',
              border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '16px', padding: '1.4rem 1.8rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Calculated Net Payable Salary
                </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Gross Earnings (₹{totalEarnings.toLocaleString()}) - Statutory Deductions (₹{totalDeductions.toLocaleString()})
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', textShadow: '0 0 20px rgba(52, 211, 153, 0.4)' }}>
                  ₹{netSalary.toLocaleString()}
                </span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#a7f3d0' }}>Final Amount for Voucher</span>
              </div>
            </div>

            {/* 4. Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setViewMode('list')}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                style={{
                  padding: '0.75rem 1.8rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff', fontWeight: 700, border: 'none',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                }}
              >
                <Sparkles size={18} />
                <span>{submitting ? 'Generating Payslip...' : 'Generate & Issue Payslip'}</span>
              </button>
            </div>

          </form>
        </Card>
      )}

      {/* Digital Payslip Modal */}
      {selectedPayslip && (
        <Modal 
          isOpen={isPayslipModalOpen} 
          onClose={() => setIsPayslipModalOpen(false)} 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={22} color="#10b981" />
              <span>Enterprise Digital Salary Voucher ({selectedPayslip.payslipId})</span>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', background: '#0f172a', padding: '1.8rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            
            {/* Company Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #10b981', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#10b981', fontWeight: 800 }}>CodeThrive Infotech Pvt Ltd</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Official Statement of Earnings - {selectedPayslip.month}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'block' }}>{selectedPayslip.payslipId}</span>
                <StatusBadge status={selectedPayslip.status || 'Paid'} />
              </div>
            </div>

            {/* Employee Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255, 255, 255, 0.04)', padding: '1rem 1.2rem', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee Name</span>
                <div style={{ fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>{selectedPayslip.employee?.fullName || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Staff ID</span>
                <div style={{ fontWeight: 700, color: '#a7f3d0', marginTop: '0.1rem' }}>{selectedPayslip.employee?.employeeId || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Designation / Department</span>
                <div style={{ color: '#e2e8f0', marginTop: '0.1rem' }}>{selectedPayslip.employee?.designation || 'Software Engineer'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disbursement Date</span>
                <div style={{ color: '#e2e8f0', marginTop: '0.1rem' }}>{selectedPayslip.paymentDate}</div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* Earnings */}
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', color: '#34d399', fontSize: '0.95rem' }}>Gross Earnings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Basic Salary</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>₹{(selectedPayslip.basicSalary || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>HRA Allowance</span>
                    <span style={{ color: '#fff' }}>₹{(selectedPayslip.allowanceDetails?.hra || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Travel & Medical</span>
                    <span style={{ color: '#fff' }}>₹{((selectedPayslip.allowanceDetails?.travel || 0) + (selectedPayslip.allowanceDetails?.medical || 0)).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '0.4rem', fontWeight: 700 }}>
                    <span style={{ color: '#34d399' }}>Gross Total</span>
                    <span style={{ color: '#34d399' }}>₹{(selectedPayslip.grossSalary || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', color: '#f87171', fontSize: '0.95rem' }}>Statutory Deductions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Provident Fund (PF)</span>
                    <span style={{ color: '#fff' }}>₹{(selectedPayslip.deductionDetails?.pf || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Professional Tax</span>
                    <span style={{ color: '#fff' }}>₹{(selectedPayslip.deductionDetails?.professionalTax || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Income Tax (TDS)</span>
                    <span style={{ color: '#fff' }}>₹{(selectedPayslip.deductionDetails?.incomeTax || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '0.4rem', fontWeight: 700 }}>
                    <span style={{ color: '#f87171' }}>Total Deductions</span>
                    <span style={{ color: '#f87171' }}>-₹{(selectedPayslip.deductions || 8200).toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Net Amount Callout */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
              padding: '1.2rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.5)'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 600 }}>Net Take-Home Pay</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Directly deposited to registered bank account</div>
              </div>
              <span style={{ fontWeight: 800, fontSize: '2rem', color: '#34d399' }}>
                ₹{(selectedPayslip.netPayable || 0).toLocaleString()}
              </span>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => downloadPayslipPDF(selectedPayslip)}>
                <Download size={16} /> Download PDF
              </button>
              <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                <Printer size={16} /> Print Voucher
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setIsPayslipModalOpen(false)}>
                Done
              </button>
            </div>

          </div>
        </Modal>
      )}

    </motion.div>
  );
};

export default AdminPayroll;
