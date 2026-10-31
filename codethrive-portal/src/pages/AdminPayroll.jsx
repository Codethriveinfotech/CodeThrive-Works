import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/dateUtils';
import DateInput from '../components/common/DateInput';
import { 
  createOfficialCodeThriveDoc, 
  exportOfficialWordDoc, 
  getCorporateTableStyles,
  formatCurrencyINR
} from '../utils/pdfLetterhead';
import { generatePsgStylePayslipPdf } from '../utils/psgPayslipPdf.js';
import { 
  Banknote, Plus, Search, CheckCircle2, X, Zap, Eye, Printer, Users, 
  Sparkles, DollarSign, TrendingUp, ShieldCheck, Download, FileText,
  FileCheck, Paperclip, Receipt, Clock
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

const _DEFAULT_PAYROLLS = [
  {
    _id: 'ps-1',
    payslipId: 'CTI-PSL-2026-001',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Paid',
    grossSalary: 85000,
    netPayable: 73000,
    basicSalary: 55000,
    bonus: 0,
    deductions: 12000,
    allowanceDetails: { hra: 13750, travel: 3000, medical: 2000, da: 5500, conveyance: 4250, other: 1500 },
    deductionDetails: { pf: 6600, esi: 0, professionalTax: 200, incomeTax: 5000, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 2, balance: 10 }, el: { eligible: 15, availed: 3, balance: 12 }, ml: { eligible: 0, availed: 0, balance: 0 }, lop: 0 },
    employeeInfo: { dob: '1990-05-15', doj: '2022-01-10', bankAcNo: 'XXXX-XXXX-4521', pfNo: 'TN/CBE/0012345/001', esiNo: '', pfPercent: 12 },
    employee: { fullName: 'Mahadevan R', employeeId: 'CTI-2026-CEO', department: 'Executive Management', designation: 'Chief Executive Officer' }
  },
  {
    _id: 'ps-2',
    payslipId: 'CTI-PSL-2026-002',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Paid',
    grossSalary: 80000,
    netPayable: 69600,
    basicSalary: 50000,
    bonus: 0,
    deductions: 10400,
    allowanceDetails: { hra: 12500, travel: 3000, medical: 2000, da: 5000, conveyance: 4500, other: 3000 },
    deductionDetails: { pf: 6000, esi: 0, professionalTax: 200, incomeTax: 4000, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 1, balance: 11 }, el: { eligible: 15, availed: 0, balance: 15 }, ml: { eligible: 0, availed: 0, balance: 0 }, lop: 0 },
    employeeInfo: { dob: '1998-03-22', doj: '2024-01-15', bankAcNo: 'XXXX-XXXX-7832', pfNo: 'TN/CBE/0012345/002', esiNo: '', pfPercent: 12 },
    employee: { fullName: 'Kirubakaran V', employeeId: 'CTI-2026-001', department: 'Engineering & Executive Board', designation: 'Managing Director & Lead Developer' }
  },
  {
    _id: 'ps-3',
    payslipId: 'CTI-PSL-2026-003',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Paid',
    grossSalary: 75000,
    netPayable: 65100,
    basicSalary: 45000,
    bonus: 0,
    deductions: 9900,
    allowanceDetails: { hra: 11250, travel: 2500, medical: 1800, da: 4500, conveyance: 3950, other: 6000 },
    deductionDetails: { pf: 5400, esi: 0, professionalTax: 200, incomeTax: 4100, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 3, balance: 9 }, el: { eligible: 15, availed: 2, balance: 13 }, ml: { eligible: 0, availed: 0, balance: 0 }, lop: 0 },
    employeeInfo: { dob: '1997-08-14', doj: '2024-03-01', bankAcNo: 'XXXX-XXXX-9156', pfNo: 'TN/CBE/0012345/003', esiNo: '', pfPercent: 12 },
    employee: { fullName: 'Saravanan R', employeeId: 'CTI-2026-002', department: 'Design & Frontend', designation: 'Frontend UI/UX Specialist' }
  },
  {
    _id: 'ps-4',
    payslipId: 'CTI-PSL-2026-004',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Paid',
    grossSalary: 65000,
    netPayable: 56800,
    basicSalary: 40000,
    bonus: 0,
    deductions: 8200,
    allowanceDetails: { hra: 10000, travel: 2500, medical: 1500, da: 4000, conveyance: 3500, other: 3500 },
    deductionDetails: { pf: 4800, esi: 0, professionalTax: 200, incomeTax: 3000, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 0, balance: 12 }, el: { eligible: 15, availed: 1, balance: 14 }, ml: { eligible: 0, availed: 0, balance: 0 }, lop: 0 },
    employeeInfo: { dob: '1999-11-03', doj: '2024-05-10', bankAcNo: 'XXXX-XXXX-6478', pfNo: 'TN/CBE/0012345/004', esiNo: '', pfPercent: 12 },
    employee: { fullName: 'Priya Dharshini M', employeeId: 'CTI-2026-003', department: 'Quality Assurance', designation: 'QA & Automation Engineer' }
  },
  {
    _id: 'ps-5',
    payslipId: 'CTI-PSL-2026-005',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Paid',
    grossSalary: 62000,
    netPayable: 54200,
    basicSalary: 38000,
    bonus: 0,
    deductions: 7800,
    allowanceDetails: { hra: 9500, travel: 2500, medical: 1500, da: 3800, conveyance: 3200, other: 3500 },
    deductionDetails: { pf: 4560, esi: 0, professionalTax: 200, incomeTax: 2840, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 4, balance: 8 }, el: { eligible: 15, availed: 5, balance: 10 }, ml: { eligible: 0, availed: 0, balance: 0 }, lop: 0 },
    employeeInfo: { dob: '1996-01-25', doj: '2024-06-01', bankAcNo: 'XXXX-XXXX-3345', pfNo: 'TN/CBE/0012345/005', esiNo: '', pfPercent: 12 },
    employee: { fullName: 'Arjun Kumar S', employeeId: 'CTI-2026-004', department: 'Backend Engineering', designation: 'Node.js Backend Developer' }
  },
  {
    _id: 'ps-6',
    payslipId: 'CTI-PSL-2026-006',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Paid',
    grossSalary: 58000,
    netPayable: 51000,
    basicSalary: 35000,
    bonus: 0,
    deductions: 7000,
    allowanceDetails: { hra: 8750, travel: 2000, medical: 1500, da: 3500, conveyance: 3250, other: 4000 },
    deductionDetails: { pf: 4200, esi: 0, professionalTax: 200, incomeTax: 2400, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 2, balance: 10 }, el: { eligible: 15, availed: 0, balance: 15 }, ml: { eligible: 6, availed: 0, balance: 6 }, lop: 0 },
    employeeInfo: { dob: '2000-06-18', doj: '2025-01-15', bankAcNo: 'XXXX-XXXX-1198', pfNo: 'TN/CBE/0012345/006', esiNo: '', pfPercent: 12 },
    employee: { fullName: 'Deepika N', employeeId: 'CTI-2026-005', department: 'DevOps & Cloud', designation: 'Cloud Infrastructure Engineer' }
  },
  {
    _id: 'ps-7',
    payslipId: 'CTI-PSL-2026-007',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Paid',
    grossSalary: 55000,
    netPayable: 48500,
    basicSalary: 33000,
    bonus: 0,
    deductions: 6500,
    allowanceDetails: { hra: 8250, travel: 2000, medical: 1500, da: 3300, conveyance: 2950, other: 4000 },
    deductionDetails: { pf: 3960, esi: 0, professionalTax: 200, incomeTax: 2140, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 1, balance: 11 }, el: { eligible: 15, availed: 2, balance: 13 }, ml: { eligible: 0, availed: 0, balance: 0 }, lop: 0 },
    employeeInfo: { dob: '1998-09-07', doj: '2025-02-01', bankAcNo: 'XXXX-XXXX-8876', pfNo: 'TN/CBE/0012345/007', esiNo: '', pfPercent: 12 },
    employee: { fullName: 'Karthik Raja P', employeeId: 'CTI-2026-006', department: 'Mobile Development', designation: 'React Native Developer' }
  },
  {
    _id: 'ps-8',
    payslipId: 'CTI-PSL-2026-008',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Processing',
    grossSalary: 52000,
    netPayable: 46000,
    basicSalary: 32000,
    bonus: 0,
    deductions: 6000,
    allowanceDetails: { hra: 8000, travel: 2000, medical: 1200, da: 3200, conveyance: 2600, other: 3000 },
    deductionDetails: { pf: 3840, esi: 0, professionalTax: 200, incomeTax: 1760, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 5, balance: 7 }, el: { eligible: 15, availed: 3, balance: 12 }, ml: { eligible: 0, availed: 0, balance: 0 }, lop: 1 },
    employeeInfo: { dob: '2001-02-12', doj: '2025-04-01', bankAcNo: 'XXXX-XXXX-5543', pfNo: 'TN/CBE/0012345/008', esiNo: 'TN/CBE/ESI/0008', pfPercent: 12 },
    employee: { fullName: 'Vishnu Priya R', employeeId: 'CTI-2026-007', department: 'Content & Marketing', designation: 'Digital Marketing Analyst' }
  },
  {
    _id: 'ps-9',
    payslipId: 'CTI-PSL-2026-009',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Processing',
    grossSalary: 48000,
    netPayable: 42700,
    basicSalary: 30000,
    bonus: 0,
    deductions: 5300,
    allowanceDetails: { hra: 7500, travel: 1500, medical: 1200, da: 3000, conveyance: 2300, other: 2500 },
    deductionDetails: { pf: 3600, esi: 0, professionalTax: 200, incomeTax: 1300, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 0, balance: 12 }, el: { eligible: 15, availed: 0, balance: 15 }, ml: { eligible: 0, availed: 0, balance: 0 }, lop: 0 },
    employeeInfo: { dob: '2000-12-30', doj: '2025-07-15', bankAcNo: 'XXXX-XXXX-2267', pfNo: 'TN/CBE/0012345/009', esiNo: 'TN/CBE/ESI/0009', pfPercent: 12 },
    employee: { fullName: 'Surya Prakash T', employeeId: 'CTI-2026-008', department: 'Full Stack Engineering', designation: 'Junior MERN Stack Developer' }
  },
  {
    _id: 'ps-10',
    payslipId: 'CTI-PSL-2026-010',
    month: 'October 2026',
    paymentDate: '2026-10-28',
    status: 'Pending',
    grossSalary: 42000,
    netPayable: 37500,
    basicSalary: 25000,
    bonus: 0,
    deductions: 4500,
    allowanceDetails: { hra: 6250, travel: 1500, medical: 1000, da: 2500, conveyance: 2250, other: 3500 },
    deductionDetails: { pf: 3000, esi: 0, professionalTax: 200, incomeTax: 1100, leaveDeduction: 0, loanAdvance: 0, other: 200 },
    leaveStatus: { cl: { eligible: 12, availed: 6, balance: 6 }, el: { eligible: 15, availed: 4, balance: 11 }, ml: { eligible: 0, availed: 0, balance: 0 }, lop: 2 },
    employeeInfo: { dob: '2002-04-08', doj: '2026-04-03', bankAcNo: 'XXXX-XXXX-9901', pfNo: 'TN/CBE/0012345/010', esiNo: 'TN/CBE/ESI/0010', pfPercent: 12 },
    employee: { fullName: 'Nandhini S', employeeId: 'CTI-2026-009', department: 'HR & Administration', designation: 'HR Executive & Admin Coordinator' }
  }
];

