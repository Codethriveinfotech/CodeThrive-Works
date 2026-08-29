import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Download, FileText, Banknote, CreditCard, Clock, CheckCircle2 } from 'lucide-react';
import './Payroll.css';

const Payroll = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      // Determine endpoint based on role
      const endpoint = ['admin', 'superadmin', 'hr'].includes(user?.role) ? '/payroll' : '/payroll/my-payslips';
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
    // In a real app, this would hit an endpoint that generates a PDF, or use jsPDF
    alert(`Downloading Payslip PDF for ${payslip.month}`);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Payroll Data...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>My Payslips</h1>
          <p style={{ color: 'var(--text-muted)' }}>View and download your monthly salary slips.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {payslips.length > 0 && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--primary-bg)', borderRadius: 'var(--radius-sm)' }}>
                <Banknote size={24} color="var(--primary-light)" />
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current Net Salary</p>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>${payslips[0].netPayable.toLocaleString()}</h3>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card title="Salary History" style={{ padding: 0 }}>
        {payslips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3>No Payslips Found</h3>
            <p>Your payroll history will appear here once processed.</p>
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
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(ps => (
                  <tr key={ps._id}>
                    <td style={{ fontWeight: 500 }}>{ps.payslipId}</td>
                    <td style={{ fontWeight: 500 }}>{ps.month}</td>
                    <td>${ps.basicSalary.toLocaleString()}</td>
                    <td>${ps.grossSalary.toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>${ps.netPayable.toLocaleString()}</td>
                    <td><StatusBadge status={ps.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => viewPayslip(ps)}>
                          View
                        </button>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => downloadPayslip(ps)}>
                          <Download size={14} />
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
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Payslip: ${selectedPayslip.month}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>CodeThrive Infotech</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payslip for {selectedPayslip.month}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={selectedPayslip.status} />
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {selectedPayslip.payslipId}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Earnings */}
              <div>
                <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: '0 0 1rem 0' }}>Earnings</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Basic Pay</span>
                  <span>${selectedPayslip.basicSalary.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>HRA (Calculated)</span>
                  <span>${(selectedPayslip.basicSalary * 0.4).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Special Allowance</span>
                  <span>${(selectedPayslip.allowances - (selectedPayslip.basicSalary * 0.4)).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bonus</span>
                  <span>${(selectedPayslip.bonus || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontWeight: 600 }}>
                  <span>Gross Salary</span>
                  <span>${selectedPayslip.grossSalary.toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: '0 0 1rem 0' }}>Deductions</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>PF (Provident Fund)</span>
                  <span>${(selectedPayslip.deductions * 0.6).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ESI</span>
                  <span>${(selectedPayslip.deductions * 0.2).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Professional Tax</span>
                  <span>${(selectedPayslip.deductions * 0.2).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontWeight: 600 }}>
                  <span>Total Deductions</span>
                  <span>${selectedPayslip.deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Net Salary Payable</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>${selectedPayslip.netPayable.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
               <button className="btn btn-primary" onClick={() => downloadPayslip(selectedPayslip)}>
                  <Download size={16} style={{marginRight: '0.5rem'}} /> Download PDF
               </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Payroll;
