import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, Plus, Search, FileText, CheckCircle2, X, Zap, Eye, Printer, Users, 
  Sparkles, RefreshCw, DollarSign, ArrowUpRight, TrendingUp, ShieldCheck
} from 'lucide-react';
import './Payroll.css';

const DEFAULT_PAYROLLS = [
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
      const combined = [...localPayrolls, ...apiPayrolls];
      
      if (combined.length === 0) {
        localStorage.setItem('cti_shared_payrolls', JSON.stringify(DEFAULT_PAYROLLS));
        setPayrolls(DEFAULT_PAYROLLS);
      } else {
        const map = new Map();
        combined.forEach(p => map.set(p._id, p));
        setPayrolls(Array.from(map.values()));
      }
    } catch (err) {
      console.error('Failed to fetch payroll data', err);
      setPayrolls(DEFAULT_PAYROLLS);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    if (empId) {
      const emp = employees.find(item => item._id === empId);
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

  const handleAllowanceChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      allowanceDetails: { ...prev.allowanceDetails, [name]: Number(value) || 0 }
    }));
  };

  const handleDeductionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      deductionDetails: { ...prev.deductionDetails, [name]: Number(value) || 0 }
    }));
  };

  const handleChange = (e) => {
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

  const handleSingleSubmit = async (e) => {
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
                        <span>View Payslip</span>
                      </button>
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