const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'individual', 'bulk', 'claims'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Expense Claims State
  const [expenseClaims, setExpenseClaims] = useState(() => {
    try {
      const stored = localStorage.getItem('cti_expense_claims');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    localStorage.setItem('cti_expense_claims', JSON.stringify(DEFAULT_EXPENSE_CLAIMS));
    return DEFAULT_EXPENSE_CLAIMS;
  });

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
  const [selectedClaimDetail, setSelectedClaimDetail] = useState(null);

  const [formData, setFormData] = useState({
    month: currentMonthName,
    year: currentYearStr,
    paymentDate: todayStr,
    status: 'Paid',
    basicSalary: 45000,
    paidLeaveDays: 2,
    allowanceDetails: { travel: 2500, medical: 1500 },
    deductionDetails: { leaveDeduction: 0 }
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
      
      // If local storage is empty, initialize with 10 default staff payrolls
      const basePayrolls = localPayrolls.length > 0 ? localPayrolls : _DEFAULT_PAYROLLS;
      if (localPayrolls.length === 0) {
        localStorage.setItem('cti_shared_payrolls', JSON.stringify(_DEFAULT_PAYROLLS));
      }

      const combined = [...apiPayrolls, ...basePayrolls];
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
      setFormData(prev => ({
        ...prev,
        basicSalary: basic,
        paidLeaveDays: 2,
        allowanceDetails: { travel: 2500, medical: 1500 },
        deductionDetails: { leaveDeduction: 0 }
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
      [name]: name === 'basicSalary' || name === 'paidLeaveDays' ? (Number(value) || 0) : value 
    }));
  };

  const totalAllowances = (formData.allowanceDetails.travel || 0) + (formData.allowanceDetails.medical || 0);
  const totalDeductions = formData.deductionDetails.leaveDeduction || 0;
  const totalEarnings = (formData.basicSalary || 0) + totalAllowances;
  const netSalary = totalEarnings - totalDeductions;

  const downloadExpenseBill = async (claim) => {
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

      // Official Letterhead PDF Voucher
      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'EXPENSE REIMBURSEMENT BILL VOUCHER',
        metaFields: [
          { label: 'Claim ID Ref', value: claim.claimId || 'EXP-2026' },
          { label: 'Employee Name', value: claim.employeeName || 'Staff Member' },
          { label: 'Employee ID', value: claim.employeeId || 'CTI-EMP-001' },
          { label: 'Expense Category', value: (claim.category || 'Expense').toUpperCase() },
          { label: 'Expense Date', value: formatDate(claim.expenseDate || claim.submittedAt) },
          { label: 'Verification Status', value: (claim.status || 'Pending').toUpperCase() }
        ]
      });

      const billTable = [
        ['Claim Reference:', claim.claimId || '-', 'Submitted Date:', formatDate(claim.submittedAt || claim.expenseDate)],
        ['Employee Name:', claim.employeeName || 'Staff Member', 'Employee ID:', claim.employeeId || 'CTI-EMP-001'],
        ['Expense Category:', claim.category || 'Travel Expense', 'Expense Date:', formatDate(claim.expenseDate)],
        ['Approved Amount:', formatCurrencyINR(claim.amount || 0), 'Attached Bill File:', claim.fileName || 'Official_Bill_Receipt.pdf'],
        ['Claim Description:', claim.description || 'Verified travel/medical reimbursement claim.', '', '']
      ];

      const autoTableFn = autoTable || doc.autoTable;
      autoTableFn(doc, {
        startY: startY,
        body: billTable,
        ...getCorporateTableStyles(),
        columnStyles: {
          0: { fontStyle: 'bold', width: 45 },
          1: { width: 55 },
          2: { fontStyle: 'bold', width: 45 },
          3: { width: 45 }
        }
      });

      finalizeDoc(`${claim.claimId || 'Claim'}_${(claim.category || 'Expense').replace(/\s+/g, '_')}_Bill.pdf`);
    } catch (err) {
      alert('Failed to download bill: ' + err.message);
    }
  };

  const downloadExpenseBillWord = (claim) => {
    try {
      exportOfficialWordDoc({
        title: 'EXPENSE REIMBURSEMENT BILL VOUCHER',
        metaFields: [
          { label: 'Claim ID Ref', value: claim.claimId || 'EXP-2026' },
          { label: 'Employee Name', value: claim.employeeName || 'Staff Member' },
          { label: 'Employee ID', value: claim.employeeId || 'CTI-EMP-001' },
          { label: 'Expense Category', value: (claim.category || 'Expense').toUpperCase() },
          { label: 'Expense Date', value: formatDate(claim.expenseDate || claim.submittedAt) },
          { label: 'Verification Status', value: (claim.status || 'Pending').toUpperCase() }
        ],
        tableHeaders: ['Particulars', 'Claim Details'],
        tableRows: [
          ['Claim ID Reference', claim.claimId || '-'],
          ['Employee Full Name', claim.employeeName || 'Staff Member'],
          ['Employee ID', claim.employeeId || 'CTI-EMP-001'],
          ['Expense Category', claim.category || 'Expense'],
          ['Expense Date', formatDate(claim.expenseDate)],
          ['Submitted At', formatDate(claim.submittedAt || claim.expenseDate)],
          ['Reimbursement Claim Amount', formatCurrencyINR(claim.amount || 0)],
          ['Expense Purpose & Description', claim.description || 'Business expense reimbursement claim.'],
          ['Approval Status', (claim.status || 'Pending').toUpperCase()]
        ],
        fileName: `${claim.claimId || 'Claim'}_${(claim.category || 'Expense').replace(/\s+/g, '_')}_Bill.doc`
      });
    } catch (err) {
      alert('Failed to export Word bill voucher: ' + err.message);
    }
  };

  const handleApproveClaim = (claimId) => {
    const updated = expenseClaims.map(c => c._id === claimId ? { ...c, status: 'Approved' } : c);
    setExpenseClaims(updated);
    localStorage.setItem('cti_expense_claims', JSON.stringify(updated));
    alert('Expense Claim Approved Successfully!');
  };

  const handleRejectClaim = (claimId) => {
    const updated = expenseClaims.map(c => c._id === claimId ? { ...c, status: 'Rejected' } : c);
    setExpenseClaims(updated);
    localStorage.setItem('cti_expense_claims', JSON.stringify(updated));
    alert('Expense Claim Status Updated to Rejected.');
  };

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

  const downloadPayslipPDF = async (payslip) => {
    try {
      await generatePsgStylePayslipPdf({
        payslip,
        overrideMonth: payslip.month,
        overrideDate: payslip.paymentDate
      });
      return;
      const basic = payslip.basicSalary || 0;
      const da = payslip.allowanceDetails?.da || 0;
      const hra = payslip.allowanceDetails?.hra || 0;
      const conveyance = payslip.allowanceDetails?.conveyance || 0;
      const travel = payslip.allowanceDetails?.travel || 0;
      const medical = payslip.allowanceDetails?.medical || 0;
      const otherAllowance = payslip.allowanceDetails?.other || 0;

      const pf = payslip.deductionDetails?.pf || 0;
      const esi = payslip.deductionDetails?.esi || 0;
      const profTax = payslip.deductionDetails?.professionalTax || 0;
      const incomeTax = payslip.deductionDetails?.incomeTax || 0;
      const loanAdv = payslip.deductionDetails?.loanAdvance || 0;
      const leaveDed = payslip.deductionDetails?.leaveDeduction || 0;
      const otherDed = payslip.deductionDetails?.other || 0;

      const empName = payslip.employee?.fullName || 'Staff Member';
      const empId = payslip.employee?.employeeId || 'CTI-EMP-001';

      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'OFFICIAL MONTHLY PAYSLIP',
        metaFields: [
          { label: 'Employee Name', value: empName },
          { label: 'Employee ID', value: empId },
          { label: 'Pay Period Month', value: payslip.month || 'N/A' },
          { label: 'Designation', value: payslip.employee?.designation || 'Staff' },
          { label: 'Department', value: payslip.employee?.department || 'Engineering' },
          { label: 'Payslip ID', value: payslip.payslipId || 'PAY-2026' },
          { label: 'DOB', value: payslip.employeeInfo?.dob ? new Date(payslip.employeeInfo.dob).toLocaleDateString('en-IN') : '-' },
          { label: 'DOJ', value: payslip.employeeInfo?.doj ? new Date(payslip.employeeInfo.doj).toLocaleDateString('en-IN') : '-' },
          { label: 'Bank A/C No', value: payslip.employeeInfo?.bankAcNo || '-' },
          { label: 'PF No', value: payslip.employeeInfo?.pfNo || '-' },
          { label: 'PF %', value: `${payslip.employeeInfo?.pfPercent || 12}%` },
          { label: 'Payment Status', value: (payslip.status || 'Paid').toUpperCase() }
        ]
      });

      const autoTableFn = autoTable || doc.autoTable;

      // Earnings & Deductions Table
      autoTableFn(doc, {
        startY: startY,
        head: [['EARNINGS & ALLOWANCES', 'AMOUNT (₹)', 'STATUTORY DEDUCTIONS', 'AMOUNT (₹)']],
        body: [
          ['Basic Salary', formatCurrencyINR(basic), 'Provident Fund (EPF)', formatCurrencyINR(pf)],
          ['Dearness Allowance (DA)', formatCurrencyINR(da), 'Professional Tax (PT)', formatCurrencyINR(profTax)],
          ['House Rent Allowance (HRA)', formatCurrencyINR(hra), 'Income Tax (TDS)', formatCurrencyINR(incomeTax)],
          ['Conveyance Allowance', formatCurrencyINR(conveyance), 'ESI Contribution', formatCurrencyINR(esi)],
          ['Travel Allowance', formatCurrencyINR(travel), 'Loan / Advance Recovery', formatCurrencyINR(loanAdv)],
          ['Medical Allowance', formatCurrencyINR(medical), 'Leave Deduction', formatCurrencyINR(leaveDed)],
          ['Special / Other Allowance', formatCurrencyINR(otherAllowance), 'Other Deductions', formatCurrencyINR(otherDed)],
          ['GROSS EARNINGS', formatCurrencyINR(payslip.grossSalary || 0), 'TOTAL DEDUCTIONS', formatCurrencyINR(payslip.deductions || 0)],
          ['NET PAYABLE AMOUNT', formatCurrencyINR(payslip.netPayable || 0), 'PAYMENT MODE', 'DIRECT BANK TRANSFER']
        ],
        ...getCorporateTableStyles(),
        didParseCell: function(data) {
          if (data.row.index === 7 || data.row.index === 8) {
            data.cell.styles.fontStyle = 'bold';
            if (data.row.index === 8) {
              data.cell.styles.fillColor = [224, 242, 254];
              data.cell.styles.textColor = [3, 105, 161];
            }
          }
        }
      });

      // Leave Status Table
      const leaveTableStartY = doc.lastAutoTable.finalY + 6;
      autoTableFn(doc, {
        startY: leaveTableStartY,
        head: [['LEAVE STATUS', 'CL', 'EL', 'ML', 'LOP DAYS']],
        body: [
          ['Eligible', String(payslip.leaveStatus?.cl?.eligible ?? 12), String(payslip.leaveStatus?.el?.eligible ?? 15), String(payslip.leaveStatus?.ml?.eligible ?? 0), ''],
          ['Availed', String(payslip.leaveStatus?.cl?.availed ?? 0), String(payslip.leaveStatus?.el?.availed ?? 0), String(payslip.leaveStatus?.ml?.availed ?? 0), String(payslip.leaveStatus?.lop ?? 0)],
          ['Balance', String(payslip.leaveStatus?.cl?.balance ?? 12), String(payslip.leaveStatus?.el?.balance ?? 15), String(payslip.leaveStatus?.ml?.balance ?? 0), '']
        ],
        ...getCorporateTableStyles(),
        headStyles: {
          ...getCorporateTableStyles().headStyles,
          fillColor: [30, 41, 59]
        }
      });

      const fileName = `Payslip_${payslip.payslipId || '2026'}_${(payslip.month || 'Month').replace(/\s+/g, '_')}.pdf`;
      finalizeDoc(fileName);
    } catch (err) {
      console.error('PDF Generation Failed', err);
      alert('Could not generate PDF: ' + err.message);
    }
  };

  const downloadPayslipWord = (payslip) => {
    try {
      const basic = payslip.basicSalary || 0;
      const da = payslip.allowanceDetails?.da || 0;
      const hra = payslip.allowanceDetails?.hra || 0;
      const conveyance = payslip.allowanceDetails?.conveyance || 0;
      const travel = payslip.allowanceDetails?.travel || 0;
      const medical = payslip.allowanceDetails?.medical || 0;
      const otherAllowance = payslip.allowanceDetails?.other || 0;

      const pf = payslip.deductionDetails?.pf || 0;
      const esi = payslip.deductionDetails?.esi || 0;
      const profTax = payslip.deductionDetails?.professionalTax || 0;
      const incomeTax = payslip.deductionDetails?.incomeTax || 0;
      const loanAdv = payslip.deductionDetails?.loanAdvance || 0;
      const otherDed = payslip.deductionDetails?.other || 0;

      const empName = payslip.employee?.fullName || 'Staff Member';
      const empId = payslip.employee?.employeeId || 'CTI-EMP-001';

      exportOfficialWordDoc({
        title: 'OFFICIAL MONTHLY PAYSLIP',
        metaFields: [
          { label: 'Employee Name', value: empName },
          { label: 'Employee ID', value: empId },
          { label: 'Pay Period Month', value: payslip.month || 'N/A' },
          { label: 'Designation', value: payslip.employee?.designation || 'Staff' },
          { label: 'Department', value: payslip.employee?.department || 'Engineering' },
          { label: 'Payslip ID', value: payslip.payslipId || 'PAY-2026' },
          { label: 'DOB', value: payslip.employeeInfo?.dob ? new Date(payslip.employeeInfo.dob).toLocaleDateString('en-IN') : '-' },
          { label: 'DOJ', value: payslip.employeeInfo?.doj ? new Date(payslip.employeeInfo.doj).toLocaleDateString('en-IN') : '-' },
          { label: 'Bank A/C No', value: payslip.employeeInfo?.bankAcNo || '-' },
          { label: 'PF No', value: payslip.employeeInfo?.pfNo || '-' },
          { label: 'Payment Status', value: (payslip.status || 'Paid').toUpperCase() }
        ],
        tableHeaders: ['EARNINGS / ALLOWANCES', 'AMOUNT (₹)', 'DEDUCTIONS', 'AMOUNT (₹)'],
        tableRows: [
          ['Basic Salary', formatCurrencyINR(basic), 'Provident Fund (EPF)', formatCurrencyINR(pf)],
          ['Dearness Allowance (DA)', formatCurrencyINR(da), 'Professional Tax (PT)', formatCurrencyINR(profTax)],
          ['House Rent Allowance (HRA)', formatCurrencyINR(hra), 'Income Tax (TDS)', formatCurrencyINR(incomeTax)],
          ['Conveyance Allowance', formatCurrencyINR(conveyance), 'ESI Contribution', formatCurrencyINR(esi)],
          ['Travel Allowance', formatCurrencyINR(travel), 'Loan / Advance Recovery', formatCurrencyINR(loanAdv)],
          ['Medical Allowance', formatCurrencyINR(medical), 'Other Deductions', formatCurrencyINR(otherDed)],
          ['Special / Other Allowance', formatCurrencyINR(otherAllowance), '', ''],
          ['GROSS EARNINGS', formatCurrencyINR(payslip.grossSalary || 0), 'TOTAL DEDUCTIONS', formatCurrencyINR(payslip.deductions || 0)],
          ['NET PAYABLE SALARY', formatCurrencyINR(payslip.netPayable || 0), 'PAYMENT MODE', 'BANK TRANSFER']
        ],
        fileName: `Payslip_${payslip.payslipId || '2026'}_${(payslip.month || 'Month').replace(/\s+/g, '_')}.doc`
      });
    } catch (err) {
      alert('Error generating Word payslip: ' + err.message);
    }
  };

  const exportFullPayrollPDF = async () => {
    try {
      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'ORGANIZATION MASTER PAYROLL AUDIT STATEMENT',
        metaFields: [
          { label: 'Organization', value: 'CodeThrive Infotech Pvt Ltd' },
          { label: 'Report Date', value: formatDate(new Date()) },
          { label: 'Total Payroll Records', value: `${filteredPayrolls.length} Records` },
          { label: 'Disbursement Status', value: 'Processed & Verified' }
        ]
      });

      const tableColumn = ["Payslip ID", "Employee Name", "Department", "Pay Period", "Gross Salary", "Deductions", "Net Payable", "Status"];
      const tableRows = filteredPayrolls.map(p => [
        p.payslipId || '-',
        p.employee?.fullName || 'Employee',
        p.employee?.department || '-',
        p.month || '-',
        formatCurrencyINR(p.grossSalary || 0),
        formatCurrencyINR(p.deductions || 0),
        formatCurrencyINR(p.netPayable || 0),
        p.status || 'Paid'
      ]);

      const autoTableFn = autoTable || doc.autoTable;
      autoTableFn(doc, {
        startY: startY,
        head: [tableColumn],
        body: tableRows,
        ...getCorporateTableStyles()
      });

      finalizeDoc(`Master_Payroll_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      alert('Could not export full payroll PDF: ' + err.message);
    }
  };

  const exportFullPayrollWord = () => {
    try {
      const tableColumn = ["Payslip ID", "Employee Name", "Department", "Pay Period", "Gross Salary", "Deductions", "Net Payable", "Status"];
      const tableRows = filteredPayrolls.map(p => [
        p.payslipId || '-',
        p.employee?.fullName || 'Employee',
        p.employee?.department || '-',
        p.month || '-',
        formatCurrencyINR(p.grossSalary || 0),
        formatCurrencyINR(p.deductions || 0),
        formatCurrencyINR(p.netPayable || 0),
        p.status || 'Paid'
      ]);

      exportOfficialWordDoc({
        title: 'ORGANIZATION MASTER PAYROLL AUDIT STATEMENT',
        metaFields: [
          { label: 'Organization', value: 'CodeThrive Infotech Pvt Ltd' },
          { label: 'Report Date', value: formatDate(new Date()) },
          { label: 'Total Payroll Records', value: `${filteredPayrolls.length} Records` }
        ],
        tableHeaders: tableColumn,
        tableRows: tableRows,
        fileName: `Master_Payroll_Report_${new Date().toISOString().slice(0,10)}.doc`
      });
    } catch (err) {
      alert('Could not export full payroll Word doc: ' + err.message);
    }
  };

  const exportFullPayrollExcel = () => {
    try {
      const excelData = filteredPayrolls.map(p => ({
        'Payslip ID': p.payslipId || '-',
        'Employee ID': p.employee?.employeeId || '-',
        'Employee Name': p.employee?.fullName || '-',
        'Department': p.employee?.department || '-',
        'Designation': p.employee?.designation || '-',
        'Pay Period': p.month || '-',
        'Basic Salary': p.basicSalary || 0,
        'Gross Salary': p.grossSalary || 0,
        'Deductions': p.deductions || 0,
        'Net Payable': p.netPayable || 0,
        'Status': p.status || 'Paid'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Summary");
      XLSX.writeFile(workbook, `Payroll_Summary_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err) {
      alert('Could not export Excel: ' + err.message);
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

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {viewMode === 'list' ? (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Left Group: Create Single Payslip (top) & Bulk Payroll (below) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <button 
                  onClick={() => setViewMode('individual')}
                  style={{
                    padding: '0.65rem 1.15rem', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff', fontWeight: 700, border: 'none',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer',
                    fontSize: '0.88rem'
                  }}
                >
                  <span>Create Single Payslip</span>
                </button>
                <button 
                  onClick={() => setViewMode('bulk')}
                  style={{
                    padding: '0.65rem 1.15rem', borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    fontSize: '0.88rem'
                  }}
                >
                  <Zap size={15} />
                  <span>1-Click Bulk Payroll</span>
                </button>
              </div>

              {/* Right Group: Expense Bills Audit & Master PDF */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <button 
                  onClick={() => setViewMode(viewMode === 'claims' ? 'list' : 'claims')}
                  style={{
                    padding: '0.65rem 1.15rem', borderRadius: '10px',
                    background: viewMode === 'claims' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.15)',
                    border: '1px solid rgba(236, 72, 153, 0.35)',
                    color: '#f472b6', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    fontSize: '0.88rem'
                  }}
                >
                  <Receipt size={15} />
                  <span>Expense Bills Audit</span>
                  {expenseClaims.filter(c => c.status === 'Pending').length > 0 && (
                    <span style={{
                      background: '#ef4444', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                      padding: '2px 7px', borderRadius: '10px', marginLeft: '3px'
                    }}>
                      {expenseClaims.filter(c => c.status === 'Pending').length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={exportFullPayrollPDF}
                  title="Download Organization Master Payroll Statement PDF"
                  style={{
                    padding: '0.65rem 1.15rem', borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#a5b4fc', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    fontSize: '0.88rem'
                  }}
                >
                  <Download size={15} />
                  <span>Export Master PDF</span>
                </button>
              </div>
            </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
          
          {/* Card 1: Total Payroll Disbursed */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.75))',
            borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.25rem',
            position: 'relative', overflow: 'hidden', backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column', gap: '0.8rem'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={20} color="#34d399" />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.6px', color: '#a7f3d0', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                DISBURSED
              </span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.5px' }}>
                ₹{stats.totalDisbursed.toLocaleString()}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.86rem', color: '#e2e8f0', fontWeight: 600 }}>Total Payroll Disbursed</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Monthly Net Disbursement</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 7px', borderRadius: '5px' }}>Released</span>
            </div>
          </div>

          {/* Card 2: Payslips Processed */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.12), rgba(15, 23, 42, 0.75))',
            borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1.25rem',
            position: 'relative', overflow: 'hidden', backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column', gap: '0.8rem'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} color="#a5b4fc" />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.6px', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.15)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                PROCESSED
              </span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#a5b4fc', letterSpacing: '-0.5px' }}>
                {stats.paidCount}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.86rem', color: '#e2e8f0', fontWeight: 600 }}>Payslips Processed</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Completed & Released</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 7px', borderRadius: '5px' }}>Issued</span>
            </div>
          </div>

          {/* Card 3: Pending Release */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.75))',
            borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1.25rem',
            position: 'relative', overflow: 'hidden', backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column', gap: '0.8rem'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color="#fbbf24" />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.6px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                PENDING
              </span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.5px' }}>
                {stats.processingCount}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.86rem', color: '#e2e8f0', fontWeight: 600 }}>Pending Release</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Processing Approval</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 7px', borderRadius: '5px' }}>Pending</span>
            </div>
          </div>

          {/* Card 4: Average Employee Payout */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.12), rgba(15, 23, 42, 0.75))',
            borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '1.25rem',
            position: 'relative', overflow: 'hidden', backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column', gap: '0.8rem'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #a855f7, #7e22ce)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} color="#c084fc" />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.6px', color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                AVERAGE
              </span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#c084fc', letterSpacing: '-0.5px' }}>
                ₹{stats.avgSalary.toLocaleString()}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.86rem', color: '#e2e8f0', fontWeight: 600 }}>Average Employee Payout</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Per Staff Net Average</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '2px 7px', borderRadius: '5px' }}>Average</span>
            </div>
          </div>

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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button 
                onClick={exportFullPayrollPDF}
                style={{
                  padding: '0.45rem 0.85rem', borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <Download size={14} /> Master PDF
              </button>
              <button 
                onClick={exportFullPayrollWord}
                style={{
                  padding: '0.45rem 0.85rem', borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.3)',
                  color: '#60a5fa', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <FileText size={14} /> Master Word
              </button>
              <button 
                onClick={exportFullPayrollExcel}
                style={{
                  padding: '0.45rem 0.85rem', borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <Download size={14} /> Excel
              </button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                Total: <strong style={{ color: '#fff' }}>{filteredPayrolls.length}</strong>
              </span>
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Payslip ID</th>
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
                    <td style={{ padding: '0.85rem 1rem', borderRadius: '12px 0 0 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399', letterSpacing: '0.2px' }}>
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
                          title="Download Official PDF Statement"
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

      {/* Submitted Expense Claims & Bills View */}
      {viewMode === 'claims' && (
        <Card style={{ background: 'rgba(15, 23, 42, 0.85)', borderRadius: '20px', border: '1px solid rgba(236, 72, 153, 0.35)', padding: '1.25rem', backdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #ec4899, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(236,72,153,0.4)' }}>
                <Receipt size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: 800 }}>Employee Expense Claims & Submitted Bills Audit</h2>
                <p style={{ margin: '0.2rem 0 0 0', color: '#fbcfe8', fontSize: '0.85rem' }}>
                  Review employee travel & medical bill submissions, download attached bill documents, and approve reimbursement.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setViewMode('list')}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '10px', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <X size={15} />
              <span>Close Audit</span>
            </button>
          </div>

          {(!expenseClaims || expenseClaims.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Receipt size={40} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
              <p>No expense bills submitted by employees yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', overflowX: 'hidden' }}>
              
              {/* Header Titles Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '18% 13% 9% 9% 14% 10% 27%',
                gap: '0.4rem', padding: '0 0.8rem', color: 'var(--text-muted)',
                fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                alignItems: 'center', width: '100%', boxSizing: 'border-box'
              }}>
                <div style={{ minWidth: 0 }}>Employee Target</div>
                <div style={{ minWidth: 0 }}>Category</div>
                <div style={{ minWidth: 0 }}>Date</div>
                <div style={{ minWidth: 0 }}>Amount</div>
                <div style={{ minWidth: 0 }}>Description</div>
                <div style={{ minWidth: 0, textAlign: 'center' }}>Status</div>
                <div style={{ minWidth: 0, textAlign: 'left' }}>Actions & Download</div>
              </div>

              {/* Rows */}
              {expenseClaims.map((claim, idx) => (
                <div 
                  key={claim._id || idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '0.75rem 0.85rem',
                    display: 'grid',
                    gridTemplateColumns: '18% 13% 9% 9% 14% 10% 27%',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  className="hover-lift"
                >
                  {/* 1. Employee Info */}
                  <div style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{claim.employeeName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a7f3d0', overflow: 'hidden', textOverflow: 'ellipsis' }}>{claim.employeeId}</div>
                  </div>

                  {/* 2. Category */}
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-block',
                      background: claim.category === 'Travel Expense' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      color: claim.category === 'Travel Expense' ? '#38bdf8' : '#c084fc',
                      border: claim.category === 'Travel Expense' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)'
                    }}>
                      {claim.category}
                    </span>
                  </div>

                  {/* 3. Date */}
                  <div style={{ minWidth: 0, color: '#e2e8f0', fontSize: '0.8rem', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {formatDate(claim.expenseDate)}
                  </div>

                  {/* 4. Amount */}
                  <div style={{ minWidth: 0, fontWeight: 800, color: '#34d399', fontSize: '0.92rem', whiteSpace: 'nowrap' }}>
                    ₹{(claim.amount || 0).toLocaleString()}
                  </div>

                  {/* 5. Description (Clickable to View Full Details) */}
                  <div 
                    onClick={() => setSelectedClaimDetail(claim)}
                    style={{ 
                      minWidth: 0, color: '#38bdf8', fontSize: '0.8rem', 
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }} 
                    title="Click to view description popup"
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                      {claim.description || '-'}
                    </span>
                    <Eye size={12} style={{ flexShrink: 0, opacity: 0.8 }} />
                  </div>

                  {/* 6. Status */}
                  <div style={{ minWidth: 0, textAlign: 'center', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center' }}>
                    <StatusBadge status={claim.status || 'Pending'} />
                  </div>

                  {/* 7. Actions & Download (Left-aligned for perfect space optimization) */}
                  <div style={{ minWidth: 0, display: 'flex', justifyContent: 'flex-start', gap: '0.45rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => downloadExpenseBill(claim)}
                      title="Download Employee Bill Receipt"
                      style={{
                        padding: '0.45rem 0.75rem', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                        color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', flexShrink: 0
                      }}
                    >
                      <Download size={13} />
                      <span>Download Bill</span>
                    </button>

                    {claim.status === 'Pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          onClick={() => handleApproveClaim(claim._id)}
                          title="Approve Reimbursement"
                          style={{
                            padding: '0.22rem 0.6rem', borderRadius: '5px',
                            background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            textAlign: 'center'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClaim(claim._id)}
                          title="Reject Reimbursement"
                          style={{
                            padding: '0.22rem 0.6rem', borderRadius: '5px',
                            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            textAlign: 'center'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Clean Description Popup Modal */}
          {selectedClaimDetail && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '1rem'
            }}>
              <div style={{
                background: '#0f172a', border: '1px solid rgba(236,72,153,0.4)',
                borderRadius: '16px', padding: '1.5rem', maxWidth: '460px', width: '100%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)', color: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ec4899', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={18} />
                    <span>Expense Claim Description & Reason</span>
                  </h3>
                  <button 
                    onClick={() => setSelectedClaimDetail(null)} 
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', margin: '0.5rem 0' }}>
                  <div style={{ color: '#f1f5f9', lineHeight: 1.6, fontSize: '0.95rem', wordBreak: 'break-word' }}>
                    {selectedClaimDetail.description || 'No description provided for this claim.'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    onClick={() => setSelectedClaimDetail(null)}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1.25rem', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
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
                <DateInput 
                  className="input-box" 
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
                  <DateInput 
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

            {/* 2. Simplified Earnings & Deductions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              
              {/* Earnings & Allowances Card */}
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
                    <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>Basic Monthly Salary (₹) *</label>
                    <input 
                      type="number" 
                      name="basicSalary"
                      value={formData.basicSalary} 
                      onChange={_handleChange}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontWeight: 700, padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Travel Expenses (₹)</label>
                      <input 
                        type="number" 
                        name="travel"
                        value={formData.allowanceDetails.travel} 
                        onChange={_handleAllowanceChange}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Medical Expenses (₹)</label>
                      <input 
                        type="number" 
                        name="medical"
                        value={formData.allowanceDetails.medical} 
                        onChange={_handleAllowanceChange}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>Paid Leave Days (Days)</label>
                    <input 
                      type="number" 
                      name="paidLeaveDays"
                      value={formData.paidLeaveDays} 
                      onChange={_handleChange}
                      placeholder=""
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Card */}
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '16px', padding: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <h3 style={{ margin: 0, color: '#f87171', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="#f87171" />
                    <span>Deductions & Adjustments</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                    Total: -₹{totalDeductions.toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="field-label" style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>Unpaid Leave Deductions (₹)</label>
                    <input 
                      type="number" 
                      name="leaveDeduction"
                      value={formData.deductionDetails.leaveDeduction} 
                      onChange={_handleDeductionChange}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontWeight: 700, padding: '0.65rem 0.9rem', borderRadius: '8px', outline: 'none' }}
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

      {/* Digital Payslip Modal - PSG Hospital Style Format */}
      {selectedPayslip && (
        <Modal 
          isOpen={isPayslipModalOpen} 
          onClose={() => setIsPayslipModalOpen(false)} 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={22} color="#10b981" />
              <span>Official Payslip — {selectedPayslip.payslipId}</span>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: '#0c1222', borderRadius: '16px', border: '1.5px solid rgba(16, 185, 129, 0.4)', overflow: 'hidden', fontFamily: "'Consolas', 'Courier New', monospace" }}>
            
            {/* ═══ Top Header Bar ═══ */}
            <div style={{ 
              background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
              padding: '1rem 1.5rem', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '2px solid #10b981'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#10b981', fontWeight: 800, letterSpacing: '1px' }}>CODETHRIVE INFOTECH PVT LTD, COIMBATORE</h2>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8', letterSpacing: '0.5px' }}>No.1 Srihari Nivas, Indira Nagar, Sungam, Coimbatore - 641045</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '2px' }}>PAYSLIP</div>
                <div style={{ fontSize: '0.82rem', color: '#a7f3d0', fontWeight: 600 }}>Month: {selectedPayslip.month}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>S.No: {selectedPayslip.payslipId}</div>
              </div>
            </div>

            {/* ═══ Employee Identity Row ═══ */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0',
              background: 'rgba(16, 185, 129, 0.06)', 
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '0.8rem 1.5rem'
            }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EMP NO</span>
                <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.92rem' }}>{selectedPayslip.employee?.employeeId || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NAME</span>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>{selectedPayslip.employee?.fullName || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DEPT / DESIGNATION</span>
                <div style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{selectedPayslip.employee?.department || '-'}</div>
                <div style={{ color: '#a7f3d0', fontSize: '0.78rem' }}>{selectedPayslip.employee?.designation || '-'}</div>
              </div>
            </div>

            {/* ═══ Personal Details + Leave Status Side by Side ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              
              {/* Left: Personal Details */}
              <div style={{ padding: '0.8rem 1.5rem', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', borderBottom: '1px solid rgba(59,130,246,0.2)', paddingBottom: '0.3rem' }}>Employee Details</div>
                {[
                  { label: 'DOB', value: selectedPayslip.employeeInfo?.dob ? new Date(selectedPayslip.employeeInfo.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-' },
                  { label: 'DOJ', value: selectedPayslip.employeeInfo?.doj ? new Date(selectedPayslip.employeeInfo.doj).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-' },
                  { label: 'BASIC', value: `₹${(selectedPayslip.basicSalary || 0).toLocaleString()}` },
                  { label: 'DA', value: `₹${(selectedPayslip.allowanceDetails?.da || 0).toLocaleString()}` },
                  { label: 'BK AC No', value: selectedPayslip.employeeInfo?.bankAcNo || '-' },
                  { label: 'PF %', value: `${selectedPayslip.employeeInfo?.pfPercent || 12}%` },
                  { label: 'PF No', value: selectedPayslip.employeeInfo?.pfNo || '-' },
                  { label: 'ESI No', value: selectedPayslip.employeeInfo?.esiNo || '-' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600, minWidth: '80px' }}>{item.label}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 500, textAlign: 'right' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Right: Leave Status */}
              <div style={{ padding: '0.8rem 1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', borderBottom: '1px solid rgba(245,158,11,0.2)', paddingBottom: '0.3rem' }}>Leave Status</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 1fr)', gap: '0', fontSize: '0.72rem', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#64748b', textAlign: 'left' }}></div>
                  <div style={{ fontWeight: 700, color: '#94a3b8' }}>CL</div>
                  <div style={{ fontWeight: 700, color: '#94a3b8' }}>EL</div>
                  <div style={{ fontWeight: 700, color: '#94a3b8' }}>ML</div>
                  <div style={{ fontWeight: 700, color: '#94a3b8' }}>LOP</div>
                  
                  <div style={{ fontWeight: 600, color: '#94a3b8', textAlign: 'left', paddingTop: '0.3rem' }}>Eligible</div>
                  <div style={{ color: '#e2e8f0', paddingTop: '0.3rem' }}>{selectedPayslip.leaveStatus?.cl?.eligible ?? 12}</div>
                  <div style={{ color: '#e2e8f0', paddingTop: '0.3rem' }}>{selectedPayslip.leaveStatus?.el?.eligible ?? 15}</div>
                  <div style={{ color: '#e2e8f0', paddingTop: '0.3rem' }}>{selectedPayslip.leaveStatus?.ml?.eligible ?? 0}</div>
                  <div style={{ color: '#e2e8f0', paddingTop: '0.3rem' }}></div>

                  <div style={{ fontWeight: 600, color: '#94a3b8', textAlign: 'left', paddingTop: '0.2rem' }}>Availed</div>
                  <div style={{ color: '#fbbf24', paddingTop: '0.2rem' }}>{selectedPayslip.leaveStatus?.cl?.availed ?? 0}</div>
                  <div style={{ color: '#fbbf24', paddingTop: '0.2rem' }}>{selectedPayslip.leaveStatus?.el?.availed ?? 0}</div>
                  <div style={{ color: '#fbbf24', paddingTop: '0.2rem' }}>{selectedPayslip.leaveStatus?.ml?.availed ?? 0}</div>
                  <div style={{ color: '#f87171', paddingTop: '0.2rem', fontWeight: 700 }}>{selectedPayslip.leaveStatus?.lop ?? 0}</div>

                  <div style={{ fontWeight: 600, color: '#94a3b8', textAlign: 'left', paddingTop: '0.2rem' }}>Balance</div>
                  <div style={{ color: '#34d399', paddingTop: '0.2rem', fontWeight: 700 }}>{selectedPayslip.leaveStatus?.cl?.balance ?? 12}</div>
                  <div style={{ color: '#34d399', paddingTop: '0.2rem', fontWeight: 700 }}>{selectedPayslip.leaveStatus?.el?.balance ?? 15}</div>
                  <div style={{ color: '#34d399', paddingTop: '0.2rem', fontWeight: 700 }}>{selectedPayslip.leaveStatus?.ml?.balance ?? 0}</div>
                  <div style={{ paddingTop: '0.2rem' }}></div>
                </div>

                <div style={{ marginTop: '0.75rem', padding: '0.4rem 0.6rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.15)', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>
                  {selectedPayslip.month} — LOP Days: {selectedPayslip.leaveStatus?.lop ?? 0}
                </div>
              </div>
            </div>

            {/* ═══ Earnings & Deductions - PSG Style Grid ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              
              {/* Earnings Column */}
              <div style={{ padding: '0.8rem 1.5rem', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '0.3rem' }}>Earnings</div>
                {[
                  { label: 'Basic', value: selectedPayslip.basicSalary || 0 },
                  { label: 'DA', value: selectedPayslip.allowanceDetails?.da || 0 },
                  { label: 'HRA', value: selectedPayslip.allowanceDetails?.hra || 0 },
                  { label: 'Conveyance Allow.', value: selectedPayslip.allowanceDetails?.conveyance || 0 },
                  { label: 'Travel Allow.', value: selectedPayslip.allowanceDetails?.travel || 0 },
                  { label: 'Medical Allow.', value: selectedPayslip.allowanceDetails?.medical || 0 },
                  { label: 'Special Allow.', value: selectedPayslip.allowanceDetails?.other || 0 }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.18rem 0', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600, fontFamily: 'monospace' }}>₹{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Deductions Column */}
              <div style={{ padding: '0.8rem 1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', borderBottom: '1px solid rgba(239,68,68,0.2)', paddingBottom: '0.3rem' }}>Deductions</div>
                {[
                  { label: 'EPF (Employee)', value: selectedPayslip.deductionDetails?.pf || 0 },
                  { label: 'Professional Tax', value: selectedPayslip.deductionDetails?.professionalTax || 0 },
                  { label: 'Income Tax (TDS)', value: selectedPayslip.deductionDetails?.incomeTax || 0 },
                  { label: 'ESI', value: selectedPayslip.deductionDetails?.esi || 0 },
                  { label: 'Loan / Advance', value: selectedPayslip.deductionDetails?.loanAdvance || 0 },
                  { label: 'Leave Deduction', value: selectedPayslip.deductionDetails?.leaveDeduction || 0 },
                  { label: 'Other Deductions', value: selectedPayslip.deductionDetails?.other || 0 }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.18rem 0', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                    <span style={{ color: item.value > 0 ? '#fca5a5' : '#475569', fontWeight: 600, fontFamily: 'monospace' }}>{item.value > 0 ? `₹${item.value.toLocaleString()}` : '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Summary Footer: GROSS | TOT DED | NET ═══ */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', 
              background: 'rgba(16, 185, 129, 0.08)', 
              borderBottom: '2px dashed rgba(16, 185, 129, 0.3)',
              padding: '0.8rem 1.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>GROSS AMT</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>₹{(selectedPayslip.grossSalary || 0).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>TOT DED</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171', fontFamily: 'monospace' }}>₹{(selectedPayslip.deductions || 0).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>NET AMT</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', textShadow: '0 0 15px rgba(52,211,153,0.3)' }}>₹{(selectedPayslip.netPayable || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* ═══ Action Buttons ═══ */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', background: 'rgba(15, 23, 42, 0.5)' }}>
              <button type="button" className="btn btn-outline" onClick={() => downloadPayslipPDF(selectedPayslip)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                <Download size={15} /> PDF
              </button>
              <button type="button" className="btn btn-outline" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                <Printer size={15} /> Print
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setIsPayslipModalOpen(false)} style={{ fontSize: '0.82rem' }}>
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
