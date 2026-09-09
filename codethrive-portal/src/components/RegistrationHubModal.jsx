import React, { useState, useEffect } from 'react';
import { 
  User, UserCheck, Search, X, Briefcase, FileText, Calendar, Clock, Banknote,
  KeyRound, ShieldAlert, Plus, CheckCircle, AlertTriangle, ArrowDownLeft, ArrowUpRight,
  Send, Trash2, Eye, Download, MessageSquare, Award, Save, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import StatusBadge from './common/StatusBadge';
import Card from './common/Card';

const DEFAULT_ONBOARDING_DATA = [
  {
    _id: 'emp_001',
    employeeId: 'CTI-EMP-001',
    fullName: 'Mahadevan',
    personalEmailAddress: 'mahadevan@codethrive.com',
    personalPhoneNumber: '9876543210',
    department: 'Engineering',
    designation: 'Senior Full Stack Developer',
    status: 'Active',
    dateOfJoining: '2025-01-15',
    salaryAmount: 85000,
    bankName: 'HDFC Bank',
    accountNumber: '50100234567890',
    ifscCode: 'HDFC0001234',
    user: { role: 'employee', status: 'active' },
    // Sent by Employee to Us
    sentByEmployee: {
      dailyReports: [
        { _id: 'dr1', date: '2026-09-09', title: 'Completed Admin Registered Employees Portal', hoursLogged: '8.0h', status: 'Approved' },
        { _id: 'dr2', date: '2026-09-08', title: 'Implemented 360 Degree Employee Control Hub', hoursLogged: '7.5h', status: 'Approved' }
      ],
      leaveApplications: [
        { _id: 'l1', leaveType: 'Casual Leave', dates: '2026-08-10 to 2026-08-11', reason: 'Family Function in native', status: 'Approved' }
      ],
      uploadedDocs: [
        { name: 'Aadhaar_Card_Mahadevan.pdf', type: 'Identity Proof', date: '2025-01-15', size: '1.2 MB' },
        { name: 'PAN_Card.pdf', type: 'Tax ID', date: '2025-01-15', size: '850 KB' },
        { name: 'Degree_Certificate.pdf', type: 'Education', date: '2025-01-15', size: '2.4 MB' }
      ],
      attendanceLogs: {
        todayStatus: 'Working',
        checkIn: '09:15 AM',
        checkOut: '--:--',
        workTime: '5h 15m',
        breakTime: '15m'
      },
      supportTickets: [
        { _id: 'st1', subject: 'Need access to Staging AWS Cluster', date: '2026-09-05', status: 'Resolved' }
      ]
    },
    // Given / Assigned by Admin to Employee
    assignedByAdmin: {
      tasks: [
        { _id: 't1', taskId: 'TSK-101', title: 'Implement Real-Time Employee Audit Panel', priority: 'High', status: 'In Progress', dueDate: '2026-09-12' },
        { _id: 't2', taskId: 'TSK-102', title: 'Fix Auth Token Expiry Bug', priority: 'Urgent', status: 'In Progress', dueDate: '2026-09-10' }
      ],
      credentials: {
        role: 'employee',
        status: 'Active',
        lastPasswordReset: '2026-08-01'
      },
      payroll: {
        salary: 85000,
        bankName: 'HDFC Bank',
        accNo: '50100234567890',
        ifsc: 'HDFC0001234',
        lastPayslipGenerated: 'August 2026'
      },
      notificationsSent: [
        { _id: 'n1', title: 'Welcome to CodeThrive Engineering Team!', date: '2025-01-15' },
        { _id: 'n2', title: 'Q3 Quarterly Appraisal Scheduled', date: '2026-09-01' }
      ]
    }
  },
  {
    _id: 'emp_002',
    employeeId: 'CTI-EMP-002',
    fullName: 'Priya Sharma',
    personalEmailAddress: 'priya@codethrive.com',
    personalPhoneNumber: '9876543211',
    department: 'UI/UX Design',
    designation: 'Lead Product Designer',
    status: 'Active',
    dateOfJoining: '2025-03-01',
    salaryAmount: 78000,
    bankName: 'ICICI Bank',
    accountNumber: '000401567891',
    ifscCode: 'ICIC0000004',
    user: { role: 'teamlead', status: 'active' },
    sentByEmployee: {
      dailyReports: [
        { _id: 'dr3', date: '2026-09-09', title: 'Designed Figma Mockups for Mobile HRMS App', hoursLogged: '7.0h', status: 'Approved' }
      ],
      leaveApplications: [],
      uploadedDocs: [
        { name: 'Priya_Design_Portfolio.pdf', type: 'Resume', date: '2025-03-01', size: '4.5 MB' },
        { name: 'Aadhaar_Priya.pdf', type: 'Identity Proof', date: '2025-03-01', size: '1.1 MB' }
      ],
      attendanceLogs: {
        todayStatus: 'On Break',
        checkIn: '09:30 AM',
        checkOut: '--:--',
        workTime: '4h 30m',
        breakTime: '20m'
      },
      supportTickets: []
    },
    assignedByAdmin: {
      tasks: [
        { _id: 't3', taskId: 'TSK-103', title: 'Redesign Admin Employee Management UI', priority: 'Urgent', status: 'In Progress', dueDate: '2026-09-11' }
      ],
      credentials: { role: 'teamlead', status: 'Active', lastPasswordReset: '2026-07-15' },
      payroll: { salary: 78000, bankName: 'ICICI Bank', accNo: '000401567891', ifsc: 'ICIC0000004', lastPayslipGenerated: 'August 2026' },
      notificationsSent: [
        { _id: 'n3', title: 'Design System Guidelines Updated', date: '2026-08-20' }
      ]
    }
  },
  {
    _id: 'emp_003',
    employeeId: 'CTI-EMP-003',
    fullName: 'Rahul Verma',
    personalEmailAddress: 'rahul@codethrive.com',
    personalPhoneNumber: '9876543212',
    department: 'Management',
    designation: 'Senior Engineering Lead',
    status: 'Active',
    dateOfJoining: '2024-11-10',
    salaryAmount: 110000,
    bankName: 'Axis Bank',
    accountNumber: '9180200345678',
    ifscCode: 'UTIB0000180',
    user: { role: 'admin', status: 'active' },
    sentByEmployee: {
      dailyReports: [
        { _id: 'dr4', date: '2026-09-08', title: 'Sprint Review & Architecture Planning', hoursLogged: '8.0h', status: 'Approved' }
      ],
      leaveApplications: [],
      uploadedDocs: [
        { name: 'Rahul_ID_Proof.pdf', type: 'Identity Proof', date: '2024-11-10', size: '1.5 MB' }
      ],
      attendanceLogs: { todayStatus: 'Checked Out', checkIn: '08:45 AM', checkOut: '05:15 PM', workTime: '8h 00m', breakTime: '30m' },
      supportTickets: []
    },
    assignedByAdmin: {
      tasks: [
        { _id: 't4', taskId: 'TSK-104', title: 'Q3 Product Deliverables Review', priority: 'High', status: 'Completed', dueDate: '2026-09-08' }
      ],
      credentials: { role: 'admin', status: 'Active', lastPasswordReset: '2026-06-01' },
      payroll: { salary: 110000, bankName: 'Axis Bank', accNo: '9180200345678', ifsc: 'UTIB0000180', lastPayslipGenerated: 'August 2026' },
      notificationsSent: []
    }
  }
];

const RegistrationHubModal = ({ isOpen, onClose }) => {
  const [employees, setEmployees] = useState(DEFAULT_ONBOARDING_DATA);
  const [selectedEmp, setSelectedEmp] = useState(DEFAULT_ONBOARDING_DATA[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSide, setActiveSide] = useState('received'); // 'received' (Sent by Employee) vs 'given' (Assigned by Admin)

  // Sub-tabs
  const [receivedSubTab, setReceivedSubTab] = useState('reports'); // reports, leaves, docs, attendance
  const [givenSubTab, setGivenSubTab] = useState('tasks'); // tasks, credentials, payroll, notifications

  // Forms
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  const [newNoticeTitle, setNewNoticeTitle] = useState('');

  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        // Merge with default bidirectional structure
        const merged = res.data.data.map((emp, i) => ({
          ...DEFAULT_ONBOARDING_DATA[i % DEFAULT_ONBOARDING_DATA.length],
          ...emp
        }));
        setEmployees(merged);
        if (merged.length > 0) setSelectedEmp(merged[0]);
      }
    } catch (err) {
      console.warn('Using default onboarding data');
    }
  };

  if (!isOpen) return null;

  const handleSelectEmployee = (emp) => {
    setSelectedEmp(emp);
    setEditRole(emp.user?.role || 'employee');
    setEditStatus(emp.status || 'Active');
  };

  const handleAssignTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedEmp) return;

    const newTask = {
      _id: 'task_' + Date.now(),
      taskId: 'TSK-' + Math.floor(100 + Math.random() * 900),
      title: newTaskTitle,
      priority: newTaskPriority,
      status: 'Assigned',
      dueDate: newTaskDueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    };

    const updatedEmp = {
      ...selectedEmp,
      assignedByAdmin: {
        ...selectedEmp.assignedByAdmin,
        tasks: [newTask, ...(selectedEmp.assignedByAdmin?.tasks || [])]
      }
    };

    setSelectedEmp(updatedEmp);
    setEmployees(prev => prev.map(e => e._id === selectedEmp._id ? updatedEmp : e));
    setNewTaskTitle('');
    setNewTaskDueDate('');
    alert('Task assigned to employee successfully!');
  };

  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !selectedEmp) return;

    const newNotice = {
      _id: 'notice_' + Date.now(),
      title: newNoticeTitle,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedEmp = {
      ...selectedEmp,
      assignedByAdmin: {
        ...selectedEmp.assignedByAdmin,
        notificationsSent: [newNotice, ...(selectedEmp.assignedByAdmin?.notificationsSent || [])]
      }
    };

    setSelectedEmp(updatedEmp);
    setEmployees(prev => prev.map(e => e._id === selectedEmp._id ? updatedEmp : e));
    setNewNoticeTitle('');
    alert('Notification sent to employee!');
  };

  const handleSaveRoleAndStatus = () => {
    if (!selectedEmp) return;
    const updatedEmp = {
      ...selectedEmp,
      status: editStatus,
      user: { ...selectedEmp.user, role: editRole, status: editStatus }
    };
    setSelectedEmp(updatedEmp);
    setEmployees(prev => prev.map(e => e._id === selectedEmp._id ? updatedEmp : e));
    setNewPassword('');
    alert(`Role set to '${editRole}' and Status set to '${editStatus}' successfully!`);
  };

  const filteredEmps = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    return !q || 
      emp.fullName?.toLowerCase().includes(q) || 
      emp.employeeId?.toLowerCase().includes(q) ||
      emp.personalEmailAddress?.toLowerCase().includes(q);
  });

  return (
    <div className="workspace-360-overlay" style={{ zIndex: 2000 }}>
      <div className="workspace-360-modal" style={{ maxWidth: '1200px', height: '88vh' }}>
        
        {/* Top Header */}
        <div className="workspace-360-header" style={{ background: 'linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
              <UserCheck size={26} color="var(--primary-light)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>Registration & Onboarding Management Hub</h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                360° Access: Everything Sent by Registered Employees vs. Everything Assigned by Admin
              </span>
            </div>
          </div>

          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Inner Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100% - 75px)', overflow: 'hidden' }}>
          
          {/* Left Sidebar: Registered Users List */}
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div className="emp-search-box" style={{ minWidth: '100%', padding: '0.4rem 0.75rem' }}>
                <Search size={14} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search Employee ID..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
              {filteredEmps.map(emp => {
                const isSelected = selectedEmp?._id === emp._id;
                return (
                  <div 
                    key={emp._id}
                    onClick={() => handleSelectEmployee(emp)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      marginBottom: '0.4rem',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(30, 41, 59, 0.3)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--primary-light)' : '#fff' }}>
                        {emp.fullName}
                      </span>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(99,102,241,0.2)', color: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        {emp.employeeId}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{emp.department}</span>
                      <span style={{ textTransform: 'capitalize', color: emp.user?.role === 'admin' ? '#f87171' : '#34d399' }}>{emp.user?.role || 'employee'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main Panel */}
          {selectedEmp ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              
              {/* Selected User Header Card */}
              <div style={{ padding: '1.25rem 1.75rem', background: 'rgba(30, 41, 59, 0.6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="emp-avatar-big" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                    {selectedEmp.fullName?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedEmp.fullName}</h3>
                      <StatusBadge status={selectedEmp.status} />
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      ID: <strong style={{ color: 'var(--primary-light)' }}>{selectedEmp.employeeId}</strong> &bull; {selectedEmp.personalEmailAddress} &bull; {selectedEmp.designation}
                    </span>
                  </div>
                </div>

                {/* Main Toggle Switcher: Received vs Assigned */}
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => setActiveSide('received')}
                    style={{
                      background: activeSide === 'received' ? 'var(--primary)' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '7px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <ArrowDownLeft size={16} /> Received from Employee (அனுப்பியவை)
                  </button>

                  <button 
                    onClick={() => setActiveSide('given')}
                    style={{
                      background: activeSide === 'given' ? 'var(--primary)' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '7px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <ArrowUpRight size={16} /> Assigned by Admin (வழங்குபவை)
                  </button>
                </div>
              </div>

              {/* Main Body View */}
              <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
                
                {/* SIDE A: SENT BY EMPLOYEE TO US */}
                {activeSide === 'received' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Sub-tabs for Received */}
                    <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <button className={`tab-item ${receivedSubTab === 'reports' ? 'active' : ''}`} onClick={() => setReceivedSubTab('reports')}>
                        <FileText size={15} /> Daily Reports ({selectedEmp.sentByEmployee?.dailyReports?.length || 0})
                      </button>
                      <button className={`tab-item ${receivedSubTab === 'leaves' ? 'active' : ''}`} onClick={() => setReceivedSubTab('leaves')}>
                        <Calendar size={15} /> Leave Applications ({selectedEmp.sentByEmployee?.leaveApplications?.length || 0})
                      </button>
                      <button className={`tab-item ${receivedSubTab === 'docs' ? 'active' : ''}`} onClick={() => setReceivedSubTab('docs')}>
                        <Eye size={15} /> Uploaded Documents ({selectedEmp.sentByEmployee?.uploadedDocs?.length || 0})
                      </button>
                      <button className={`tab-item ${receivedSubTab === 'attendance' ? 'active' : ''}`} onClick={() => setReceivedSubTab('attendance')}>
                        <Clock size={15} /> Attendance Logs
                      </button>
                    </div>

                    {/* Sub-tab Content */}
                    {receivedSubTab === 'reports' && (
                      <div>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-light)' }}>Submitted Daily Progress Reports</h4>
                        {selectedEmp.sentByEmployee?.dailyReports?.map(r => (
                          <div key={r._id} className="history-row" style={{ marginBottom: '0.5rem' }}>
                            <div>
                              <strong style={{ display: 'block', color: '#fff' }}>{r.title}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date: {r.date} &bull; Time Logged: {r.hoursLogged}</span>
                            </div>
                            <span className="badge-small">{r.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {receivedSubTab === 'leaves' && (
                      <div>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-light)' }}>Submitted Leave Applications</h4>
                        {selectedEmp.sentByEmployee?.leaveApplications?.length === 0 ? (
                          <div className="empty-box">No pending or submitted leave requests.</div>
                        ) : (
                          selectedEmp.sentByEmployee?.leaveApplications?.map(l => (
                            <div key={l._id} className="history-row" style={{ marginBottom: '0.5rem' }}>
                              <div>
                                <strong style={{ color: '#fff' }}>{l.leaveType} ({l.dates})</strong>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reason: {l.reason}</p>
                              </div>
                              <span className="badge-small">{l.status}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {receivedSubTab === 'docs' && (
                      <div>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-light)' }}>Uploaded Employee Identity & Verification Documents</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                          {selectedEmp.sentByEmployee?.uploadedDocs?.map((doc, idx) => (
                            <div key={idx} style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong style={{ fontSize: '0.88rem', color: '#fff', display: 'block' }}>{doc.name}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.type} &bull; {doc.size}</span>
                              </div>
                              <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                <Download size={12} /> View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {receivedSubTab === 'attendance' && (
                      <div>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-light)' }}>Real-Time Attendance Audit</h4>
                        <div className="audit-cards-grid">
                          <div className="audit-card">
                            <span className="audit-title">Today Status</span>
                            <StatusBadge status={selectedEmp.sentByEmployee?.attendanceLogs?.todayStatus || 'Working'} />
                          </div>
                          <div className="audit-card">
                            <span className="audit-title">Check-In Time</span>
                            <span className="audit-val" style={{ color: 'var(--success)' }}>{selectedEmp.sentByEmployee?.attendanceLogs?.checkIn || '09:15 AM'}</span>
                          </div>
                          <div className="audit-card">
                            <span className="audit-title">Check-Out Time</span>
                            <span className="audit-val" style={{ color: 'var(--info)' }}>{selectedEmp.sentByEmployee?.attendanceLogs?.checkOut || '--:--'}</span>
                          </div>
                          <div className="audit-card">
                            <span className="audit-title">Work Time Logged</span>
                            <span className="audit-val" style={{ color: 'var(--primary-light)' }}>{selectedEmp.sentByEmployee?.attendanceLogs?.workTime || '5h 15m'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* SIDE B: ASSIGNED BY ADMIN TO EMPLOYEE */}
                {activeSide === 'given' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Sub-tabs for Given */}
                    <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <button className={`tab-item ${givenSubTab === 'tasks' ? 'active' : ''}`} onClick={() => setGivenSubTab('tasks')}>
                        <Briefcase size={15} /> Assign Tasks
                      </button>
                      <button className={`tab-item ${givenSubTab === 'credentials' ? 'active' : ''}`} onClick={() => setGivenSubTab('credentials')}>
                        <KeyRound size={15} /> Role & Credentials
                      </button>
                      <button className={`tab-item ${givenSubTab === 'payroll' ? 'active' : ''}`} onClick={() => setGivenSubTab('payroll')}>
                        <Banknote size={15} /> Salary & Payslips
                      </button>
                      <button className={`tab-item ${givenSubTab === 'notifications' ? 'active' : ''}`} onClick={() => setGivenSubTab('notifications')}>
                        <Send size={15} /> Send Announcements
                      </button>
                    </div>

                    {/* Sub-tab Content */}
                    {givenSubTab === 'tasks' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--primary-light)' }}>Assigned Tasks ({selectedEmp.assignedByAdmin?.tasks?.length || 0})</h4>
                        {selectedEmp.assignedByAdmin?.tasks?.map(t => (
                          <div key={t._id} className="task-card-row">
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.taskId}</span>
                              <h4 style={{ margin: '0.2rem 0', fontSize: '0.95rem' }}>{t.title}</h4>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {t.dueDate}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span className={`priority-tag ${t.priority?.toLowerCase()}`}>{t.priority}</span>
                              <StatusBadge status={t.status} />
                            </div>
                          </div>
                        ))}

                        <div className="form-box">
                          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Assign New Task to {selectedEmp.fullName}</h4>
                          <form onSubmit={handleAssignTask} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                            <div>
                              <label className="form-label">Task Title</label>
                              <input type="text" placeholder="e.g. Build Backend Auth Middleware" className="form-input" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required />
                            </div>
                            <div>
                              <label className="form-label">Priority</label>
                              <select className="form-input" value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                              </select>
                            </div>
                            <div>
                              <label className="form-label">Due Date</label>
                              <input type="date" className="form-input" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary">Assign Task</button>
                          </form>
                        </div>
                      </div>
                    )}

                    {givenSubTab === 'credentials' && (
                      <div className="grid-2-col">
                        <Card title={<><KeyRound size={16} style={{ marginRight: '0.5rem' }} /> System Access Role & Status</>}>
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Access Role</label>
                              <select className="form-input" value={editRole} onChange={e => setEditRole(e.target.value)}>
                                <option value="admin">System Administrator</option>
                                <option value="hr">HR Manager</option>
                                <option value="teamlead">Team Lead</option>
                                <option value="employee">Software Employee</option>
                                <option value="intern">Intern</option>
                              </select>
                            </div>

                            <div className="form-group">
                              <label>Account Status</label>
                              <select className="form-input" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive / Suspended</option>
                                <option value="Pending">Pending Approval</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={handleSaveRoleAndStatus}>
                              <Save size={15} /> Apply Changes
                            </button>
                          </div>
                        </Card>

                        <Card title={<><ShieldAlert size={16} style={{ marginRight: '0.5rem' }} /> Reset Password</>}>
                          <div className="form-group">
                            <label>New Temporary Password</label>
                            <input 
                              type="password" 
                              placeholder="Type password..." 
                              className="form-input" 
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                            />
                          </div>
                          <div style={{ marginTop: '1rem' }}>
                            <button className="btn btn-outline" onClick={handleSaveRoleAndStatus} disabled={!newPassword.trim()}>
                              Reset User Password
                            </button>
                          </div>
                        </Card>
                      </div>
                    )}

                    {givenSubTab === 'payroll' && (
                      <Card title="Monthly Salary & Payslips Issued">
                        <div className="detail-rows">
                          <div className="detail-row"><span>Base Salary:</span> <strong>₹{Number(selectedEmp.salaryAmount || 60000).toLocaleString()} / Month</strong></div>
                          <div className="detail-row"><span>Bank Name:</span> <span>{selectedEmp.bankName || 'HDFC Bank'}</span></div>
                          <div className="detail-row"><span>Account No:</span> <span>{selectedEmp.accountNumber || '501002345678'}</span></div>
                          <div className="detail-row"><span>IFSC Code:</span> <span>{selectedEmp.ifscCode || 'HDFC0001234'}</span></div>
                        </div>
                      </Card>
                    )}

                    {givenSubTab === 'notifications' && (
                      <div>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-light)' }}>Direct Notifications Sent to {selectedEmp.fullName}</h4>
                        {selectedEmp.assignedByAdmin?.notificationsSent?.map(n => (
                          <div key={n._id} className="history-row" style={{ marginBottom: '0.5rem' }}>
                            <span style={{ color: '#fff' }}>{n.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sent: {n.date}</span>
                          </div>
                        ))}

                        <div className="form-box" style={{ marginTop: '1rem' }}>
                          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>Send Announcement / Push Notice</h4>
                          <form onSubmit={handleSendNotification} style={{ display: 'flex', gap: '0.75rem' }}>
                            <input 
                              type="text" 
                              placeholder="Type message or announcement..." 
                              className="form-input" 
                              style={{ flex: 1 }}
                              value={newNoticeTitle}
                              onChange={e => setNewNoticeTitle(e.target.value)}
                              required
                            />
                            <button type="submit" className="btn btn-primary">
                              <Send size={15} /> Send Notice
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Select an employee from the left panel to manage.
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RegistrationHubModal;
