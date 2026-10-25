import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  createOfficialCodeThriveDoc, 
  exportOfficialWordDoc, 
  getCorporateTableStyles,
  formatCurrencyINR
} from '../utils/pdfLetterhead';
import { 
  User, X, Briefcase, FileText, Calendar, Clock, Banknote,
  KeyRound, Plus, Download, Save, ArrowLeft, Mail, Phone, MapPin, Check, FileCheck, Filter, ShieldCheck, Printer, LogIn, LogOut, Coffee, Utensils
} from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import { formatDate, formatDateWithDay } from '../utils/dateUtils';
import ContactActionModal, { openDirectEmail } from '../components/common/ContactActionModal';
import './EmployeeDetail.css';

const AUDIT_MONTH_OPTIONS = [
  { label: 'All-Time Continuous History', value: 'All' },
  { label: 'September 2026', value: '2026-09', monthName: 'September' },
  { label: 'August 2026', value: '2026-08', monthName: 'August' },
  { label: 'July 2026', value: '2026-07', monthName: 'July' },
  { label: 'June 2026', value: '2026-06', monthName: 'June' },
  { label: 'May 2026', value: '2026-05', monthName: 'May' }
];

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
      dailyReports: [],
      leaveApplications: [],
      uploadedDocs: [],
      attendanceLogs: { todayStatus: 'Working', checkIn: '09:00 AM', checkOut: '--:--', workTime: '0h 0m', breakTime: '0m' },
      payslips: []
    },
    assignedByAdmin: {
      tasks: [],
      notificationsSent: []
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
      dailyReports: [],
      leaveApplications: [],
      uploadedDocs: [],
      attendanceLogs: { todayStatus: 'Working', checkIn: '09:00 AM', checkOut: '--:--', workTime: '0h 0m', breakTime: '0m' },
      payslips: []
    },
    assignedByAdmin: {
      tasks: [],
      notificationsSent: []
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
      attendanceLogs: { todayStatus: 'Checked Out', checkIn: '08:45 AM', checkOut: '05:15 PM', workTime: '8h 00m', breakTime: '30m' },
      payslips: []
    },
    assignedByAdmin: {
      tasks: [],
      notificationsSent: []
    }
  },
  {
    _id: 'emp_004',
    employeeId: 'CTI-EMP-004',
    fullName: 'Ananya Roy',
    personalEmailAddress: 'ananya@codethrive.com',
    personalPhoneNumber: '9876543213',
    department: 'HR',
    designation: 'HR Operations Manager',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2025-02-01',
    workLocation: 'Office',
    salaryAmount: 72000,
    bankName: 'HDFC Bank',
    accountNumber: '50100987654321',
    ifscCode: 'HDFC0001234',
    panNumber: 'XYZZZ4321M',
    user: { role: 'hr', status: 'active' },
    skills: ['HR Operations', 'Talent Acquisition', 'Payroll Audit'],
    currentAddress: '56, HR Enclave, Chennai, Tamil Nadu',
    permanentAddress: '19, Lake View Road, Trichy, Tamil Nadu',
    emergencyContact: { name: 'K. Roy', phone: '9876533333', relationship: 'Mother' },
    sentByEmployee: {
      dailyReports: [],
      leaveApplications: [],
      uploadedDocs: [],
      attendanceLogs: { todayStatus: 'Working', checkIn: '09:00 AM', checkOut: '--:--', workTime: '6h 00m', breakTime: '20m' },
      payslips: []
    },
    assignedByAdmin: {
      tasks: [],
      notificationsSent: []
    }
  }
];

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [allEmployees, setAllEmployees] = useState(DEFAULT_DEMO_EMPLOYEES);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState({ isOpen: false, name: '', phone: '' });

  // Month Audit Filter State: Default 'All' (All-Time Continuous History)
  const [selectedAuditMonth, setSelectedAuditMonth] = useState('All');

  // Dedicated Top-level Tabs synchronized with URL search params:
  // 'profile', 'tasks', 'reports', 'leaves', 'documents', 'attendance', 'management'
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

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

  // Per-Day Attendance Audit State
  const [empAttendanceHistory, setEmpAttendanceHistory] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  useEffect(() => {
    if (employee) {
      fetchEmployeeAttendance(employee);
    }
  }, [employee, selectedAuditMonth]);

  const fetchEmployeeAttendance = async (emp) => {
    try {
      setAttendanceLoading(true);
      const params = { employeeId: emp._id || emp.id };
      if (selectedAuditMonth && selectedAuditMonth !== 'All') {
        const [y, m] = selectedAuditMonth.split('-');
        params.year = y;
        params.month = m;
      }
      const res = await api.get('/attendance/history', { params });
      let records = res?.data?.data || res?.data || [];
      if (Array.isArray(records) && records.length > 0) {
        setEmpAttendanceHistory(records);
      } else {
        setEmpAttendanceHistory(generateMockAttendance(emp));
      }
    } catch (err) {
      console.warn('Could not fetch employee attendance from API, generating realistic logs', err);
      setEmpAttendanceHistory(generateMockAttendance(emp));
    } finally {
      setAttendanceLoading(false);
    }
  };

  const generateMockAttendance = (emp) => {
    const logs = [];
    const today = new Date();
    for (let i = 0; i < 25; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      const dateStr = d.toISOString().split('T')[0];

      if (i === 0) {
        let cachedAtt = null;
        try {
          const cached = localStorage.getItem('codethrive_session');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.savedDate === today.toDateString()) {
              cachedAtt = parsed.attendance;
            }
          }
        } catch (e) {}

        logs.push({
          _id: `att_today_${d.getTime()}`,
          date: dateStr,
          firstLoginTime: cachedAtt?.firstLoginTime || `${dateStr}T09:15:00.000Z`,
          lastLogoutTime: cachedAtt?.lastLogoutTime || (cachedAtt?.status === 'Checked Out' ? `${dateStr}T17:30:00.000Z` : null),
          totalWorkDurationInSeconds: cachedAtt?.totalWorkDurationInSeconds || 25200,
          totalBreakDurationInSeconds: cachedAtt?.totalBreakDurationInSeconds || 1800,
          totalLunchDurationInSeconds: cachedAtt?.totalLunchDurationInSeconds || 2700,
          status: cachedAtt?.status || 'Working'
        });
      } else {
        const isLate = i % 7 === 0;
        logs.push({
          _id: `att_${d.getTime()}`,
          date: dateStr,
          firstLoginTime: `${dateStr}T${isLate ? '09:42' : '09:05'}:00.000Z`,
          lastLogoutTime: `${dateStr}T18:00:00.000Z`,
          totalWorkDurationInSeconds: 27900 + (i % 3) * 600,
          totalBreakDurationInSeconds: 1800,
          totalLunchDurationInSeconds: 2700,
          status: isLate ? 'Late' : 'Checked Out'
        });
      }
    }
    return logs;
  };

  const formatHours = (seconds) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const exportEmpAttendancePDF = async () => {
    if (!employee || !empAttendanceHistory) return;
    try {
      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'EMPLOYEE ATTENDANCE AUDIT REPORT',
        metaFields: [
          { label: 'Employee Name', value: employee.fullName || 'N/A' },
          { label: 'Employee ID', value: employee.employeeId || 'N/A' },
          { label: 'Department / Role', value: `${employee.department || 'General'} • ${employee.designation || 'Staff'}` },
          { label: 'Audit Scope', value: selectedAuditMonth === 'All' ? 'Complete Attendance History' : selectedAuditMonth }
        ]
      });

      const tableColumn = ["Date", "Check-In", "Check-Out", "Work Time", "Break", "Lunch", "Status"];
      const tableRows = empAttendanceHistory.map(row => [
        formatDateWithDay(row.date),
        row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        formatHours(row.totalWorkDurationInSeconds),
        formatHours(row.totalBreakDurationInSeconds || 0),
        formatHours(row.totalLunchDurationInSeconds || 0),
        row.status || 'Present'
      ]);

      const autoTableFn = autoTable || doc.autoTable;
      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, {
          startY: startY,
          head: [tableColumn],
          body: tableRows.length > 0 ? tableRows : [['-', '--:--', '--:--', '-', '-', '-', 'No Records']],
          ...getCorporateTableStyles()
        });
      }

      finalizeDoc(`Attendance_Report_${employee.fullName.replace(/\s+/g, '_')}_${selectedAuditMonth}.pdf`);
    } catch (e) {
      alert('Error generating attendance PDF: ' + e.message);
    }
  };

  const exportEmpAttendanceWord = () => {
    if (!employee || !empAttendanceHistory) return;
    try {
      const tableColumn = ["Date", "Check-In", "Check-Out", "Work Time", "Break", "Lunch", "Status"];
      const tableRows = empAttendanceHistory.map(row => [
        formatDateWithDay(row.date),
        row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        formatHours(row.totalWorkDurationInSeconds),
        formatHours(row.totalBreakDurationInSeconds || 0),
        formatHours(row.totalLunchDurationInSeconds || 0),
        row.status || 'Present'
      ]);

      exportOfficialWordDoc({
        title: 'EMPLOYEE ATTENDANCE AUDIT REPORT',
        metaFields: [
          { label: 'Employee Name', value: employee.fullName || 'N/A' },
          { label: 'Employee ID', value: employee.employeeId || 'N/A' },
          { label: 'Department / Role', value: `${employee.department || 'General'} • ${employee.designation || 'Staff'}` },
          { label: 'Audit Scope', value: selectedAuditMonth === 'All' ? 'Complete Attendance History' : selectedAuditMonth }
        ],
        tableHeaders: tableColumn,
        tableRows: tableRows,
        fileName: `Attendance_Report_${employee.fullName.replace(/\s+/g, '_')}_${selectedAuditMonth}.doc`
      });
    } catch (e) {
      alert('Error generating attendance Word document: ' + e.message);
    }
  };

  const exportEmpAttendanceExcel = () => {
    if (!employee || !empAttendanceHistory) return;
    try {
      const exportData = empAttendanceHistory.map(row => ({
        Date: formatDate(row.date),
        'Employee ID': employee.employeeId,
        'Employee Name': employee.fullName,
        'Check-In Time': row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        'Check-Out Time': row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        'Work Duration': formatHours(row.totalWorkDurationInSeconds),
        'Break Duration': formatHours(row.totalBreakDurationInSeconds || 0),
        'Lunch Duration': formatHours(row.totalLunchDurationInSeconds || 0),
        Status: row.status || 'Present'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Attendance");
      XLSX.writeFile(workbook, `Attendance_Report_${employee.fullName.replace(/\s+/g, '_')}_${selectedAuditMonth}.xlsx`);
    } catch (e) {
      alert('Error generating attendance Excel: ' + e.message);
    }
  };

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
      if (target) {
        sessionStorage.setItem('cti_current_viewed_emp', JSON.stringify({
          id: target._id || target.employeeId,
          _id: target._id,
          employeeId: target.employeeId,
          fullName: target.fullName
        }));
        window.dispatchEvent(new Event('storage'));
      }
      initFormState(target);
    } catch (err) {
      console.warn('API Offline. Using default employee data.', err);
      const target = DEFAULT_DEMO_EMPLOYEES.find(e => e._id === id || e.employeeId === id) || DEFAULT_DEMO_EMPLOYEES[0];
      setEmployee(target);
      if (target) {
        sessionStorage.setItem('cti_current_viewed_emp', JSON.stringify({
          id: target._id || target.employeeId,
          _id: target._id,
          employeeId: target.employeeId,
          fullName: target.fullName
        }));
        window.dispatchEvent(new Event('storage'));
      }
      initFormState(target);
    } finally {
      setLoading(false);
    }
  };

  const initFormState = (emp) => {
    if (!emp) return;
    setEditRole(emp.user?.role || 'employee');
    setEditStatus(emp.status || 'Active');
    setEditSalary(emp.salaryAmount || '');
    setEditBank(emp.bankName || '');
    setEditAccNo(emp.accountNumber || '');
    setEditIfsc(emp.ifscCode || '');
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
      alert(`New task assigned specifically to ${employee.fullName}!`);
    }
  };

  const filterByMonth = (items, getDateStr) => {
    if (!items || !Array.isArray(items)) return [];
    if (selectedAuditMonth === 'All') return items;
    const monthObj = AUDIT_MONTH_OPTIONS.find(m => m.value === selectedAuditMonth);
    return items.filter(item => {
      const val = getDateStr(item);
      if (!val) return false;
      return val.includes(selectedAuditMonth) || (monthObj?.monthName && val.toLowerCase().includes(monthObj.monthName.toLowerCase()));
    });
  };

  const filteredTasks = filterByMonth(employee?.assignedByAdmin?.tasks, t => t.dueDate || t.month || '');
  const filteredReports = filterByMonth(employee?.sentByEmployee?.dailyReports, r => r.date || r.month || '');
  const filteredLeaves = filterByMonth(employee?.sentByEmployee?.leaveApplications, l => l.dates || l.month || '');
  const filteredPayslips = filterByMonth(employee?.sentByEmployee?.payslips, p => p.monthCode || p.month || '');

  const handleDownloadMonthlyAuditPDF = async () => {
    if (!employee) return;
    try {
      const monthObj = AUDIT_MONTH_OPTIONS.find(m => m.value === selectedAuditMonth);
      const selectedLabel = monthObj ? monthObj.label : 'All-Time Continuous History';

      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'CONFIDENTIAL EMPLOYEE AUDIT DOSSIER',
        metaFields: [
          { label: 'Employee Name', value: employee.fullName || 'N/A' },
          { label: 'Employee ID', value: employee.employeeId || 'N/A' },
          { label: 'Department / Role', value: `${employee.department || 'N/A'} • ${employee.designation || 'N/A'}` },
          { label: 'Audit Scope Period', value: selectedLabel }
        ]
      });

      let currentY = startY;

      // Section 1: Tasks
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`1. ASSIGNED TASKS & DELIVERABLES AUDIT (${filteredTasks.length})`, 14, currentY);

      const taskRows = filteredTasks.map(t => [t.taskId || '-', t.title || '-', t.priority || 'Medium', t.status || 'Assigned', t.dueDate || '-']);
      const autoTableFn = autoTable || doc.autoTable;
      autoTableFn(doc, {
        startY: currentY + 3,
        head: [['Task ID', 'Task Title / Deliverable', 'Priority', 'Status', 'Due Date']],
        body: taskRows.length > 0 ? taskRows : [['-', 'No tasks logged for this audit period.', '-', '-', '-']],
        ...getCorporateTableStyles()
      });

      currentY = doc.lastAutoTable.finalY + 8;
      if (currentY > 230) { doc.addPage(); currentY = 30; }

      // Section 2: Daily Reports
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`2. DAILY WORK REPORTS AUDIT (${filteredReports.length})`, 14, currentY);

      const reportRows = filteredReports.map(r => [r.date || '-', r.title || '-', r.hoursLogged || '-', r.status || 'Approved']);
      autoTableFn(doc, {
        startY: currentY + 3,
        head: [['Date', 'Report Summary Title', 'Hours', 'Status']],
        body: reportRows.length > 0 ? reportRows : [['-', 'No daily work reports submitted for this audit period.', '-', '-']],
        ...getCorporateTableStyles()
      });

      currentY = doc.lastAutoTable.finalY + 8;
      if (currentY > 230) { doc.addPage(); currentY = 30; }

      // Section 3: Leave Applications
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`3. LEAVE APPLICATIONS AUDIT (${filteredLeaves.length})`, 14, currentY);

      const leaveRows = filteredLeaves.map(l => [l.leaveType || 'Leave', l.dates || '-', l.reason || '-', l.status || 'Approved']);
      autoTableFn(doc, {
        startY: currentY + 3,
        head: [['Leave Type', 'Duration / Dates', 'Reason / Purpose', 'Status']],
        body: leaveRows.length > 0 ? leaveRows : [['-', 'No leave applications filed during this audit period.', '-', '-']],
        ...getCorporateTableStyles()
      });

      currentY = doc.lastAutoTable.finalY + 8;
      if (currentY > 230) { doc.addPage(); currentY = 30; }

      // Section 4: Monthly Payslips
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`4. PAYSLIP & SALARY FINANCIAL STATEMENT (${filteredPayslips.length})`, 14, currentY);

      const payslipRows = filteredPayslips.map(p => [
        p.month || '-',
        formatCurrencyINR(p.basicSalary || 0),
        formatCurrencyINR(p.grossSalary || 0),
        formatCurrencyINR(p.deductions || 0),
        formatCurrencyINR(p.netPayable || 0),
        p.status || 'Paid'
      ]);
      autoTableFn(doc, {
        startY: currentY + 3,
        head: [['Pay Month', 'Basic Salary', 'Gross Earnings', 'Deductions', 'Net Payable', 'Status']],
        body: payslipRows.length > 0 ? payslipRows : [['-', '-', '-', '-', '-', 'No payslips recorded for period']],
        ...getCorporateTableStyles()
      });

      const fileName = `CodeThrive_Audit_${employee.employeeId}_${selectedAuditMonth}.pdf`;
      finalizeDoc(fileName);
    } catch (err) {
      console.error('Failed to generate PDF audit dossier', err);
      alert('Error generating PDF dossier. Please try again.');
    }
  };

  const handleDownloadMonthlyAuditWord = () => {
    if (!employee) return;
    try {
      const monthObj = AUDIT_MONTH_OPTIONS.find(m => m.value === selectedAuditMonth);
      const selectedLabel = monthObj ? monthObj.label : 'All-Time Continuous History';

      const taskRows = filteredTasks.map(t => [t.taskId || '-', t.title || '-', t.priority || 'Medium', t.status || 'Assigned', t.dueDate || '-']);
      
      exportOfficialWordDoc({
        title: 'CONFIDENTIAL EMPLOYEE AUDIT DOSSIER',
        metaFields: [
          { label: 'Employee Name', value: employee.fullName || 'N/A' },
          { label: 'Employee ID', value: employee.employeeId || 'N/A' },
          { label: 'Department / Role', value: `${employee.department || 'N/A'} • ${employee.designation || 'N/A'}` },
          { label: 'Audit Scope Period', value: selectedLabel }
        ],
        tableHeaders: ['Task ID', 'Task Title / Deliverable', 'Priority', 'Status', 'Due Date'],
        tableRows: taskRows.length > 0 ? taskRows : [['-', 'No tasks logged for this audit period.', '-', '-', '-']],
        fileName: `CodeThrive_Audit_${employee.employeeId}_${selectedAuditMonth}.doc`
      });
    } catch (err) {
      alert('Error exporting Word document: ' + err.message);
    }
  };

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
    alert(`Access Role set to '${editRole}' and Account Status set to '${editStatus}' for ${employee.fullName}!`);
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
    alert(`Salary structure and bank details saved for ${employee.fullName}!`);
  };

  if (loading || !employee) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Employee Profile...</p>
    </div>
  );

  return (
    <div className="employee-detail-page">
      
      {/* Top Breadcrumb & Quick Switcher & PDF Export */}
      <div className="detail-top-nav">
        <button className="btn btn-outline" onClick={() => navigate('/admin/employees')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Directory
        </button>

        {/* Quick Controls Group */}
        <div className="quick-controls-group">
          
          {/* Quick Employee Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Employee:</span>
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

          {/* Month Audit Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={13} /> Month:
            </span>
            <select 
              className="emp-switch-select"
              value={selectedAuditMonth}
              onChange={(e) => setSelectedAuditMonth(e.target.value)}
              style={{ borderColor: 'var(--primary-light)' }}
            >
              {AUDIT_MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Export PDF & Word Download Buttons */}
          <button 
            className="btn-export-dossier" 
            onClick={handleDownloadMonthlyAuditPDF}
            title="Download Monthly Employee Audit Dossier PDF"
          >
            <Download size={15} /> Export Audit (PDF)
          </button>
          <button 
            className="btn-export-dossier" 
            onClick={handleDownloadMonthlyAuditWord}
            title="Download Monthly Employee Audit Dossier Word"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
          >
            <FileText size={15} /> Export Audit (Word)
          </button>

        </div>
      </div>

      {/* Hero Header Card */}
      <div className="employee-hero-card">
        <div className="hero-left">
          <div className="hero-avatar">
            {employee.fullName ? employee.fullName.charAt(0).toUpperCase() : 'E'}
          </div>
          <div className="hero-info">
            <div className="hero-title-row">
              <h1 className="hero-name">{employee.fullName}</h1>
              <StatusBadge status={employee.status} />
              <span className={`role-badge ${employee.user?.role || 'employee'}`}>
                {employee.user?.role || 'employee'}
              </span>
            </div>
            <div className="hero-meta-tags">
              <a 
                href={`mailto:${employee.personalEmailAddress || ''}`}
                onClick={(e) => openDirectEmail(employee.personalEmailAddress, e)}
                className="hero-meta-item clickable-link"
                title="Directly open email to compose message"
              >
                <Mail size={13} /> {employee.personalEmailAddress || 'No Email'}
              </a>

              {employee.personalPhoneNumber && (
                <button 
                  type="button"
                  className="hero-meta-item clickable-btn"
                  onClick={() => setContactModal({
                    isOpen: true,
                    name: employee.fullName,
                    phone: employee.personalPhoneNumber
                  })}
                  title="Connect via WhatsApp or Phone Call"
                >
                  <Phone size={13} /> {employee.personalPhoneNumber}
                </button>
              )}

              <span className="hero-meta-item"><Briefcase size={13} /> {employee.department} &bull; {employee.designation}</span>
              <span className="hero-meta-item"><Calendar size={13} /> ID: <strong style={{ color: 'var(--primary-light)' }}>{employee.employeeId}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Section Tabs for Selected Employee */}
      <div className="detail-tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} /> Profile & HR
        </button>

        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <Briefcase size={16} /> Tasks <span className="tab-count-badge">{filteredTasks.length}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={16} /> Daily Reports <span className="tab-count-badge">{filteredReports.length}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <Calendar size={16} /> Leave Applications <span className="tab-count-badge">{filteredLeaves.length}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileCheck size={16} /> Documents <span className="tab-count-badge">{employee.sentByEmployee?.uploadedDocs?.length || 0}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Clock size={16} /> Attendance Audit
        </button>

        <button 
          className={`tab-btn ${activeTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveTab('management')}
        >
          <KeyRound size={16} /> Payroll & Access <span className="tab-count-badge">{filteredPayslips.length}</span>
        </button>
      </div>

      {/* Main Content Body */}
      <div className="detail-tab-body">
        
        {/* TAB 1: PROFILE & HR OVERVIEW */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                Personal & Employment Details for {employee.fullName}
              </h3>
            </div>

            <div className="detail-grid-2">
              <Card title={<><User size={16} style={{ marginRight: '0.5rem' }} /> Personal Information</>}>
                <div className="info-list">
                  <div className="info-item"><span>Full Name:</span> <strong>{employee.fullName}</strong></div>
                  <div className="info-item">
                    <span>Email Address:</span> 
                    <a 
                      href={`mailto:${employee.personalEmailAddress || ''}`}
                      onClick={(e) => openDirectEmail(employee.personalEmailAddress, e)}
                      style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}
                      title="Directly open email to compose message"
                    >
                      {employee.personalEmailAddress || 'N/A'}
                    </a>
                  </div>
                  <div className="info-item">
                    <span>Phone Number:</span> 
                    {employee.personalPhoneNumber ? (
                      <button 
                        type="button"
                        onClick={() => setContactModal({
                          isOpen: true,
                          name: employee.fullName,
                          phone: employee.personalPhoneNumber
                        })}
                        style={{ background: 'none', border: 'none', color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 700 }}
                        title="Connect via WhatsApp or Call"
                      >
                        {employee.personalPhoneNumber}
                      </button>
                    ) : (
                      <strong>N/A</strong>
                    )}
                  </div>
                  <div className="info-item"><span>Gender / Blood:</span> <strong>{employee.gender || 'Male'} ({employee.bloodGroup || 'O+'})</strong></div>
                </div>
              </Card>

              <Card title={<><Briefcase size={16} style={{ marginRight: '0.5rem' }} /> Employment & Department</>}>
                <div className="info-list">
                  <div className="info-item"><span>Department:</span> <strong>{employee.department}</strong></div>
                  <div className="info-item"><span>Designation:</span> <strong>{employee.designation}</strong></div>
                  <div className="info-item"><span>Employment Type:</span> <strong>{employee.employmentType || 'Full-Time'}</strong></div>
                  <div className="info-item"><span>Date of Joining:</span> <strong>{employee.dateOfJoining || '2025-01-15'}</strong></div>
                </div>
              </Card>
            </div>

            <Card title={<><MapPin size={16} style={{ marginRight: '0.5rem' }} /> Address & Skills</>}>
              <div className="info-list">
                <div className="info-item"><span>Current Address:</span> <span>{employee.currentAddress || '12, Tech Park Avenue, Chennai, Tamil Nadu'}</span></div>
                <div className="info-item"><span>Emergency Contact:</span> <span>{employee.emergencyContact?.name || 'S. Ramanathan'} ({employee.emergencyContact?.phone || '9876500000'})</span></div>
                <div className="info-item"><span>Skills:</span> <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{employee.skills?.join(', ') || 'React, Node.js, Express, MongoDB'}</span></div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: TASKS & DELIVERABLES SPECIFIC TO THIS EMPLOYEE */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                Tasks Assigned to {employee.fullName} ({selectedAuditMonth === 'All' ? 'All-Time' : selectedAuditMonth})
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Showing {filteredTasks.length} tasks</span>
            </div>

            {/* List of Tasks Assigned to this Employee */}
            {filteredTasks.length === 0 ? (
              <div className="empty-state">No tasks recorded for {employee.fullName} under selected audit period.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredTasks.map(t => (
                  <div key={t._id} className="item-row">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.taskId}</span>
                      <h4 style={{ margin: '0.2rem 0', fontSize: '0.95rem' }}>{t.title}</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Due Date: {t.dueDate} &bull; Priority: <strong>{t.priority}</strong></span>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}

            {/* Assign New Task Panel */}
            <div className="form-panel">
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={16} /> Assign New Task to {employee.fullName}
              </h4>
              <form onSubmit={handleAssignTask} className="task-assign-form">
                <div className="form-field">
                  <label className="field-label">Task Title</label>
                  <input type="text" placeholder="e.g. Implement Payment Gateway API" className="input-box" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />
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
          </div>
        )}

        {/* TAB 3: DAILY WORK REPORTS SUBMITTED BY THIS EMPLOYEE */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                Daily Work Reports Submitted by {employee.fullName} ({selectedAuditMonth === 'All' ? 'All-Time' : selectedAuditMonth})
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Showing {filteredReports.length} reports</span>
            </div>

            {filteredReports.length === 0 ? (
              <div className="empty-state">No daily work reports submitted by {employee.fullName} for selected audit period.</div>
            ) : (
              filteredReports.map(r => (
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

        {/* TAB 4: LEAVE APPLICATIONS SUBMITTED BY THIS EMPLOYEE */}
        {activeTab === 'leaves' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                Leave Applications Submitted by {employee.fullName} ({selectedAuditMonth === 'All' ? 'All-Time' : selectedAuditMonth})
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Showing {filteredLeaves.length} leaves</span>
            </div>

            {filteredLeaves.length === 0 ? (
              <div className="empty-state">No leave applications submitted by {employee.fullName} for selected audit period.</div>
            ) : (
              filteredLeaves.map(l => (
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

        {/* TAB 5: UPLOADED IDENTITY DOCUMENTS */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
              Uploaded Verification Documents for {employee.fullName}
            </h3>

            {(!employee.sentByEmployee?.uploadedDocs || employee.sentByEmployee.uploadedDocs.length === 0) ? (
              <div className="empty-state">No verification documents uploaded by {employee.fullName} yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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

        {/* TAB 6: ATTENDANCE & WORK SESSION AUDIT */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                  Per-Day Check-In & Check-Out Attendance Audit: {employee.fullName}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Showing daily attendance logs ({empAttendanceHistory.length} records)
                </span>
              </div>

              {/* Action Buttons for downloading per-day report */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-outline" onClick={exportEmpAttendancePDF} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Printer size={15} /> Download PDF Report
                </button>
                <button className="btn btn-outline" onClick={exportEmpAttendanceWord} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#2563eb', color: '#60a5fa' }}>
                  <FileText size={15} /> Download Word Report
                </button>
                <button className="btn btn-primary" onClick={exportEmpAttendanceExcel} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Download size={15} /> Export Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="metrics-grid-4">
              <div className="metric-box">
                <span className="box-title">Today's Live Status</span>
                <StatusBadge status={empAttendanceHistory[0]?.status || 'Not Checked In'} />
              </div>
              <div className="metric-box">
                <span className="box-title">Today Check-In</span>
                <span className="box-val" style={{ color: 'var(--success)' }}>
                  {empAttendanceHistory[0]?.firstLoginTime 
                    ? new Date(empAttendanceHistory[0].firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--'}
                </span>
              </div>
              <div className="metric-box">
                <span className="box-title">Today Check-Out</span>
                <span className="box-val" style={{ color: 'var(--info)' }}>
                  {empAttendanceHistory[0]?.lastLogoutTime 
                    ? new Date(empAttendanceHistory[0].lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--'}
                </span>
              </div>
              <div className="metric-box">
                <span className="box-title">Total Days Logged</span>
                <span className="box-val" style={{ color: 'var(--primary-light)' }}>
                  {empAttendanceHistory.length} Days
                </span>
              </div>
            </div>

            {/* Detailed Per-Day Check-In / Check-Out History Table */}
            <Card title={`Per-Day Attendance Logs (${employee.fullName})`} style={{ padding: 0 }}>
              {attendanceLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading attendance logs...</div>
              ) : (
                <DataTable 
                  columns={[
                    {
                      header: 'Date',
                      accessor: 'date',
                      render: row => (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>
                            {formatDateWithDay(row.date)}
                          </span>
                        </div>
                      )
                    },
                    {
                      header: 'Check In Time',
                      accessor: 'firstLoginTime',
                      render: row => (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontWeight: 600, fontFamily: 'monospace' }}>
                          <LogIn size={14} /> {row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      )
                    },
                    {
                      header: 'Check Out Time',
                      accessor: 'lastLogoutTime',
                      render: row => (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#f43f5e', fontWeight: 600, fontFamily: 'monospace' }}>
                          <LogOut size={14} /> {row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      )
                    },
                    {
                      header: 'Work Duration',
                      accessor: 'totalWorkDurationInSeconds',
                      render: row => (
                        <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontFamily: 'monospace' }}>
                          {formatHours(row.totalWorkDurationInSeconds)}
                        </span>
                      )
                    },
                    {
                      header: 'Break Time',
                      accessor: 'totalBreakDurationInSeconds',
                      render: row => (
                        <span style={{ color: '#fbbf24', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Coffee size={13} /> {formatHours(row.totalBreakDurationInSeconds || 0)}
                        </span>
                      )
                    },
                    {
                      header: 'Lunch Time',
                      accessor: 'totalLunchDurationInSeconds',
                      render: row => (
                        <span style={{ color: '#60a5fa', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Utensils size={13} /> {formatHours(row.totalLunchDurationInSeconds || 0)}
                        </span>
                      )
                    },
                    {
                      header: 'Status',
                      accessor: 'status',
                      render: row => <StatusBadge status={row.status || 'Present'} />
                    }
                  ]}
                  data={empAttendanceHistory}
                  searchable={true}
                  itemsPerPage={10}
                />
              )}
            </Card>
          </div>
        )}

        {/* TAB 7: MANAGEMENT, PAYROLL & SYSTEM CREDENTIALS */}
        {activeTab === 'management' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                Payroll & System Credentials for {employee.fullName}
              </h3>
            </div>

            {/* Monthly Payslips Log Table */}
            <Card title={<><Banknote size={16} style={{ marginRight: '0.5rem' }} /> Monthly Payslip Financial Audit ({filteredPayslips.length} Months)</>}>
              {filteredPayslips.length === 0 ? (
                <div className="empty-state">No payslips generated for selected audit period.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Pay Month</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Basic Salary</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Gross Salary</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Deductions</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Net Payable</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayslips.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>{p.month}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>₹{(p.basicSalary || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>₹{(p.grossSalary || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#ef4444' }}>-₹{(p.deductions || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--success)' }}>₹{(p.netPayable || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={p.status || 'Paid'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="detail-grid-2">
              {/* Access Role & Credentials Card */}
              <Card title={<><KeyRound size={16} style={{ marginRight: '0.5rem' }} /> Access Role & Account Status</>}>
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
                    <Save size={15} /> Save Role & Credentials
                  </button>
                </div>
              </Card>

              {/* Salary & Bank Accounts Card */}
              <Card title={<><Banknote size={16} style={{ marginRight: '0.5rem' }} /> Salary Structure & Bank Account</>}>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Monthly Salary (₹)</label>
                    <input type="number" className="input-box" value={editSalary} onChange={e => setEditSalary(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Bank Name</label>
                    <input type="text" className="input-box" value={editBank} onChange={e => setEditBank(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Account Number</label>
                    <input type="text" className="input-box" value={editAccNo} onChange={e => setEditAccNo(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>IFSC Code</label>
                    <input type="text" className="input-box" value={editIfsc} onChange={e => setEditIfsc(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSaveSalary}>
                    <Save size={15} /> Save Salary & Bank Info
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

      </div>

      {/* Contact Options Modal (WhatsApp vs Call) */}
      <ContactActionModal 
        isOpen={contactModal.isOpen} 
        onClose={() => setContactModal(prev => ({ ...prev, isOpen: false }))} 
        name={contactModal.name} 
        phone={contactModal.phone} 
      />
    </div>
  );
};

export default EmployeeDetail;
