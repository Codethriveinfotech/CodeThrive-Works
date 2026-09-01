import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Download, FileText, Search, CreditCard, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';
import './Payroll.css';

const Payroll = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
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
      // For Employee Portal, use the secure my-payslips endpoint
      const endpoint = '/payroll/my-payslips';
      const res = await api.get(endpoint);
      setPayslips(res.data.data);
    } catch (err) {
      console.error('Failed to fetch payslips', err);
    } finally {
      setLoading(false);
    }
  };

  const viewPayslip = (payslip) => {
    setSelectedPayslip(payslip);
    setIsModalOpen(true);
  };

  const downloadPayslip = (payslip) => {
    // Mock download action
    alert(`Downloading Payslip PDF for ${payslip.month}`);
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

  // Derived state for latest payslip
  const latestPayslip = payslips && payslips.length > 0 ? payslips[0] : null;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Payroll Data...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="welcome-hero-section ultra-premium-hero" style={{ marginBottom: '0.5rem', padding: '1.5rem 2rem' }}>
        <div className="welcome-content">
          <h1 className="welcome-title">My Payslips</h1>
          <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-muted)' }}>View, manage, and download your monthly salary payslips.</p>
        </div>
      </div>

      {latestPayslip && (
        <div className="payslip-summary-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
               <span style={{ fontSize: '0.85rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Latest Payslip</span>
               <StatusBadge status={latestPayslip.status} />
            </div>
            <h2 style={{ fontSize: '2rem', margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>{latestPayslip.month}</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={14} /> Issued on {new Date(latestPayslip.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="payslip-amount-box">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Net Salary</span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>${latestPayslip?.netPayable?.toLocaleString() || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => viewPayslip(latestPayslip)} style={{ width: '100%', justifyContent: 'center' }}>
                <FileText size={16} /> View Payslip
              </button>
              <button className="btn btn-outline" onClick={() => downloadPayslip(latestPayslip)} style={{ width: '100%', justifyContent: 'center' }}>
                <Download size={16} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      <Card style={{ padding: 0 }} className="premium-card">
        <div className="payslip-filters">
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="filter-input" 
              placeholder="Search payslips..." 
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="filter-input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
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
          <select className="filter-input" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {(!payslips || payslips.length === 0) ? (
          <div className="empty-state-premium" style={{ margin: '2rem' }}>
            <CreditCard size={64} className="icon" />
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No Payslips Available Yet</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
              Your payslips will appear here once your salary has been processed by the HR department.
            </p>
          </div>
        ) : filteredPayslips.length === 0 ? (
          <div className="empty-state-premium" style={{ margin: '2rem' }}>
            <Search size={48} className="icon" />
            <p>No payslips found matching your filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payslip ID</th>
                  <th>Month</th>
                  <th>Basic Salary</th>
                  <th>Gross Salary</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.map(ps => (
                  <tr key={ps._id} className="premium-hover" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                    <td style={{ fontWeight: 500 }}>{ps.payslipId}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{ps.month}</td>
                    <td>${ps.basicSalary?.toLocaleString() || 0}</td>
                    <td>${ps.grossSalary?.toLocaleString() || 0}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>${ps.netPayable?.toLocaleString() || 0}</td>
                    <td><StatusBadge status={ps.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button className="icon-btn-subtle" title="View Details" onClick={() => viewPayslip(ps)}>
                          <FileText size={16} />
                        </button>
                        <button className="icon-btn-subtle" title="Download" onClick={() => downloadPayslip(ps)}>
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detailed Payslip Modal */}
      {selectedPayslip && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Salary Payslip">
          <div className="modal-payslip-details">
            
            <div className="payslip-header-info">
              <div>
                <div className="payslip-company-logo">CodeThrive Infotech</div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Salary slip for the month of {selectedPayslip.month}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={selectedPayslip.status} />
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payslip ID: {selectedPayslip.payslipId}</p>
              </div>
            </div>

            <div className="payslip-employee-details">
              <div className="detail-item">
                <span className="detail-label">Employee Name</span>
                <span className="detail-value">{user?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Employee ID</span>
                <span className="detail-value">{user?.employeeId || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Designation</span>
                <span className="detail-value">{user?.designation || (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee')}</span>
              </div>
            </div>

            <div className="salary-breakdown-grid">
              {/* Earnings Section */}
              <div className="breakdown-section">
                <h5 className="breakdown-title">Earnings</h5>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Basic Salary</span>
                  <span>${selectedPayslip?.basicSalary?.toLocaleString() || 0}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>House Rent Allowance (HRA)</span>
                  <span>${(selectedPayslip?.allowanceDetails?.hra || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Travel / Conveyance</span>
                  <span>${(selectedPayslip?.allowanceDetails?.travel || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Medical Allowance</span>
                  <span>${(selectedPayslip?.allowanceDetails?.medical || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Other Allowances</span>
                  <span>${(selectedPayslip?.allowanceDetails?.other || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Bonus / Incentives</span>
                  <span>${(selectedPayslip?.bonus || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row total-row" style={{ color: 'var(--primary-light)' }}>
                  <span>Total Earnings</span>
                  <span>${selectedPayslip?.grossSalary?.toLocaleString() || 0}</span>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="breakdown-section">
                <h5 className="breakdown-title">Deductions</h5>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Provident Fund (PF)</span>
                  <span>${(selectedPayslip?.deductionDetails?.pf || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>ESI</span>
                  <span>${(selectedPayslip?.deductionDetails?.esi || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Professional Tax</span>
                  <span>${(selectedPayslip?.deductionDetails?.professionalTax || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Income Tax (TDS)</span>
                  <span>${(selectedPayslip?.deductionDetails?.incomeTax || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Leave Deduction</span>
                  <span>${(selectedPayslip?.deductionDetails?.leaveDeduction || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Loan / Advance</span>
                  <span>${(selectedPayslip?.deductionDetails?.loanAdvance || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Other Deductions</span>
                  <span>${(selectedPayslip?.deductionDetails?.other || 0).toLocaleString()}</span>
                </div>
                <div className="breakdown-row total-row" style={{ color: 'var(--danger)' }}>
                  <span>Total Deductions</span>
                  <span>${selectedPayslip?.deductions?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="net-salary-banner">
              <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Net Salary Payable</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>${selectedPayslip?.netPayable?.toLocaleString() || 0}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
               <button className="btn btn-primary" onClick={() => downloadPayslip(selectedPayslip)}>
                  <Download size={18} style={{marginRight: '0.5rem'}} /> Download PDF Payslip
               </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Payroll;

