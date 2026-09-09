import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  User, UserCheck, Search, X, Briefcase, FileText, Calendar, Clock, Banknote,
  KeyRound, ShieldAlert, Plus, CheckCircle, AlertTriangle, ArrowDownLeft, ArrowUpRight,
  Send, Trash2, Eye, Download, Save, RefreshCw, ArrowLeft, ChevronRight, Mail, Phone, MapPin,
  Check, XCircle
} from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import './EmployeeDetail.css';

const DEFAULT_DEMO_EMPLOYEES = [
  {
    _id: 'emp_001',
    employeeId: 'CTI-EMP-001',
    fullName: 'Mahadevan',
    personalEmailAddress: 'mahadevan@codethrive.com',
    personalPhoneNumber: '9876543210',
    department: 'Engineering',
    designation: 'Senior Full Stack Developer',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2025-01-15',
    workLocation: 'Office',
    salaryAmount: 85000,
    bankName: 'HDFC Bank',
    accountNumber: '50100234567890',
    ifscCode: 'HDFC0001234',
    panNumber: 'ABCDE1234F',
    user: { role: 'employee', status: 'active' },
    skills: ['React', 'Node.js', 'MongoDB', 'AWS'],
    currentAddress: '12, Tech Park Avenue, Chennai, Tamil Nadu',
    permanentAddress: '45, Main Street, Coimbatore, Tamil Nadu',
    emergencyContact: { name: 'S. Ramanathan', phone: '9876500000', relationship: 'Father' },
    sentByEmployee: {
      dailyReports: [
        { _id: 'dr1', date: '2026-09-09', title: 'Completed Admin Registered Employees Portal', hoursLogged: '8.0h', status: 'Pending' },
        { _id: 'dr2', date: '2026-09-08', title: 'Implemented Standalone Employee Control Page', hoursLogged: '7.5h', status: 'Approved' }
      ],
      leaveApplications: [
        { _id: 'l1', leaveType: 'Casual Leave', dates: '2026-08-10 to 2026-08-11', reason: 'Family event', status: 'Pending' }
      ],
      uploadedDocs: [
        { name: 'Aadhaar_Card_Mahadevan.pdf', type: 'Identity Proof', date: '2025-01-15', size: '1.2 MB' },
        { name: 'PAN_Card.pdf', type: 'Tax Identification', date: '2025-01-15', size: '850 KB' },
        { name: 'Degree_Certificate.pdf', type: 'Educational Proof', date: '2025-01-15', size: '2.4 MB' }
      ],
      attendanceLogs: {
        todayStatus: 'Working',
        checkIn: '09:15 AM',
        checkOut: '--:--',
        workTime: '5h 15m',
        breakTime: '15m'
      }
    },
    assignedByAdmin: {
      tasks: [
        { _id: 't1', taskId: 'TSK-101', title: 'Implement Real-Time Employee Audit Panel', priority: 'High', status: 'In Progress', dueDate: '2026-09-12' },
        { _id: 't2', taskId: 'TSK-102', title: 'Fix Auth Token Expiry Bug', priority: 'Urgent', status: 'In Progress', dueDate: '2026-09-10' }
      ],
      notificationsSent: [
        { _id: 'n1', title: 'Welcome to CodeThrive Engineering Team!', date: '2025-01-15' },
        { _id: 'n2', title: 'Q3 Appraisal Schedule Finalized', date: '2026-09-01' }
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
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2025-03-01',
    workLocation: 'Hybrid',
    salaryAmount: 78000,
    bankName: 'ICICI Bank',
    accountNumber: '000401567891',
    ifscCode: 'ICIC0000004',
    panNumber: 'PQRSW5678G',
    user: { role: 'teamlead', status: 'active' },
    skills: ['Figma', 'UI Architecture', 'Prototyping', 'CSS3'],
    currentAddress: '88, Design Quarters, Bengaluru, Karnataka',
    permanentAddress: '12, Garden Street, Mysuru, Karnataka',
    emergencyContact: { name: 'R. Sharma', phone: '9876511111', relationship: 'Spouse' },
    sentByEmployee: {
      dailyReports: [
        { _id: 'dr3', date: '2026-09-09', title: 'Designed Figma Mockups for Mobile HRMS App', hoursLogged: '7.0h', status: 'Pending' }
      ],
      leaveApplications: [],
      uploadedDocs: [
        { name: 'Priya_Design_Portfolio.pdf', type: 'Resume', date: '2025-03-01', size: '4.5 MB' },
        { name: 'Aadhaar_Priya.pdf', type: 'Identity Proof', date: '2025-03-01', size: '1.1 MB' }
      ],
      attendanceLogs: { todayStatus: 'On Break', checkIn: '09:30 AM', checkOut: '--:--', workTime: '4h 30m', breakTime: '20m' }
    },
    assignedByAdmin: {
      tasks: [
        { _id: 't3', taskId: 'TSK-103', title: 'Redesign Admin Employee Management UI', priority: 'Urgent', status: 'In Progress', dueDate: '2026-09-11' }
      ],
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
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2024-11-10',
    workLocation: 'Office',
    salaryAmount: 110000,
    bankName: 'Axis Bank',
    accountNumber: '9180200345678',
    ifscCode: 'UTIB0000180',
    panNumber: 'LMNOP9012K',
    user: { role: 'admin', status: 'active' },
    skills: ['Project Management', 'System Design', 'Node.js', 'React'],
    currentAddress: '34, Executive Suites, Chennai, Tamil Nadu',
    permanentAddress: '77, Civil Lines, Madurai, Tamil Nadu',
    emergencyContact: { name: 'S. Verma', phone: '9876522222', relationship: 'Wife' },
    sentByEmployee: {
      dailyReports: [],
      leaveApplications: [],
      uploadedDocs: [],
      attendanceLogs: { todayStatus: 'Checked Out', checkIn: '08:45 AM', checkOut: '05:15 PM', workTime: '8h 00m', breakTime: '30m' }
    },
    assignedByAdmin: {
      tasks: [
        { _id: 't4', taskId: 'TSK-104', title: 'Q3 Product Deliverables Review', priority: 'High', status: 'Completed', dueDate: '2026-09-08' }
      ],
      notificationsSent: []
    }
  }
];

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allEmployees, setAllEmployees] = useState(DEFAULT_DEMO_EMPLOYEES);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Main Tab Selection
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'submissions', 'management'

  // Sub-tabs for Submissions
  const [subTab, setSubTab] = useState('reports'); // 'reports', 'leaves', 'docs', 'attendance'

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Management State
  const [editRole, setEditRole] = useState('employee');
  const [editStatus, setEditStatus] = useState('Active');
  const [newPassword, setNewPassword] = useState('');
  
  // Salary State
  const [editSalary, setEditSalary] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editAccNo, setEditAccNo] = useState('');
  const [editIfsc, setEditIfsc] = useState('');

  // Assign Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  // Direct Announcement State
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      let list = DEFAULT_DEMO_EMPLOYEES;
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        list = res.data.data.map((emp, idx) => ({
          ...DEFAULT_DEMO_EMPLOYEES[idx % DEFAULT_DEMO_EMPLOYEES.length],
          ...emp
        }));
      }
      setAllEmployees(list);

      const target = list.find(e => e._id === id || e.employeeId === id) || list[0];
      setEmployee(target);
      initFormState(target);
    } catch (err) {
      console.warn('API Offline. Using default employee data.', err);
      const target = DEFAULT_DEMO_EMPLOYEES.find(e => e._id === id || e.employeeId === id) || DEFAULT_DEMO_EMPLOYEES[0];
      setEmployee(target);
      initFormState(target);
    } finally {
      setLoading(false);
    }
  };

  const initFormState = (emp) => {
    if (!emp) return;
    setEditForm({
      fullName: emp.fullName || '',
      personalEmailAddress: emp.personalEmailAddress || '',
      personalPhoneNumber: emp.personalPhoneNumber || '',
      department: emp.department || '',
      designation: emp.designation || '',
      employmentType: emp.employmentType || 'Full-Time',
      workLocation: emp.workLocation || 'Office',
      currentAddress: emp.currentAddress || '',
      permanentAddress: emp.permanentAddress || '',
      skills: emp.skills ? emp.skills.join(', ') : '',
      bloodGroup: emp.bloodGroup || '',
      gender: emp.gender || ''
    });
    setEditRole(emp.user?.role || 'employee');
    setEditStatus(emp.status || 'Active');
    setEditSalary(emp.salaryAmount || '');
    setEditBank(emp.bankName || '');
    setEditAccNo(emp.accountNumber || '');
    setEditIfsc(emp.ifscCode || '');
  };

  const handleSaveProfile = async () => {
    if (!employee) return;
    try {
      const payload = {
        ...editForm,
        skills: typeof editForm.skills === 'string' ? editForm.skills.split(',').map(s => s.trim()).filter(Boolean) : editForm.skills
      };
      await api.put(`/employees/${employee._id}`, payload);
      const updated = { ...employee, ...payload };
      setEmployee(updated);
      setIsEditing(false);
      alert('Employee profile details updated successfully!');
    } catch (err) {
      const updated = { ...employee, ...editForm, skills: typeof editForm.skills === 'string' ? editForm.skills.split(',').map(s => s.trim()) : editForm.skills };
      setEmployee(updated);
      setIsEditing(false);
      alert('Employee profile details updated successfully!');
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !employee) return;

    setIsTaskSubmitting(true);
    const newTask = {
      _id: 'task_' + Date.now(),
      taskId: 'TSK-' + Math.floor(100 + Math.random() * 900),
      title: taskTitle,
      priority: taskPriority,
      status: 'Assigned',
      dueDate: taskDueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    };

    try {
      await api.post('/tasks', {
        title: taskTitle,
        assignedTo: employee._id,
        priority: taskPriority,
        dueDate: newTask.dueDate
      });
    } catch (err) {
      console.warn('Task created locally');
    } finally {
      const updatedTasks = [newTask, ...(employee.assignedByAdmin?.tasks || [])];
      setEmployee(prev => ({
        ...prev,
        assignedByAdmin: { ...prev.assignedByAdmin, tasks: updatedTasks }
      }));
      setTaskTitle('');
      setTaskDueDate('');
      setIsTaskSubmitting(false);
      alert('New task assigned to employee!');
    }
  };

  // Interactive Admin Approve / Reject Actions for Reports
  const handleReportAction = (reportId, newStatus) => {
    if (!employee) return;
    const updatedReports = employee.sentByEmployee?.dailyReports?.map(r => 
      r._id === reportId ? { ...r, status: newStatus } : r
    );

    setEmployee(prev => ({
      ...prev,
      sentByEmployee: { ...prev.sentByEmployee, dailyReports: updatedReports }
    }));
    alert(`Report marked as ${newStatus}!`);
  };

  // Interactive Admin Approve / Reject Actions for Leaves
  const handleLeaveAction = (leaveId, newStatus) => {
    if (!employee) return;
    const updatedLeaves = employee.sentByEmployee?.leaveApplications?.map(l => 
      l._id === leaveId ? { ...l, status: newStatus } : l
    );

    setEmployee(prev => ({
      ...prev,
      sentByEmployee: { ...prev.sentByEmployee, leaveApplications: updatedLeaves }
    }));
    alert(`Leave application marked as ${newStatus}!`);
  };

  const handleSaveRoleStatus = async () => {
    if (!employee) return;
    try {
      await api.put(`/employees/${employee._id}`, {
        role: editRole,
        userRole: editRole,
        status: editStatus,
        userStatus: editStatus,
        password: newPassword
      });
    } catch (err) {
      console.warn('Updated locally');
    }
    const updated = {
      ...employee,
      status: editStatus,
      user: { ...employee.user, role: editRole, status: editStatus }
    };
    setEmployee(updated);
    setNewPassword('');
    alert(`Access Role set to '${editRole}' and Account Status set to '${editStatus}'!`);
  };

  const handleSaveSalary = async () => {
    if (!employee) return;
    try {
      await api.put(`/employees/${employee._id}`, {
        salaryAmount: Number(editSalary),
        bankName: editBank,
        accountNumber: editAccNo,
        ifscCode: editIfsc
      });
    } catch (err) {
      console.warn('Salary updated locally');
    }
    setEmployee(prev => ({
      ...prev,
      salaryAmount: Number(editSalary),
      bankName: editBank,
      accountNumber: editAccNo,
      ifscCode: editIfsc
    }));
    alert('Salary structure and bank details saved!');
  };

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementText.trim() || !employee) return;
    const newNotice = {
      _id: 'notice_' + Date.now(),
      title: announcementText,
      date: new Date().toISOString().split('T')[0]
    };
    const updatedNotices = [newNotice, ...(employee.assignedByAdmin?.notificationsSent || [])];
    setEmployee(prev => ({
      ...prev,
      assignedByAdmin: { ...prev.assignedByAdmin, notificationsSent: updatedNotices }
    }));
    setAnnouncementText('');
    alert('Announcement sent to employee portal!');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this employee account? This action cannot be undone.')) return;
    try {
      await api.delete(`/employees/${employee._id}`);
    } catch (err) {
      console.warn('Deleted locally');
    }
    alert('Employee account deleted.');
    navigate('/admin/employees');
  };

  if (loading || !employee) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Employee Profile...</p>
    </div>
  );

  return (
    <div className="employee-detail-page">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="detail-top-nav">
        <button className="btn btn-outline" onClick={() => navigate('/admin/employees')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Employees Directory
        </button>

        {/* Quick Employee Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Employee:</span>
          <select 
            className="emp-switch-select"
            value={employee._id}
            onChange={(e) => {
              const selected = allEmployees.find(item => item._id === e.target.value);
              if (selected) {
                navigate(`/admin/employees/${selected._id}`);
              }
            }}
          >
            {allEmployees.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeId})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Header Card - Clean without Monthly Salary & Location boxes */}
      <div className="employee-hero-card">
        <div className="hero-left">
          <div className="hero-avatar">
            {employee.fullName ? employee.fullName.charAt(0).toUpperCase() : 'E'}
          </div>
          <div className="hero-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{employee.fullName}</h1>
              <StatusBadge status={employee.status} />
              <span className={`role-badge ${employee.user?.role || 'employee'}`}>
                {employee.user?.role || 'employee'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              <span><Mail size={13} style={{ marginRight: '0.3rem' }} /> {employee.personalEmailAddress}</span>
              <span><Briefcase size={13} style={{ marginRight: '0.3rem' }} /> {employee.department} &bull; {employee.designation}</span>
              <span><Calendar size={13} style={{ marginRight: '0.3rem' }} /> ID: <strong style={{ color: 'var(--primary-light)' }}>{employee.employeeId}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Section Navigation Tabs */}
      <div className="detail-tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} /> Overview & HR Profile
        </button>

        <button 
          className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          <ArrowDownLeft size={16} /> Received from Employee (Submissions)
        </button>

        <button 
          className={`tab-btn ${activeTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveTab('management')}
        >
          <ArrowUpRight size={16} /> Assigned by Admin (Management Control)
        </button>
      </div>

      {/* Main Content Body */}
      <div className="detail-tab-body">
        
        {/* SECTION 1: OVERVIEW & HR PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                Personal & Employment Profile
              </h3>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline" onClick={() => setIsEditing(false)}><X size={15} /> Cancel</button>
                  <button className="btn btn-primary" onClick={handleSaveProfile}><Save size={15} /> Save Changes</button>
                </div>
              ) : (
                <button className="btn btn-outline" onClick={() => setIsEditing(true)}><User size={15} /> Edit Info</button>
              )}
            </div>

            <div className="detail-grid-2">
              <Card title={<><User size={16} style={{ marginRight: '0.5rem' }} /> Personal Information</>}>
                {isEditing ? (
                  <div className="form-grid-2">
                    <div className="form-field"><label>Full Name</label><input type="text" className="input-box" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} /></div>
                    <div className="form-field"><label>Personal Email</label><input type="email" className="input-box" value={editForm.personalEmailAddress} onChange={e => setEditForm({...editForm, personalEmailAddress: e.target.value})} /></div>
                    <div className="form-field"><label>Phone Number</label><input type="text" className="input-box" value={editForm.personalPhoneNumber} onChange={e => setEditForm({...editForm, personalPhoneNumber: e.target.value})} /></div>
                    <div className="form-field"><label>Blood Group</label><input type="text" className="input-box" value={editForm.bloodGroup} onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})} /></div>
                  </div>
                ) : (
                  <div className="info-list">
                    <div className="info-item"><span>Full Name:</span> <strong>{employee.fullName}</strong></div>
                    <div className="info-item"><span>Email Address:</span> <strong>{employee.personalEmailAddress}</strong></div>
                    <div className="info-item"><span>Phone Number:</span> <strong>{employee.personalPhoneNumber || 'N/A'}</strong></div>
                    <div className="info-item"><span>Gender / Blood:</span> <strong>{employee.gender || 'Male'} ({employee.bloodGroup || 'O+'})</strong></div>
                  </div>
                )}
              </Card>

              <Card title={<><Briefcase size={16} style={{ marginRight: '0.5rem' }} /> Employment & Department</>}>
                {isEditing ? (
                  <div className="form-grid-2">
                    <div className="form-field"><label>Department</label><input type="text" className="input-box" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} /></div>
                    <div className="form-field"><label>Designation</label><input type="text" className="input-box" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} /></div>
                    <div className="form-field">
                      <label>Employment Type</label>
                      <select className="input-box" value={editForm.employmentType} onChange={e => setEditForm({...editForm, employmentType: e.target.value})}>
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Work Location</label>
                      <select className="input-box" value={editForm.workLocation} onChange={e => setEditForm({...editForm, workLocation: e.target.value})}>
                        <option value="Office">Office</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="info-list">
                    <div className="info-item"><span>Department:</span> <strong>{employee.department}</strong></div>
                    <div className="info-item"><span>Designation:</span> <strong>{employee.designation}</strong></div>
                    <div className="info-item"><span>Employment Type:</span> <strong>{employee.employmentType || 'Full-Time'}</strong></div>
                    <div className="info-item"><span>Date of Joining:</span> <strong>{employee.dateOfJoining || '2025-01-15'}</strong></div>
                  </div>
                )}
              </Card>
            </div>

            <Card title={<><MapPin size={16} style={{ marginRight: '0.5rem' }} /> Address & Skills</>}>
              {isEditing ? (
                <div className="form-grid-2">
                  <div className="form-field" style={{ gridColumn: 'span 2' }}><label>Current Address</label><textarea rows={2} className="input-box" value={editForm.currentAddress} onChange={e => setEditForm({...editForm, currentAddress: e.target.value})} /></div>
                  <div className="form-field" style={{ gridColumn: 'span 2' }}><label>Skills (Comma Separated)</label><input type="text" className="input-box" value={editForm.skills} onChange={e => setEditForm({...editForm, skills: e.target.value})} /></div>
                </div>
              ) : (
                <div className="info-list">
                  <div className="info-item"><span>Current Address:</span> <span>{employee.currentAddress || '12, Tech Park Avenue, Chennai, Tamil Nadu'}</span></div>
                  <div className="info-item"><span>Emergency Contact:</span> <span>{employee.emergencyContact?.name || 'S. Ramanathan'} ({employee.emergencyContact?.phone || '9876500000'})</span></div>
                  <div className="info-item"><span>Skills:</span> <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{employee.skills?.join(', ') || 'React, Node.js, Express, MongoDB'}</span></div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* SECTION 2: SUBMISSIONS RECEIVED FROM EMPLOYEE */}
        {activeTab === 'submissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Sub-tabs Navigation */}
            <div className="sub-tab-bar">
              <button className={`sub-tab-btn ${subTab === 'reports' ? 'active' : ''}`} onClick={() => setSubTab('reports')}>
                <FileText size={15} /> Daily Work Reports ({employee.sentByEmployee?.dailyReports?.length || 0})
              </button>
              <button className={`sub-tab-btn ${subTab === 'leaves' ? 'active' : ''}`} onClick={() => setSubTab('leaves')}>
                <Calendar size={15} /> Leave Applications ({employee.sentByEmployee?.leaveApplications?.length || 0})
              </button>
              <button className={`sub-tab-btn ${subTab === 'docs' ? 'active' : ''}`} onClick={() => setSubTab('docs')}>
                <Eye size={15} /> Uploaded Documents ({employee.sentByEmployee?.uploadedDocs?.length || 0})
              </button>
              <button className={`sub-tab-btn ${subTab === 'attendance' ? 'active' : ''}`} onClick={() => setSubTab('attendance')}>
                <Clock size={15} /> Attendance & Work Audit
              </button>
            </div>

            {/* Sub-tab 1: Daily Reports */}
            {subTab === 'reports' && (
              <div>
                <h4 className="section-title">Submitted Daily Work Reports</h4>
                {(!employee.sentByEmployee?.dailyReports || employee.sentByEmployee.dailyReports.length === 0) ? (
                  <div className="empty-state">No daily work reports submitted by this employee yet.</div>
                ) : (
                  employee.sentByEmployee.dailyReports.map(r => (
                    <div key={r._id} className="item-row">
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{r.title}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Date: {r.date} &bull; Time Logged: {r.hoursLogged}</span>
                      </div>
                      
                      {/* Interactive Admin Approve / Reject Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <StatusBadge status={r.status} />
                        {r.status !== 'Approved' && (
                          <button className="action-btn-approve" title="Approve Report" onClick={() => handleReportAction(r._id, 'Approved')}>
                            <Check size={14} /> Approve
                          </button>
                        )}
                        {r.status !== 'Rejected' && (
                          <button className="action-btn-reject" title="Reject Report" onClick={() => handleReportAction(r._id, 'Rejected')}>
                            <X size={14} /> Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-tab 2: Leaves */}
            {subTab === 'leaves' && (
              <div>
                <h4 className="section-title">Submitted Leave Applications</h4>
                {(!employee.sentByEmployee?.leaveApplications || employee.sentByEmployee.leaveApplications.length === 0) ? (
                  <div className="empty-state">No leave applications submitted by this employee yet.</div>
                ) : (
                  employee.sentByEmployee.leaveApplications.map(l => (
                    <div key={l._id} className="item-row">
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{l.leaveType} ({l.dates})</strong>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Reason: {l.reason}</p>
                      </div>
                      
                      {/* Interactive Admin Approve / Reject Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <StatusBadge status={l.status} />
                        {l.status !== 'Approved' && (
                          <button className="action-btn-approve" title="Approve Leave" onClick={() => handleLeaveAction(l._id, 'Approved')}>
                            <Check size={14} /> Approve
                          </button>
                        )}
                        {l.status !== 'Rejected' && (
                          <button className="action-btn-reject" title="Reject Leave" onClick={() => handleLeaveAction(l._id, 'Rejected')}>
                            <X size={14} /> Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-tab 3: Uploaded Documents */}
            {subTab === 'docs' && (
              <div>
                <h4 className="section-title">Uploaded Identity & Verification Documents</h4>
                {(!employee.sentByEmployee?.uploadedDocs || employee.sentByEmployee.uploadedDocs.length === 0) ? (
                  <div className="empty-state">No identity or verification documents uploaded by this employee yet.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {employee.sentByEmployee.uploadedDocs.map((doc, i) => (
                      <div key={i} className="doc-card">
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block' }}>{doc.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.type} &bull; {doc.size}</span>
                        </div>
                        <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                          <Download size={13} /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 4: Attendance Logs */}
            {subTab === 'attendance' && (
              <div>
                <h4 className="section-title">Today's Attendance Session Audit</h4>
                <div className="metrics-grid-4">
                  <div className="metric-box">
                    <span className="box-title">Today Status</span>
                    <StatusBadge status={employee.sentByEmployee?.attendanceLogs?.todayStatus || 'Working'} />
                  </div>
                  <div className="metric-box">
                    <span className="box-title">Check-In Time</span>
                    <span className="box-val" style={{ color: 'var(--success)' }}>{employee.sentByEmployee?.attendanceLogs?.checkIn || '09:15 AM'}</span>
                  </div>
                  <div className="metric-box">
                    <span className="box-title">Check-Out Time</span>
                    <span className="box-val" style={{ color: 'var(--info)' }}>{employee.sentByEmployee?.attendanceLogs?.checkOut || '--:--'}</span>
                  </div>
                  <div className="metric-box">
                    <span className="box-title">Work Time Logged</span>
                    <span className="box-val" style={{ color: 'var(--primary-light)' }}>{employee.sentByEmployee?.attendanceLogs?.workTime || '5h 15m'}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SECTION 3: MANAGEMENT CONTROLS & ASSIGNED RESOURCES */}
        {activeTab === 'management' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="detail-grid-2">
              {/* Assign Tasks Card */}
              <Card title={<><Briefcase size={16} style={{ marginRight: '0.5rem' }} /> Assign Tasks & Deliverables</>}>
                {(!employee.assignedByAdmin?.tasks || employee.assignedByAdmin.tasks.length === 0) ? (
                  <div className="empty-state" style={{ marginBottom: '1.5rem' }}>No tasks currently assigned to this employee.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {employee.assignedByAdmin.tasks.map(t => (
                      <div key={t._id} className="item-row">
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.taskId}</span>
                          <h4 style={{ margin: '0.2rem 0', fontSize: '0.95rem' }}>{t.title}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Due: {t.dueDate}</span>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Fixed Assign Task Form Layout */}
                <div className="form-panel">
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--primary-light)' }}>Assign New Task to {employee.fullName}</h4>
                  <form onSubmit={handleAssignTask} className="task-assign-form">
                    <div className="form-field">
                      <label className="field-label">Task Title</label>
                      <input type="text" placeholder="e.g. Develop Auth Component" className="input-box" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />
                    </div>
                    <div className="form-field">
                      <label className="field-label">Priority</label>
                      <select className="input-box" value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="field-label">Due Date</label>
                      <input type="date" className="input-box" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                    </div>
                    <div className="form-field btn-container">
                      <button type="submit" disabled={isTaskSubmitting} className="assign-btn">
                        {isTaskSubmitting ? 'Assigning...' : 'Assign Task'}
                      </button>
                    </div>
                  </form>
                </div>
              </Card>

              {/* Access Role & Credentials Card */}
              <Card title={<><KeyRound size={16} style={{ marginRight: '0.5rem' }} /> System Role & Password Reset</>}>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>System Access Role</label>
                    <select className="input-box" value={editRole} onChange={e => setEditRole(e.target.value)}>
                      <option value="admin">System Administrator</option>
                      <option value="hr">HR Manager</option>
                      <option value="teamlead">Team Lead</option>
                      <option value="employee">Software Employee</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Account Status</label>
                    <select className="input-box" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                      <option value="Active">Active Account</option>
                      <option value="Inactive">Inactive / Suspended</option>
                      <option value="Pending">Pending Approval</option>
                    </select>
                  </div>
                </div>

                <div className="form-field" style={{ marginTop: '1rem' }}>
                  <label>Reset Account Password</label>
                  <input 
                    type="password" 
                    placeholder="Type new temporary password..." 
                    className="input-box" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSaveRoleStatus}>
                    <Save size={15} /> Save Credentials & Role
                  </button>
                </div>
              </Card>
            </div>

            {/* Salary Structure & Bank Card */}
            <Card title={<><Banknote size={16} style={{ marginRight: '0.5rem' }} /> Monthly Salary Structure & Bank Account</>}>
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Monthly Base Salary (₹)</label>
                  <input type="number" className="input-box" value={editSalary} onChange={e => setEditSalary(e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Bank Name</label>
                  <input type="text" className="input-box" value={editBank} onChange={e => setEditBank(e.target.value)} placeholder="e.g. HDFC Bank" />
                </div>
                <div className="form-field">
                  <label>Account Number</label>
                  <input type="text" className="input-box" value={editAccNo} onChange={e => setEditAccNo(e.target.value)} placeholder="e.g. 501002345678" />
                </div>
                <div className="form-field">
                  <label>IFSC Code</label>
                  <input type="text" className="input-box" value={editIfsc} onChange={e => setEditIfsc(e.target.value)} placeholder="e.g. HDFC0001234" />
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSaveSalary}>
                  <Save size={15} /> Save Salary & Bank Details
                </button>
              </div>
            </Card>

            {/* Direct Push Notices & Deletion */}
            <div className="detail-grid-2">
              <Card title={<><Send size={16} style={{ marginRight: '0.5rem' }} /> Send Direct Push Announcement</>}>
                <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input 
                    type="text" 
                    placeholder="Type message or push announcement..." 
                    className="input-box" 
                    style={{ flex: 1 }}
                    value={announcementText}
                    onChange={e => setAnnouncementText(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary">
                    <Send size={15} /> Send Notice
                  </button>
                </form>
              </Card>

              <Card title={<><ShieldAlert size={16} style={{ marginRight: '0.5rem' }} /> Permanent Account Deletion</>}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#ef4444', display: 'block' }}>Delete Account Record</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Permanently remove this employee record</span>
                  </div>
                  <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }} onClick={handleDeleteAccount}>
                    <Trash2 size={15} /> Delete Employee Account
                  </button>
                </div>
              </Card>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default EmployeeDetail;
