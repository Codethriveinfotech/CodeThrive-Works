import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import { Banknote, Plus, Search, FileText, CheckCircle2, X } from 'lucide-react';
import './Payroll.css'; // Reuse existing premium styles

const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear().toString(),
    paymentDate: '',
    status: 'Pending',
    basicSalary: 0,
    bonus: 0,
    allowanceDetails: { hra: 0, travel: 0, medical: 0, other: 0 },
    deductionDetails: { pf: 0, esi: 0, professionalTax: 0, incomeTax: 0, leaveDeduction: 0, loanAdvance: 0, other: 0 }
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
      setPayrolls(payrollRes.data.data);
      setEmployees(empRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    if (empId) {
      const emp = employees.find(e => e._id === empId);
      setSelectedEmployee(emp);
      if (emp && emp.salaryAmount) {
        setFormData(prev => ({ ...prev, basicSalary: emp.salaryAmount }));
      }
    } else {
      setSelectedEmployee(null);
      setFormData(prev => ({ ...prev, basicSalary: 0 }));
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
    setFormData(prev => ({ ...prev, [name]: name === 'basicSalary' || name === 'bonus' ? (Number(value) || 0) : value }));
  };

  // Auto Calculations
  const totalAllowances = Object.values(formData.allowanceDetails).reduce((acc, val) => acc + val, 0);
  const totalDeductions = Object.values(formData.deductionDetails).reduce((acc, val) => acc + val, 0);
  const totalEarnings = formData.basicSalary + totalAllowances + formData.bonus;
  const netSalary = totalEarnings - totalDeductions;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || !formData.month || !formData.year) {
      alert("Please select an employee and specify the salary month and year.");
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
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Failed to generate payroll', err);
      alert(err.response?.data?.message || 'Failed to generate payroll');
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
    { header: 'Payslip ID', accessor: 'payslipId', render: (row) => <span style={{ fontWeight: 500 }}>{row.payslipId}</span> },
    { header: 'Employee', accessor: 'employee', render: (row) => (
      <div>
        <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>{row.employee?.fullName}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.employee?.employeeId}</span>
      </div>
    )},
    { header: 'Month', accessor: 'month' },
    { header: 'Gross Salary', accessor: 'grossSalary', render: (row) => `$${row.grossSalary?.toLocaleString() || 0}` },
    { header: 'Net Salary', accessor: 'netPayable', render: (row) => <span style={{ fontWeight: 700, color: 'var(--success)' }}>${row.netPayable?.toLocaleString() || 0}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  if (loading && viewMode === 'list') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Payroll Data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Payroll Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage employee salaries and generate monthly payslips.</p>
        </div>
        {viewMode === 'list' ? (
          <button className="btn btn-primary" onClick={() => setViewMode('create')}>
            <Plus size={16} /> Generate Payroll
          </button>
        ) : (
          <button className="btn btn-outline" onClick={() => setViewMode('list')}>
            <X size={16} /> Cancel
          </button>
        )}
      </div>

      {viewMode === 'list' && (
        <Card style={{ padding: 0 }} className="premium-card">
          <div className="payslip-filters">
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="filter-input" 
                placeholder="Search by ID or Employee Name..." 
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {!filteredPayrolls || filteredPayrolls.length === 0 ? (
            <div className="empty-state-premium" style={{ margin: '2rem' }}>
              <Banknote size={64} className="icon" />
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No Payroll Records Found</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                Generate a new payroll record to issue a payslip to an employee.
              </p>
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

      {viewMode === 'create' && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Employee Selection */}
              <Card title="1. Select Employee" className="premium-card">
                <div className="form-group">
                  <label>Employee</label>
                  <select className="input-field" value={selectedEmployeeId} onChange={handleEmployeeSelect} required>
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>
                
                {selectedEmployee && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Name:</span>
                      <span style={{ fontWeight: 600 }}>{selectedEmployee.fullName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>ID:</span>
                      <span>{selectedEmployee.employeeId}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Designation:</span>
                      <span>{selectedEmployee.designation}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Payroll Information */}
              <Card title="2. Payroll Information" className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Salary Month</label>
                    <select className="input-field" name="month" value={formData.month} onChange={handleChange} required>
                      <option value="">Select Month</option>
                      <option value="January">January</option><option value="February">February</option>
                      <option value="March">March</option><option value="April">April</option>
                      <option value="May">May</option><option value="June">June</option>
                      <option value="July">July</option><option value="August">August</option>
                      <option value="September">September</option><option value="October">October</option>
                      <option value="November">November</option><option value="December">December</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Salary Year</label>
                    <input type="number" className="input-field" name="year" value={formData.year} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Payment Date</label>
                    <input type="date" className="input-field" name="paymentDate" value={formData.paymentDate} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Payment Status</label>
                    <select className="input-field" name="status" value={formData.status} onChange={handleChange}>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              </Card>
              
              {/* Summary */}
              <Card title="Summary & Generate" className="premium-card">
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Earnings</span>
                    <span style={{ fontWeight: 600 }}>${totalEarnings.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Deductions</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-${totalDeductions.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Net Salary</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>${netSalary.toLocaleString()}</span>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                  <CheckCircle2 size={18} /> {submitting ? 'Processing...' : 'Save & Generate Payslip'}
                </button>
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Earnings */}
              <Card title="3. Earnings & Allowances" className="premium-card">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Basic Salary</label>
                  <input type="number" className="input-field" style={{ fontSize: '1.2rem', fontWeight: 600 }} name="basicSalary" value={formData.basicSalary} onChange={handleChange} required min="0" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label>HRA</label><input type="number" className="input-field" name="hra" value={formData.allowanceDetails.hra} onChange={handleAllowanceChange} min="0" /></div>
                  <div className="form-group"><label>Travel / Conveyance</label><input type="number" className="input-field" name="travel" value={formData.allowanceDetails.travel} onChange={handleAllowanceChange} min="0" /></div>
                  <div className="form-group"><label>Medical</label><input type="number" className="input-field" name="medical" value={formData.allowanceDetails.medical} onChange={handleAllowanceChange} min="0" /></div>
                  <div className="form-group"><label>Other Allowances</label><input type="number" className="input-field" name="other" value={formData.allowanceDetails.other} onChange={handleAllowanceChange} min="0" /></div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Bonus / Incentives</label><input type="number" className="input-field" name="bonus" value={formData.bonus} onChange={handleChange} min="0" /></div>
                </div>
              </Card>

              {/* Deductions */}
              <Card title="4. Deductions" className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label>Provident Fund (PF)</label><input type="number" className="input-field" name="pf" value={formData.deductionDetails.pf} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>ESI</label><input type="number" className="input-field" name="esi" value={formData.deductionDetails.esi} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>Professional Tax</label><input type="number" className="input-field" name="professionalTax" value={formData.deductionDetails.professionalTax} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>Income Tax (TDS)</label><input type="number" className="input-field" name="incomeTax" value={formData.deductionDetails.incomeTax} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>Leave Deduction</label><input type="number" className="input-field" name="leaveDeduction" value={formData.deductionDetails.leaveDeduction} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group"><label>Loan / Advance</label><input type="number" className="input-field" name="loanAdvance" value={formData.deductionDetails.loanAdvance} onChange={handleDeductionChange} min="0" /></div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Other Deductions</label><input type="number" className="input-field" name="other" value={formData.deductionDetails.other} onChange={handleDeductionChange} min="0" /></div>
                </div>
              </Card>
            </div>

          </div>
        </form>
      )}

    </div>
  );
};

export default AdminPayroll;
