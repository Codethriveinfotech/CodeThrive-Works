import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { Banknote, Plus, Search, FileText, CheckCircle2, X, Zap, Eye, Printer, Users } from 'lucide-react';
import './Payroll.css';

const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'individual', 'bulk'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payslip detail modal
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  // Form State for Individual Generation
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = monthsList[new Date().getMonth()];
  const currentYearStr = new Date().getFullYear().toString();
  const todayStr = new Date().toISOString().substring(0, 10);

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

  // Bulk Generation Form State
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
      const [payrollRes, empRes] = await Promise.all([
        api.get('/payroll'),
        api.get('/employees')
      ]);
      setPayrolls(Array.isArray(payrollRes.data?.data) ? payrollRes.data.data : []);
      setEmployees(Array.isArray(empRes.data?.data) ? empRes.data.data : []);
    } catch (err) {
      console.error('Failed to fetch payroll data', err);
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

  // Auto Calculations
  const totalAllowances = Object.values(formData.allowanceDetails).reduce((acc, val) => acc + (val || 0), 0);
  const totalDeductions = Object.values(formData.deductionDetails).reduce((acc, val) => acc + (val || 0), 0);
  const totalEarnings = (formData.basicSalary || 0) + totalAllowances + (formData.bonus || 0);
  const netSalary = totalEarnings - totalDeductions;

  // Single Payroll Submit
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert("Please select an employee.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        employeeId: selectedEmployeeId,
        month: `${formData.month} ${formData.year}`,
        paymentDate: formData.paymentDate,
        status: formData.status,
        basicSalary: formData.basicSalary,
        bonus: formData.bonus,
        allowanceDetails: formData.allowanceDetails,
        deductionDetails: formData.deductionDetails
      };

      await api.post('/payroll', payload);
      alert('Payroll generated successfully!');
      setViewMode('list');
      fetchData();
    } catch (err) {
      console.error('Failed to generate payroll', err);
      alert(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Payroll Submit
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        month: `${bulkFormData.month} ${bulkFormData.year}`,
        paymentDate: bulkFormData.paymentDate,
        status: bulkFormData.status
      };

      const res = await api.post('/payroll/bulk-generate', payload);
      alert(res.data?.message || 'Bulk payroll generated successfully!');
      setViewMode('list');
      fetchData();
    } catch (err) {
      console.error('Failed bulk payroll generation', err);
      alert(err.response?.data?.message || 'Failed bulk payroll generation');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayrolls = useMemo(() => {
    if (!payrolls || !Array.isArray(payrolls)) return [];
    return payrolls.filter(ps => {
      const psId = ps?.payslipId || '';
      const empName = ps?.employee?.fullName || '';
      return psId.toLowerCase().includes(searchTerm.toLowerCase()) || 
             empName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [payrolls, searchTerm]);

  const columns = [
    { 
      header: 'Payslip ID', 
      accessor: 'payslipId', 
      render: (row) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.payslipId}</span> 
    },
    { 
      header: 'Employee', 
      accessor: 'employee', 
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>{row.employee?.fullName || 'N/A'}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.employee?.employeeId || 'ID N/A'}</span>
        </div>
      )
    },
    { header: 'Month', accessor: 'month' },
    { 
      header: 'Gross Salary', 
      accessor: 'grossSalary', 
      render: (row) => `₹${(row.grossSalary || 0).toLocaleString()}` 
    },
    { 
      header: 'Net Salary', 
      accessor: 'netPayable', 
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹${(row.netPayable || 0).toLocaleString()}</span> 
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row) => <StatusBadge status={row.status || 'Paid'} /> 
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          className="btn btn-outline"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => {
            setSelectedPayslip(row);
            setIsPayslipModalOpen(true);
          }}
        >
          <Eye size={14} /> View Payslip
        </button>
      )
    }
  ];

  if (loading && viewMode === 'list') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Payroll Data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '700' }}>Payroll Management</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Manage employee salaries, generate monthly payslips, and process bulk payrolls.</p>
        </div>

        {viewMode === 'list' ? (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setViewMode('bulk')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} color="var(--warning)" /> 1-Click Bulk Payroll
            </button>
            <button className="btn btn-primary" onClick={() => setViewMode('individual')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Create Individual Payroll
            </button>
          </div>
        ) : (
          <button className="btn btn-outline" onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <X size={16} /> Back to List
          </button>
        )}
      </div>

      {/* VIEW MODE 1: Payroll Records Table */}
      {viewMode === 'list' && (
        <Card style={{ padding: 0 }} className="premium-card">
          <div className="payslip-filters" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search by Payslip ID or Employee Name..." 
                style={{ width: '100%', paddingLeft: '2.75rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Total Records: <strong style={{ color: 'var(--text-main)' }}>{filteredPayrolls.length}</strong>
            </div>
          </div>

          {!filteredPayrolls || filteredPayrolls.length === 0 ? (
            <div className="empty-state-premium" style={{ margin: '3rem 1.5rem', textAlign: 'center' }}>
              <Banknote size={64} className="icon" style={{ opacity: 0.5, marginBottom: '1rem', color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No Payroll Records Found</h3>
              <p style={{ maxWidth: '450px', margin: '0 auto 1.5rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                Generate monthly payslips for individual employees or use 1-Click Bulk Payroll to issue salaries for all employees.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={() => setViewMode('bulk')}>
                  <Zap size={16} style={{ marginRight: '0.5rem' }} /> Auto-Generate Bulk Payroll
                </button>
                <button className="btn btn-outline" onClick={() => setViewMode('individual')}>
                  <Plus size={16} style={{ marginRight: '0.5rem' }} /> Create Single Payroll
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              <DataTable 
                columns={columns} 
                data={filteredPayrolls} 
                searchable={false} 
              />
            </div>
          )}
        </Card>
      )}

      {/* VIEW MODE 2: Bulk Auto-Generate Payroll */}
      {viewMode === 'bulk' && (
        <Card title="⚡ 1-Click Bulk Payroll Generator" className="premium-card">
          <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              This action will automatically generate standard payslips (Basic + HRA + Allowances - PF & Tax) for all registered active employees for the selected period.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div className="form-group">
                <label>Salary Month *</label>
                <select 
                  className="input-field" 
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
                <label>Salary Year *</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={bulkFormData.year} 
                  onChange={(e) => setBulkFormData({...bulkFormData, year: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Payment Date *</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={bulkFormData.paymentDate} 
                  onChange={(e) => setBulkFormData({...bulkFormData, paymentDate: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Payment Status</label>
                <select 
                  className="input-field" 
                  value={bulkFormData.status} 
                  onChange={(e) => setBulkFormData({...bulkFormData, status: e.target.value})}
                >
                  <option value="Paid">Paid</option>
                  <option value="Processing">Processing</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(79, 70, 229, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
              <Users size={24} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>Employees Eligible: {employees.length} Employee(s)</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Employees who already have a payslip generated for {bulkFormData.month} {bulkFormData.year} will automatically be skipped to prevent duplicates.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setViewMode('list')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || employees.length === 0} style={{ padding: '0.8rem 2rem' }}>
                <Zap size={18} style={{ marginRight: '0.5rem' }} /> {submitting ? 'Generating Bulk Payroll...' : 'Generate Payroll for All Employees'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* VIEW MODE 3: Individual Employee Payroll Form */}
      {viewMode === 'individual' && (
        <form onSubmit={handleSingleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 1. Employee Selection */}
              <Card title="1. Select Employee" className="premium-card">
                <div className="form-group">
                  <label>Select Employee *</label>
                  <select className="input-field" value={selectedEmployeeId} onChange={handleEmployeeSelect} required>
                    <option value="">-- Choose Employee --</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeId || 'ID Pending'})</option>
                    ))}
                  </select>
                </div>
                
                {selectedEmployee && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>
                      <span style={{ fontWeight: 600 }}>{selectedEmployee.fullName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Employee ID:</span>
                      <span>{selectedEmployee.employeeId || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Designation:</span>
                      <span>{selectedEmployee.designation || 'Employee'}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* 2. Payroll Information */}
              <Card title="2. Period & Payment Info" className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Salary Month *</label>
                    <select className="input-field" name="month" value={formData.month} onChange={handleChange} required>
                      {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Salary Year *</label>
                    <input type="number" className="input-field" name="year" value={formData.year} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Payment Date *</label>
                    <input type="date" className="input-field" name="paymentDate" value={formData.paymentDate} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Payment Status</label>
                    <select className="input-field" name="status" value={formData.status} onChange={handleChange}>
                      <option value="Paid">Paid</option>
                      <option value="Processing">Processing</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </Card>
              
              {/* Summary Card */}
              <Card title="Summary & Generate" className="premium-card">
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Gross Earnings</span>
                    <span style={{ fontWeight: 600 }}>₹{totalEarnings.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Deductions</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-₹{totalDeductions.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34, 197, 94, 0.12)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--success)' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Net Payable Salary</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>₹{netSalary.toLocaleString()}</span>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }} disabled={submitting || !selectedEmployeeId}>
                  <CheckCircle2 size={18} /> {submitting ? 'Generating Payslip...' : 'Save & Issue Payslip'}
                </button>
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 3. Earnings & Allowances */}
              <Card title="3. Earnings & Allowances (₹)" className="premium-card">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Basic Salary *</label>
                  <input type="number" className="input-field" style={{ fontSize: '1.2rem', fontWeight: 600 }} name="basicSalary" value={formData.basicSalary} onChange={handleChange} required min="0" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label>HRA</label><input type="number" className="input-field" name="hra" value={formData.allowanceDetails.hra} onChange={handleAllowanceChange} min="0" /></div>
                  <div className="form-group"><label>Travel / Conveyance</label><input type="number" className="input-field" name="travel" value={formData.allowanceDetails.travel} onChange={handleAllowanceChange} min="0" /></div>
                  <div className="form-group"><label>Medical</label><input type="number" className="input-field" name="medical" value={formData.allowanceDetails.medical} onChange={handleAllowanceChange} min="0" /></div>
                  <div className="form-group"><label>Other Allowances</label><input type="number" className="input-field" name="other" value={formData.allowanceDetails.other} onChange={handleAllowanceChange} min="0" /></div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Bonus / Performance Incentive</label><input type="number" className="input-field" name="bonus" value={formData.bonus} onChange={handleChange} min="0" /></div>
                </div>
              </Card>

              {/* 4. Deductions */}
              <Card title="4. Statutory Deductions (₹)" className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label>Provident Fund (PF)</label><input type="number" className="input-field" name="pf" value={formData.deductionDetails.pf} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>ESI</label><input type="number" className="input-field" name="esi" value={formData.deductionDetails.esi} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>Professional Tax</label><input type="number" className="input-field" name="professionalTax" value={formData.deductionDetails.professionalTax} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>Income Tax (TDS)</label><input type="number" className="input-field" name="incomeTax" value={formData.deductionDetails.incomeTax} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>Leave Deduction</label><input type="number" className="input-field" name="leaveDeduction" value={formData.deductionDetails.leaveDeduction} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>Loan / Advance</label><input type="number" className="input-field" name="loanAdvance" value={formData.deductionDetails.loanAdvance} onChange={handleDeductionChange} min="0" /></div>
                </div>
              </Card>
            </div>

          </div>
        </form>
      )}

      {/* Digital Payslip Modal View */}
      {selectedPayslip && (
        <Modal isOpen={isPayslipModalOpen} onClose={() => setIsPayslipModalOpen(false)} title={`Digital Payslip - ${selectedPayslip.payslipId}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary)' }}>CodeThrive Infotech Pvt Ltd</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Official Salary Payslip - {selectedPayslip.month}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>{selectedPayslip.payslipId}</span>
                <StatusBadge status={selectedPayslip.status || 'Paid'} />
              </div>
            </div>

            {/* Employee Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee Name:</span>
                <div style={{ fontWeight: 600 }}>{selectedPayslip.employee?.fullName || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee ID:</span>
                <div style={{ fontWeight: 600 }}>{selectedPayslip.employee?.employeeId || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Designation:</span>
                <div>{selectedPayslip.employee?.designation || 'Software Engineer'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment Date:</span>
                <div>{selectedPayslip.paymentDate ? new Date(selectedPayslip.paymentDate).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* Earnings */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--success)' }}>Earnings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Basic Salary</span>
                    <span>₹{(selectedPayslip.basicSalary || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>HRA</span>
                    <span>₹{(selectedPayslip.allowanceDetails?.hra || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Conveyance / Travel</span>
                    <span>₹{(selectedPayslip.allowanceDetails?.travel || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Medical Allowance</span>
                    <span>₹{(selectedPayslip.allowanceDetails?.medical || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bonus / Incentive</span>
                    <span>₹{(selectedPayslip.bonus || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', fontWeight: 600 }}>
                    <span>Gross Earnings</span>
                    <span>₹{(selectedPayslip.grossSalary || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)' }}>Deductions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Provident Fund (PF)</span>
                    <span>₹{(selectedPayslip.deductionDetails?.pf || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Professional Tax</span>
                    <span>₹{(selectedPayslip.deductionDetails?.professionalTax || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Income Tax (TDS)</span>
                    <span>₹{(selectedPayslip.deductionDetails?.incomeTax || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', fontWeight: 600, color: 'var(--danger)' }}>
                    <span>Total Deductions</span>
                    <span>-₹{(selectedPayslip.deductions || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Net Amount Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34, 197, 94, 0.15)', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--success)' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Net Amount Payable</span>
              <span style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--success)' }}>₹{(selectedPayslip.netPayable || 0).toLocaleString()}</span>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={16} /> Print Payslip
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setIsPayslipModalOpen(false)}>
                Close
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};

export default AdminPayroll;
